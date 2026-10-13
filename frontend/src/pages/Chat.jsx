import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { assessSupportLevel } from "../utils/classifier";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  LogOut,
  Video,
  VideoOff,
  PlusCircle,
  MessageSquare,
  Edit2,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wind,
  Smile,
  ShieldAlert,
  Clock,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { EmergencyModal } from "../components/EmergencyModal";
import { BreathingExerciseModal } from "../components/BreathingExerciseModal";
import { MoodTrackerModal } from "../components/MoodTrackerModal";
import { useNavigate } from "react-router-dom";

const WELCOME_TEXT =
  "Hi, welcome to CalmChain 💙 This is your calm space. How are you feeling today? You can type your thoughts or use voice input whenever you feel comfortable.";

export const Chat = () => {
  const { currentUser } = useAuth();
  const { supportLevel, setSupportLevel, theme } = useTheme();
  const navigate = useNavigate();

  // Chats & Messages
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message composition
  const [newMessage, setNewMessage] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Modals & Tools
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showCameraNotice, setShowCameraNotice] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Voice Input (Auto-Send on final transcript)
  // States: 'idle' | 'listening' | 'processing' | 'sending' | 'error'
  const [voiceState, setVoiceState] = useState("idle");
  const [sttSupported, setSttSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const hasSubmittedVoiceRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");
  const silenceTimerRef = useRef(null);

  // Speech Synthesis (TTS) - Optional audio readout
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live Date/Time
  const [liveClock, setLiveClock] = useState("");

  // Camera & Face-API (Optional, Private, Local)
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectedExpression, setDetectedExpression] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Refs
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Live Date & Time timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize Socket.IO connection
  useEffect(() => {
    const backendUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:5000";

    const s = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (currentUser?.uid) {
        s.emit("join", currentUser.uid);
      }
    });

    s.on("receiveMessage", async (incoming) => {
      if (!incoming) return;
      setIsAiReplying(false);

      if (incoming.level) {
        setSupportLevel(incoming.level);
        if (incoming.level === 3) setShowEmergency(true);
      }

      if (ttsEnabled && incoming.text) {
        speakReply(incoming.text);
      }

      if (currentChatId) {
        try {
          const docRef = doc(db, "chats", currentChatId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const curMsgs = snap.data().messages || [];
            const alreadyExists = curMsgs.some(
              (m) =>
                m.text === incoming.text &&
                Math.abs(new Date(m.timestamp) - new Date(incoming.timestamp)) < 2000
            );
            if (!alreadyExists) {
              const aiMsg = {
                id: `ai_${Date.now()}`,
                text: incoming.text,
                sender: "ai",
                emotion: incoming.emotion || "calm",
                level: incoming.level || 1,
                timestamp: incoming.timestamp || new Date().toISOString()
              };
              const updated = [...curMsgs, aiMsg];
              await updateDoc(docRef, {
                messages: updated,
                updatedAt: new Date().toISOString(),
                supportLevel: incoming.level || 1
              });
            }
          }
        } catch (err) {
          console.error("Error appending AI message to Firestore:", err);
        }
      }
    });

    return () => {
      s.disconnect();
    };
  }, [currentChatId, currentUser, ttsEnabled]);

  // 3. VOICE INPUT WITH AUTOMATIC SEND AFTER SPEAKING
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setVoiceState("listening");
        setVoiceError("");
        hasSubmittedVoiceRef.current = false;
        accumulatedTranscriptRef.current = "";
      };

      recognition.onresult = (event) => {
        let interimText = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current + " " + finalChunk
          ).trim();
          setNewMessage(accumulatedTranscriptRef.current);
        } else if (interimText) {
          setNewMessage(
            (accumulatedTranscriptRef.current + " " + interimText).trim()
          );
        }

        // Reset silence timer: when user pauses for 1.8 seconds after speaking, auto-stop
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (voiceState === "listening" && accumulatedTranscriptRef.current.trim()) {
            recognition.stop();
          }
        }, 1800);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "no-speech") {
          setVoiceState("idle");
        } else if (event.error === "not-allowed") {
          setVoiceError("Microphone permission denied.");
          setVoiceState("error");
          setTimeout(() => setVoiceState("idle"), 3000);
        } else {
          setVoiceState("idle");
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        const textToSend = accumulatedTranscriptRef.current.trim();
        if (textToSend && !hasSubmittedVoiceRef.current) {
          hasSubmittedVoiceRef.current = true;
          setVoiceState("sending");
          // Automatically send the message without requiring Send click!
          handleSendVoiceMessage(textToSend);
        } else {
          setVoiceState("idle");
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSttSupported(false);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentChatId, currentUser]);

  const startVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (voiceState === "listening") {
      recognitionRef.current.stop();
    } else {
      try {
        hasSubmittedVoiceRef.current = false;
        accumulatedTranscriptRef.current = "";
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start issue:", err);
      }
    }
  };

  const cancelVoiceInput = () => {
    if (recognitionRef.current) {
      hasSubmittedVoiceRef.current = true; // prevent auto-send
      recognitionRef.current.abort();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    accumulatedTranscriptRef.current = "";
    setNewMessage("");
    setVoiceState("idle");
  };

  // Helper function to auto-send the recognized speech transcript
  const handleSendVoiceMessage = async (transcriptText) => {
    if (!transcriptText || !currentChatId || !currentUser) {
      setVoiceState("idle");
      return;
    }

    // Automatically assess support level using centralized classifier
    const assessed = assessSupportLevel(transcriptText);
    setSupportLevel(assessed.level);
    if (assessed.level === 3) setShowEmergency(true);

    const userMsgObj = {
      id: `user_${Date.now()}`,
      text: transcriptText,
      sender: "user",
      emotion: assessed.emotion,
      level: assessed.level,
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, userMsgObj];
    setMessages(updated);
    setNewMessage("");
    setIsAiReplying(true);
    setVoiceState("idle");

    const isFirstUserMsg = !messages.some((m) => m.sender === "user");
    const autoTitle = isFirstUserMsg
      ? transcriptText.length > 30
        ? `${transcriptText.slice(0, 30)}...`
        : transcriptText
      : null;

    try {
      const chatDocRef = doc(db, "chats", currentChatId);
      const updatePayload = {
        messages: updated,
        updatedAt: new Date().toISOString(),
        supportLevel: assessed.level
      };
      if (autoTitle) updatePayload.title = autoTitle;
      await updateDoc(chatDocRef, updatePayload);
    } catch (err) {
      console.error("Error updating Firestore on voice send:", err);
    }

    // Emit to AI
    dispatchAiRequest(transcriptText, assessed, updated);
  };

  // 4. Speech Synthesis (Read aloud)
  const speakReply = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // 5. Load Face-API models lazily
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models")
        ]);
        if (isMounted) setModelsLoaded(true);
      } catch (err) {
        console.warn("Face-API models loading deferred:", err);
      }
    };
    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // 6. Camera controls (Explicit, Optional, Private)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      setShowCameraNotice(false);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      alert("Camera permission was denied. You can continue typing or using voice input normally.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setDetectedExpression(null);
  };

  useEffect(() => {
    let interval = null;
    if (cameraActive && modelsLoaded) {
      interval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const detections = await faceapi
              .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
              .withFaceExpressions();

            if (detections && detections.length > 0) {
              const exprs = detections[0].expressions;
              const dominant = Object.keys(exprs).reduce((a, b) => (exprs[a] > exprs[b] ? a : b));
              setDetectedExpression(dominant);
            }
          } catch (e) {
            // Silently ignore drop
          }
        }
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraActive, modelsLoaded]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, []);

  // 7. Load User's Chat List from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingChats(true);

    const q = query(
      collection(db, "chats"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        setChats(list);
        setLoadingChats(false);

        if (list.length > 0 && !currentChatId) {
          setCurrentChatId(list[0].id);
        } else if (list.length === 0 && !currentChatId) {
          createNewChat();
        }
      },
      (err) => {
        console.error("Firestore chats query error:", err);
        setLoadingChats(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 8. Load Current Chat Messages
  useEffect(() => {
    if (!currentChatId) return;
    setLoadingMessages(true);

    const chatDocRef = doc(db, "chats", currentChatId);
    const unsubscribe = onSnapshot(
      chatDocRef,
      (docSnap) => {
        setLoadingMessages(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const msgs = data.messages || [];
          setMessages(msgs);

          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.level) {
              setSupportLevel(lastMsg.level);
              if (lastMsg.level === 3) setShowEmergency(true);
            }
          }

          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          setMessages([]);
        }
      },
      (err) => {
        console.error("Error reading chat document:", err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [currentChatId]);

  // 9. Create a Genuinely New Chat with Automatic First Welcome Message
  const createNewChat = async () => {
    if (!currentUser) return;
    try {
      const welcomeMessage = {
        id: `welcome_${Date.now()}`,
        text: WELCOME_TEXT,
        sender: "ai",
        emotion: "calm",
        level: 1,
        timestamp: new Date().toISOString()
      };

      const now = new Date().toISOString();
      const newDoc = await addDoc(collection(db, "chats"), {
        userId: currentUser.uid,
        title: "New Conversation",
        createdAt: now,
        updatedAt: now,
        supportLevel: 1,
        messages: [welcomeMessage]
      });

      setCurrentChatId(newDoc.id);
      setSupportLevel(1);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  // Group chats by date (Today, Yesterday, Older)
  const groupedChats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      Older: []
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.createdAt || chat.updatedAt || Date.now());
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate.getTime() === today.getTime()) {
        groups.Today.push(chat);
      } else if (chatDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  }, [chats]);

  // AI dispatch helper (Socket.IO with REST fallback)
  const dispatchAiRequest = async (text, assessed, currentMsgList) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", {
        userId: currentUser.uid,
        text: text,
        emotion: assessed.emotion
      });
    } else {
      try {
        const backendUrl =
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_BACKEND_URL ||
          "http://localhost:5000";

        const res = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.uid,
            text: text,
            emotion: assessed.emotion
          })
        });

        if (res.ok) {
          const data = await res.json();
          setIsAiReplying(false);
          const aiMsgObj = {
            id: `ai_${Date.now()}`,
            text: data.text,
            sender: "ai",
            emotion: data.emotion || "calm",
            level: data.level || 1,
            timestamp: new Date().toISOString()
          };
          const withAi = [...currentMsgList, aiMsgObj];
          await updateDoc(doc(db, "chats", currentChatId), {
            messages: withAi,
            updatedAt: new Date().toISOString(),
            supportLevel: data.level || 1
          });
          if (ttsEnabled && data.text) speakReply(data.text);
        }
      } catch (restErr) {
        console.warn("REST fallback notice:", restErr);
        setIsAiReplying(false);
      }
    }
  };

  // 10. Manual Send Message (Typed text)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !currentChatId || !currentUser) return;

    const assessed = assessSupportLevel(trimmed);
    setSupportLevel(assessed.level);
    if (assessed.level === 3) setShowEmergency(true);

    const userMsgObj = {
      id: `user_${Date.now()}`,
      text: trimmed,
      sender: "user",
      emotion: assessed.emotion,
      level: assessed.level,
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, userMsgObj];
    setMessages(updated);
    setNewMessage("");
    setIsAiReplying(true);

    const isFirstUserMsg = !messages.some((m) => m.sender === "user");
    const autoTitle = isFirstUserMsg
      ? trimmed.length > 30
        ? `${trimmed.slice(0, 30)}...`
        : trimmed
      : null;

    try {
      const chatDocRef = doc(db, "chats", currentChatId);
      const updatePayload = {
        messages: updated,
        updatedAt: new Date().toISOString(),
        supportLevel: assessed.level
      };
      if (autoTitle) updatePayload.title = autoTitle;
      await updateDoc(chatDocRef, updatePayload);
    } catch (err) {
      console.error("Error updating Firestore on message send:", err);
    }

    dispatchAiRequest(trimmed, assessed, updated);
  };

  // 11. Edit Message
  const handleEditMessage = async (msgId) => {
    if (!editText.trim() || !currentChatId) return;
    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        const assessed = assessSupportLevel(editText);
        setSupportLevel(assessed.level);
        return {
          ...m,
          text: editText,
          level: assessed.level,
          emotion: assessed.emotion,
          edited: true
        };
      }
      return m;
    });

    try {
      await updateDoc(doc(db, "chats", currentChatId), {
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating edited message:", err);
    }
    setEditingMsgId(null);
    setEditText("");
  };

  const handleLogout = () => {
    stopCamera();
    stopSpeaking();
    auth.signOut().then(() => navigate("/login"));
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex h-screen w-full ${theme.pageBg} ${theme.textPrimary} font-['Inter'] relative overflow-hidden select-none transition-colors duration-500`}>
      {/* Ambient Theme Lighting Halos */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-[15%] -left-[10%] w-[55%] h-[55%] blur-[140px] rounded-full transition-colors duration-700 ${theme.orb1}`}
        />
        <div
          className={`absolute bottom-[-10%] -right-[10%] w-[50%] h-[55%] blur-[150px] rounded-full transition-colors duration-700 ${theme.orb2}`}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 ${theme.sidebarBg} backdrop-blur-2xl border-r ${theme.border} flex flex-col shadow-xl transition-all duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className={`p-5 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <img src="/calmchain-logo.svg" alt="CalmChain Logo" className="w-9 h-9 drop-shadow-sm" />
            <div>
              <h1 className="text-xl font-black font-['Outfit'] tracking-tight">CalmChain</h1>
              <p className={`text-[11px] font-bold ${theme.textSecondary}`}>{theme.name}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-slate-500 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewChat}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition shadow-sm border ${theme.accentSecondaryButton} cursor-pointer`}
          >
            <PlusCircle size={18} /> New Conversation
          </button>
        </div>

        {/* Conversation History List grouped by Date */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          {loadingChats ? (
            <div className="space-y-2 p-2">
              <div className="h-10 bg-slate-200/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-200/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-200/50 rounded-xl animate-pulse" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No conversations yet. Tap "New Conversation" to start.
            </div>
          ) : (
            Object.entries(groupedChats).map(([groupTitle, chatList]) => {
              if (chatList.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>
                    {groupTitle}
                  </div>
                  {chatList.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-2.5 text-left transition truncate cursor-pointer border ${
                        currentChatId === chat.id
                          ? `${theme.activeItem} shadow-xs`
                          : `${theme.inactiveItem} border-transparent`
                      }`}
                    >
                      <MessageSquare size={15} className="shrink-0" />
                      <span className="truncate flex-1">
                        {chat.title || "Conversation"}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Tools Navigation */}
        <div className={`p-3 border-t ${theme.border} space-y-1 text-xs font-semibold`}>
          <button
            onClick={() => setShowBreathing(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${theme.inactiveItem}`}
          >
            <Wind size={16} /> Box Breathing Grounding
          </button>
          <button
            onClick={() => setShowMoodTracker(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${theme.inactiveItem}`}
          >
            <Smile size={16} /> Daily Mood Tracker
          </button>
          <button
            onClick={() => setShowEmergency(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left cursor-pointer text-rose-700 hover:bg-rose-50`}
          >
            <PhoneCall size={16} /> Emergency Helplines
          </button>
        </div>

        {/* User Info & Logout */}
        <div className={`p-4 border-t ${theme.border} flex items-center justify-between bg-white/40`}>
          <div className="truncate pr-2">
            <p className="text-xs font-bold truncate">
              {currentUser?.email || "User"}
            </p>
            <p className={`text-[10px] font-medium ${theme.textMuted}`}>Sanctuary Member</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0 h-full">
        {/* Header Bar */}
        <header className={`px-4 sm:px-6 py-3.5 ${theme.headerBg} backdrop-blur-xl border-b ${theme.border} flex items-center justify-between shrink-0 shadow-xs`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Menu size={18} />
            </button>

            {/* Active Support Level Badge with Immediate Interactive Controls */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 border ${theme.badge} shadow-xs`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    supportLevel === 3
                      ? "bg-rose-600 animate-ping"
                      : supportLevel === 2
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                />
                {theme.label}
              </span>

              {supportLevel === 3 && (
                <button
                  onClick={() => setShowEmergency(true)}
                  className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black transition flex items-center gap-1 shadow-sm"
                >
                  <PhoneCall size={12} /> Call 14416
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls (Live Clock, TTS Audio, Camera) */}
          <div className="flex items-center gap-2.5">
            {liveClock && (
              <div className={`hidden lg:flex items-center gap-1.5 text-xs ${theme.textSecondary} bg-white/70 px-3 py-1.5 rounded-xl border ${theme.border}`}>
                <Clock size={13} />
                <span>{liveClock}</span>
              </div>
            )}

            {/* Read Aloud (TTS) Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  setTtsEnabled(!ttsEnabled);
                }
              }}
              title={ttsEnabled ? "Read Aloud Enabled" : "Read Aloud Disabled"}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                ttsEnabled
                  ? theme.badge
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
              }`}
            >
              {isSpeaking ? (
                <Volume2 size={16} className="animate-pulse text-emerald-600" />
              ) : ttsEnabled ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
            </button>

            {/* Camera Privacy Toggle */}
            <div className="relative flex items-center">
              {cameraActive ? (
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={stopCamera}
                    title="Turn Off Camera"
                    className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                  >
                    <VideoOff size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCameraNotice(true)}
                  title="Enable Facial Mirror (Optional & Local)"
                  className="p-2 rounded-xl bg-white text-slate-600 hover:text-emerald-700 border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Video size={16} />
                  <span className="hidden sm:inline">Camera</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Detected Expression Notification (Subtle Local Mirror Banner) */}
        {cameraActive && detectedExpression && (
          <div className={`px-6 py-1.5 bg-white/80 border-b ${theme.border} ${theme.textSecondary} text-xs flex items-center justify-between`}>
            <span className="flex items-center gap-2">
              <span>🪞 Facial Mirror (Local only):</span>
              <strong className="capitalize">{detectedExpression}</strong>
            </span>
            <span className="text-[10px] opacity-70">Zero cloud upload</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {loadingMessages ? (
              <div className="space-y-4 py-8">
                <div className="w-2/3 h-14 bg-slate-200/50 rounded-2xl animate-pulse" />
                <div className="w-1/2 h-14 bg-slate-200/50 rounded-2xl ml-auto animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Starting your calm space...
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[85%] sm:max-w-[78%] p-4 sm:p-5 rounded-3xl relative group shadow-sm leading-relaxed select-text border ${
                    msg.sender === "user"
                      ? `${theme.userBubble} self-end rounded-br-sm`
                      : `${theme.aiBubble} self-start rounded-bl-sm`
                  }`}
                >
                  {editingMsgId === msg.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl text-sm border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditMessage(msg.id)}
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check size={13} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[14px] sm:text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                        {msg.text}
                      </p>

                      <div className="flex items-center justify-between gap-3 mt-2 text-[10px] opacity-70">
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {msg.edited && <span>(edited)</span>}
                        {msg.sender === "user" && (
                          <button
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditText(msg.text);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-black/10 rounded"
                            title="Edit message"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {isAiReplying && (
              <div className={`self-start p-4 rounded-3xl ${theme.cardBg} border ${theme.border} flex items-center gap-2 text-xs ${theme.textSecondary}`}>
                <Sparkles size={14} className="animate-pulse" />
                <span>CalmChain is reflecting...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Voice Input State Notification Banner */}
        {voiceState !== "idle" && (
          <div className="px-6 py-2 bg-white/95 border-t border-slate-200 text-xs flex items-center justify-between z-20 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold">
                {voiceState === "listening" && "Listening... speak now, will send automatically when you finish"}
                {voiceState === "processing" && "Processing speech..."}
                {voiceState === "sending" && "Submitting your message to chat..."}
              </span>
            </div>
            <button
              onClick={cancelVoiceInput}
              className="text-slate-500 hover:text-rose-600 font-bold text-[11px] underline cursor-pointer"
            >
              Cancel Voice
            </button>
          </div>
        )}

        {voiceError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs">
            {voiceError}
          </div>
        )}

        {/* Input Composer */}
        <footer className={`p-3 sm:p-5 ${theme.headerBg} backdrop-blur-xl border-t ${theme.border} shrink-0`}>
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center gap-2"
          >
            {/* Automatic Voice Input Button */}
            {sttSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                title={
                  voiceState === "listening"
                    ? "Listening... Tap to finish or pause"
                    : "Voice Input (Auto-sends upon finish)"
                }
                className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
                  voiceState === "listening" ? theme.micActive : theme.micButton
                }`}
              >
                <Mic size={20} />
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                voiceState === "listening"
                  ? "Listening to your voice (will auto-send when you finish)..."
                  : "Type what's on your mind or tap mic..."
              }
              className={`w-full rounded-2xl px-5 py-3.5 text-sm sm:text-base outline-none border transition shadow-inner font-normal ${theme.input}`}
            />

            {/* Manual Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`p-3.5 rounded-2xl disabled:opacity-30 transition shadow-md active:scale-95 cursor-pointer shrink-0 ${theme.sendButton}`}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <div className={`max-w-3xl mx-auto mt-2 flex items-center justify-between text-[11px] ${theme.textMuted} px-2`}>
            <span>Confidential AI companion • Voice auto-sends when speech ends</span>
            {supportLevel === 2 && (
              <span className="font-semibold text-amber-800">
                Peer Support Desk: Mon-Sat 9AM-8PM IST
              </span>
            )}
          </div>
        </footer>
      </main>

      {/* Camera Privacy Permission Modal */}
      <AnimatePresence>
        {showCameraNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            onClick={() => setShowCameraNotice(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-slate-800 text-center shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Video size={24} />
              </div>
              <h2 className="text-lg font-bold font-['Outfit'] mb-2">Optional Facial Mirror</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                CalmChain uses your camera solely for <strong>100% on-device emotion estimation</strong> via face-api.js.
                Zero video or biometric data is recorded, stored, or uploaded. You can turn it off anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCameraNotice(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                >
                  Allow & Start Camera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
      <BreathingExerciseModal isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
      <MoodTrackerModal
        isOpen={showMoodTracker}
        onClose={() => setShowMoodTracker(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

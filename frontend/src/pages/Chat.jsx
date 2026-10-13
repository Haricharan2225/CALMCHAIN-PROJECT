import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
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
  HelpCircle
} from "lucide-react";
import { EmergencyModal } from "../components/EmergencyModal";
import { BreathingExerciseModal } from "../components/BreathingExerciseModal";
import { MoodTrackerModal } from "../components/MoodTrackerModal";
import { useNavigate } from "react-router-dom";

// Initial system welcome message template
const WELCOME_TEXT =
  "Hi, welcome to CalmChain 💙 This is your calm space. How are you feeling today? You can type your thoughts or use voice input whenever you feel comfortable.";

export const Chat = () => {
  const { currentUser } = useAuth();
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

  // Emotional & Support Levels (1: Calm, 2: Additional Support, 3: Safety Alert)
  const [emotionLevel, setEmotionLevel] = useState(1);
  const [levelAnalysis, setLevelAnalysis] = useState("");

  // Voice Recognition (STT)
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const recognitionRef = useRef(null);

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
  const sessionStartTime = useRef(Date.now());
  const initialWelcomeCheckedRef = useRef({});

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
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
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
        setEmotionLevel(incoming.level);
        if (incoming.level === 3) setShowEmergency(true);
      }

      if (ttsEnabled && incoming.text) {
        speakReply(incoming.text);
      }

      // Append to Firestore document
      if (currentChatId) {
        try {
          const docRef = doc(db, "chats", currentChatId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const curMsgs = snap.data().messages || [];
            // Prevent duplicate message IDs
            const alreadyExists = curMsgs.some(
              (m) => m.text === incoming.text && Math.abs(new Date(m.timestamp) - new Date(incoming.timestamp)) < 2000
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

  // 3. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setNewMessage((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSttSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
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
        console.warn("Face-API models loading deferred or unavailable:", err);
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
      console.warn("Camera access denied or device not found:", err);
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

  // Local-only facial expression loop
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
            // Silently swallow intermittent detection drops
          }
        }
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraActive, modelsLoaded]);

  // Clean camera on unmount
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

        // If no active chat selected yet, pick the first or create new
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

          // Update emotion level based on messages
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.level) {
              setEmotionLevel(lastMsg.level);
              if (lastMsg.level === 3) setShowEmergency(true);
            }
          }

          // Auto-scroll to bottom
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
      setEmotionLevel(1);
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

  // Risk detector for client safety
  const detectLevel = (text) => {
    const lower = (text || "").toLowerCase();
    const l3Kw = [
      "suicide", "suicidal", "sucide", "kill myself", "end my life", "ending my life",
      "want to die", "end it all", "hang myself", "slit my", "overdose", "cant live anymore"
    ];
    if (l3Kw.some((kw) => lower.includes(kw))) return 3;

    const l2Kw = [
      "sad", "lonely", "stress", "depressed", "depression", "panic", "anxiety",
      "anxious", "overwhelmed", "hopeless", "crying", "worthless", "exhausted", "burnout"
    ];
    if (l2Kw.some((kw) => lower.includes(kw))) return 2;

    return 1;
  };

  // 10. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !currentChatId || !currentUser) return;

    const detectedLvl = detectLevel(trimmed);
    setEmotionLevel(detectedLvl);
    if (detectedLvl === 3) setShowEmergency(true);

    const userMsgObj = {
      id: `user_${Date.now()}`,
      text: trimmed,
      sender: "user",
      emotion: detectedLvl === 3 ? "danger" : detectedLvl === 2 ? "warning" : "calm",
      level: detectedLvl,
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, userMsgObj];
    setMessages(updated);
    setNewMessage("");
    setIsAiReplying(true);

    // Compute dynamic chat title if this is the first user message
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
        supportLevel: detectedLvl
      };
      if (autoTitle) updatePayload.title = autoTitle;
      await updateDoc(chatDocRef, updatePayload);
    } catch (err) {
      console.error("Error updating Firestore on message send:", err);
    }

    // Emit via Socket.IO
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", {
        userId: currentUser.uid,
        text: trimmed,
        emotion: userMsgObj.emotion
      });
    } else {
      // Fallback to REST endpoint
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.uid,
            text: trimmed,
            emotion: userMsgObj.emotion
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
          const withAi = [...updated, aiMsgObj];
          await updateDoc(doc(db, "chats", currentChatId), {
            messages: withAi,
            updatedAt: new Date().toISOString(),
            supportLevel: data.level || 1
          });
          if (ttsEnabled && data.text) speakReply(data.text);
        }
      } catch (restErr) {
        console.warn("REST fallback error:", restErr);
        setIsAiReplying(false);
      }
    }
  };

  // 11. Edit Message
  const handleEditMessage = async (msgId) => {
    if (!editText.trim() || !currentChatId) return;
    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        const newLvl = detectLevel(editText);
        return {
          ...m,
          text: editText,
          level: newLvl,
          emotion: newLvl === 3 ? "danger" : newLvl === 2 ? "warning" : "calm",
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
    <div className="flex h-screen w-full bg-[#0B1120] text-slate-100 font-['Inter'] relative overflow-hidden select-none">
      {/* Dynamic Ambient Calming Halo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-[15%] -left-[10%] w-[55%] h-[55%] blur-[140px] rounded-full transition-colors duration-1000 ${
            emotionLevel === 3
              ? "bg-rose-600/15"
              : emotionLevel === 2
              ? "bg-amber-500/15"
              : "bg-teal-500/10"
          }`}
        />
        <div
          className={`absolute bottom-[-10%] -right-[10%] w-[50%] h-[55%] blur-[150px] rounded-full transition-colors duration-1000 ${
            emotionLevel === 3
              ? "bg-red-700/15"
              : emotionLevel === 2
              ? "bg-yellow-600/15"
              : "bg-cyan-600/10"
          }`}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900/90 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col shadow-2xl transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/calmchain-logo.svg" alt="CalmChain Logo" className="w-9 h-9 drop-shadow-md" />
            <div>
              <h1 className="text-xl font-black text-white font-['Outfit'] tracking-tight">CalmChain</h1>
              <p className="text-[11px] text-teal-400 font-semibold">Tranquil Sanctuary</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-300 border border-teal-500/40 rounded-2xl font-bold text-sm transition shadow-lg shadow-teal-500/5 cursor-pointer"
          >
            <PlusCircle size={18} /> New Conversation
          </button>
        </div>

        {/* Conversation History List grouped by Date */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          {loadingChats ? (
            <div className="space-y-2 p-2">
              <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
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
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {groupTitle}
                  </div>
                  {chatList.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-2.5 text-left transition truncate cursor-pointer ${
                        currentChatId === chat.id
                          ? "bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                    >
                      <MessageSquare size={15} className="shrink-0 text-teal-400" />
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
        <div className="p-3 border-t border-slate-800/80 space-y-1 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setShowBreathing(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-teal-300 hover:bg-teal-500/10 transition text-left cursor-pointer"
          >
            <Wind size={16} /> Box Breathing Grounding
          </button>
          <button
            onClick={() => setShowMoodTracker(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-cyan-500/10 transition text-left cursor-pointer"
          >
            <Smile size={16} /> Daily Mood Tracker
          </button>
          <button
            onClick={() => setShowEmergency(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
          >
            <PhoneCall size={16} /> Emergency Helplines
          </button>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-200 truncate">
              {currentUser?.email || "User"}
            </p>
            <p className="text-[10px] text-teal-400">Sanctuary Member</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0 h-full">
        {/* Header Bar */}
        <header className="px-4 sm:px-6 py-3.5 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu size={18} />
            </button>

            {/* Support Level Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 shadow-sm border ${
                  emotionLevel === 3
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : emotionLevel === 2
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    emotionLevel === 3
                      ? "bg-rose-500"
                      : emotionLevel === 2
                      ? "bg-amber-400"
                      : "bg-teal-400"
                  }`}
                />
                Level {emotionLevel}:{" "}
                {emotionLevel === 3
                  ? "Urgent Safety"
                  : emotionLevel === 2
                  ? "Human Support Available"
                  : "Calm Support"}
              </span>

              {emotionLevel === 3 && (
                <button
                  onClick={() => setShowEmergency(true)}
                  className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black transition flex items-center gap-1"
                >
                  <PhoneCall size={12} /> Call 14416
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls (Clock, Audio Readout, Camera) */}
          <div className="flex items-center gap-3">
            {/* Live Time Display */}
            {liveClock && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Clock size={13} className="text-teal-400" />
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
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              {isSpeaking ? <Volume2 size={16} className="animate-pulse text-teal-400" /> : ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Camera Privacy Toggle */}
            <div className="relative flex items-center">
              {cameraActive ? (
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400 shadow-md bg-black">
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
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                  >
                    <VideoOff size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCameraNotice(true)}
                  title="Enable Facial Mirror (Optional & Local)"
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-teal-300 border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Video size={16} />
                  <span className="hidden sm:inline">Camera</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Detected Expression Notification (Subtle Mirror Banner) */}
        {cameraActive && detectedExpression && (
          <div className="px-6 py-1.5 bg-teal-500/10 border-b border-teal-500/20 text-teal-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>🪞 Facial Mirror (Local only):</span>
              <strong className="capitalize">{detectedExpression}</strong>
            </span>
            <span className="text-[10px] text-slate-400">Zero cloud upload</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {loadingMessages ? (
              <div className="space-y-4 py-8">
                <div className="w-2/3 h-14 bg-slate-800/50 rounded-2xl animate-pulse" />
                <div className="w-1/2 h-14 bg-slate-800/50 rounded-2xl ml-auto animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                Starting your calm space...
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[85%] sm:max-w-[78%] p-4 sm:p-5 rounded-3xl relative group shadow-lg leading-relaxed select-text ${
                    msg.sender === "user"
                      ? "bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 text-slate-950 font-medium self-end rounded-br-sm border border-teal-400/30"
                      : "bg-slate-900/90 text-slate-100 self-start rounded-bl-sm border border-slate-800 shadow-slate-950/50"
                  }`}
                >
                  {editingMsgId === msg.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl text-sm border border-slate-700 outline-none focus:border-teal-400"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditMessage(msg.id)}
                          className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check size={13} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[14px] sm:text-[15px] whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>

                      <div className="flex items-center justify-between gap-3 mt-2 text-[10px] opacity-75">
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {msg.edited && <span>(edited)</span>}
                        {msg.sender === "user" && (
                          <button
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditText(msg.text);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-950/20 rounded"
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
              <div className="self-start p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} className="text-teal-400 animate-pulse" />
                <span>CalmChain is reflecting...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Composer */}
        <footer className="p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center gap-2"
          >
            {/* Voice Input Button */}
            {sttSupported && (
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Listening... click to stop" : "Voice Input (Speech-to-Text)"}
                className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-400 animate-pulse"
                    : "bg-slate-800 text-slate-400 hover:text-teal-300 border-slate-700"
                }`}
              >
                {isListening ? <Mic size={20} /> : <Mic size={20} />}
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isListening
                  ? "Listening to your voice..."
                  : "Type what's on your mind or tap mic..."
              }
              className="w-full bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-2xl px-5 py-3.5 text-sm sm:text-base outline-none focus:border-teal-400/80 focus:ring-2 focus:ring-teal-400/20 transition shadow-inner font-normal"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 disabled:opacity-40 text-slate-950 rounded-2xl transition shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>Confidential AI companion • Not a substitute for clinical care</span>
            {emotionLevel === 2 && (
              <span className="text-amber-400 font-semibold">
                Peer Support Desk: Available Mon-Sat 9AM-8PM IST
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
            onClick={() => setShowCameraNotice(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white text-center shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto mb-4">
                <Video size={24} />
              </div>
              <h2 className="text-lg font-bold font-['Outfit'] mb-2">Optional Facial Expression Mirror</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                CalmChain uses your webcam solely for <strong>100% on-device emotion estimation</strong> via face-api.js.
                No video or facial biometrics are ever recorded, stored, or sent to any server. You can turn it off anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCameraNotice(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 text-xs font-black"
                >
                  Allow & Start Camera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auxiliary Modals */}
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

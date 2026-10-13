import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  RotateCcw,
  Loader2
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

  // Active Refs to prevent stale React closures
  const currentChatIdRef = useRef(null);
  const messagesRef = useRef([]);
  const ttsEnabledRef = useRef(false);

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

  // Voice Input (Auto-submit workflow upon speech completion)
  const [voiceState, setVoiceState] = useState("idle"); // 'idle' | 'listening' | 'processing'
  const [sttSupported, setSttSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const hasSubmittedVoiceRef = useRef(false);
  const userCancelledVoiceRef = useRef(false);
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
  const pendingAiTimerRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // 1. Camera Consent Check on sign-in / entry
  useEffect(() => {
    if (currentUser) {
      const consentDecided = sessionStorage.getItem("calmchain_camera_consent_decided");
      if (!consentDecided) {
        setShowCameraNotice(true);
      }
    }
  }, [currentUser]);

  // 2. Live Date & Time timer
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

  // 3. Speech Synthesis (Read aloud) - Independent from message display
  const speakReply = useCallback((text) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const cleanSpeakText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "").trim();
      if (!cleanSpeakText) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeakText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      setIsSpeaking(false);
    }
  }, []);

  // 4. Central Incoming Assistant Message Handler (Guarantees visible text bubble first!)
  const handleIncomingAssistantMessage = useCallback(async (incoming) => {
    if (!incoming || !incoming.text) return;

    // Clear timeout fallback if active
    if (pendingAiTimerRef.current) {
      clearTimeout(pendingAiTimerRef.current);
      pendingAiTimerRef.current = null;
    }

    // Dismiss typing indicator
    setIsAiReplying(false);

    // Update active level and show emergency if Level 3
    if (incoming.level) {
      setSupportLevel(incoming.level);
      if (incoming.level === 3) setShowEmergency(true);
    }

    const aiMsgObj = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: incoming.text,
      sender: "ai",
      emotion: incoming.emotion || "calm",
      level: incoming.level || 1,
      timestamp: incoming.timestamp || new Date().toISOString()
    };

    // STEP 1: IMMEDIATELY RENDER IN REACT STATE (Guarantees visible bubble independently of TTS & network!)
    setMessages((prevMsgs) => {
      // Deduplicate: avoid adding identical response if arrived twice (e.g. socket + REST)
      const alreadyExists = prevMsgs.some(
        (m) =>
          m.sender === "ai" &&
          m.text === aiMsgObj.text &&
          Math.abs(new Date(m.timestamp || 0) - new Date(aiMsgObj.timestamp || 0)) < 3000
      );
      if (alreadyExists) return prevMsgs;
      return [...prevMsgs, aiMsgObj];
    });

    // STEP 2: Optional text-to-speech audio (Plays independently; does NOT block or hide text bubble)
    if (ttsEnabledRef.current && incoming.text) {
      speakReply(incoming.text);
    }

    // STEP 3: Persist to Firestore document using currentChatIdRef
    const activeChatId = currentChatIdRef.current;
    if (activeChatId) {
      try {
        const docRef = doc(db, "chats", activeChatId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const curMsgs = snap.data().messages || [];
          const alreadyInDoc = curMsgs.some(
            (m) =>
              m.sender === "ai" &&
              m.text === aiMsgObj.text &&
              Math.abs(new Date(m.timestamp || 0) - new Date(aiMsgObj.timestamp || 0)) < 3000
          );
          if (!alreadyInDoc) {
            await updateDoc(docRef, {
              messages: [...curMsgs, aiMsgObj],
              updatedAt: new Date().toISOString(),
              supportLevel: incoming.level || 1
            });
          }
        }
      } catch (err) {
        console.warn("Firestore background sync notice:", err);
      }
    }
  }, [setSupportLevel, speakReply]);

  // 5. Initialize Socket.IO connection
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

    s.on("receiveMessage", (incoming) => {
      handleIncomingAssistantMessage(incoming);
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser, handleIncomingAssistantMessage]);

  // REST Fallback Dispatcher
  const callRestAiFallback = useCallback(async (text, assessed, currentMsgList) => {
    try {
      const backendUrl =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        "http://localhost:5000";

      const historyContext = currentMsgList.slice(-6).map((m) => ({
        text: m.text,
        sender: m.sender
      }));

      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.uid || "anonymous",
          text: text,
          emotion: assessed.emotion,
          history: historyContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        handleIncomingAssistantMessage(data);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("[CalmChain] REST fallback error:", err);
      setIsAiReplying(false);
      // Visible fallback message
      handleIncomingAssistantMessage({
        text: "I'm right here with you 💙 Take a slow, steady breath. I'm listening closely — feel free to share whatever is on your mind.",
        emotion: "calm",
        level: assessed.level || 1,
        sender: "ai",
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUser, handleIncomingAssistantMessage]);

  // AI dispatch helper (Socket.IO with robust REST fallback timeout)
  const dispatchAiRequest = useCallback((text, assessed, currentMsgList) => {
    const historyContext = currentMsgList.slice(-6).map((m) => ({
      text: m.text,
      sender: m.sender
    }));

    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", {
        userId: currentUser?.uid,
        text: text,
        emotion: assessed.emotion,
        history: historyContext
      });

      // 6.5s fallback timeout: if socket reply drops, trigger REST fallback
      pendingAiTimerRef.current = setTimeout(() => {
        console.warn("[CalmChain] Socket response timeout, invoking REST fallback...");
        callRestAiFallback(text, assessed, currentMsgList);
      }, 6500);
    } else {
      callRestAiFallback(text, assessed, currentMsgList);
    }
  }, [currentUser, callRestAiFallback]);

  // Central Message Submitter
  const submitMessage = useCallback(async (textToSend) => {
    const trimmed = (textToSend !== undefined ? textToSend : newMessage).trim();
    const activeChatId = currentChatIdRef.current;
    if (!trimmed || !activeChatId || !currentUser) return;

    // Assess support level using centralized classifier
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

    // Update state immediately
    const updated = [...messagesRef.current, userMsgObj];
    setMessages(updated);
    setNewMessage("");
    setIsAiReplying(true);

    // Generate descriptive title from first user message if applicable
    const isFirstUserMsg = !messagesRef.current.some((m) => m.sender === "user");
    const autoTitle = isFirstUserMsg
      ? trimmed.length > 28
        ? `${trimmed.slice(0, 28)}...`
        : trimmed
      : null;

    try {
      const chatDocRef = doc(db, "chats", activeChatId);
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
  }, [currentUser, newMessage, setSupportLevel, dispatchAiRequest]);

  // 6. VOICE INPUT (Speech Recognition with real-time dictation & reliable auto-submit)
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
        finalTranscriptRef.current = "";
        hasSubmittedVoiceRef.current = false;
        userCancelledVoiceRef.current = false;
      };

      recognition.onresult = (event) => {
        let interimText = "";
        let finalPiece = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalPiece += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalPiece) {
          finalTranscriptRef.current = (
            finalTranscriptRef.current + " " + finalPiece
          ).trim();
          setNewMessage(finalTranscriptRef.current);

          // Reset silence timer for automatic submission on speech pause (1.4s)
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (
              !hasSubmittedVoiceRef.current &&
              !userCancelledVoiceRef.current &&
              finalTranscriptRef.current.trim()
            ) {
              setVoiceState("processing");
              try {
                recognitionRef.current?.stop();
              } catch (e) {}
            }
          }, 1400);
        } else if (interimText) {
          setNewMessage(
            (finalTranscriptRef.current + " " + interimText).trim()
          );
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError("Microphone permission denied. You can continue typing normally.");
        } else if (event.error !== "no-speech") {
          setVoiceError("Voice recognition paused. You can continue typing or tap mic again.");
        }
        setVoiceState("idle");
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // If user cancelled explicitly, ignore
        if (userCancelledVoiceRef.current) {
          setVoiceState("idle");
          return;
        }

        // Auto-submit workflow: submit once when speech completes
        const textToSubmit = finalTranscriptRef.current.trim() || newMessage.trim();
        if (!hasSubmittedVoiceRef.current && textToSubmit) {
          hasSubmittedVoiceRef.current = true;
          setVoiceState("processing");
          submitMessage(textToSubmit);
          finalTranscriptRef.current = "";
          setTimeout(() => {
            setVoiceState("idle");
          }, 400);
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
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [submitMessage, newMessage]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (voiceState === "listening" || voiceState === "processing") {
      // Deliberate user cancel
      userCancelledVoiceRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setVoiceState("idle");
    } else {
      // Clean start: stop any playing speech synthesis first so bot doesn't listen to itself
      stopSpeaking();
      userCancelledVoiceRef.current = false;
      hasSubmittedVoiceRef.current = false;
      finalTranscriptRef.current = "";
      setNewMessage("");
      setVoiceError("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start issue:", err);
      }
    }
  };

  const cancelVoiceInput = () => {
    userCancelledVoiceRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceState("idle");
  };

  const finishVoiceInputAndSend = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    const textToSubmit = finalTranscriptRef.current.trim() || newMessage.trim();
    if (textToSubmit && !hasSubmittedVoiceRef.current) {
      hasSubmittedVoiceRef.current = true;
      setVoiceState("processing");
      submitMessage(textToSubmit);
      finalTranscriptRef.current = "";
      setTimeout(() => {
        setVoiceState("idle");
      }, 400);
    }
  };

  // 7. Face-API lazy loading
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

  // 8. Camera controls (Explicit, Optional, Private, 100% On-Device)
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
      setCameraActive(false);
      setShowCameraNotice(false);
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

  const handleAllowCamera = () => {
    sessionStorage.setItem("calmchain_camera_consent_decided", "allowed");
    setShowCameraNotice(false);
    startCamera();
  };

  const handleDismissCamera = () => {
    sessionStorage.setItem("calmchain_camera_consent_decided", "dismissed");
    setShowCameraNotice(false);
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
            // Frame drop
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
      if (pendingAiTimerRef.current) clearTimeout(pendingAiTimerRef.current);
    };
  }, [stopSpeaking]);

  // 9. Load User's Chat List from Firestore (Safe query without composite index requirement)
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoadingChats(true);

    const q = query(
      collection(db, "chats"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        list.sort((a, b) => {
          const timeA = new Date(b.createdAt || b.updatedAt || 0).getTime();
          const timeB = new Date(a.createdAt || a.updatedAt || 0).getTime();
          return timeA - timeB;
        });

        setChats(list);
        setLoadingChats(false);

        if (list.length > 0 && !currentChatIdRef.current) {
          setCurrentChatId(list[0].id);
        } else if (list.length === 0 && !currentChatIdRef.current) {
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

  // 10. Load Current Chat Messages
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
  }, [currentChatId, setSupportLevel]);

  // 11. Create New Chat
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

  // Explicit Send Message (Form submit)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((voiceState === "listening" || voiceState === "processing") && recognitionRef.current) {
      userCancelledVoiceRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setVoiceState("idle");
    }
    await submitMessage(newMessage);
  };

  // Edit Message
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
      {/* Dynamic Ambient Theme Mesh Orbs */}
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 ${theme.sidebarBg} backdrop-blur-2xl border-r ${theme.border} flex flex-col shadow-lg transition-all duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className={`p-5 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <img src="/calmchain-logo.svg" alt="CalmChain Logo" className="w-9 h-9 drop-shadow-md" />
            <div>
              <h1 className="text-xl font-black font-['Outfit'] tracking-tight text-slate-900">
                CalmChain
              </h1>
              <p className={`text-[11px] font-bold ${theme.textSecondary}`}>{theme.name}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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

        {/* Previous Chat History List grouped by Date */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          {loadingChats ? (
            <div className="space-y-2 p-2">
              <div className="h-10 bg-slate-200/60 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-200/60 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-200/60 rounded-xl animate-pulse" />
            </div>
          ) : chats.length === 0 ? (
            <div className={`text-center py-10 ${theme.textMuted} text-xs`}>
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

        {/* Sidebar Grounding Tools Navigation */}
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
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left cursor-pointer text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            <PhoneCall size={16} /> Emergency Helplines
          </button>
        </div>

        {/* User Info & Logout */}
        <div className={`p-4 border-t ${theme.border} flex items-center justify-between bg-slate-50/70`}>
          <div className="truncate pr-2">
            <p className="text-xs font-bold truncate text-slate-800">
              {currentUser?.email || "User"}
            </p>
            <p className={`text-[10px] font-medium ${theme.textMuted}`}>Sanctuary Member</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              className={`md:hidden p-2 rounded-xl bg-white border ${theme.border} hover:bg-slate-50 text-slate-700 shadow-xs`}
            >
              <Menu size={18} />
            </button>

            {/* Active Support Level Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 border ${theme.badge} shadow-xs`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    supportLevel === 3
                      ? "bg-rose-500 animate-ping"
                      : supportLevel === 2
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                {theme.label}
              </span>

              {supportLevel === 3 && (
                <button
                  onClick={() => setShowEmergency(true)}
                  className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <PhoneCall size={12} /> Call 14416
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls (Live Clock, TTS Audio, Camera) */}
          <div className="flex items-center gap-2.5">
            {liveClock && (
              <div className={`hidden lg:flex items-center gap-1.5 text-xs ${theme.textSecondary} bg-white px-3 py-1.5 rounded-xl border ${theme.border} shadow-xs font-medium`}>
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
              className={`p-2 rounded-xl border transition cursor-pointer shadow-xs ${
                ttsEnabled
                  ? theme.badge
                  : `bg-white text-slate-600 border ${theme.border} hover:text-slate-900`
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
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-900">
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
                    className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition cursor-pointer shadow-xs"
                  >
                    <VideoOff size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!cameraActive) {
                      startCamera();
                    }
                  }}
                  title="Enable Facial Emotion Mirror (100% Local & Private)"
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
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
          <div className={`px-6 py-1.5 bg-white/90 border-b ${theme.border} ${theme.textSecondary} text-xs flex items-center justify-between`}>
            <span className="flex items-center gap-2">
              <span>🪞 Facial Mirror (Local only):</span>
              <strong className="capitalize text-emerald-700">{detectedExpression}</strong>
            </span>
            <span className="text-[10px] text-slate-400">Zero cloud upload</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {loadingMessages ? (
              <div className="space-y-4 py-8">
                <div className="w-2/3 h-14 bg-slate-200/60 rounded-2xl animate-pulse" />
                <div className="w-1/2 h-14 bg-slate-200/60 rounded-2xl ml-auto animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className={`text-center py-16 ${theme.textMuted} text-sm`}>
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
                        className={`w-full ${theme.input} px-3 py-2 rounded-xl text-sm outline-none`}
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
                          className={`px-3 py-1 ${theme.accentButton} rounded-lg text-xs font-bold flex items-center gap-1`}
                        >
                          <Check size={13} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[14px] sm:text-[15px] whitespace-pre-wrap break-words leading-relaxed font-normal">
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

            {/* Live Typing / Loading Indicator */}
            {isAiReplying && (
              <div className={`self-start p-4 rounded-3xl ${theme.cardBg} border ${theme.border} flex items-center gap-2 text-xs ${theme.textSecondary}`}>
                <Sparkles size={14} className="animate-pulse" />
                <span>CalmChain is reflecting...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Voice Input Listening / Processing Status Notice */}
        {voiceState === "listening" && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs flex items-center justify-between z-20 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="font-bold">
                Listening to your voice... Speak naturally. Voice will automatically submit upon completion.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={finishVoiceInputAndSend}
                className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg font-bold text-[11px] shadow-xs cursor-pointer hover:bg-emerald-50"
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={cancelVoiceInput}
                className="text-emerald-100 hover:text-white font-medium text-[11px] underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {voiceState === "processing" && (
          <div className="px-6 py-2 bg-teal-600 text-white text-xs flex items-center gap-2 z-20 shadow-md">
            <Loader2 size={14} className="animate-spin" />
            <span className="font-bold">Processing voice transcript... Submitting message.</span>
          </div>
        )}

        {voiceError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs font-medium">
            {voiceError}
          </div>
        )}

        {/* Input Composer */}
        <footer className={`p-3 sm:p-5 ${theme.headerBg} backdrop-blur-xl border-t ${theme.border} shrink-0`}>
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center gap-2"
          >
            {/* Voice Input Microphone Button */}
            {sttSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={
                  voiceState === "listening"
                    ? "Listening... Tap to cancel voice input"
                    : voiceState === "processing"
                    ? "Processing voice..."
                    : "Tap to speak (auto-submits when done speaking)"
                }
                className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
                  voiceState === "listening"
                    ? theme.micActive
                    : voiceState === "processing"
                    ? "bg-teal-500 text-white animate-pulse"
                    : theme.micButton
                }`}
                aria-label="Toggle voice input"
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
                  ? "Listening to speech (auto-submits when you stop)..."
                  : voiceState === "processing"
                  ? "Submitting spoken message..."
                  : "Type what's on your mind or tap the mic..."
              }
              className={`w-full rounded-2xl px-5 py-3.5 text-sm sm:text-base outline-none border transition shadow-xs font-normal ${theme.input}`}
            />

            {/* Manual Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`p-3.5 rounded-2xl transition shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${theme.sendButton}`}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <div className={`max-w-3xl mx-auto mt-2 flex items-center justify-between text-[11px] ${theme.textMuted} px-2`}>
            <span>Confidential AI companion • Voice auto-submits on speech end</span>
            {supportLevel === 2 && (
              <span className="font-semibold text-amber-700">
                Peer Support Desk: Mon-Sat 9AM-8PM IST
              </span>
            )}
          </div>
        </footer>
      </main>

      {/* Camera Consent Modal */}
      <AnimatePresence>
        {showCameraNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={handleDismissCamera}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Video size={28} />
              </div>
              <h2 className="text-xl font-bold font-['Outfit'] mb-2 text-slate-900">
                Would you like to enable camera-based support?
              </h2>
              <p className={`text-xs ${theme.textSecondary} leading-relaxed mb-4`}>
                CalmChain can optionally estimate your facial sentiment in real time to adjust emotional support and comforting grounding tools.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left mb-6 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Sparkles size={14} /> 100% Private & Local
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  All face emotion detection runs locally on your device via Face-API. Zero video feeds or biometrics are ever recorded, stored, or uploaded. Never used as a diagnosis.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDismissCamera}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  Not Now
                </button>
                <button
                  onClick={handleAllowCamera}
                  className={`flex-1 py-3 rounded-xl ${theme.accentButton} text-xs font-black shadow-md transition cursor-pointer`}
                >
                  Allow Camera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grounding & Safety Modals */}
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

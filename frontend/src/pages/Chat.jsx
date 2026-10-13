import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { assessSupportLevel } from "../utils/classifier";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2
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
  const [chatToDelete, setChatToDelete] = useState(null); // { id, title }
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Active Refs to prevent stale React closures
  const currentChatIdRef = useRef(null);
  const messagesRef = useRef([]);
  const ttsEnabledRef = useRef(false);

  // Message composition
  const [newMessage, setNewMessage] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState("");

  // Modals & Tools
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showCameraNotice, setShowCameraNotice] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Voice Input (Continuous listening through natural pauses with silence detection & auto-submit)
  const [voiceState, setVoiceState] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'sent' | 'error'
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const accumulatedFinalTextRef = useRef("");
  const isListeningRef = useRef(false);
  const hasSubmittedVoiceRef = useRef(false);
  const userCancelledVoiceRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const submissionLockRef = useRef(false);
  const submitMessageRef = useRef(null);

  // Speech Synthesis (TTS) - Optional audio readout
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);

  // Live Date/Time
  const [liveClock, setLiveClock] = useState("");

  // Camera & Face-API (Optional, Private, Local)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
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

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

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
      // Abort speech recognition immediately so the microphone NEVER listens to or transcribes the assistant's voice!
      if (recognitionRef.current && isListeningRef.current) {
        userCancelledVoiceRef.current = true;
        isListeningRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        setVoiceState("idle");
        setVoiceLiveTranscript("");
      }

      window.speechSynthesis.cancel();
      const cleanSpeakText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "").trim();
      if (!cleanSpeakText) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeakText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        // Cool down period before mic can receive input again so lingering speaker audio is ignored
        setTimeout(() => {
          isSpeakingRef.current = false;
        }, 500);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      setIsSpeaking(false);
      isSpeakingRef.current = false;
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

    // Cancel speech recognition so incoming assistant text/audio is never captured by microphone
    if (recognitionRef.current && isListeningRef.current) {
      userCancelledVoiceRef.current = true;
      isListeningRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      setVoiceState("idle");
      setVoiceLiveTranscript("");
    }

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
      canRetry: Boolean(incoming.canRetry || incoming.aiError),
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

    // STEP 2: Optional text-to-speech audio (Plays independently; never blocks or hides text bubble)
    if (ttsEnabledRef.current && incoming.text && !incoming.aiError) {
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
          history: historyContext,
          previousLevel: supportLevel
        })
      });

      const data = await res.json();
      if (res.ok) {
        handleIncomingAssistantMessage(data);
      } else {
        // Display clear error if AI provider failed
        handleIncomingAssistantMessage({
          text: data.text || "AI service connection error. Please tap Retry to try again.",
          canRetry: true,
          aiError: true,
          level: assessed.level || 1,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("[CalmChain] REST fallback error:", err);
      setIsAiReplying(false);
      handleIncomingAssistantMessage({
        text: "I am having trouble connecting to the wellness server. Please check your connection and tap Retry.",
        canRetry: true,
        aiError: true,
        level: assessed.level || 1,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUser, handleIncomingAssistantMessage, supportLevel]);

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
        history: historyContext,
        previousLevel: supportLevel
      });

      // 6.5s fallback timeout: if socket reply drops, trigger REST fallback
      pendingAiTimerRef.current = setTimeout(() => {
        console.warn("[CalmChain] Socket response timeout, invoking REST fallback...");
        callRestAiFallback(text, assessed, currentMsgList);
      }, 6500);
    } else {
      callRestAiFallback(text, assessed, currentMsgList);
    }
  }, [currentUser, callRestAiFallback, supportLevel]);

  // Central Message Submitter
  const submitMessage = useCallback(async (textToSend) => {
    const trimmed = (textToSend !== undefined ? textToSend : newMessage).trim();
    const activeChatId = currentChatIdRef.current;
    if (!trimmed || !activeChatId || !currentUser) return;

    setLastUserPrompt(trimmed);

    // Assess support level using centralized classifier with history & sticky previousLevel
    const assessed = assessSupportLevel(trimmed, "calm", messagesRef.current, supportLevel);
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

  // Keep submitMessageRef in sync with submitMessage
  useEffect(() => {
    submitMessageRef.current = submitMessage;
  }, [submitMessage]);

  // Retry the last message when AI provider fails
  const handleRetryLastMessage = useCallback(() => {
    if (lastUserPrompt && submitMessageRef.current) {
      submitMessageRef.current(lastUserPrompt);
    }
  }, [lastUserPrompt]);

  // 6. CONTINUOUS VOICE RECOGNITION (Listens through natural pauses, accumulates speech, auto-submits once)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stay active across natural pauses
      recognition.interimResults = true; // Capture real-time dictation
      recognition.lang = "en-US";

      const processFinalSubmission = (text) => {
        if (submissionLockRef.current || hasSubmittedVoiceRef.current || userCancelledVoiceRef.current) return;
        const clean = (text || "").trim();
        if (!clean) return;

        submissionLockRef.current = true;
        hasSubmittedVoiceRef.current = true;
        isListeningRef.current = false;
        setVoiceState("processing");

        try {
          recognition.stop();
        } catch (e) {}

        // Submit the complete sentence directly to chat — never touches newMessage / typepad
        if (submitMessageRef.current) {
          submitMessageRef.current(clean);
        }
        accumulatedFinalTextRef.current = "";
        setVoiceLiveTranscript("");

        setVoiceState("sent");
        setTimeout(() => {
          setVoiceState("idle");
          hasSubmittedVoiceRef.current = false;
          submissionLockRef.current = false;
        }, 1200);
      };

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState("listening");
        setVoiceError("");
        hasSubmittedVoiceRef.current = false;
        userCancelledVoiceRef.current = false;
        submissionLockRef.current = false;
      };

      recognition.onresult = (event) => {
        // Do NOT process speech if assistant is speaking through device speakers!
        if (isSpeakingRef.current) return;

        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinalTextRef.current = (
              accumulatedFinalTextRef.current + " " + piece
            ).trim();
          } else {
            interimText += piece;
          }
        }

        const liveTranscript = (
          accumulatedFinalTextRef.current + (interimText ? " " + interimText : "")
        ).trim();

        // Update live voice transcript for banner display — NEVER type on the user's keypad/newMessage!
        setVoiceLiveTranscript(liveTranscript);

        // Auto-submit on natural pause: 1.8s of silence after speech ends
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (
            isListeningRef.current &&
            !userCancelledVoiceRef.current &&
            !hasSubmittedVoiceRef.current
          ) {
            const finalClean = (accumulatedFinalTextRef.current + " " + interimText).trim();
            if (finalClean) {
              processFinalSubmission(finalClean);
            }
          }
        }, 1800);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          isListeningRef.current = false;
          setVoiceError("Microphone permission denied. Please allow microphone access in browser settings.");
          setVoiceState("error");
        } else if (event.error !== "no-speech") {
          // Non-fatal error; don't terminate abruptly unless critical
          setVoiceError("Voice recognition notice. You can continue speaking or type normally.");
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // If user cancelled deliberately, do not restart or submit
        if (userCancelledVoiceRef.current) {
          isListeningRef.current = false;
          setVoiceState("idle");
          setVoiceLiveTranscript("");
          return;
        }

        // If already submitted, reset cleanly
        if (hasSubmittedVoiceRef.current) {
          isListeningRef.current = false;
          return;
        }

        // Auto-submit if speech text was captured
        const pending = accumulatedFinalTextRef.current.trim();
        if (pending && !hasSubmittedVoiceRef.current) {
          processFinalSubmission(pending);
          return;
        }

        // If user was still listening and hasn't spoken yet, keep listening across brief pauses
        if (isListeningRef.current && !isSpeakingRef.current) {
          try {
            recognition.start();
            return;
          } catch (e) {
            // Cannot restart; fall through
          }
        }

        isListeningRef.current = false;
        setVoiceState("idle");
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
  }, []); // Mounts once — never aborted by typing or message updates!

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (voiceState === "listening" || voiceState === "processing") {
      // User tapped mic while active: cancel cleanly
      cancelVoiceInput();
    } else {
      // Clean start: stop any playing speech synthesis first so bot doesn't transcribe itself
      stopSpeaking();
      userCancelledVoiceRef.current = false;
      hasSubmittedVoiceRef.current = false;
      submissionLockRef.current = false;
      accumulatedFinalTextRef.current = "";
      setVoiceLiveTranscript("");
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
    isListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    accumulatedFinalTextRef.current = "";
    setVoiceLiveTranscript("");
    setVoiceState("idle");
  };

  const finishVoiceInputAndSend = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const textToSubmit = accumulatedFinalTextRef.current.trim() || voiceLiveTranscript.trim();
    if (textToSubmit && !hasSubmittedVoiceRef.current) {
      submissionLockRef.current = true;
      hasSubmittedVoiceRef.current = true;
      isListeningRef.current = false;
      setVoiceState("processing");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (submitMessageRef.current) {
        submitMessageRef.current(textToSubmit);
      }
      accumulatedFinalTextRef.current = "";
      setVoiceLiveTranscript("");
      setVoiceState("sent");
      setTimeout(() => {
        setVoiceState("idle");
        hasSubmittedVoiceRef.current = false;
        submissionLockRef.current = false;
      }, 1200);
    }
  };

  // 7. Face-API lazy loading (Non-blocking: models load in background without blocking preview)
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

  // 8. CAMERA CONTROLS & LIVE STREAM LIFECYCLE (Fixes black camera preview)
  const startCamera = async () => {
    setCameraError("");
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      setShowCameraNotice(false);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraActive(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied in your browser settings. You can continue using CalmChain with text or voice.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on your device.");
      } else {
        setCameraError("Camera is currently in use or unavailable. Please check device permissions.");
      }
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
    setCameraReady(false);
    setDetectedExpression(null);
  };

  // Attach MediaStream to Video Element immediately upon mount with loadedmetadata & safe play()
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;

      const handleMetadata = () => {
        video
          .play()
          .then(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setCameraReady(true);
            }
          })
          .catch((playErr) => {
            console.warn("Camera autoplay notice:", playErr);
          });
      };

      video.onloadedmetadata = handleMetadata;

      // Fallback check if metadata already loaded
      if (video.readyState >= 2) {
        handleMetadata();
      }
    }
  }, [cameraActive]);

  // Face-API facial emotion detection timer (Runs purely locally; independent from stream)
  useEffect(() => {
    let interval = null;
    if (cameraActive && cameraReady && modelsLoaded) {
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
            // Silently ignore detection drop
          }
        }
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraActive, cameraReady, modelsLoaded]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
      if (pendingAiTimerRef.current) clearTimeout(pendingAiTimerRef.current);
    };
  }, [stopSpeaking]);

  const handleAllowCamera = () => {
    sessionStorage.setItem("calmchain_camera_consent_decided", "allowed");
    setShowCameraNotice(false);
    startCamera();
  };

  const handleDismissCamera = () => {
    sessionStorage.setItem("calmchain_camera_consent_decided", "dismissed");
    setShowCameraNotice(false);
  };

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

  // 11. Create New Chat (Avoids re-sending welcome message on existing chats)
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

  // Delete Conversation (Authenticated User Ownership Verified)
  const handleDeleteChat = async () => {
    if (!chatToDelete || !currentUser) return;
    setIsDeletingChat(true);
    try {
      const targetChat = chats.find((c) => c.id === chatToDelete.id);
      if (targetChat && targetChat.userId !== currentUser.uid) {
        console.error("Permission denied: You do not own this conversation.");
        setIsDeletingChat(false);
        setChatToDelete(null);
        return;
      }

      await deleteDoc(doc(db, "chats", chatToDelete.id));

      if (currentChatIdRef.current === chatToDelete.id) {
        const remaining = chats.filter((c) => c.id !== chatToDelete.id);
        if (remaining.length > 0) {
          setCurrentChatId(remaining[0].id);
        } else {
          await createNewChat();
        }
      }
    } catch (err) {
      console.error("Error deleting conversation from Firestore:", err);
    } finally {
      setIsDeletingChat(false);
      setChatToDelete(null);
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
      isListeningRef.current = false;
      try {
        recognitionRef.current.abort();
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
    <div className={`flex h-screen h-[100dvh] w-full ${theme.pageBg} ${theme.textPrimary} font-['Inter'] relative overflow-hidden select-none transition-colors duration-500`}>
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
        className={`fixed md:static inset-y-0 left-0 z-50 w-[82vw] sm:w-72 max-w-xs ${theme.sidebarBg} backdrop-blur-2xl border-r ${theme.border} flex flex-col shadow-lg transition-all duration-300 ${
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
                    <div
                      key={chat.id}
                      className={`group w-full rounded-xl flex items-center justify-between transition border ${
                        currentChatId === chat.id
                          ? `${theme.activeItem} shadow-xs`
                          : `${theme.inactiveItem} border-transparent`
                      }`}
                    >
                      <button
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          setMobileSidebarOpen(false);
                        }}
                        className="flex-1 p-2.5 flex items-center gap-2.5 text-left truncate cursor-pointer min-w-0"
                      >
                        <MessageSquare size={15} className="shrink-0" />
                        <span className="truncate flex-1 font-medium text-xs">
                          {chat.title || "Conversation"}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat);
                        }}
                        title="Delete conversation"
                        className="p-1.5 mr-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
        <header className={`px-2.5 sm:px-6 py-2.5 sm:py-3.5 ${theme.headerBg} backdrop-blur-xl border-b ${theme.border} flex items-center justify-between shrink-0 shadow-xs gap-2`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl bg-white border ${theme.border} hover:bg-slate-50 text-slate-700 shadow-xs shrink-0`}
              aria-label="Open sidebar menu"
            >
              <Menu size={18} />
            </button>

            {/* Active Support Level Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wide flex items-center gap-1.5 border ${theme.badge} shadow-xs truncate`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    supportLevel === 3
                      ? "bg-rose-500 animate-ping"
                      : supportLevel === 2
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="truncate">{theme.label}</span>
              </span>

              {supportLevel === 3 && (
                <button
                  onClick={() => setShowEmergency(true)}
                  className="px-2 sm:px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] sm:text-[11px] font-black transition flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                >
                  <PhoneCall size={12} /> <span className="hidden xs:inline sm:inline">Call </span>14416
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls (Live Clock, TTS Audio, Camera) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
              aria-label="Toggle text to speech"
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
                <button
                  onClick={stopCamera}
                  title="Turn Off Live Camera Preview"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold transition flex items-center gap-1 text-xs shadow-xs cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                >
                  <VideoOff size={15} />
                  <span className="hidden sm:inline">Camera Live</span>
                  <span className="sm:hidden text-[10px]">Live</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    startCamera();
                  }}
                  title="Enable Facial Emotion Mirror (100% Local & Private)"
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Video size={16} />
                  <span className="hidden sm:inline">Camera</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Camera Permission / Device Notice if present */}
        {cameraError && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => setCameraError("")}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4 pb-4">
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
                  className={`max-w-[88%] sm:max-w-[78%] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl relative group shadow-sm leading-relaxed select-text border ${
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
                        className={`w-full ${theme.input} px-3 py-2 rounded-xl text-base sm:text-sm outline-none`}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditMessage(msg.id)}
                          className={`px-3 py-1 ${theme.accentButton} rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer`}
                        >
                          <Check size={13} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13.5px] sm:text-[15px] whitespace-pre-wrap break-words leading-relaxed font-normal">
                        {msg.text}
                      </p>

                      {/* Retry Button if AI service had an error */}
                      {msg.canRetry && (
                        <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-between">
                          <span className="text-[11px] text-rose-700 font-medium">Service connection issue</span>
                          <button
                            onClick={handleRetryLastMessage}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <RotateCcw size={12} /> Retry
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 mt-2 text-[10px] opacity-75">
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {msg.edited && <span>(edited)</span>}
                        {msg.sender === "user" && (
                          <button
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditText(msg.text);
                            }}
                            className="opacity-70 md:opacity-0 md:group-hover:opacity-100 transition p-1 hover:bg-black/10 rounded cursor-pointer"
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

        {/* VOICE INPUT STATUS BANNERS */}
        {voiceState === "listening" && (
          <div className="px-4 sm:px-6 py-2.5 bg-emerald-600 text-white text-xs flex items-center justify-between z-20 shadow-md">
            <div className="flex items-center gap-2 overflow-hidden mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
              <span className="font-semibold truncate">
                {voiceLiveTranscript
                  ? `🎙️ "${voiceLiveTranscript}"`
                  : "Listening... Speak naturally with pauses. Voice will automatically send when you finish speaking."}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {voiceLiveTranscript && (
                <button
                  type="button"
                  onClick={finishVoiceInputAndSend}
                  className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg font-bold text-[11px] shadow-xs cursor-pointer hover:bg-emerald-50"
                >
                  Send Now
                </button>
              )}
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

        {voiceState === "sent" && (
          <div className="px-6 py-2 bg-emerald-700 text-white text-xs flex items-center gap-2 z-20 shadow-md">
            <CheckCircle2 size={14} />
            <span className="font-bold">Voice message submitted!</span>
          </div>
        )}

        {voiceError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
            <span>{voiceError}</span>
            <button
              onClick={() => setVoiceError("")}
              className="text-rose-900 font-bold hover:underline cursor-pointer ml-2"
            >
              OK
            </button>
          </div>
        )}

        {/* Input Composer */}
        <footer className={`p-2.5 sm:p-5 ${theme.headerBg} backdrop-blur-xl border-t ${theme.border} shrink-0 safe-bottom`}>
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center gap-1.5 sm:gap-2"
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
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition cursor-pointer shrink-0 ${
                  voiceState === "listening"
                    ? theme.micActive
                    : voiceState === "processing"
                    ? "bg-teal-500 text-white animate-pulse"
                    : theme.micButton
                }`}
                aria-label="Toggle voice input"
              >
                <Mic size={19} />
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                voiceState === "listening"
                  ? "Recording voice (auto-sends on speech end)..."
                  : voiceState === "processing"
                  ? "Submitting voice message..."
                  : "Type what's on your mind or tap the mic..."
              }
              className={`w-full rounded-xl sm:rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-base sm:text-base outline-none border transition shadow-xs font-normal ${theme.input}`}
            />

            {/* Manual Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${theme.sendButton}`}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <div className={`max-w-3xl mx-auto mt-1 sm:mt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] ${theme.textMuted} px-1 sm:px-2 gap-0.5 sm:gap-2 text-center sm:text-left`}>
            <span>Confidential AI companion • Voice auto-submits on speech end</span>
            {supportLevel === 2 && (
              <span className="font-semibold text-amber-700">
                Peer Support Desk: Mon-Sat 9AM-8PM IST
              </span>
            )}
          </div>
        </footer>
      </main>

      {/* DOCKED / FLOATING LIVE CAMERA PREVIEW CARD (Visible, responsive, and verified nonzero dimensions) */}
      {cameraActive && (
        <div className="fixed bottom-20 right-2.5 sm:bottom-28 sm:right-6 z-40 w-44 sm:w-72 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 bg-slate-950/95 shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
          {/* Top Title Bar of Preview Card */}
          <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-[10px] sm:text-[11px] tracking-wide">Live Camera Feed</span>
            </div>
            <button
              onClick={stopCamera}
              className="p-1 rounded-lg hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
              title="Close camera preview"
            >
              <X size={14} />
            </button>
          </div>

          {/* Actual Video Canvas with verified metadata and nonzero dimensions */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 text-xs gap-2">
                <Loader2 size={18} className="animate-spin text-emerald-400" />
                <span className="text-[10px] sm:text-xs">Starting stream...</span>
              </div>
            )}
          </div>

          {/* Mirror Sentiment Badge Bar */}
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-300">
            <span className="flex items-center gap-1 sm:gap-1.5 truncate">
              <span>Mirror:</span>
              <strong className="text-emerald-400 capitalize truncate">
                {detectedExpression ? detectedExpression : "Calm & Centered"}
              </strong>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0 ml-1">100% on-device</span>
          </div>
        </div>
      )}

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
              className="w-[92vw] max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 text-center shadow-2xl relative text-slate-900 max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-3.5 sm:mb-4">
                <Video size={26} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] mb-2 text-slate-900">
                Would you like to enable camera-based support?
              </h2>
              <p className={`text-xs ${theme.textSecondary} leading-relaxed mb-4`}>
                CalmChain can optionally estimate your facial sentiment in real time to adjust emotional support and comforting grounding tools.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left mb-5 sm:mb-6 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Sparkles size={14} /> 100% Private & Local
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  All face emotion detection runs locally on your device via Face-API. Zero video feeds or biometrics are ever recorded, stored, or uploaded. Never used as a diagnosis.
                </p>
              </div>
              <div className="flex gap-2.5 sm:gap-3">
                <button
                  onClick={handleDismissCamera}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  Not Now
                </button>
                <button
                  onClick={handleAllowCamera}
                  className={`flex-1 py-2.5 sm:py-3 rounded-xl ${theme.accentButton} text-xs font-black shadow-md transition cursor-pointer`}
                >
                  Allow Camera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Conversation Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isDeletingChat && setChatToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-5 sm:p-7 max-w-sm w-[92vw] shadow-2xl border border-slate-200 space-y-4 text-slate-900 max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Delete Conversation</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{chatToDelete.title || "this conversation"}"</span>? All messages in this session will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChatToDelete(null)}
                  disabled={isDeletingChat}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteChat}
                  disabled={isDeletingChat}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isDeletingChat ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} /> Delete
                    </>
                  )}
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

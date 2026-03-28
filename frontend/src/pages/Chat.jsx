import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot, getDocs, setDoc } from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Video, PlusCircle, MessageSquare, Edit2, Check, VideoOff } from "lucide-react";
import { EmergencyModal } from "../components/EmergencyModal";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");

export const Chat = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [newMessage, setNewMessage] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");

  const [emotionLevel, setEmotionLevel] = useState(1);
  const [showEmergency, setShowEmergency] = useState(false);
  const [levelAnalysis, setLevelAnalysis] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);
  const sessionStartTime = useRef(Date.now());

  // Load Face API models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face models. Make sure they are in public/models", err);
      }
    };
    loadModels();

    // Start New Session Logic
    sessionStartTime.current = Date.now();
    const interval = setInterval(() => {
      const diffMinutes = (Date.now() - sessionStartTime.current) / 60000;
      if (diffMinutes >= 3) {
        analyzeSessionLevel();
        sessionStartTime.current = Date.now(); // reset timer
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const analyzeSessionLevel = async () => {
    if (!currentChatId || messages.length === 0) return;
    let totalLevel = 0;
    messages.forEach(m => { totalLevel += m.level; });
    const avg = totalLevel / messages.length;
    let generalLvl = 1;
    if (avg > 2.2) generalLvl = 3;
    else if (avg > 1.4) generalLvl = 2;

    setLevelAnalysis(`Analysis Complete: You are currently Level ${generalLvl}`);
    setTimeout(() => setLevelAnalysis(""), 5000);
  };

  // Camera & Face API Logic
  useEffect(() => {
    if (modelsLoaded && !cameraActive) {
      startVideo();
    }
    return () => stopVideo();
  }, [modelsLoaded]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera permission denied or not available", err);
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    let faceInterval;
    if (cameraActive && modelsLoaded) {
      faceInterval = setInterval(async () => {
        if (videoRef.current) {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            // Find dominant emotion
            const dominant = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
            // Log expressions silently
            // console.log("Detected expr:", dominant);
          }
        }
      }, 3000);
    }
    return () => clearInterval(faceInterval);
  }, [cameraActive, modelsLoaded]);

  // Fetch Chats History
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "chats"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(fetched);
      if (fetched.length > 0 && !currentChatId) {
        setCurrentChatId(fetched[0].id);
      } else if (fetched.length === 0) {
        createNewChat();
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Messages for Current Chat
  useEffect(() => {
    if (!currentChatId) return;
    const chatDocRef = doc(db, "chats", currentChatId);
    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        setMessages(docSnap.data().messages);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
        // Update emotion level state based on latest message
        const msgs = docSnap.data().messages;
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          // We only take the level from user's message, or if forced to level 3
          if (lastMsg.sender === 'user' || lastMsg.level === 3) {
             setEmotionLevel(lastMsg.level);
             if (lastMsg.level === 3) setShowEmergency(true);
          }
        }
      } else {
        setMessages([]);
      }
    });

    socket.on("receiveMessage", async (message) => {
      if (message.userId !== currentUser.uid) return;
      // When AI replies, we append to array
      const docSnap = await getDocs(query(collection(db, "chats"), where("userId", "==", currentUser.uid))); 
      // safer way to append without wiping the current local array is pulling the specific document
      const currentDocRef = doc(db, "chats", currentChatId);
      getDocs(query(collection(db, "chats"))).then(()=>{}); // mock await
      
      setMessages(prev => {
        const updated = [...prev, {
          id: Date.now().toString(),
          text: message.text,
          sender: "ai",
          emotion: message.emotion,
          level: message.emotion === "danger" ? 3 : 1,
          timestamp: new Date().toISOString()
        }];
        updateDoc(currentDocRef, { messages: updated });
        return updated;
      });
    });

    return () => {
      unsubscribe();
      socket.off("receiveMessage");
    };
  }, [currentChatId, currentUser]);

  const createNewChat = async () => {
    const newDoc = await addDoc(collection(db, "chats"), {
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
      messages: []
    });
    setCurrentChatId(newDoc.id);
  };

  const detectLevel = (text) => {
    const lower = text.toLowerCase();
    const l3Kw = ["suicide", "kill myself", "end life"];
    if (l3Kw.some(kw => lower.includes(kw))) return 3;
    
    const l2Kw = ["sad", "lonely", "stress", "depressed", "angry", "hate"];
    if (l2Kw.some(kw => lower.includes(kw))) return 2;
    
    return 1;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChatId) return;

    const lvl = detectLevel(newMessage);
    setEmotionLevel(lvl);
    if (lvl === 3) setShowEmergency(true);

    const msgObj = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      emotion: lvl === 3 ? "danger" : lvl === 2 ? "warning" : "calm",
      level: lvl,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, msgObj];
    await updateDoc(doc(db, "chats", currentChatId), { messages: updatedMessages });
    
    socket.emit("sendMessage", {
      userId: currentUser.uid,
      text: newMessage,
      emotion: msgObj.emotion
    });

    setNewMessage("");
  };

  const handleEditMessage = async (msgId) => {
    if (!editText.trim()) return;
    const updatedMessages = messages.map(m => {
      if (m.id === msgId) {
        const newLvl = detectLevel(editText);
        return {
           ...m, 
           text: editText, 
           level: newLvl, 
           emotion: newLvl === 3 ? "danger" : newLvl === 2 ? "warning" : "calm"
        };
      }
      return m;
    });
    
    await updateDoc(doc(db, "chats", currentChatId), { messages: updatedMessages });
    setEditingMsgId(null);
    setEditText("");
  };

  const getBackgroundTheme = () => {
    switch(emotionLevel) {
      case 3: return "bg-gradient-to-br from-red-400 via-rose-300 to-white text-rose-900";
      case 2: return "bg-gradient-to-br from-yellow-300 via-amber-200 to-white text-amber-900";
      case 1: 
      default: return "bg-gradient-to-br from-emerald-300 via-teal-200 to-white text-teal-900";
    }
  };

  const handleLogout = () => {
    stopVideo();
    setMessages([]); // clear local state on logout as requested
    auth.signOut().then(() => navigate('/login'));
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-1000 ${getBackgroundTheme()}`}>
      {/* Sidebar */}
      <div className="w-72 bg-white/40 backdrop-blur-md border-r border-white/30 flex flex-col shadow-xl z-20">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">CalmChain</h2>
          <p className="text-sm font-medium opacity-70">Your tranquil space</p>
        </div>
        
        <button 
          onClick={createNewChat}
          className="mx-4 mb-4 flex items-center justify-center gap-2 py-3 bg-white/60 hover:bg-white/90 rounded-xl shadow-sm text-gray-800 font-semibold transition"
        >
          <PlusCircle size={18} /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setCurrentChatId(chat.id)}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${
                currentChatId === chat.id ? "bg-white/80 shadow text-blue-700 font-semibold" : "hover:bg-white/40 text-gray-700"
              }`}
            >
              <MessageSquare size={16} />
              <span className="truncate text-sm">
                {new Date(chat.createdAt).toLocaleDateString()} Chat
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/30">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-700 rounded-xl font-bold transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Floating Level Analysis Toast */}
        <AnimatePresence>
          {levelAnalysis && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg z-30 font-medium text-sm"
            >
              {levelAnalysis}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="px-8 py-5 flex justify-between items-center bg-white/20 backdrop-blur-md border-b border-white/20 shadow-sm z-10">
          <div>
            <span className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-sm ${
              emotionLevel === 3 ? "bg-red-500 text-white" : 
              emotionLevel === 2 ? "bg-yellow-400 text-yellow-900" : "bg-emerald-500 text-white"
            }`}>
              Level {emotionLevel} Mode
            </span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black/10 border-2 border-white/50 flex flex-col items-center justify-center text-teal-900">
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 opacity-50" />
               {!cameraActive && <VideoOff size={20} className="z-10" />}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col gap-6 pt-4">
             {messages.map((msg) => (
               <motion.div 
                 key={msg.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`max-w-[80%] p-5 rounded-3xl shadow-lg border relative group ${
                   msg.sender === "user" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white self-end rounded-br-sm border-blue-400/50 shadow-blue-500/20" 
                    : "bg-white/95 backdrop-blur-md self-start rounded-bl-sm text-gray-800 border-white/50 shadow-black/5"
                 }`}
               >
                 {editingMsgId === msg.id ? (
                   <div className="flex items-center gap-2">
                     <input 
                        type="text" 
                        value={editText} 
                        onChange={e => setEditText(e.target.value)}
                        className="bg-white/20 px-3 py-1 rounded outline-none w-full text-white placeholder-white/50"
                        autoFocus
                     />
                     <button onClick={() => handleEditMessage(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check size={16}/></button>
                   </div>
                 ) : (
                   <div className="flex flex-col">
                     <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                     
                     {msg.sender === "user" && (
                       <button 
                         onClick={() => { setEditingMsgId(msg.id); setEditText(msg.text); }}
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-white/20 text-white rounded-md"
                       >
                         <Edit2 size={14} />
                       </button>
                     )}
                   </div>
                 )}
               </motion.div>
             ))}
             <div ref={chatEndRef} />
          </div>
        </main>

        <div className="p-6 bg-white/10 backdrop-blur-lg border-t border-white/20">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md text-gray-900 placeholder-gray-500 rounded-full px-6 py-4 outline-none focus:ring-4 focus:ring-blue-400/50 border border-white/60 shadow-xl transition-all font-medium"
              placeholder="How are you feeling right now?"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-transform active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
      </div>
    </div>
  );
};

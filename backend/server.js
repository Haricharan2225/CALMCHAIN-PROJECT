const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { assessSupportLevel } = require("./classifier");
const { findBestReferenceResponse, getResponseLibraryStats } = require("./responseLibraries");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50kb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Concise, empathetic mental wellness system instructions
const WELLNESS_SYSTEM_INSTRUCTION = `You are CalmChain (TranquilNet), an empathetic, confidential AI mental wellness companion.
CRITICAL CONVERSATIONAL RULES:
1. Keep replies SHORT, SIMPLE, AND NATURAL (typically 1 to 4 sentences, strictly under 180 words).
2. Never produce long robotic essays, bullet lists, or repetitive boilerplate.
3. Respond directly to what the user actually said:
   - If they greet you -> greet them warmly.
   - If they ask an educational or general question -> answer clearly and directly.
   - If they share stress, sadness, college, work, family or relationship issues -> validate their feelings with empathy and offer one gentle, practical next step.
   - If they ask for a coping or breathing technique -> provide a concise grounding exercise.
4. Use recent conversation history for context so follow-up questions make sense.
5. You are NOT a doctor, psychiatrist, or medical professional. Do not diagnose conditions.
6. If the user expresses imminent self-harm, suicide, or crisis, prioritize immediate safety, ask if they are in immediate danger, and provide 24/7 helplines (India: 112 for Emergency, 14416 for Tele-MANAS toll-free 24/7).`;

/**
 * Generate concise, natural, context-aware mental-wellness responses.
 * Respects configured cloud AI providers (Gemini, Groq, OpenAI).
 * Uses our 600-response library (200 per level) for grounding and offline routing.
 */
async function generateAiResponse(text, userEmotion, riskAssessment, chatHistory = []) {
  if (!text || typeof text !== "string") {
    return "I'm here with you. Take a steady breath whenever you're ready to share.";
  }
  const cleanText = text.trim().slice(0, 1000);
  const lower = cleanText.toLowerCase();

  // Retrieve best matched reference response from the 200-item library for this support level
  const bestReference = findBestReferenceResponse(riskAssessment.level, cleanText, chatHistory);

  // --------------------------------------------------------------------------
  // LEVEL 3 SAFETY PROTOCOL (Immediate priority; never overridden by prompts)
  // --------------------------------------------------------------------------
  if (riskAssessment.level === 3) {
    if (bestReference && bestReference.text) {
      return bestReference.text;
    }
    return "I hear how much pain you're carrying right now, and I want you to know you are not alone 💙 Are you in immediate danger right now? Please connect with someone who can help right now — you can call Tele-MANAS at 14416 (toll-free 24/7) or National Emergency 112 immediately. Confidential resources are on your screen.";
  }

  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const hasCloudConfig = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY
  );

  // 1. Google Gemini Provider
  if ((provider === "gemini" || process.env.GEMINI_API_KEY) && process.env.GEMINI_API_KEY) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const contents = [];
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        chatHistory.slice(-4).forEach((m) => {
          if (m.text && typeof m.text === "string") {
            contents.push({
              role: m.sender === "user" ? "user" : "model",
              parts: [{ text: m.text.slice(0, 400) }]
            });
          }
        });
      }

      contents.push({
        role: "user",
        parts: [
          {
            text: `${WELLNESS_SYSTEM_INSTRUCTION}\n\nSupport Level: Level ${riskAssessment.level}\nReference Tone Example: "${bestReference.text}"\nUser message: "${cleanText}"\nReply (1-3 sentences, warm, natural, directly answering their message under 150 words):`
          }
        ]
      });

      const payload = {
        contents,
        generationConfig: {
          maxOutputTokens: 140,
          temperature: 0.7
        }
      };

      const res = await axios.post(url, payload, { timeout: 8000 });
      const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim()) return candidate.trim();
    } catch (err) {
      console.warn("[CalmChain AI] Gemini provider error:", err?.response?.data || err?.message);
      const providerError = new Error("Gemini AI service error. Tap Retry to reconnect.");
      providerError.aiError = true;
      throw providerError;
    }
  }

  // 2. Groq Provider
  if ((provider === "groq" || process.env.GROQ_API_KEY) && process.env.GROQ_API_KEY) {
    try {
      const messages = [
        {
          role: "system",
          content: `${WELLNESS_SYSTEM_INSTRUCTION}\nSupport Level: Level ${riskAssessment.level}\nReference Tone Example: "${bestReference.text}"`
        }
      ];

      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        chatHistory.slice(-4).forEach((m) => {
          if (m.text && typeof m.text === "string") {
            messages.push({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text.slice(0, 400)
            });
          }
        });
      }

      messages.push({ role: "user", content: cleanText });

      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages,
          max_tokens: 140,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 8000
        }
      );
      const content = res.data?.choices?.[0]?.message?.content;
      if (content && content.trim()) return content.trim();
    } catch (err) {
      console.warn("[CalmChain AI] Groq provider error:", err?.response?.data || err?.message);
      const providerError = new Error("Groq AI service error. Tap Retry to reconnect.");
      providerError.aiError = true;
      throw providerError;
    }
  }

  // 3. OpenAI Provider
  if ((provider === "openai" || process.env.OPENAI_API_KEY) && process.env.OPENAI_API_KEY) {
    try {
      const messages = [
        {
          role: "system",
          content: `${WELLNESS_SYSTEM_INSTRUCTION}\nSupport Level: Level ${riskAssessment.level}\nReference Tone Example: "${bestReference.text}"`
        }
      ];

      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        chatHistory.slice(-4).forEach((m) => {
          if (m.text && typeof m.text === "string") {
            messages.push({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text.slice(0, 400)
            });
          }
        });
      }

      messages.push({ role: "user", content: cleanText });

      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages,
          max_tokens: 140,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 8000
        }
      );
      const content = res.data?.choices?.[0]?.message?.content;
      if (content && content.trim()) return content.trim();
    } catch (err) {
      console.warn("[CalmChain AI] OpenAI provider error:", err?.response?.data || err?.message);
      const providerError = new Error("OpenAI service error. Tap Retry to reconnect.");
      providerError.aiError = true;
      throw providerError;
    }
  }

  // --------------------------------------------------------------------------
  // 4. CONTEXT-AWARE OFFLINE ROUTING & REFERENCE RETRIEVAL ENGINE
  // --------------------------------------------------------------------------

  // 4.1 Multi-turn context lookback
  const recentUserTexts = Array.isArray(chatHistory)
    ? chatHistory
        .filter((m) => m.sender === "user" && m.text)
        .slice(-3)
        .map((m) => m.text.toLowerCase())
    : [];

  const priorUserContext = recentUserTexts.join(" ");

  // Handle follow-up questions like "Why does it hurt so much in my chest?"
  if (lower.includes("why does it hurt") || lower.includes("why does it feel like this")) {
    if (priorUserContext.includes("breakup") || priorUserContext.includes("ex") || priorUserContext.includes("partner")) {
      return "Emotional heartbreak activates the exact same physical pain pathways in the brain as a bodily injury 💙 That tight ache in your chest is a physical manifestation of grief. Give your body rest, sip warm tea, and let yourself cry if you need to.";
    }
    if (priorUserContext.includes("exam") || priorUserContext.includes("college") || priorUserContext.includes("study")) {
      return "When academic stress builds up without enough rest, your muscles hold onto tension and your nervous system stays on high alert. That tension is real. Let's take three slow breaths together and release your shoulders.";
    }
    return "When our nervous system carries unresolved stress or sadness, it often translates into physical tightness in the chest, throat, or stomach. Taking slow exhalations helps signal safety to your body. Would you like to try a gentle breathing exercise?";
  }

  // Handle follow-up questions like "Can you guide me through box breathing now?"
  if (lower.includes("guide me through") && (lower.includes("breathing") || lower.includes("box"))) {
    return "Let's do Box Breathing right now: Inhale slowly for 4 counts... Hold gently for 4 counts... Exhale smoothly for 4 counts... And rest empty for 4 counts. Repeat this twice, and notice how your chest softens.";
  }

  if (lower.includes("what should i do next") || lower.includes("what can i do next") || lower.includes("how to fix this")) {
    if (priorUserContext.includes("exam") || priorUserContext.includes("study")) {
      return "For right now: put away all study materials for 15 minutes, drink a glass of water, and step outside for fresh air. Once your mind cools down, write down only your top 2 priorities for tomorrow. Does that sound manageable?";
    }
    if (priorUserContext.includes("breakup") || priorUserContext.includes("lonely")) {
      return "Next small step: make yourself a warm beverage, wrap in a soft blanket, and reach out to a trusted friend or family member for gentle company. You don't have to carry this grief alone tonight.";
    }
    return "The best next step is small: drink a glass of water, unclench your jaw, and focus only on the next 15 minutes. What is one gentle thing you can do for yourself right now?";
  }

  // 4.2 Greetings & Friendly Introductions
  if (/^(hi|hello|hey|hii|heyy|howdy|greetings|good\s+morning|good\s+afternoon|good\s+evening)\b/i.test(lower) || lower === "hi" || lower === "hello" || lower === "hey" || lower === "hii") {
    return "Hi 🌿 Welcome to CalmChain. I'm here to listen and support you. How are you feeling today?";
  }

  // 4.3 Positive acknowledgements ("I am happy", "feeling good")
  if (/\b(i\s+am\s+happy|feeling\s+happy|feel\s+happy|so\s+happy|i\s+am\s+good|feeling\s+good|feel\s+good|i\s+feel\s+great|feeling\s+great|great\s+day|wonderful\s+day|doing\s+well|in\s+a\s+good\s+mood)\b/i.test(lower) && !lower.includes("not happy") && !lower.includes("not good")) {
    return "I'm so glad to hear that! 😊 Taking a moment to appreciate positive feelings is wonderful. What has brought you joy or calm today?";
  }

  // 4.4 Empathetic responses to sadness ("I am sad", "feeling down")
  if (/\b(i\s+am\s+sad|feeling\s+sad|feel\s+sad|so\s+sad|feeling\s+down|feel\s+down|feeling\s+low|feel\s+low|feeling\s+unhappy|sad\s+today)\b/i.test(lower)) {
    return "I hear you, and it's completely okay to feel sad 💙 You don't have to carry this heaviness all by yourself. What's been on your mind today?";
  }

  // 4.5 Study & Academic Guidance
  if (/\b(how\s+to\s+study|study\s+tips|exam\s+tips|study\s+advice|prepare\s+for\s+exam|study\s+pressure|exam\s+pressure|exam\s+stress|concentrate\s+on\s+studies|focus\s+on\s+studying)\b/i.test(lower)) {
    return "When study stress feels high, try breaking your session into 25-minute Pomodoro intervals with 5-minute movement breaks. Take three slow breaths before starting, clear away phone distractions, and tackle just one concept at a time. Which subject or topic are you focusing on right now?";
  }

  // 4.6 Single-word / minimal conversational replies
  if (/^(yes|yeah|yep|sure|ok|okay)\b/i.test(lower) && cleanText.length < 15) {
    if (priorUserContext.includes("breath") || priorUserContext.includes("grounding")) {
      return "Wonderful. Inhale gently for 4 seconds... and let it out slow for 4 seconds. How does your chest feel as you do that?";
    }
    return "I'm right here with you. Take your time, and share whatever feels right whenever you're ready.";
  }
  if (/^(no|nope|not really|nah)\b/i.test(lower) && cleanText.length < 15) {
    return "That is completely fine. We don't have to push anything. We can just rest quietly together in this sanctuary, or try a gentle grounding exercise whenever you feel like it.";
  }

  // 4.7 Direct Questions & Knowledge Queries
  if (/\b(how are you|how're you|how do you feel)\b/i.test(lower)) {
    return "I'm feeling calm and present with you today, thank you for asking! 🌿 More importantly, how has your heart and mind been treating you today?";
  }

  if (/\b(what is machine learning|explain machine learning|what's machine learning)\b/i.test(lower)) {
    return "Machine learning is a branch of artificial intelligence where computer systems learn patterns from data rather than following static rules. In wellness tech like CalmChain, it helps tailor supportive tones and support levels to how you're feeling. What aspect of AI are you curious about?";
  }

  if (/\b(neural networks|how neural networks work|what is deep learning)\b/i.test(lower)) {
    return "Neural networks are computational models inspired by the human brain, consisting of interconnected layers of nodes that learn complex patterns from data. They power modern language understanding and empathetic AI assistants. What topic in AI would you like to explore?";
  }

  if (/\b(who are you|what are you|what is calmchain|who created you)\b/i.test(lower)) {
    return "I'm CalmChain (TranquilNet), your confidential AI mental wellness companion. I'm designed to offer a peaceful sanctuary, active listening, Box Breathing grounding tools, and safe crisis support whenever you need a moment of calm.";
  }

  if (/\b(what can you do|what are your features|how can you help)\b/i.test(lower)) {
    return "I can listen whenever you want to express your thoughts, guide you through Box Breathing exercises, track your daily moods, adapt support levels, and provide 24/7 emergency resources if you ever feel overwhelmed. How can I help you right now?";
  }

  // 4.4 Coping Techniques & Practical Grounding Requests
  if (/\b(coping technique|coping mechanism|grounding technique|tips for anxiety|how to calm down|help me calm down|relaxation technique)\b/i.test(lower)) {
    return "Here is a quick sensory technique called 5-4-3-2-1: notice 5 things you can see around you, 4 things you can physically touch, 3 sounds you can hear, 2 scents you can notice, and 1 slow deep breath. You can also open the Box Breathing tool in your sidebar anytime.";
  }

  if (lower.includes("breathing") || lower.includes("box breathing")) {
    return "Let's take a slow breath together: inhale gently for 4 seconds, hold for 4, exhale for 4, and rest for 4. You can also tap 'Box Breathing Grounding' in the sidebar for an animated guide.";
  }

  // 4.5 General Knowledge Questions Catch (e.g. "What is...", "Why is...")
  if (/^(what is|what are|why is|why do|how do|how can|can you explain)\b/i.test(lower)) {
    if (lower.includes("anxiety") || lower.includes("panic")) {
      return "Anxiety is your body's natural alarm system reacting to perceived stress. Even though the sensations feel alarming, they are temporary and cannot harm you. Taking long, slow exhalations helps signal to your nervous system that you are safe in this moment.";
    }
    if (lower.includes("stress")) {
      return "Stress is the body's reaction to high demands or uncertainty. Finding small moments of recovery — like taking a 5-minute walk, staying hydrated, and setting one boundary — helps restore your equilibrium.";
    }
  }

  // 4.5 Targeted Intent Handlers (Tech/Idioms, Third-Person Crisis, Celebrations, Wellness)
  if (/\b(kill\s+a\s+process|kill\s+process|terminal|bug\s+is\s+killing)\b/i.test(lower)) {
    return "To kill a process in terminal, find its PID with 'ps aux | grep <name>' and run 'kill -9 <PID>' (or 'taskkill /F /PID <PID>' in Windows). In wellness terms, when tricky code bugs feel overwhelming, remember to step away from your monitor for two minutes to clear your perspective!";
  }

  if (/\b(my friend|friend|roommate|classmate)\s+(wants to die|is suicidal|planning to suicide|talking about suicide)\b/i.test(lower) || lower.includes("friend wants to die")) {
    return "If your friend is expressing thoughts of suicide, take it very seriously 💙 If they are in immediate danger, call 112 immediately. In India, you can also dial Tele-MANAS together at 14416 (toll-free 24/7) so a trained counselor can guide you both. Do not leave your friend alone right now.";
  }

  if (/\b(happy|loved it|celebrate|proud of|passed my|great day|excited)\b/i.test(lower) && !lower.includes("not happy")) {
    return "That is wonderful news! 🎉 Taking time to celebrate your achievements and soak in moments of joy is so important for your emotional wellbeing. What felt like the best part of that accomplishment?";
  }

  if (/\b(daily habits|wellness habits|habits for|better mental|healthy routine|habits)\b/i.test(lower) && lower.includes("wellbeing")) {
    return "A few grounded daily habits for mental wellbeing: 1) Morning sunlight for 10 minutes to set circadian rhythm, 2) Staying hydrated throughout the day, 3) Taking 5-minute walking breaks away from screens, and 4) Practicing gentle Box Breathing whenever tension surfaces. Which of these feels easiest to practice today?";
  }

  // 4.6 Contextual Retrieval Fallback from the 200+ response library
  // Returns the retrieved, high-quality, category-specific response matching the current support level!
  if (bestReference && bestReference.text) {
    return bestReference.text;
  }

  return "I'm right here with you in this space 🌿 How has your day been treating your heart and mind so far?";
}

// REST Endpoints
app.get("/api/health", (req, res) => {
  const stats = getResponseLibraryStats();
  res.json({
    status: "healthy",
    service: "CalmChain Wellness Server",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY),
    provider: process.env.AI_PROVIDER || "offline",
    responseLibraries: stats,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { userId, text, emotion, history, previousLevel } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text message is required" });
    }

    const risk = assessSupportLevel(text, emotion, history, previousLevel);
    const aiText = await generateAiResponse(text, emotion, risk, history);

    return res.json({
      userId,
      text: aiText,
      sender: "ai",
      emotion: risk.emotion,
      level: risk.level,
      reason: risk.reason,
      confidence: risk.confidence,
      signals: risk.signals,
      requiresImmediateSupport: risk.requiresImmediateSupport,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in /api/chat:", err.message);
    const isAiError = Boolean(err.aiError);
    return res.status(isAiError ? 502 : 500).json({
      error: true,
      aiError: isAiError,
      message: err.message || "Wellness service error",
      text: isAiError
        ? `Unable to connect to the configured AI provider: ${err.message}. Please check credentials or retry.`
        : "I'm here with you. Take a steady breath while we reconnect.",
      sender: "ai",
      canRetry: true,
      emotion: "calm",
      level: 1,
      confidence: 0.8,
      signals: ["api_error"],
      requiresImmediateSupport: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Socket.IO Real-time Connection
io.on("connection", (socket) => {
  console.log(`[CalmChain] Client connected: ${socket.id}`);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`[CalmChain] Socket ${socket.id} joined personal room for user: ${userId}`);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { userId, text, emotion, history, previousLevel } = data || {};
      if (!userId || !text) return;

      const risk = assessSupportLevel(text, emotion, history, previousLevel);
      const aiReply = await generateAiResponse(text, emotion, risk, history);

      const responsePayload = {
        userId,
        text: aiReply,
        sender: "ai",
        emotion: risk.emotion,
        level: risk.level,
        reason: risk.reason,
        confidence: risk.confidence,
        signals: risk.signals,
        requiresImmediateSupport: risk.requiresImmediateSupport,
        timestamp: new Date().toISOString()
      };

      if (userId) {
        io.to(userId).emit("receiveMessage", responsePayload);
      } else {
        socket.emit("receiveMessage", responsePayload);
      }
    } catch (err) {
      console.error("[CalmChain] Error processing socket message:", err.message);
      const isAiError = Boolean(err.aiError);
      const errorPayload = {
        userId: data?.userId,
        error: true,
        aiError: isAiError,
        canRetry: true,
        text: isAiError
          ? `AI service notice: ${err.message}. Please tap Retry to try again.`
          : "I'm here with you. Take a steady breath while we reconnect.",
        sender: "ai",
        emotion: "calm",
        level: 1,
        confidence: 0.8,
        signals: ["socket_error"],
        requiresImmediateSupport: false,
        timestamp: new Date().toISOString()
      };

      if (data?.userId) {
        io.to(data.userId).emit("receiveMessage", errorPayload);
      } else {
        socket.emit("receiveMessage", errorPayload);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[CalmChain] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[CalmChain Backend] Running on http://localhost:${PORT}`);
  console.log(`[CalmChain Backend] AI Provider mode: ${process.env.AI_PROVIDER || "offline"}`);
  const stats = getResponseLibraryStats();
  console.log(`[CalmChain Backend] Response Libraries Loaded: L1=${stats.level1Count}, L2=${stats.level2Count}, L3=${stats.level3Count} (Total=${stats.totalCount})`);
});

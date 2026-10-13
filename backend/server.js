const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { assessSupportLevel } = require("./classifier");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Concise, empathetic mental wellness system instructions
const WELLNESS_SYSTEM_INSTRUCTION = `You are CalmChain, an empathetic, calm AI mental wellness companion.
CRITICAL CONVERSATIONAL RULES:
1. Keep replies SHORT, SIMPLE, AND NATURAL (typically 1 to 4 sentences, roughly 20 to 60 words for ordinary messages).
2. Never produce long walls of text, robotic intros, or repetitive boilerplate like "Tell me more, I'm listening".
3. Respond directly to what the user actually said with warmth and validation. Ask ONE useful follow-up question when appropriate.
4. If the user explicitly asks for detailed explanations or a guided exercise, provide appropriate detail because it was requested.
5. You are NOT a doctor, psychiatrist, or licensed clinical therapist. Never make medical or psychiatric diagnoses.
6. If the user expresses imminent self-harm, suicide, or crisis, calmly ask: "Are you in immediate danger right now?" and remind them that free, confidential help is available 24/7 (Tele-MANAS: 14416, Emergency: 112).`;

// Generate concise empathetic response using configured AI Provider or Offline Engine
async function generateAiResponse(text, userEmotion, riskAssessment) {
  const provider = (process.env.AI_PROVIDER || "offline").toLowerCase();

  // Urgent Level 3 Safety Protocol takes immediate priority
  if (riskAssessment.level === 3) {
    return "I hear how much pain you're carrying right now, and I want you to know you are not alone 💙 Are you in immediate danger right now? Please connect with someone who can help right now — you can call Tele-MANAS at 14416 or Emergency 112 immediately. We have resources ready on your screen.";
  }

  // 1. Google Gemini Provider
  if ((provider === "gemini" || process.env.GEMINI_API_KEY) && process.env.GEMINI_API_KEY) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${WELLNESS_SYSTEM_INSTRUCTION}\n\nUser message: "${text}"\nReply (1-3 sentences, warm and concise):` }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.7
        }
      };

      const res = await axios.post(url, payload, { timeout: 7000 });
      const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) return candidate.trim();
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local wellness engine:", err?.message || err);
    }
  }

  // 2. Groq Provider
  if ((provider === "groq" || process.env.GROQ_API_KEY) && process.env.GROQ_API_KEY) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: WELLNESS_SYSTEM_INSTRUCTION },
            { role: "user", content: text }
          ],
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 7000
        }
      );
      const content = res.data?.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (err) {
      console.warn("Groq API call failed, falling back to local wellness engine:", err?.message || err);
    }
  }

  // 3. OpenAI Provider
  if ((provider === "openai" || process.env.OPENAI_API_KEY) && process.env.OPENAI_API_KEY) {
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: WELLNESS_SYSTEM_INSTRUCTION },
            { role: "user", content: text }
          ],
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 7000
        }
      );
      const content = res.data?.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to local wellness engine:", err?.message || err);
    }
  }

  // 4. Transparent, Empathetic Offline Support Engine (Concise, Conversational, Human-Centric)
  const lower = text.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|good afternoon)\b/i.test(lower)) {
    return "Hi 💚 I'm here with you. How are you feeling today?";
  }

  // Breathing / Grounding Request
  if (lower.includes("breathing exercise") || lower.includes("breath exercise") || lower.includes("grounding")) {
    return "Let's try box breathing: inhale gently for 4 seconds, hold for 4, exhale for 4, then pause for 4. Repeat gently a few times. You can also tap the Box Breathing tool in your sidebar whenever you like.";
  }

  // Bad day / tough day
  if (lower.includes("bad day") || lower.includes("rough day") || lower.includes("terrible day") || lower.includes("awful day")) {
    return "I'm sorry today was difficult. 💚 Want to tell me what happened?";
  }

  // Exam / college stress
  if (lower.includes("exam") || lower.includes("study") || lower.includes("studies") || lower.includes("homework") || lower.includes("college")) {
    return "That sounds stressful, but remember to take it one step at a time. What's worrying you most right now?";
  }

  // Presentation / public speaking
  if (lower.includes("presentation") || lower.includes("nervous about")) {
    return "It's completely natural to feel nervous before a presentation. Take a deep, slow breath right now. Would running through what you want to say help you feel more prepared?";
  }

  // Level 2 Elevated Distress
  if (riskAssessment.level === 2) {
    if (lower.includes("lonely") || lower.includes("isolated") || lower.includes("nobody understands")) {
      return "Feeling isolated is really tough, but you are not alone in this space 💙 I'm sitting right here with you. Would you like to share what's on your mind?";
    }
    if (lower.includes("overwhelmed") || lower.includes("too much") || lower.includes("giving up")) {
      return "When everything piles up, it's exhausting. Let's pause together and take a slow breath. If you could set aside everything else, what is the single smallest thing we can focus on right now?";
    }
    if (lower.includes("panic") || lower.includes("anxiety") || lower.includes("overthinking")) {
      return "When overthinking and anxiety rise, grounding can gently anchor you. Try placing both feet flat on the floor and taking 3 slow, deep breaths. I'm right here with you.";
    }
    return "I hear how heavy this feels right now. Thank you for sharing it with me 💚 Let's take it one gentle breath at a time. What feels like the hardest part at this moment?";
  }

  // Good / positive / peaceful
  if (lower.includes("happy") || lower.includes("good") || lower.includes("relaxed") || lower.includes("peaceful") || lower.includes("doing okay")) {
    return "That's wonderful to hear 😊 What's brought you a feeling of calm or joy today?";
  }

  // General conversational reply
  return "I'm listening and holding space for you. How has your day been treating your heart and mind so far?";
}

// REST Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "CalmChain Wellness Server",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.HF_TOKEN),
    provider: process.env.AI_PROVIDER || "offline",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { userId, text, emotion } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text message is required" });
    }

    const risk = assessSupportLevel(text, emotion);
    const aiText = await generateAiResponse(text, emotion, risk);

    return res.json({
      userId,
      text: aiText,
      sender: "ai",
      emotion: risk.emotion,
      level: risk.level,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({
      error: "Internal wellness service error",
      text: "I'm here with you. Take a steady breath while we reconnect.",
      sender: "ai",
      emotion: "calm",
      level: 1,
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
      const { userId, text, emotion } = data || {};
      if (!userId || !text) return;

      const risk = assessSupportLevel(text, emotion);
      const aiReply = await generateAiResponse(text, emotion, risk);

      const responsePayload = {
        userId,
        text: aiReply,
        sender: "ai",
        emotion: risk.emotion,
        level: risk.level,
        timestamp: new Date().toISOString()
      };

      if (userId) {
        io.to(userId).emit("receiveMessage", responsePayload);
      } else {
        socket.emit("receiveMessage", responsePayload);
      }
    } catch (err) {
      console.error("[CalmChain] Error processing socket message:", err);
      socket.emit("receiveMessage", {
        userId: data?.userId,
        text: "I'm here with you. Take a gentle breath while we reconnect.",
        sender: "ai",
        emotion: "calm",
        level: 1,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    // Clean socket disconnect
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` CalmChain Mental Wellness Server active`);
  console.log(` Listening on port: ${PORT}`);
  console.log(` Provider Mode: ${process.env.AI_PROVIDER || 'offline'}`);
  console.log(`===============================================`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { assessSupportLevel } = require("./classifier");

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
const WELLNESS_SYSTEM_INSTRUCTION = `You are CalmChain, an empathetic, calm AI mental wellness companion.
CRITICAL CONVERSATIONAL RULES:
1. Keep replies SHORT, SIMPLE, AND NATURAL (typically 1 to 4 sentences, roughly 20 to 60 words for ordinary messages).
2. Never produce long walls of text, robotic intros, or repetitive boilerplate like "Tell me more, I'm listening".
3. Respond directly to what the user actually said with warmth and validation. Ask ONE useful follow-up question when appropriate.
4. If the user explicitly asks for detailed explanations or a guided exercise, provide appropriate detail because it was requested.
5. You are NOT a doctor, psychiatrist, or licensed clinical therapist. Never make medical or psychiatric diagnoses.
6. If the user expresses imminent self-harm, suicide, or crisis, calmly ask: "Are you in immediate danger right now?" and remind them that free, confidential help is available 24/7 (Tele-MANAS: 14416, Emergency: 112).`;

/**
 * Generate concise, empathetic response using configured AI Provider or topic-aware wellness engine.
 */
async function generateAiResponse(text, userEmotion, riskAssessment) {
  // Input validation
  if (!text || typeof text !== "string") {
    return "I'm here with you. Take a steady breath whenever you're ready to share.";
  }
  const cleanText = text.trim().slice(0, 1000); // Guard max length

  // --------------------------------------------------------------------------
  // LEVEL 3 SAFETY PROTOCOL (Immediate priority)
  // --------------------------------------------------------------------------
  if (riskAssessment.level === 3) {
    return "I hear how much pain you're carrying right now, and I want you to know you are not alone 💙 Are you in immediate danger right now? Please connect with someone who can help right now — you can call Tele-MANAS at 14416 (toll-free 24/7) or National Emergency 112 immediately. Confidential resources are on your screen.";
  }

  const provider = (process.env.AI_PROVIDER || "").toLowerCase();

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
              { text: `${WELLNESS_SYSTEM_INSTRUCTION}\n\nSupport Level: Level ${riskAssessment.level}\nUser message: "${cleanText}"\nReply (1-3 sentences, warm, specific to their message):` }
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
      if (candidate && candidate.trim()) return candidate.trim();
    } catch (err) {
      console.warn("[CalmChain AI] Gemini provider error:", err?.response?.data || err?.message);
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
            { role: "system", content: `${WELLNESS_SYSTEM_INSTRUCTION}\nSupport Level: Level ${riskAssessment.level}` },
            { role: "user", content: cleanText }
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
      if (content && content.trim()) return content.trim();
    } catch (err) {
      console.warn("[CalmChain AI] Groq provider error:", err?.response?.data || err?.message);
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
            { role: "system", content: `${WELLNESS_SYSTEM_INSTRUCTION}\nSupport Level: Level ${riskAssessment.level}` },
            { role: "user", content: cleanText }
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
      if (content && content.trim()) return content.trim();
    } catch (err) {
      console.warn("[CalmChain AI] OpenAI provider error:", err?.response?.data || err?.message);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Topic-Aware Empathetic Mental Wellness Engine
  // Generates specific, comforting, non-repetitive responses tailored to the
  // user's actual emotion and subject.
  // --------------------------------------------------------------------------
  const lower = cleanText.toLowerCase();

  // Breathing / Grounding tool request
  if (lower.includes("breathing") || lower.includes("grounding") || lower.includes("calm down")) {
    return "Let's take a slow breath together: inhale for 4 seconds, gently hold for 4, and release for 4. You can also open the Box Breathing tool in your sidebar anytime.";
  }

  // LEVEL 2 TOPICS: Stress, Heartbreak, Exams, Loneliness, Overthinking, Anger, Crying
  if (riskAssessment.level === 2) {
    if (lower.includes("breakup") || lower.includes("hurt") || lower.includes("heartbroken") || lower.includes("relationship")) {
      return "Going through a breakup is deeply painful, and it's completely okay to feel hurt right now 💙 Be gentle with yourself today. What part feels most difficult to sit with at this moment?";
    }
    if (lower.includes("exam") || lower.includes("study") || lower.includes("studies") || lower.includes("college") || lower.includes("test")) {
      return "Exam stress can feel like a heavy weight, but remember you don't have to carry the whole semester at once. Let's take it one concept at a time. What is worrying you most right now?";
    }
    if (lower.includes("lonely") || lower.includes("isolated") || lower.includes("alone") || lower.includes("nobody")) {
      return "Feeling lonely can ache in a very quiet way, but you are not alone in this space 💙 I'm right here with you. What usually brings you a tiny bit of comfort when loneliness hits?";
    }
    if (lower.includes("overthinking") || lower.includes("racing") || lower.includes("anxious") || lower.includes("panic") || lower.includes("tension")) {
      return "When anxiety and overthinking take over, let's ground your senses. Feel your feet resting on the floor and take three long, slow exhalations. What specific thought is looping right now?";
    }
    if (lower.includes("cry") || lower.includes("crying") || lower.includes("sad") || lower.includes("tears")) {
      return "Crying is your nervous system's way of releasing built-up tension, so please don't hold it back. It's okay to feel sad. Would you like to tell me what triggered these feelings?";
    }
    if (lower.includes("angry") || lower.includes("frustrated") || lower.includes("mad") || lower.includes("furious")) {
      return "It makes sense that you're feeling frustrated — anger often shows up when things feel unfair or overwhelming. Take a moment to let that out. What happened that made you feel this way?";
    }
    if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("tired")) {
      return "When tension keeps you awake, try relaxing your jaw and dropping your shoulders right now. Rest is still valuable even if sleep is delayed. How long have you been having trouble sleeping?";
    }
    if (lower.includes("overwhelmed") || lower.includes("too much") || lower.includes("giving up") || lower.includes("future")) {
      return "When everything feels like too much, we only need to survive the next five minutes. You don't have to figure out your entire future today. What is the single smallest thing on your mind right now?";
    }
    return "I hear how heavy this feels for you right now 💚 Thank you for having the courage to share it. Let's take a slow breath together — what feels like the hardest part at this moment?";
  }

  // LEVEL 1 TOPICS: Positive, Calm, Daily reflection, Greetings
  if (lower.includes("good") || lower.includes("happy") || lower.includes("relaxed") || lower.includes("calm") || lower.includes("grateful") || lower.includes("fine") || lower.includes("okay")) {
    return "I'm really glad to hear that 😊 Moments of calm and gratitude are so precious. What's been the brightest or most peaceful part of your day?";
  }
  if (lower.includes("excited") || lower.includes("nice day") || lower.includes("better")) {
    return "That's wonderful to hear! Having something to look forward to brings so much light. What's making you feel excited?";
  }
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(lower)) {
    return "Hi 🌿 Welcome to your calm sanctuary. How is your heart and mind feeling today?";
  }
  if (lower.includes("homework") || lower.includes("work") || lower.includes("day") || lower.includes("talk")) {
    return "I'm listening and right here with you. What would you like to explore or share today?";
  }

  return "I'm right here with you in this space 🌿 How has your day been treating your heart and mind so far?";
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
        text: "I'm here with you. Take a steady breath while we reconnect.",
        sender: "ai",
        emotion: "calm",
        level: 1,
        timestamp: new Date().toISOString()
      });
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
});

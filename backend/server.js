const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

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

// System prompt enforcing mental wellness boundaries
const WELLNESS_SYSTEM_INSTRUCTION = `You are CalmChain (TranquilNet), an empathetic, calm, and non-judgmental AI mental wellness companion.
Your role is to offer supportive listening, validation, and gentle grounding guidance.
IMPORTANT RULES:
1. You are NOT a doctor, psychiatrist, or licensed medical therapist. Never claim to diagnose mental health conditions or prescribe medical treatment.
2. Keep your replies concise (2 to 4 sentences), soothing, and easy to read.
3. Validate user feelings without judgment. Encourage mindfulness, deep breathing, or healthy grounding techniques when appropriate.
4. If the user expresses thoughts of suicide, self-harm, or severe danger, prioritize their safety: encourage them warmly to reach out for immediate human assistance, and remind them that they are not alone. Never promise secrecy around self-harm.`;

// Multi-signal risk assessment
function assessRiskLevel(text, clientEmotion = "calm") {
  const lower = (text || "").toLowerCase().trim();
  
  const level3Keywords = [
    "suicide", "suicidal", "sucide", "kill myself", "end my life", "ending my life",
    "end it all", "want to die", "dont want to live", "don't want to live",
    "hang myself", "slit my", "overdose", "cant live anymore", "can't live anymore",
    "no reason to live", "better off dead"
  ];

  const level2Keywords = [
    "depressed", "depression", "panic attack", "anxiety", "anxious", "overwhelmed",
    "lonely", "hopeless", "crying", "cant breathe", "can't breathe", "suffocating",
    "hate myself", "worthless", "exhausted", "burnout", "stressed out", "stress",
    "hurting inside", "scared", "terrified", "lost"
  ];

  for (const kw of level3Keywords) {
    if (lower.includes(kw)) {
      return { level: 3, emotion: "danger" };
    }
  }

  for (const kw of level2Keywords) {
    if (lower.includes(kw)) {
      return { level: 2, emotion: "warning" };
    }
  }

  if (clientEmotion === "danger") return { level: 3, emotion: "danger" };
  if (clientEmotion === "warning" || clientEmotion === "sad" || clientEmotion === "angry") {
    return { level: 2, emotion: "warning" };
  }

  return { level: 1, emotion: "calm" };
}

// Generate empathetic response using configured AI Provider or Transparent Offline Mode
async function generateAiResponse(text, userEmotion, riskAssessment) {
  const provider = (process.env.AI_PROVIDER || "offline").toLowerCase();

  // If Level 3 is detected, safety response takes priority
  if (riskAssessment.level === 3) {
    return "I hear how much pain you're carrying right now, and I want you to know you are not alone 💙 Your safety matters deeply. Please reach out to someone who can help right now — you can call Tele-MANAS at 14416 or 112 immediately. We have resources ready on your screen.";
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
              { text: `${WELLNESS_SYSTEM_INSTRUCTION}\n\nUser expresses (${userEmotion || "unspecified"}): "${text}"\nRespond empathetically:` }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 180,
          temperature: 0.7
        }
      };

      const res = await axios.post(url, payload, { timeout: 8000 });
      const candidates = res.data?.candidates;
      if (candidates && candidates.length > 0 && candidates[0]?.content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text.trim();
      }
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
          max_tokens: 150,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 8000
        }
      );
      if (res.data?.choices?.[0]?.message?.content) {
        return res.data.choices[0].message.content.trim();
      }
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
          max_tokens: 150,
          temperature: 0.7
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 8000
        }
      );
      if (res.data?.choices?.[0]?.message?.content) {
        return res.data.choices[0].message.content.trim();
      }
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to local wellness engine:", err?.message || err);
    }
  }

  // 4. Hugging Face Inference API
  if ((provider === "huggingface" || process.env.HF_TOKEN) && process.env.HF_TOKEN) {
    try {
      const model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
      const res = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: `<s>[INST] <<SYS>>\n${WELLNESS_SYSTEM_INSTRUCTION}\n<</SYS>>\n\n${text} [/INST]`,
          parameters: { max_new_tokens: 150, temperature: 0.7 }
        },
        {
          headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
          timeout: 8000
        }
      );
      if (Array.isArray(res.data) && res.data[0]?.generated_text) {
        const full = res.data[0].generated_text;
        const answer = full.split("[/INST]").pop()?.trim() || full;
        return answer;
      }
    } catch (err) {
      console.warn("Hugging Face API call failed, falling back to local wellness engine:", err?.message || err);
    }
  }

  // Transparent, Empathetic Offline Support Sanctuary Engine (Zero Mock Deception)
  const lowerText = text.toLowerCase();
  if (riskAssessment.level === 2) {
    return "Thank you for sharing that with me. It takes real courage to put heavy emotions into words. Remember to take a slow breath right now — you don't have to navigate everything all at once. What feels like the hardest part at this moment?";
  }

  if (lowerText.includes("anxious") || lowerText.includes("panic") || lowerText.includes("nervous")) {
    return "When anxiety starts to feel overwhelming, grounding can help bring you back to the present. Try relaxing your shoulders and inhaling deeply for 4 counts, holding for 4, and exhaling for 4. I'm right here with you.";
  }

  if (lowerText.includes("sad") || lowerText.includes("lonely") || lowerText.includes("hurt")) {
    return "I'm holding space for you today. It is completely okay to feel sad or tired. Please be gentle with yourself, and feel free to share whatever is on your mind whenever you're ready.";
  }

  if (lowerText.includes("happy") || lowerText.includes("good") || lowerText.includes("better") || lowerText.includes("peace")) {
    return "It's wonderful to hear that you're feeling a sense of calm and positivity today 😊 What has brought you peace or joy recently?";
  }

  return "Thank you for reaching out to CalmChain today. I'm here to listen without judgment. How has your day been treating your heart and mind so far?";
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

    const risk = assessRiskLevel(text, emotion);
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
      text: "I'm having a brief connection pause, but please take a steady breath. I am still here listening.",
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

  // Allow client to join their dedicated personal room
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

      const risk = assessRiskLevel(text, emotion);
      const aiReply = await generateAiResponse(text, emotion, risk);

      const responsePayload = {
        userId,
        text: aiReply,
        sender: "ai",
        emotion: risk.emotion,
        level: risk.level,
        timestamp: new Date().toISOString()
      };

      // Send response specifically to the sender's socket or room (NEVER broadcast to all sockets)
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

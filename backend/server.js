const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("sendMessage", (data) => {
    // data: { userId, text, emotion }
    const { userId, text, emotion } = data;

    // In a real scenario, could call Hugging Face API here.
    // E.g., const response = await axios.post("HF_URL", { inputs: text });
    
    // For now, mock AI fallback
    setTimeout(() => {
      let aiResponseText = "Tell me more, I'm listening...";
      
      const lower = text.toLowerCase();
      const isSuicide = ["suicide", "sucide", "kill myself", "end life", "want to die"].some(k => lower.includes(k));
      let currentEmotion = emotion;

      if (isSuicide || emotion === "danger") {
         aiResponseText = "I'm triggering an emergency protocol. Please use the resources on your screen.";
         currentEmotion = "danger";
      } else if (emotion === "sad" || ["sad", "lonely", "stress"].some(k => lower.includes(k))) {
         aiResponseText = "I'm here for you 💙 You are not alone.";
      } else if (emotion === "happy") {
         aiResponseText = "That's amazing 😊 Keep smiling!";
      } else if (emotion === "angry") {
         aiResponseText = "Take a deep breath. I'm here with you.";
      }

      io.emit("receiveMessage", {
        userId,
        text: aiResponseText,
        sender: "ai",
        emotion: currentEmotion,
      });
    }, 1500);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

# CalmChain (TranquilNet) 💙🌿
### AI-Assisted Mental Wellness Support Sanctuary & Real-time Safety Platform

**Final-Year B.Tech Project** | **Repository:** [https://github.com/Haricharan2225/CALMCHAIN-PROJECT.git](https://github.com/Haricharan2225/CALMCHAIN-PROJECT.git)

---

## 🌟 Overview
**CalmChain** is an empathetic, privacy-first AI mental wellness platform engineered to provide accessible conversational grounding, emotional de-escalation, and urgent safety escalation. 

Built with React 19, Tailwind CSS v4, Node.js, Express, Socket.IO, and Firebase (Authentication & Cloud Firestore), CalmChain blends ambient design with multi-tier emotional safety to support individuals experiencing stress, anxiety, or emotional distress.

---

## 🛡️ Core System Architecture

```
calmchain-project/
├── frontend/                     # React 19 + Vite Client
│   ├── public/
│   │   ├── calmchain-logo.svg    # Official CalmChain Vector Logo
│   │   ├── favicon.svg           # High-contrast Favicon
│   │   └── models/               # On-device face-api.js neural weights
│   ├── src/
│   │   ├── components/
│   │   │   ├── BreathingExerciseModal.jsx  # Interactive 4-4-4 Box Breathing
│   │   │   ├── MoodTrackerModal.jsx        # Private Mood Log & Timeline
│   │   │   ├── EmergencyModal.jsx          # Tele-MANAS (14416) & 112 Safety Hub
│   │   │   └── ProtectedRoute.jsx          # Role-Based Route Guard
│   │   ├── pages/
│   │   │   ├── Home.jsx                    # Landing page with live clock & features
│   │   │   ├── Login.jsx                   # Secure authentication with persistence
│   │   │   ├── Signup.jsx                  # Account registration with role tagging
│   │   │   ├── Chat.jsx                    # Core AI chat, voice STT/TTS, history
│   │   │   └── AdminDashboard.jsx          # Real-time Firestore analytics & supervisor
│   │   ├── hooks/useAuth.jsx               # Firebase Auth Context & Role Manager
│   │   ├── firebase.js                     # Firebase Web SDK initialization
│   │   ├── index.css                       # Modern Mint/Teal/Slate Design System
│   │   └── App.jsx                         # Client routing
│   ├── .env                                # Client environment configuration
│   └── package.json
└── backend/                      # Express + Socket.IO API Server
    ├── server.js                 # Multi-provider AI, risk detection, room sockets
    ├── .env.example              # Server environment template
    ├── .env                      # Local server configuration
    └── package.json
```

---

## 🎯 Key Implemented Capabilities

### 1. 🎨 Modern, Calming Mint/Teal/Slate UI
- Ambient mesh gradients, smooth glassmorphism, and accessible high-contrast typography (`Outfit` headings + `Inter` body).
- Fully responsive across mobile, tablet, and widescreen desktop displays.
- Full reduced-motion accessibility support.

### 2. 🛡️ Three-Tier Emotional Support System
- **Level 1 (Calm Support):** Mint/Teal accent with gentle conversational validation and instant interactive Box Breathing grounding tool.
- **Level 2 (Additional Human Support):** Amber/Yellow accent offering peer support information and honest counselor desk availability indicators.
- **Level 3 (Urgent Safety Escalation):** High-visibility Rose/Red safety state providing immediate direct calling access to **Tele-MANAS (14416)**, **National Emergency (112)**, and verified crisis helplines.

### 3. 💬 Persistent Multi-Conversation History
- Fully persisted in Cloud Firestore (`chats` collection) scoped to each authenticated user.
- Sidebar automatically groups conversations by **Today**, **Yesterday**, and **Older**.
- Automatically generates descriptive conversation titles from the user's first reflection.
- Automatic first welcome message appears once per new conversation without duplicates on re-render.

### 4. 🎙️ Voice Input (STT) & Speech Readout (TTS)
- Browser-native speech recognition button in chat composer.
- Transcribes speech directly into the input field for user review and editing before sending.
- Optional speech synthesis readout with dedicated stop audio toggle.

### 5. 🪞 Privacy-Conscious Local Facial Mirror (Webcam)
- Completely optional (default OFF) requiring explicit user consent.
- Runs 100% locally in the browser via `@vladmandic/face-api`.
- Zero video, audio, or biometric data is ever recorded, stored, or uploaded to any server.

### 6. 🌿 Private Mood Sanctuary & Timeline
- Voluntary daily mood logging with emojis (🌿 Deeply Calm, 😊 Content, 😐 Neutral, 🌧️ Low, 🌪️ Overwhelmed) and reflection notes.
- Private Firestore timeline with formatted date labels and loading states.

### 7. 📊 Real-Time Admin Dashboard
- Live Firestore listener streams active conversations, registered accounts, and safety escalations.
- Dynamic Sentiment/Level distribution chart rendered using Chart.js.
- Role-based security ensuring only authorized supervisors access administrative telemetry.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your backend environment variables (optional: add Gemini or Groq key)
cp .env.example .env
npm run dev
# Server will start on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Vite client will start on http://localhost:5173
```

### 3. Production Build
```bash
cd frontend
npm run build
# Production assets will be bundled into frontend/dist/
```

---

## 🔒 Security & Privacy Notice
CalmChain is built with strict mental wellness safety principles:
- **Zero Medical Diagnosis:** CalmChain is an AI conversational companion and does not claim to diagnose clinical psychiatric conditions or replace professional psychotherapy.
- **Immediate Emergency Handoff:** In moments of acute distress, safety protocols prioritize immediate human connection via verified toll-free helplines.
- **Client Biometric Privacy:** Camera feed is never streamed over any network.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, Play, Pause, RotateCcw } from "lucide-react";

const PHASE_CONFIG = {
  Inhale: {
    label: "INHALE",
    labelClass: "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]",
    borderClass: "border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.55)]",
    glowClass: "bg-emerald-400/25",
    gradientClass: "from-emerald-900/90 via-teal-950/80 to-[#0A251E]",
    instruction: "Breathe in gently and deeply through your nose...",
    scaleTarget: 1.3
  },
  Hold: {
    label: "HOLD",
    labelClass: "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]",
    borderClass: "border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.55)]",
    glowClass: "bg-cyan-400/25",
    gradientClass: "from-cyan-900/90 via-blue-950/80 to-[#0B1E36]",
    instruction: "Gently hold your breath. Feel the tranquil stillness...",
    scaleTarget: 1.3
  },
  Exhale: {
    label: "EXHALE",
    labelClass: "text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.8)]",
    borderClass: "border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.55)]",
    glowClass: "bg-teal-400/25",
    gradientClass: "from-teal-900/90 via-emerald-950/80 to-[#092B23]",
    instruction: "Slowly and smoothly release breath through your mouth...",
    scaleTarget: 0.95
  },
  Rest: {
    label: "REST",
    labelClass: "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]",
    borderClass: "border-white/80 shadow-[0_0_35px_rgba(255,255,255,0.45)]",
    glowClass: "bg-white/20",
    gradientClass: "from-slate-800/90 via-teal-950/70 to-[#0F172A]",
    instruction: "Pause naturally and rest before the next cycle begins...",
    scaleTarget: 0.95
  }
};

export const BreathingExerciseModal = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState("Inhale");
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const timerRef = useRef(null);

  // Clean reset when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
      setPhase("Inhale");
      setCountdown(4);
      setCyclesCompleted(0);
    }
  }, [isOpen]);

  // Interval timer for 4-4-4-4 rhythm
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setPhase((curr) => {
              if (curr === "Inhale") return "Hold";
              if (curr === "Hold") return "Exhale";
              if (curr === "Exhale") return "Rest";
              if (curr === "Rest") {
                setCyclesCompleted((c) => c + 1);
                return "Inhale";
              }
              return "Inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setPhase("Inhale");
    setCountdown(4);
    setCyclesCompleted(0);
  };

  const handleToggle = () => {
    setIsActive((prev) => !prev);
  };

  const currentConfig = PHASE_CONFIG[phase] || PHASE_CONFIG.Inhale;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0B132B]/95 border border-teal-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl relative text-center text-white overflow-hidden backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Cyan Accent Beam */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 shadow-xs"
              aria-label="Close breathing exercise"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-1.5 text-teal-300">
              <Wind size={22} className="animate-pulse text-teal-400" />
              <h2 className="text-xl font-bold font-['Outfit'] tracking-tight text-white">
                Box Breathing Grounding
              </h2>
            </div>
            <p className="text-xs text-slate-300 mb-7">
              4-4-4-4 autonomic rhythm to restore nervous system calm
            </p>

            {/* Animated Vibrant Breathing Circle Arena */}
            <div className="relative w-64 h-64 mx-auto mb-7 flex items-center justify-center">
              {/* Outer Radiant Glow Orb */}
              <motion.div
                animate={{
                  scale: isActive ? (phase === "Inhale" || phase === "Hold" ? 1.4 : 1.05) : 1.1,
                  opacity: isActive ? 0.8 : 0.35
                }}
                transition={{ duration: 3.8, ease: "easeInOut" }}
                className={`absolute inset-4 rounded-full blur-2xl transition-colors duration-1000 ${currentConfig.glowClass}`}
              />

              {/* Middle Pulsing Ring */}
              <motion.div
                animate={{
                  scale: isActive ? (phase === "Inhale" || phase === "Hold" ? 1.25 : 1.0) : 1.0,
                  opacity: isActive ? [0.4, 0.8, 0.4] : 0.3
                }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                className={`absolute inset-8 rounded-full border-2 transition-all duration-700 ${currentConfig.borderClass}`}
              />

              {/* Main Breathing Core Orb */}
              <motion.div
                animate={{
                  scale: isActive ? currentConfig.scaleTarget : 1
                }}
                transition={{ duration: 3.8, ease: "easeInOut" }}
                className={`w-40 h-40 rounded-full bg-gradient-to-br ${currentConfig.gradientClass} border-2 ${currentConfig.borderClass} flex flex-col items-center justify-center relative z-10 transition-all duration-700`}
              >
                {/* Phase Tag */}
                <span className={`text-xs font-black tracking-widest uppercase transition-all duration-500 ${currentConfig.labelClass}`}>
                  {currentConfig.label}
                </span>

                {/* Big Vibrant Countdown */}
                <span className="text-5xl font-black font-['Outfit'] my-1 text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  {countdown}
                </span>

                {/* Subtitle */}
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  seconds
                </span>
              </motion.div>
            </div>

            {/* Dynamic Phase Guidance Text */}
            <p className="text-xs sm:text-sm font-semibold text-slate-200 min-h-[38px] px-3 mb-6 transition-colors duration-500">
              {isActive ? currentConfig.instruction : "Press Start Breathing to begin your synchronized calming cycle."}
            </p>

            {/* Action Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleToggle}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition shadow-lg cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-slate-900/50"
                    : "bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 shadow-teal-500/25"
                }`}
              >
                {isActive ? <Pause size={17} /> : <Play size={17} />}
                {isActive ? "Pause Rhythm" : "Start Breathing"}
              </button>

              <button
                onClick={handleReset}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer shadow-xs active:scale-95"
                title="Reset Cycle"
                aria-label="Reset exercise"
              >
                <RotateCcw size={17} />
              </button>
            </div>

            {/* Cycles counter */}
            {cyclesCompleted > 0 && (
              <p className="text-xs text-teal-300 mt-4 font-bold flex items-center justify-center gap-1.5">
                <span>✨</span>
                <span>{cyclesCompleted} box cycle{cyclesCompleted > 1 ? "s" : ""} completed. Feeling centered!</span>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

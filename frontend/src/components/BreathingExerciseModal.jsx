import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, Play, Pause, RotateCcw } from "lucide-react";

export const BreathingExerciseModal = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState("Inhale"); // "Inhale", "Hold", "Exhale", "Rest"
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setIsActive(false);
      setPhase("Inhale");
      setCountdown(4);
      setCyclesCompleted(0);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    let timer = null;
    if (isActive) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            setPhase((currPhase) => {
              if (currPhase === "Inhale") return "Hold";
              if (currPhase === "Hold") return "Exhale";
              if (currPhase === "Exhale") return "Rest";
              if (currPhase === "Rest") {
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
    }
    return () => clearInterval(timer);
  }, [isActive]);

  const getPhaseInstruction = () => {
    switch (phase) {
      case "Inhale":
        return "Breathe in gently through your nose...";
      case "Hold":
        return "Gently hold your breath. Feel the stillness...";
      case "Exhale":
        return "Release slowly through your mouth...";
      case "Rest":
        return "Pause and rest before the next breath...";
      default:
        return "Follow the calm rhythm...";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "Inhale":
        return "from-teal-400 to-cyan-500 text-teal-300";
      case "Hold":
        return "from-blue-400 to-indigo-500 text-blue-300";
      case "Exhale":
        return "from-emerald-400 to-teal-500 text-emerald-300";
      case "Rest":
        return "from-slate-400 to-teal-600 text-slate-300";
      default:
        return "from-teal-400 to-cyan-500 text-teal-300";
    }
  };

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative text-center text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              aria-label="Close breathing exercise"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-2 text-teal-400">
              <Wind size={22} className="animate-pulse" />
              <h2 className="text-xl font-bold font-['Outfit']">Box Breathing Grounding</h2>
            </div>
            <p className="text-xs text-slate-400 mb-8">
              A 4-4-4-4 rhythm to activate your parasympathetic nervous system and restore calm.
            </p>

            {/* Animated Breathing Circle */}
            <div className="relative w-56 h-56 mx-auto mb-8 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{
                  scale: isActive
                    ? phase === "Inhale"
                      ? [1, 1.3]
                      : phase === "Hold"
                      ? 1.3
                      : phase === "Exhale"
                      ? [1.3, 1]
                      : 1
                    : 1,
                  opacity: isActive ? [0.4, 0.7, 0.4] : 0.3
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full border border-teal-500/40 bg-teal-500/10 blur-sm"
              />

              {/* Main Breathing Core */}
              <motion.div
                animate={{
                  scale: isActive
                    ? phase === "Inhale"
                      ? 1.25
                      : phase === "Hold"
                      ? 1.25
                      : phase === "Exhale"
                      ? 0.95
                      : 0.95
                    : 1
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border-2 border-teal-400/60 shadow-xl flex flex-col items-center justify-center z-10"
              >
                <span className="text-xs uppercase font-bold tracking-widest text-teal-300">
                  {phase}
                </span>
                <span className="text-4xl font-black font-['Outfit'] my-1 text-white">
                  {countdown}
                </span>
                <span className="text-[10px] text-slate-400">seconds</span>
              </motion.div>
            </div>

            {/* Guidance Text */}
            <p className="text-sm font-medium text-slate-300 min-h-[40px] px-4 mb-6">
              {isActive ? getPhaseInstruction() : "Press start to begin your 4-phase calming breath."}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition shadow-lg ${
                  isActive
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
                    : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black"
                }`}
              >
                {isActive ? <Pause size={18} /> : <Play size={18} />}
                {isActive ? "Pause" : "Start Breathing"}
              </button>

              <button
                onClick={() => {
                  setIsActive(false);
                  setPhase("Inhale");
                  setCountdown(4);
                  setCyclesCompleted(0);
                }}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
                title="Reset"
                aria-label="Reset exercise"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {cyclesCompleted > 0 && (
              <p className="text-xs text-teal-400 mt-4 font-semibold">
                ✨ {cyclesCompleted} cycle{cyclesCompleted > 1 ? "s" : ""} completed. Well done!
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

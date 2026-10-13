import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Shield, HeartPulse, MessageSquare, Wind, PhoneCall, ArrowRight, Clock } from "lucide-react";

export const Home = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
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
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-['Inter'] flex flex-col relative overflow-hidden">
      {/* Calming Ambient Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] bg-teal-500/10 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[25%] -right-[10%] w-[50%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[25%] w-[45%] h-[45%] bg-emerald-600/10 blur-[130px] rounded-full"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-4 sm:px-6 py-3.5 sm:py-5 flex justify-between items-center max-w-7xl mx-auto border-b border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img src="/calmchain-logo.svg" alt="CalmChain Logo" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md shrink-0" />
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">CalmChain</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 uppercase tracking-wider">
              TranquilNet 3.0
            </span>
          </div>
        </div>

        {/* Live Date/Time & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          {currentTime && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
              <Clock size={13} className="text-teal-400" />
              <span>{currentTime}</span>
            </div>
          )}
          <Link
            to="/login"
            className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition px-2.5 sm:px-3 py-1.5 sm:py-2"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start Calm Session</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-20 z-10 text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900/80 backdrop-blur-xl py-1.5 sm:py-2 px-3.5 sm:px-5 rounded-full mb-6 sm:mb-8 flex items-center justify-center gap-2 text-teal-400 font-bold tracking-widest text-[10px] sm:text-xs border border-teal-500/20 shadow-xl max-w-[92vw]"
        >
          <Sparkles size={13} className="animate-pulse shrink-0" />
          <span className="truncate sm:overflow-visible">CONFIDENTIAL AI MENTAL WELLNESS SANCTUARY</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1] tracking-tight font-['Outfit'] break-words px-1"
        >
          FIND PEACE IN EVERY <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-400">
            CONVERSATION
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl leading-relaxed font-normal px-2"
        >
          A safe, non-judgmental space engineered with real-time empathetic AI, 3-tier emotional safety escalation, voice reflection, and privacy-conscious tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md px-2"
        >
          <Link to="/signup" className="w-full sm:w-auto flex-1">
            <button className="w-full px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 text-slate-950 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-teal-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98">
              Begin Free Journey <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto flex-1 sm:flex-initial">
            <button className="w-full px-6 sm:px-7 py-3.5 sm:py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-2xl font-bold text-sm sm:text-base border border-slate-700/80 transition cursor-pointer active:scale-98">
              Existing Account
            </button>
          </Link>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-20 w-full text-left px-2">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3.5 sm:mb-4">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] mb-1.5 sm:mb-2">Empathetic AI Companion</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Thoughtful, validating replies tuned for de-escalation, emotional clarity, and non-judgmental presence.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3.5 sm:mb-4">
              <Wind size={20} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] mb-1.5 sm:mb-2">Grounding & Mood Insights</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Instant Box Breathing exercise, speech voice reflection, and private personal mood timeline tracking.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3.5 sm:mb-4">
              <PhoneCall size={20} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] mb-1.5 sm:mb-2">3-Tier Safety Protocol</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Multi-signal risk protection with immediate verified emergency helplines (Tele-MANAS 14416 & 112).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-4 sm:px-6 py-6 sm:py-8 mt-auto border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs gap-4 text-center md:text-left">
          <div className="flex items-center justify-center gap-2">
            <img src="/calmchain-logo.svg" alt="CalmChain" className="w-5 h-5 opacity-70" />
            <span>© 2026 CalmChain (TranquilNet). Final-Year B.Tech Mental Wellness Project.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-semibold text-slate-400">
            <span className="hover:text-teal-400 transition cursor-help">ZERO CLOUD BIOMETRIC LOGGING</span>
            <span className="hover:text-teal-400 transition cursor-help">TELE-MANAS INTEGRATED</span>
            <span className="hover:text-teal-400 transition cursor-help">PRIVACY FIRST</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

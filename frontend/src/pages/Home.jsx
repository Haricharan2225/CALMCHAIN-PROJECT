import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Shield, HeartPulse, MessageSquare, Wind, PhoneCall, ArrowRight, Clock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export const Home = () => {
  const { theme, supportLevel } = useTheme();
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
    <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} font-['Inter'] flex flex-col relative overflow-hidden transition-colors duration-500`}>
      {/* Ambient Theme Mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-[15%] -left-[10%] w-[55%] h-[55%] blur-[140px] rounded-full ${theme.orb1}`}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[25%] -right-[10%] w-[50%] h-[60%] blur-[150px] rounded-full ${theme.orb2}`}
        />
      </div>

      {/* Navigation */}
      <nav className={`relative z-10 w-full px-6 py-5 flex justify-between items-center max-w-7xl mx-auto border-b ${theme.border} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <img src="/calmchain-logo.svg" alt="CalmChain Logo" className="w-10 h-10 drop-shadow-sm" />
          <div>
            <span className="text-2xl font-black font-['Outfit'] tracking-tight">CalmChain</span>
            <span className={`hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${theme.badge}`}>
              Tranquil Sanctuary
            </span>
          </div>
        </div>

        {/* Live Date/Time & Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {currentTime && (
            <div className={`hidden md:flex items-center gap-2 text-xs ${theme.textSecondary} bg-white/80 px-3.5 py-1.5 rounded-xl border ${theme.border} shadow-xs`}>
              <Clock size={13} />
              <span>{currentTime}</span>
            </div>
          )}
          <Link
            to="/login"
            className={`text-xs sm:text-sm font-bold ${theme.textSecondary} hover:opacity-80 transition px-3 py-2`}
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className={`px-5 py-2.5 ${theme.accentButton} font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95`}
          >
            Start Calm Session
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`py-2 px-5 rounded-full mb-8 flex items-center gap-2 font-bold tracking-widest text-xs border ${theme.badge} shadow-xs`}
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>CONFIDENTIAL AI MENTAL WELLNESS SANCTUARY</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight font-['Outfit']"
        >
          FIND PEACE IN EVERY <br className="hidden sm:block" />
          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
            supportLevel === 3
              ? "from-rose-600 to-red-600"
              : supportLevel === 2
              ? "from-amber-600 to-yellow-600"
              : "from-emerald-600 to-teal-600"
          }`}>
            CONVERSATION
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={`text-base sm:text-lg md:text-xl ${theme.textSecondary} mb-10 max-w-2xl leading-relaxed font-normal`}
        >
          A gentle, non-judgmental space engineered with real-time empathetic AI, automatic voice input, 3-tier emotional safety escalation, and privacy-conscious grounding tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md"
        >
          <Link to="/signup" className="w-full sm:w-auto flex-1">
            <button className={`w-full px-8 py-4 ${theme.accentButton} rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer`}>
              Begin Free Journey <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <button className={`w-full px-7 py-4 bg-white hover:bg-slate-50 ${theme.textPrimary} rounded-2xl font-bold text-base border ${theme.border} transition cursor-pointer shadow-xs`}>
              Existing Account
            </button>
          </Link>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} backdrop-blur-md`}>
            <div className={`w-12 h-12 rounded-2xl ${theme.badge} flex items-center justify-center mb-4`}>
              <MessageSquare size={22} />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] mb-2">Concise AI Companion</h3>
            <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
              Short, natural replies tuned for de-escalation, emotional clarity, and non-judgmental validation.
            </p>
          </div>

          <div className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} backdrop-blur-md`}>
            <div className={`w-12 h-12 rounded-2xl ${theme.badge} flex items-center justify-center mb-4`}>
              <Wind size={22} />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] mb-2">Grounding & Mood Insights</h3>
            <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
              Automatic voice sending, instant Box Breathing exercise, and private personal mood timeline tracking.
            </p>
          </div>

          <div className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} backdrop-blur-md`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center mb-4">
              <PhoneCall size={22} />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] mb-2">3-Tier Safety Protocol</h3>
            <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
              Multi-signal risk detection with direct calling access to Tele-MANAS (14416) and Emergency (112).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 w-full px-6 py-8 mt-auto border-t ${theme.border} bg-white/40`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs gap-4">
          <div className="flex items-center gap-2">
            <img src="/calmchain-logo.svg" alt="CalmChain" className="w-5 h-5 opacity-75" />
            <span className={theme.textMuted}>© 2026 CalmChain (TranquilNet). Final-Year B.Tech Mental Wellness Project.</span>
          </div>
          <div className={`flex gap-6 text-[11px] font-semibold ${theme.textSecondary}`}>
            <span className="cursor-help">ZERO CLOUD BIOMETRIC LOGGING</span>
            <span className="cursor-help">TELE-MANAS INTEGRATED</span>
            <span className="cursor-help">PRIVACY FIRST</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Shield, HeartPulse } from "lucide-react";

export const Home = () => {
  return (
    <div className="min-h-screen bg-[#0F172A] font-['Inter'] flex flex-col relative overflow-hidden">
      {/* Animated Midnight Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-900/20 blur-[150px] rounded-full" 
         />
         <motion.div 
            animate={{ scale: [1, 1.1, 1], x: [0, -60, 0], y: [0, 80, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] -right-[15%] w-[50%] h-[70%] bg-cyan-900/20 blur-[150px] rounded-full" 
         />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
           <HeartPulse className="text-cyan-400 font-bold" size={28} />
           <span className="text-2xl font-black text-white font-['Outfit']">CalmChain</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="px-4 py-2 text-slate-400 font-bold hover:text-white transition text-xs tracking-widest">LOG IN</Link>
          <Link to="/signup" className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-black hover:bg-cyan-400 hover:scale-105 shadow-xl transition-all text-sm">GET STARTED</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 z-10 text-center max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-slate-800/30 backdrop-blur-2xl py-2 px-6 rounded-full mb-8 flex items-center gap-2 text-cyan-400 font-bold tracking-[0.1em] text-[10px] border border-white/5 border-t-white/10 shadow-2xl"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>EVOKE TRANQUILITY</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight font-['Outfit'] max-w-4xl"
        >
          FIND PEACE IN EVERY <br className="hidden md:block"/> CONVERSATION
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-xl text-slate-400 mb-10 font-[400] max-w-2xl leading-relaxed"
        >
          A confidential sanctuary where AI understands your whispers, matches your levels, and guides you back to calm.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(6, 182, 212, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[1.2rem] font-black text-lg shadow-2xl shadow-cyan-500/10 transition-all flex justify-center items-center gap-3 group"
            >
              START JOURNEY <Shield size={20} className="group-hover:rotate-12 transition-transform"/>
            </motion.button>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10 w-full p-8 mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 font-bold text-[10px] tracking-[0.2em] gap-4 uppercase">
          <p>© 2026 CALMCHAIN SECURE SYSTEMS.</p>
          <div className="flex gap-8">
             <span className="hover:text-cyan-400 transition cursor-help">EMOTION ENGINE 3.0</span>
             <span className="hover:text-cyan-400 transition cursor-help">ZERO LOGGING</span>
             <span className="hover:text-cyan-400 transition cursor-help">ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

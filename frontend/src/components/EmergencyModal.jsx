import { motion, AnimatePresence } from "framer-motion";
import { X, PhoneCall, ShieldAlert, Heart, ExternalLink } from "lucide-react";

export const EmergencyModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#26090E] border-2 border-rose-500/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-rose-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-red-600" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-rose-300 hover:text-white transition cursor-pointer border border-white/10"
              aria-label="Close safety modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4 text-rose-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center shrink-0">
                <ShieldAlert size={26} className="text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
                  You Are Not Alone 💙
                </h2>
                <p className="text-xs text-rose-300 font-bold tracking-wide">
                  Level 3 Priority Safety & Immediate Support
                </p>
              </div>
            </div>

            <p className="text-sm text-rose-100/90 leading-relaxed mb-6">
              If you are feeling overwhelmed or having thoughts of self-harm, please connect with someone who can help right now. Free, confidential support is available 24/7.
            </p>

            {/* Helpline Directory with Direct Tel Links */}
            <div className="space-y-3 mb-6">
              {/* Tele-MANAS */}
              <a
                href="tel:14416"
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold transition shadow-lg shadow-rose-950/50 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <PhoneCall size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold">Tele-MANAS (India Toll-Free)</div>
                    <div className="text-xs text-rose-100 font-medium">National Mental Health Helpline</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white text-rose-700 text-xs font-black rounded-lg group-hover:scale-105 transition-transform">
                  Call 14416
                </span>
              </a>

              {/* National Emergency 112 */}
              <a
                href="tel:112"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#360C14] hover:bg-[#45101A] border border-rose-800/80 text-rose-100 font-bold transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/30 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0">
                    <PhoneCall size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">National Emergency Services</div>
                    <div className="text-xs text-rose-300/80">Police / Medical Immediate Assistance</div>
                  </div>
                </div>
                <span className="text-xs text-rose-200 font-extrabold bg-rose-950/80 border border-rose-700 px-2.5 py-1 rounded-md">
                  Call 112
                </span>
              </a>

              {/* Vandrevala Foundation */}
              <a
                href="tel:+919999666555"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#360C14] hover:bg-[#45101A] border border-rose-800/80 text-rose-100 font-bold transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/30 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                    <Heart size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Vandrevala Foundation Helpline</div>
                    <div className="text-xs text-rose-300/80">24x7 Free Crisis Counseling</div>
                  </div>
                </div>
                <span className="text-xs text-teal-300 font-bold bg-teal-950/80 border border-teal-800 px-2.5 py-1 rounded-md">
                  +91 9999 666 555
                </span>
              </a>
            </div>

            <div className="bg-black/30 rounded-xl p-3 mb-6 text-[11px] text-rose-200/80 text-left border border-white/10">
              <span className="font-semibold text-white">Privacy Notice:</span> CalmChain connects you with verified helplines. No medical records or personal identity are shared without consent.
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="w-full py-3 bg-black/30 hover:bg-black/50 text-rose-200 rounded-xl font-bold transition text-sm cursor-pointer border border-white/10"
              >
                Return to Calm Space
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

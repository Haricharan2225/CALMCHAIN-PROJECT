import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Clock, AlertCircle } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";

const MOOD_OPTIONS = [
  { id: "calm", label: "Deeply Calm", emoji: "🌿", score: 5, color: "text-emerald-300 border-emerald-500/60 bg-emerald-950/60" },
  { id: "peaceful", label: "Content & Peaceful", emoji: "😊", score: 4, color: "text-teal-300 border-teal-500/60 bg-teal-950/60" },
  { id: "neutral", label: "Neutral & Steady", emoji: "😐", score: 3, color: "text-slate-300 border-slate-600 bg-slate-800" },
  { id: "low", label: "Low & Heavy", emoji: "🌧️", score: 2, color: "text-amber-300 border-amber-500/60 bg-amber-950/60" },
  { id: "anxious", label: "Overwhelmed / Anxious", emoji: "🌪️", score: 1, color: "text-rose-300 border-rose-500/60 bg-rose-950/60" },
];

export const MoodTrackerModal = ({ isOpen, onClose, currentUser }) => {
  const { theme } = useTheme();
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setLoadingHistory(true);
    setErrorMessage("");

    try {
      // Safe query without composite index requirement
      const q = query(
        collection(db, "moods"),
        where("userId", "==", currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          logs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setHistory(logs.slice(0, 10));
          setLoadingHistory(false);
        },
        (err) => {
          console.warn("Mood history query notice:", err);
          setLoadingHistory(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setLoadingHistory(false);
    }
  }, [isOpen, currentUser]);

  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const newEntry = {
        userId: currentUser.uid,
        moodId: selectedMood.id,
        moodLabel: selectedMood.label,
        emoji: selectedMood.emoji,
        score: selectedMood.score,
        note: note.trim(),
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
      };

      await addDoc(collection(db, "moods"), newEntry);
      setNote("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving mood:", err);
      setErrorMessage("Failed to record mood. Please check network and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-2xl ${theme.cardBg} border ${theme.border} rounded-3xl p-4 sm:p-8 shadow-2xl relative ${theme.textPrimary} max-h-[92vh] flex flex-col overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between pb-3 sm:pb-4 border-b ${theme.border}`}>
              <div className={`flex items-center gap-2 ${theme.textSecondary}`}>
                <Sparkles size={18} />
                <h2 className="text-lg sm:text-xl font-bold font-['Outfit']">Daily Mood & Wellness Tracker</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-black/25 hover:bg-black/45 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-5 sm:space-y-6 pr-1">
              {/* Record Mood Form */}
              <form onSubmit={handleSaveMood} className="space-y-4">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} mb-2 block`}>
                    How is your internal weather right now?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMood(m)}
                        className={`p-2 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          selectedMood.id === m.id
                            ? `${m.color} ring-2 ring-emerald-400 shadow-md scale-[1.02] font-bold`
                            : "border-white/10 bg-black/25 text-slate-300 hover:bg-black/40"
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">{m.emoji}</span>
                        <span className="text-[10px] sm:text-[11px] leading-tight">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} mb-2 block`}>
                    Optional reflection or note
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Took a walk, felt lighter after writing..."
                    className={`w-full px-4 py-3 rounded-xl ${theme.input} text-base sm:text-sm outline-none transition`}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <span>✨ Your mood was recorded securely in your private timeline.</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl ${theme.accentButton} font-bold transition shadow-sm flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer`}
                  >
                    <Send size={15} />
                    {isSubmitting ? "Saving..." : "Log Mood Entry"}
                  </button>
                </div>
              </form>

              {/* Mood Timeline */}
              <div className={`pt-4 border-t ${theme.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-1.5`}>
                    <Clock size={15} />
                    Your Recent Mood Timeline
                  </h3>
                  <span className={`text-[11px] ${theme.textMuted}`}>Private & encrypted to your account</span>
                </div>

                {loadingHistory ? (
                  <div className="space-y-2 py-4">
                    <div className="h-10 bg-black/20 rounded-xl animate-pulse" />
                    <div className="h-10 bg-black/20 rounded-xl animate-pulse" />
                  </div>
                ) : history.length === 0 ? (
                  <div className={`text-center py-6 ${theme.textMuted} text-xs bg-black/20 rounded-2xl border ${theme.border}`}>
                    No mood entries recorded yet. Tap above to log your first reflection!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-xl bg-black/25 border ${theme.border} flex items-start gap-3 text-xs`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{entry.emoji || "🌿"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200">{entry.moodLabel}</span>
                            <span className={`text-[10px] ${theme.textMuted} shrink-0`}>
                              {formatTimestamp(entry.createdAt)}
                            </span>
                          </div>
                          {entry.note && (
                            <p className={`${theme.textSecondary} mt-1 truncate`}>{entry.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

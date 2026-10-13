import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Clock, Calendar, AlertCircle } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

const MOOD_OPTIONS = [
  { id: "calm", label: "Deeply Calm", emoji: "🌿", score: 5, color: "text-teal-400 border-teal-500/40 bg-teal-500/10" },
  { id: "peaceful", label: "Content & Peaceful", emoji: "😊", score: 4, color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  { id: "neutral", label: "Neutral & Steady", emoji: "😐", score: 3, color: "text-slate-300 border-slate-600 bg-slate-800/40" },
  { id: "low", label: "Low & Heavy", emoji: "🌧️", score: 2, color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { id: "anxious", label: "Overwhelmed / Anxious", emoji: "🌪️", score: 1, color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
];

export const MoodTrackerModal = ({ isOpen, onClose, currentUser }) => {
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
      const q = query(
        collection(db, "moods"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setHistory(logs);
          setLoadingHistory(false);
        },
        (err) => {
          console.error("Error loading mood history:", err);
          // If compound query requires indexing or fails, fallback to simple query
          loadFallbackHistory();
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to attach listener:", err);
      loadFallbackHistory();
    }
  }, [isOpen, currentUser]);

  const loadFallbackHistory = async () => {
    try {
      const q = query(
        collection(db, "moods"),
        where("userId", "==", currentUser.uid)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort client-side
        logs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setHistory(logs.slice(0, 10));
        setLoadingHistory(false);
      });
      return () => unsub();
    } catch (e) {
      setLoadingHistory(false);
      setErrorMessage("Could not load mood history.");
    }
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="text-teal-400" size={20} />
                <h2 className="text-xl font-bold font-['Outfit']">Daily Mood & Wellness Sanctuary</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
              {/* Record Mood Form */}
              <form onSubmit={handleSaveMood} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    How is your internal weather right now?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMood(m)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          selectedMood.id === m.id
                            ? `${m.color} ring-2 ring-teal-400/50 shadow-lg scale-[1.02]`
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Optional reflection or note
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Took a walk, felt lighter after journaling..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs flex items-center gap-2">
                    <span>✨ Your mood was recorded securely in your private timeline.</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold hover:from-teal-400 hover:to-cyan-400 transition shadow-lg flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Send size={15} />
                    {isSubmitting ? "Saving..." : "Log Mood Entry"}
                  </button>
                </div>
              </form>

              {/* Mood Timeline */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock size={15} className="text-teal-400" />
                    Your Recent Mood Timeline
                  </h3>
                  <span className="text-[11px] text-slate-500">Private & encrypted to your account</span>
                </div>

                {loadingHistory ? (
                  <div className="space-y-2 py-4">
                    <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs bg-slate-800/20 rounded-2xl border border-slate-800">
                    No mood entries recorded yet. Tap above to log your first reflection!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-start gap-3 text-xs"
                      >
                        <span className="text-xl shrink-0 mt-0.5">{entry.emoji || "🌿"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200">{entry.moodLabel}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatTimestamp(entry.createdAt)}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-slate-400 mt-1 truncate">{entry.note}</p>
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

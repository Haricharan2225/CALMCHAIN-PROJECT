import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEME_CONFIGS = {
  1: {
    level: 1,
    name: "Calm Support",
    label: "Level 1 — Calm Support",
    themeClass: "theme-calm",
    pageBg: "bg-[#0B1120]", // Dark navy blue foundation
    sidebarBg: "bg-[#0F172A]/95 border-slate-800",
    headerBg: "bg-[#0F172A]/90 border-slate-800",
    cardBg: "bg-[#1E293B]/70 border-slate-800 shadow-md",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-300",
    textMuted: "text-slate-400",
    border: "border-slate-800",
    accent: "emerald",
    accentButton: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40",
    accentSecondaryButton: "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30",
    activeItem: "bg-emerald-950/50 text-emerald-300 font-semibold border-emerald-500/40",
    inactiveItem: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
    badge: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    userBubble: "bg-emerald-700 text-white border-emerald-600 shadow-md",
    aiBubble: "bg-[#1E293B] text-slate-100 border-slate-700/80 shadow-md",
    input: "bg-[#1E293B]/80 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20",
    micButton: "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700",
    micActive: "bg-emerald-600 text-white border-emerald-400 animate-pulse",
    sendButton: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40",
    orb1: "bg-emerald-600/10",
    orb2: "bg-teal-500/10"
  },
  2: {
    level: 2,
    name: "Guided Support",
    label: "Level 2 — Guided Support",
    themeClass: "theme-guided",
    pageBg: "bg-[#0B1120]", // Dark navy blue foundation
    sidebarBg: "bg-[#0F172A]/95 border-slate-800",
    headerBg: "bg-[#0F172A]/90 border-slate-800",
    cardBg: "bg-[#1E293B]/70 border-slate-800 shadow-md",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-300",
    textMuted: "text-slate-400",
    border: "border-slate-800",
    accent: "amber",
    accentButton: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/40",
    accentSecondaryButton: "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30",
    activeItem: "bg-amber-950/50 text-amber-300 font-semibold border-amber-500/40",
    inactiveItem: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
    badge: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    userBubble: "bg-amber-500 text-slate-950 font-medium border-amber-400 shadow-md",
    aiBubble: "bg-[#1E293B] text-slate-100 border-slate-700/80 shadow-md",
    input: "bg-[#1E293B]/80 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20",
    micButton: "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700",
    micActive: "bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold",
    sendButton: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40 font-bold",
    orb1: "bg-amber-600/10",
    orb2: "bg-yellow-600/10"
  },
  3: {
    level: 3,
    name: "Priority Support",
    label: "Level 3 — Priority Support",
    themeClass: "theme-priority",
    pageBg: "bg-[#0B1120]", // Dark navy blue foundation
    sidebarBg: "bg-[#0F172A]/95 border-slate-800",
    headerBg: "bg-[#0F172A]/90 border-slate-800",
    cardBg: "bg-[#1E293B]/70 border-slate-800 shadow-md",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-300",
    textMuted: "text-slate-400",
    border: "border-slate-800",
    accent: "rose",
    accentButton: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40",
    accentSecondaryButton: "bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30",
    activeItem: "bg-rose-950/50 text-rose-300 font-semibold border-rose-500/40",
    inactiveItem: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
    badge: "bg-rose-950/60 text-rose-300 border-rose-500/40",
    userBubble: "bg-rose-600 text-white border-rose-500 shadow-md",
    aiBubble: "bg-[#1E293B] text-slate-100 border-slate-700/80 shadow-md",
    input: "bg-[#1E293B]/80 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-rose-500 focus:ring-rose-500/20",
    micButton: "bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700",
    micActive: "bg-rose-600 text-white border-rose-500 animate-pulse",
    sendButton: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40",
    orb1: "bg-rose-600/10",
    orb2: "bg-red-600/10"
  }
};

export const ThemeProvider = ({ children }) => {
  const [supportLevel, setSupportLevelState] = useState(1);

  const setSupportLevel = (lvl) => {
    const validLevel = lvl === 3 ? 3 : lvl === 2 ? 2 : 1;
    setSupportLevelState(validLevel);
  };

  const theme = THEME_CONFIGS[supportLevel] || THEME_CONFIGS[1];

  useEffect(() => {
    // Update data-theme on documentElement for CSS styling
    document.documentElement.setAttribute("data-theme", `level-${supportLevel}`);
    document.body.className = "bg-[#0B1120] text-slate-100 antialiased";
  }, [supportLevel]);

  return (
    <ThemeContext.Provider value={{ supportLevel, setSupportLevel, theme }}>
      <div className="min-h-screen bg-[#0B1120] text-slate-100">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      supportLevel: 1,
      setSupportLevel: () => {},
      theme: THEME_CONFIGS[1]
    };
  }
  return context;
};

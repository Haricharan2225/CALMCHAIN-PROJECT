import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEME_CONFIGS = {
  1: {
    level: 1,
    name: "Calm Support",
    label: "Level 1 — Calm Support",
    themeClass: "theme-calm",
    pageBg: "bg-[#F3FAF6]", // Soft, bright, peaceful mint green
    sidebarBg: "bg-white/95 border-emerald-100/90",
    headerBg: "bg-white/95 border-emerald-100/90",
    cardBg: "bg-white border-emerald-100 shadow-sm shadow-emerald-900/5",
    textPrimary: "text-slate-900",
    textSecondary: "text-emerald-800",
    textMuted: "text-slate-500",
    border: "border-emerald-200/80",
    accent: "emerald",
    accentButton: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 active:scale-95",
    accentSecondaryButton: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200",
    activeItem: "bg-emerald-100 text-emerald-950 font-semibold border-emerald-300 shadow-xs",
    inactiveItem: "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    userBubble: "bg-emerald-600 text-white border-emerald-500 shadow-sm",
    aiBubble: "bg-white text-slate-800 border-emerald-100 shadow-sm",
    input: "bg-white border-emerald-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20",
    micButton: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    micActive: "bg-emerald-600 text-white border-emerald-500 animate-pulse font-bold",
    sendButton: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    orb1: "bg-emerald-300/35",
    orb2: "bg-teal-300/25"
  },
  2: {
    level: 2,
    name: "Elevated Support",
    label: "Level 2 — Elevated Support",
    themeClass: "theme-guided",
    pageBg: "bg-[#FFFDF4]", // Bright warm cream & gentle amber
    sidebarBg: "bg-white/95 border-amber-100/90",
    headerBg: "bg-white/95 border-amber-100/90",
    cardBg: "bg-white border-amber-100 shadow-sm shadow-amber-900/5",
    textPrimary: "text-slate-900",
    textSecondary: "text-amber-900",
    textMuted: "text-slate-500",
    border: "border-amber-200/80",
    accent: "amber",
    accentButton: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95",
    accentSecondaryButton: "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200",
    activeItem: "bg-amber-100 text-amber-950 font-semibold border-amber-300 shadow-xs",
    inactiveItem: "text-slate-600 hover:bg-amber-50 hover:text-amber-900",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    userBubble: "bg-amber-500 text-slate-950 font-medium border-amber-400 shadow-sm",
    aiBubble: "bg-white text-slate-800 border-amber-100 shadow-sm",
    input: "bg-white border-amber-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20",
    micButton: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
    micActive: "bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold",
    sendButton: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20",
    orb1: "bg-amber-300/35",
    orb2: "bg-yellow-300/25"
  },
  3: {
    level: 3,
    name: "Priority Support",
    label: "Level 3 — Priority Support",
    themeClass: "theme-priority",
    pageBg: "bg-[#FFF6F7]", // Soft reassuring blush & light rose
    sidebarBg: "bg-white/95 border-rose-100/90",
    headerBg: "bg-white/95 border-rose-100/90",
    cardBg: "bg-white border-rose-100 shadow-sm shadow-rose-900/5",
    textPrimary: "text-slate-900",
    textSecondary: "text-rose-900",
    textMuted: "text-slate-500",
    border: "border-rose-200/80",
    accent: "rose",
    accentButton: "bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 active:scale-95",
    accentSecondaryButton: "bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200",
    activeItem: "bg-rose-100 text-rose-950 font-semibold border-rose-300 shadow-xs",
    inactiveItem: "text-slate-600 hover:bg-rose-50 hover:text-rose-900",
    badge: "bg-rose-100 text-rose-900 border-rose-300",
    userBubble: "bg-rose-600 text-white border-rose-500 shadow-sm",
    aiBubble: "bg-white text-slate-800 border-rose-100 shadow-sm",
    input: "bg-white border-rose-200 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-rose-500/20",
    micButton: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    micActive: "bg-rose-600 text-white border-rose-500 animate-pulse font-bold",
    sendButton: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
    orb1: "bg-rose-300/35",
    orb2: "bg-red-300/25"
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
    document.documentElement.setAttribute("data-theme", `level-${supportLevel}`);
  }, [supportLevel]);

  return (
    <ThemeContext.Provider value={{ supportLevel, setSupportLevel, theme }}>
      {children}
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

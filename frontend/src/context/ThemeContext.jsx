import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEME_CONFIGS = {
  1: {
    level: 1,
    name: "Calm Support",
    label: "Level 1 — Calm Support",
    themeClass: "theme-calm",
    pageBg: "bg-[#061A14]", // Predominantly dark forest/emerald green
    sidebarBg: "bg-[#09261E]/95 border-emerald-900/60",
    headerBg: "bg-[#09261E]/90 border-emerald-900/60",
    cardBg: "bg-[#0E352B]/80 border-emerald-800/60 shadow-lg shadow-emerald-950/40",
    textPrimary: "text-emerald-50",
    textSecondary: "text-emerald-200/90",
    textMuted: "text-emerald-400/80",
    border: "border-emerald-800/60",
    accent: "emerald",
    accentButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-950/40",
    accentSecondaryButton: "bg-[#0A261E] hover:bg-[#0E382C] text-emerald-300 border border-emerald-700/60",
    activeItem: "bg-emerald-800/60 text-emerald-100 font-semibold border-emerald-500/60 shadow-xs",
    inactiveItem: "text-emerald-300/80 hover:bg-emerald-900/40 hover:text-emerald-100",
    badge: "bg-emerald-900/80 text-emerald-300 border-emerald-600/60",
    userBubble: "bg-emerald-600 text-white border-emerald-500 shadow-sm",
    aiBubble: "bg-[#0D3328] text-emerald-50 border-emerald-800/80 shadow-sm",
    input: "bg-[#09261E] border-emerald-700/80 text-emerald-50 placeholder-emerald-400/60 focus:border-emerald-400 focus:ring-emerald-400/20",
    micButton: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80 hover:text-emerald-100",
    micActive: "bg-emerald-500 text-slate-950 border-emerald-300 animate-pulse font-bold",
    sendButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-emerald-950/40",
    orb1: "bg-emerald-500/20",
    orb2: "bg-teal-500/20"
  },
  2: {
    level: 2,
    name: "Elevated Support",
    label: "Level 2 — Elevated Support",
    themeClass: "theme-guided",
    pageBg: "bg-[#191304]", // Predominantly warm amber/golden yellow
    sidebarBg: "bg-[#241B07]/95 border-amber-900/60",
    headerBg: "bg-[#241B07]/90 border-amber-900/60",
    cardBg: "bg-[#33260A]/80 border-amber-800/60 shadow-lg shadow-amber-950/40",
    textPrimary: "text-amber-50",
    textSecondary: "text-amber-200/90",
    textMuted: "text-amber-400/80",
    border: "border-amber-800/60",
    accent: "amber",
    accentButton: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-950/40",
    accentSecondaryButton: "bg-[#261B05] hover:bg-[#382808] text-amber-300 border border-amber-700/60",
    activeItem: "bg-amber-800/60 text-amber-100 font-semibold border-amber-500/60 shadow-xs",
    inactiveItem: "text-amber-300/80 hover:bg-amber-900/40 hover:text-amber-100",
    badge: "bg-amber-900/80 text-amber-300 border-amber-600/60",
    userBubble: "bg-amber-500 text-slate-950 font-medium border-amber-400 shadow-sm",
    aiBubble: "bg-[#302308] text-amber-50 border-amber-800/80 shadow-sm",
    input: "bg-[#241B07] border-amber-700/80 text-amber-50 placeholder-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20",
    micButton: "bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900/80 hover:text-amber-100",
    micActive: "bg-amber-500 text-slate-950 border-amber-300 animate-pulse font-bold",
    sendButton: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-950/40",
    orb1: "bg-amber-500/20",
    orb2: "bg-yellow-500/20"
  },
  3: {
    level: 3,
    name: "Priority Support",
    label: "Level 3 — Priority Support",
    themeClass: "theme-priority",
    pageBg: "bg-[#180509]", // Predominantly deep crimson/coral red
    sidebarBg: "bg-[#26090E]/95 border-rose-900/60",
    headerBg: "bg-[#26090E]/90 border-rose-900/60",
    cardBg: "bg-[#360C14]/80 border-rose-800/60 shadow-lg shadow-rose-950/40",
    textPrimary: "text-rose-50",
    textSecondary: "text-rose-200/90",
    textMuted: "text-rose-400/80",
    border: "border-rose-800/60",
    accent: "rose",
    accentButton: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-950/40",
    accentSecondaryButton: "bg-[#28080E] hover:bg-[#3D0C16] text-rose-300 border border-rose-700/60",
    activeItem: "bg-rose-800/60 text-rose-100 font-semibold border-rose-500/60 shadow-xs",
    inactiveItem: "text-rose-300/80 hover:bg-rose-900/40 hover:text-rose-100",
    badge: "bg-rose-900/80 text-rose-300 border-rose-600/60",
    userBubble: "bg-rose-600 text-white border-rose-500 shadow-sm",
    aiBubble: "bg-[#330B12] text-rose-50 border-rose-800/80 shadow-sm",
    input: "bg-[#26090E] border-rose-700/80 text-rose-50 placeholder-rose-400/60 focus:border-rose-400 focus:ring-rose-400/20",
    micButton: "bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900/80 hover:text-rose-100",
    micActive: "bg-rose-600 text-white border-rose-400 animate-pulse font-bold",
    sendButton: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-rose-950/40",
    orb1: "bg-rose-500/20",
    orb2: "bg-red-500/20"
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

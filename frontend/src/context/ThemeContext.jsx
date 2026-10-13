import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEME_CONFIGS = {
  1: {
    level: 1,
    name: "Calm Support",
    label: "Level 1 — Calm Support",
    themeClass: "theme-calm",
    pageBg: "bg-[#F4FBF7]", // Soft peaceful mint/sage
    sidebarBg: "bg-white/90 border-emerald-100/90",
    headerBg: "bg-white/90 border-emerald-100/90",
    cardBg: "bg-white border-emerald-100 shadow-sm shadow-emerald-900/5",
    textPrimary: "text-emerald-950",
    textSecondary: "text-emerald-700",
    textMuted: "text-emerald-600/70",
    border: "border-emerald-200/80",
    accent: "emerald",
    accentButton: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20",
    accentSecondaryButton: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200",
    activeItem: "bg-emerald-100/90 text-emerald-900 font-semibold border-emerald-300",
    inactiveItem: "text-emerald-800/80 hover:bg-emerald-50 hover:text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    userBubble: "bg-emerald-600 text-white border-emerald-500 shadow-sm",
    aiBubble: "bg-white text-emerald-950 border-emerald-100 shadow-sm",
    input: "bg-white border-emerald-200 text-emerald-950 placeholder-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20",
    micButton: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    micActive: "bg-emerald-600 text-white border-emerald-500 animate-pulse",
    sendButton: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    orb1: "bg-emerald-200/40",
    orb2: "bg-teal-200/30"
  },
  2: {
    level: 2,
    name: "Guided Support",
    label: "Level 2 — Guided Support",
    themeClass: "theme-guided",
    pageBg: "bg-[#FFFDF5]", // Warm cream & soft yellow
    sidebarBg: "bg-white/90 border-amber-100/90",
    headerBg: "bg-white/90 border-amber-100/90",
    cardBg: "bg-white border-amber-100 shadow-sm shadow-amber-900/5",
    textPrimary: "text-amber-950",
    textSecondary: "text-amber-800",
    textMuted: "text-amber-700/70",
    border: "border-amber-200/80",
    accent: "amber",
    accentButton: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20",
    accentSecondaryButton: "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200",
    activeItem: "bg-amber-100/90 text-amber-950 font-semibold border-amber-300",
    inactiveItem: "text-amber-800/80 hover:bg-amber-50 hover:text-amber-900",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    userBubble: "bg-amber-500 text-slate-950 font-medium border-amber-400 shadow-sm",
    aiBubble: "bg-white text-amber-950 border-amber-100 shadow-sm",
    input: "bg-white border-amber-200 text-amber-950 placeholder-amber-400 focus:border-amber-500 focus:ring-amber-500/20",
    micButton: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
    micActive: "bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold",
    sendButton: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20",
    orb1: "bg-amber-200/40",
    orb2: "bg-yellow-200/30"
  },
  3: {
    level: 3,
    name: "Priority Support",
    label: "Level 3 — Priority Support",
    themeClass: "theme-priority",
    pageBg: "bg-[#FFF5F6]", // Reassuring blush pink & soft rose
    sidebarBg: "bg-white/90 border-rose-100/90",
    headerBg: "bg-white/90 border-rose-100/90",
    cardBg: "bg-white border-rose-100 shadow-sm shadow-rose-900/5",
    textPrimary: "text-rose-950",
    textSecondary: "text-rose-700",
    textMuted: "text-rose-600/70",
    border: "border-rose-200/80",
    accent: "rose",
    accentButton: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20",
    accentSecondaryButton: "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200",
    activeItem: "bg-rose-100/90 text-rose-950 font-semibold border-rose-300",
    inactiveItem: "text-rose-800/80 hover:bg-rose-50 hover:text-rose-900",
    badge: "bg-rose-100 text-rose-900 border-rose-300",
    userBubble: "bg-rose-600 text-white border-rose-500 shadow-sm",
    aiBubble: "bg-white text-rose-950 border-rose-100 shadow-sm",
    input: "bg-white border-rose-200 text-rose-950 placeholder-rose-400 focus:border-rose-500 focus:ring-rose-500/20",
    micButton: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    micActive: "bg-rose-600 text-white border-rose-500 animate-pulse",
    sendButton: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
    orb1: "bg-rose-200/40",
    orb2: "bg-red-200/30"
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
    // Update data-theme on documentElement for CSS variables and scrollbar
    document.documentElement.setAttribute("data-theme", `level-${supportLevel}`);
    document.body.className = `${theme.pageBg} ${theme.textPrimary} transition-colors duration-500`;
  }, [supportLevel, theme]);

  return (
    <ThemeContext.Provider value={{ supportLevel, setSupportLevel, theme }}>
      <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} transition-colors duration-500`}>
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

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import {
  Users,
  AlertTriangle,
  Activity,
  PhoneCall,
  LogOut,
  ShieldAlert,
  Clock,
  RotateCcw,
  ArrowLeft,
  Lock
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const { theme, supportLevel } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeChats: 0,
    riskUsers: 0,
    emotions: { calm: 0, warning: 0, danger: 0 }
  });
  const [recentRisks, setRecentRisks] = useState([]);
  const [liveClock, setLiveClock] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
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
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubChats = null;

    const loadData = async () => {
      try {
        const uSnap = await getDocs(collection(db, "users")).catch(() => ({ size: 0 }));
        const aSnap = await getDocs(collection(db, "admins")).catch(() => ({ size: 0 }));
        const total = (uSnap?.size || 0) + (aSnap?.size || 0);

        setStats((prev) => ({ ...prev, totalUsers: total }));

        const qChats = query(collection(db, "chats"));
        unsubChats = onSnapshot(
          qChats,
          (snapshot) => {
            const activeCount = snapshot.size;
            let eCalm = 0;
            let eWarn = 0;
            let eDanger = 0;
            const riskUserSet = new Set();
            const risks = [];

            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach((msg) => {
                  if (msg.sender === "user") {
                    if (msg.level === 3) eDanger++;
                    else if (msg.level === 2) eWarn++;
                    else eCalm++;

                    if (msg.level === 3) {
                      riskUserSet.add(data.userId || "anonymous");
                      risks.push({
                        chatId: docSnap.id,
                        userId: data.userId || "anonymous",
                        timestamp: msg.timestamp,
                        text: msg.text
                      });
                    }
                  }
                });
              }
            });

            risks.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            setRecentRisks(risks.slice(0, 10));

            setStats((prev) => ({
              ...prev,
              activeChats: activeCount,
              riskUsers: riskUserSet.size,
              emotions: { calm: eCalm, warning: eWarn, danger: eDanger }
            }));

            setLoading(false);
          },
          (err) => {
            console.error("Error subscribing to chats:", err);
            setError("Failed to stream real-time chat data from Firestore. Check permissions.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
        setError("Error connecting to Firestore data services.");
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubChats) unsubChats();
    };
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => navigate("/login"));
  };

  const isAuthorizedAdmin =
    userRole === "admin" ||
    currentUser?.email?.toLowerCase() === "haripatel2225@gmail.com";

  if (!isAuthorizedAdmin && !loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} flex items-center justify-center p-6 font-['Inter']`}>
        <div className={`max-w-md w-full bg-white border ${theme.border} rounded-3xl p-8 text-center shadow-xl`}>
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold font-['Outfit'] mb-2">Restricted Admin Portal</h1>
          <p className="text-xs text-slate-500 mb-6">
            Your account ({currentUser?.email}) does not have administrative privileges.
          </p>
          <Link
            to="/chat"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${theme.accentButton} font-bold text-xs`}
          >
            <ArrowLeft size={16} /> Return to Chat Sanctuary
          </Link>
        </div>
      </div>
    );
  }

  const pieData = {
    labels: ["Calm Support (Lv1)", "Guided Support (Lv2)", "Priority Support (Lv3)"],
    datasets: [
      {
        data: [
          stats.emotions.calm,
          stats.emotions.warning,
          stats.emotions.danger
        ],
        backgroundColor: ["#10B981", "#F59E0B", "#F43F5E"],
        borderColor: "#FFFFFF",
        borderWidth: 2
      }
    ]
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "Recent";
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
    <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} p-6 md:p-10 font-['Inter'] relative overflow-x-hidden transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Bar */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b ${theme.border} gap-4`}>
          <div className="flex items-center gap-3">
            <img src="/calmchain-logo.svg" alt="CalmChain" className="w-10 h-10 drop-shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-['Outfit']">
                  CalmChain Admin Center
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
                  Live Firestore
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
                Mental Wellness Telemetry & Risk Supervision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {liveClock && (
              <div className={`hidden md:flex items-center gap-1.5 text-xs ${theme.textSecondary} bg-white px-3.5 py-2 rounded-xl border ${theme.border} shadow-xs`}>
                <Clock size={14} />
                <span>{liveClock}</span>
              </div>
            )}
            <Link
              to="/chat"
              className={`px-4 py-2 bg-white text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border ${theme.border} transition flex items-center gap-1.5 shadow-xs`}
            >
              <ArrowLeft size={14} /> User Chat
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Users className="text-emerald-600" size={24} />}
            title="Total Registered Accounts"
            value={stats.totalUsers}
            subtitle="Users + Administrators"
            badge="Firestore"
            border={theme.border}
            loading={loading}
          />
          <StatCard
            icon={<Activity className="text-teal-600" size={24} />}
            title="Active Chat Sessions"
            value={stats.activeChats}
            subtitle="Persisted Conversations"
            badge="Real-time"
            border={theme.border}
            loading={loading}
          />
          <StatCard
            icon={<ShieldAlert className="text-rose-600" size={24} />}
            title="Users Flagged Level 3"
            value={stats.riskUsers}
            subtitle="High Risk Escalations"
            badge="Safety Protocol"
            badgeColor="text-rose-700 bg-rose-50 border-rose-200"
            border={theme.border}
            loading={loading}
          />
          <StatCard
            icon={<PhoneCall className="text-amber-600" size={24} />}
            title="Total Emergency Triggers"
            value={stats.emotions.danger}
            subtitle="Safety Helplines Displayed"
            badge="Tele-MANAS"
            border={theme.border}
            loading={loading}
          />
        </div>

        {/* Charts & Risk Supervision Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emotion / Level Distribution Chart */}
          <div className={`bg-white border ${theme.border} rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-['Outfit']">
                  Emotion & Support Level Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time sentiment classification from user messages
                </p>
              </div>
            </div>

            {loading ? (
              <div className="w-56 h-56 mx-auto rounded-full bg-slate-100 animate-pulse my-auto" />
            ) : stats.emotions.calm === 0 &&
              stats.emotions.warning === 0 &&
              stats.emotions.danger === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                <span>No conversation messages recorded yet.</span>
              </div>
            ) : (
              <div className="w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] mx-auto my-auto flex items-center justify-center">
                <Pie
                  data={pieData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: "#475569",
                          font: { family: "Inter", size: 11 },
                          padding: 16
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Recent Level 3 Alerts */}
          <div className={`bg-white border ${theme.border} rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={18} />
                  Recent Level 3 Urgent Alerts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged safety flags for immediate supervisor visibility
                </p>
              </div>
              <span className="text-xs text-rose-700 font-extrabold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {recentRisks.length} logged
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                  <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
              ) : recentRisks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                  <span>✨ Zero Level 3 risk events recorded in recent sessions.</span>
                </div>
              ) : (
                recentRisks.map((risk, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:border-rose-300 transition flex items-start gap-3.5 text-xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          User UID: {risk.userId}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatTimestamp(risk.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 italic break-words line-clamp-2">
                        "{risk.text}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, badge, badgeColor, border, loading }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className={`p-6 rounded-3xl bg-white border ${border || "border-slate-200"} shadow-sm relative overflow-hidden`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      {badge && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            badgeColor || "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
    <p className="text-xs font-semibold text-slate-500">{title}</p>
    {loading ? (
      <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse mt-2" />
    ) : (
      <h4 className="text-3xl font-black font-['Outfit'] text-slate-900 mt-1">{value}</h4>
    )}
    <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
  </motion.div>
);

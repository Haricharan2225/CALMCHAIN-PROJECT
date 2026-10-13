import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
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

  // Clock
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

  // Fetch Firestore Data
  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubChats = null;

    const loadData = async () => {
      try {
        // 1. Fetch total registered users + admins count
        const uSnap = await getDocs(collection(db, "users")).catch(() => ({ size: 0 }));
        const aSnap = await getDocs(collection(db, "admins")).catch(() => ({ size: 0 }));
        const total = (uSnap?.size || 0) + (aSnap?.size || 0);

        setStats((prev) => ({ ...prev, totalUsers: total }));

        // 2. Realtime listener for chats collection
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
            setError("Failed to stream real-time chat data from Firestore. Check database permissions.");
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
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-6 font-['Inter']">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold font-['Outfit'] mb-2">Restricted Admin Portal</h1>
          <p className="text-xs text-slate-400 mb-6">
            Your account ({currentUser?.email}) does not have administrative privileges.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-xs"
          >
            <ArrowLeft size={16} /> Return to Chat Sanctuary
          </Link>
        </div>
      </div>
    );
  }

  const pieData = {
    labels: ["Calm Support (Lv1)", "Elevated Stress (Lv2)", "Urgent Safety (Lv3)"],
    datasets: [
      {
        data: [
          stats.emotions.calm,
          stats.emotions.warning,
          stats.emotions.danger
        ],
        backgroundColor: ["#2DD4BF", "#FBBF24", "#F43F5E"],
        borderColor: "#0F172A",
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
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 md:p-10 font-['Inter'] relative overflow-x-hidden">
      {/* Calming Mesh Gradient */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-teal-500/5 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <img src="/calmchain-logo.svg" alt="CalmChain" className="w-10 h-10 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-['Outfit'] text-white">
                  CalmChain Admin Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mental Wellness Telemetry & Risk Supervision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {liveClock && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <Clock size={14} className="text-teal-400" />
                <span>{liveClock}</span>
              </div>
            )}
            <Link
              to="/chat"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> User Chat
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Users className="text-teal-400" size={24} />}
            title="Total Registered Accounts"
            value={stats.totalUsers}
            subtitle="Users + Administrators"
            badge="Firestore"
            loading={loading}
          />
          <StatCard
            icon={<Activity className="text-cyan-400" size={24} />}
            title="Active Chat Sessions"
            value={stats.activeChats}
            subtitle="Persisted Conversations"
            badge="Real-time"
            loading={loading}
          />
          <StatCard
            icon={<ShieldAlert className="text-rose-400" size={24} />}
            title="Users Requiring Level 3"
            value={stats.riskUsers}
            subtitle="High Risk Escalations"
            badge="Safety Protocol"
            badgeColor="text-rose-400 bg-rose-500/10 border-rose-500/30"
            loading={loading}
          />
          <StatCard
            icon={<PhoneCall className="text-amber-400" size={24} />}
            title="Total Emergency Triggers"
            value={stats.emotions.danger}
            subtitle="Safety Helplines Displayed"
            badge="Tele-MANAS"
            loading={loading}
          />
        </div>

        {/* Charts & Risk Supervision Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emotion / Level Distribution Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-white">
                  Emotion & Support Level Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time sentiment classification from user messages
                </p>
              </div>
            </div>

            {loading ? (
              <div className="w-56 h-56 mx-auto rounded-full bg-slate-800/40 animate-pulse my-auto" />
            ) : stats.emotions.calm === 0 &&
              stats.emotions.warning === 0 &&
              stats.emotions.danger === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
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
                          color: "#94A3B8",
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-400" />
                  Recent Level 3 Urgent Alerts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged safety flags for immediate supervisor visibility
                </p>
              </div>
              <span className="text-xs text-rose-400 font-extrabold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                {recentRisks.length} logged
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
                  <div className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
                </div>
              ) : recentRisks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
                  <span>✨ Zero Level 3 risk events recorded in recent sessions.</span>
                </div>
              ) : (
                recentRisks.map((risk, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 transition flex items-start gap-3.5 text-xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-300 truncate">
                          User UID: {risk.userId}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatTimestamp(risk.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 italic break-words line-clamp-2">
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

const StatCard = ({ icon, title, value, subtitle, badge, badgeColor, loading }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
        {icon}
      </div>
      {badge && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            badgeColor || "text-teal-400 bg-teal-500/10 border-teal-500/20"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
    <p className="text-xs font-semibold text-slate-400">{title}</p>
    {loading ? (
      <div className="h-9 w-20 bg-slate-800 rounded-lg animate-pulse mt-2" />
    ) : (
      <h4 className="text-3xl font-black font-['Outfit'] text-white mt-1">{value}</h4>
    )}
    <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
  </motion.div>
);

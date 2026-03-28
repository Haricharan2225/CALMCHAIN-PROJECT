import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { Pie } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
} from "chart.js";
import { Users, AlertTriangle, Activity, PhoneCall, LogOut, ShieldAlert } from "lucide-react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    riskUsers: 0,
    emotions: { calm: 0, warning: 0, danger: 0 }
  });
  const [recentRisks, setRecentRisks] = useState([]);

  useEffect(() => {
    // 1. Fetch total users (users + admins)
    const fetchUsers = async () => {
      const uSnap = await getDocs(collection(db, "users"));
      const aSnap = await getDocs(collection(db, "admins"));
      setStats(prev => ({ ...prev, totalUsers: uSnap.size + aSnap.size }));
    };
    fetchUsers();

    // 2. Realtime listener for chats/messages
    const qChats = query(collection(db, "chats"));
    const unsub = onSnapshot(qChats, (snapshot) => {
      let activeCount = snapshot.size;
      let eCalm = 0, eWarn = 0, eDanger = 0;
      let riskCount = new Set();
      let risks = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.messages && data.messages.length > 0) {
           data.messages.forEach(msg => {
             if (msg.sender === "user") {
               if (msg.level === 3) eDanger++;
               else if (msg.level === 2) eWarn++;
               else eCalm++;

               if (msg.level === 3) {
                 riskCount.add(data.userId);
                 risks.push({ userId: data.userId, timestamp: msg.timestamp, text: msg.text });
               }
             }
           });
        }
      });
      
      risks.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentRisks(risks.slice(0, 5));

      setStats(prev => ({
        ...prev,
        activeUsers: activeCount,
        riskUsers: riskCount.size,
        emotions: { calm: eCalm, warning: eWarn, danger: eDanger }
      }));
    });

    return () => unsub();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };

  const pieData = {
    labels: ['Calm (Lv1)', 'Warning (Lv2)', 'Danger (Lv3)'],
    datasets: [
      {
        data: [stats.emotions.calm, stats.emotions.warning, stats.emotions.danger],
        backgroundColor: ['#10B981', '#FBBF24', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 font-[Poppins]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              Admin Overview
            </h1>
            <p className="text-slate-500 mt-1">CalmChain Control Center</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-red-500 hover:bg-red-50 transition border border-red-100 font-semibold">
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            icon={<Users className="text-blue-500" />}
            title="Total Users" 
            value={stats.totalUsers} 
            color="bg-blue-50 border-blue-100 text-blue-900" 
          />
          <StatCard 
            icon={<Activity className="text-emerald-500" />}
            title="Active Chats" 
            value={stats.activeUsers} 
            color="bg-emerald-50 border-emerald-100 text-emerald-900" 
          />
          <StatCard 
            icon={<ShieldAlert className="text-red-500" />}
            title="Risk Users (Lv3)" 
            value={stats.riskUsers} 
            color="bg-red-50 border-red-100 text-red-900" 
          />
          <StatCard 
            icon={<PhoneCall className="text-indigo-500" />}
            title="Total SOS Logs" 
            value={stats.emotions.danger} 
            color="bg-indigo-50 border-indigo-100 text-indigo-900" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold text-slate-700 mb-6 font-[Poppins]">Emotion Message Distribution</h3>
            {stats.emotions.calm === 0 && stats.emotions.warning === 0 && stats.emotions.danger === 0 ? (
               <p className="text-center text-gray-400 mt-20">No messages yet.</p>
            ) : (
               <div className="w-[300px] h-[300px] mx-auto">
                 <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
               </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
          >
            <h3 className="text-lg font-bold text-slate-700 mb-6 font-[Poppins]">Recent Level 3 Alerts</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
               {recentRisks.length > 0 ? recentRisks.map((risk, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm shrink-0">
                     <AlertTriangle size={18} />
                   </div>
                   <div className="overflow-hidden">
                     <p className="font-semibold text-slate-800 text-sm truncate">User: {risk.userId}</p>
                     <p className="text-xs text-slate-500 mt-1 truncate">"{risk.text}"</p>
                   </div>
                   <div className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full whitespace-nowrap">
                     Danger
                   </div>
                 </div>
               )) : (
                 <p className="text-gray-400 text-sm">No recent Level 3 alerts.</p>
               )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-3xl border ${color} shadow-sm relative overflow-hidden`}
  >
    <div className="absolute -right-4 -top-4 opacity-10 scale-150 pointer-events-none">
      {icon}
    </div>
    <div className="mb-4">
      {icon}
    </div>
    <p className="text-sm font-semibold opacity-80">{title}</p>
    <h3 className="text-4xl font-black mt-2">{value}</h3>
  </motion.div>
);

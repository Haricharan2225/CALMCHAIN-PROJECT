import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if admin first
      let role = "user";
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists()) {
        role = adminDoc.data().role;
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          role = userDoc.data().role;
        } else if (email === "haripatel2225@gmail.com") {
          role = "admin";
        }
      }

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-['Outfit']"
    >
      {/* Premium Midnight Mesh Gradient */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-900/30 blur-[150px] rounded-full" 
         />
         <motion.div 
            animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 60, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] bg-cyan-900/20 blur-[150px] rounded-full" 
         />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md p-12 bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
             <div className="relative group">
                <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                <div className="relative w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl border border-cyan-400/30 overflow-hidden">
                   <svg className="w-10 h-10 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                   </svg>
                </div>
             </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 font-medium text-base">Re-enter your peaceful world</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 text-red-400 text-xs font-bold py-3 px-4 rounded-xl mb-8 text-center border border-red-500/20">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest">EMAIL ADDRESS</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4.5 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:bg-slate-800 focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 outline-none transition-all placeholder-slate-600 font-semibold" 
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest">PASSWORD</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4.5 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:bg-slate-800 focus:ring-4 focus:ring-cyan-400/20 focus:border-cyan-400 outline-none transition-all placeholder-slate-600 font-semibold" 
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center gap-3 px-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 bg-slate-800 rounded-lg border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-slate-400 font-bold cursor-pointer select-none">Remember Me</label>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01, boxShadow: "0px 0px 30px rgba(6, 182, 212, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "SIGN IN"}
          </motion.button>
        </form>

        <p className="text-center mt-10 text-slate-500 text-sm font-bold">
          New to the peaceful side? <Link to="/signup" className="text-cyan-400 font-black hover:text-cyan-300 transition underline decoration-2 underline-offset-8">Create account</Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

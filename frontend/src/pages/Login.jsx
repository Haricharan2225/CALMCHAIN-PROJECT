import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine role from Firestore
      let role = "user";
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          role = adminDoc.data().role || "admin";
        } else {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || "user";
          } else if (email.toLowerCase() === "haripatel2225@gmail.com") {
            role = "admin";
          }
        }
      } catch (roleErr) {
        console.warn("Could not retrieve Firestore role, fallback check:", roleErr);
        if (email.toLowerCase() === "haripatel2225@gmail.com") {
          role = "admin";
        }
      }

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email address or password. Please double-check your credentials.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Access temporarily blocked due to multiple failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to sign in. Please verify your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Ambient Calming Aura */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] w-[50%] h-[60%] bg-cyan-600/10 blur-[140px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 sm:p-10 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group mb-3">
            <img
              src="/calmchain-logo.svg"
              alt="CalmChain"
              className="w-14 h-14 drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              CalmChain
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-100">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">Re-enter your peaceful sanctuary</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 text-red-300 text-xs font-semibold py-3 px-4 rounded-xl mb-6 border border-red-500/20 flex items-start gap-2"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-11 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              Remember session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-base shadow-xl shadow-teal-500/20 transition-all flex justify-center items-center cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-xs">
          New to CalmChain?{" "}
          <Link to="/signup" className="text-teal-400 font-bold hover:underline">
            Create a calm account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

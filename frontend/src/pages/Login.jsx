import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export const Login = () => {
  const { theme } = useTheme();
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

      let role = "user";
      const isAdminEmail = email.toLowerCase() === "haripatel2225@gmail.com";
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          role = adminDoc.data().role || "admin";
        } else {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || (isAdminEmail ? "admin" : "user");
          } else if (isAdminEmail) {
            role = "admin";
          }
        }
      } catch (roleErr) {
        if (isAdminEmail) {
          role = "admin";
        }
      }

      // Sync user profile document into Firestore
      const targetCol = (role === "admin" || isAdminEmail) ? "admins" : "users";
      setDoc(
        doc(db, targetCol, user.uid),
        {
          email: user.email,
          role: role,
          lastLoginAt: new Date().toISOString()
        },
        { merge: true }
      ).catch(() => {});

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email address or password. Please verify your details.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Access temporarily blocked due to multiple attempts. Please wait a moment.");
      } else {
        setError(err.message || "Failed to sign in. Please verify connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Ambient Theme Halo matching Landing Page */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] blur-[140px] rounded-full bg-teal-500/15"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] w-[50%] h-[60%] blur-[150px] rounded-full bg-cyan-600/15"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[25%] w-[45%] h-[45%] blur-[130px] rounded-full bg-emerald-600/10"
        />
      </div>

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-6 sm:p-10 bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group mb-2.5">
            <img
              src="/calmchain-logo.svg"
              alt="CalmChain"
              className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
              CalmChain
            </span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-white">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-0.5">Re-enter your peaceful sanctuary</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-950/60 text-rose-300 text-xs font-semibold py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl mb-5 sm:mb-6 border border-rose-800 flex items-start gap-2"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider block text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-slate-700 text-slate-100 placeholder-slate-500 text-base sm:text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider block text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#1E293B] border border-slate-700 text-slate-100 placeholder-slate-500 text-base sm:text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
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
                className="w-4 h-4 rounded text-teal-400 focus:ring-teal-400 bg-slate-800 border-slate-700 cursor-pointer"
              />
              Remember session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-base shadow-lg shadow-teal-500/20 transition-all flex justify-center items-center cursor-pointer disabled:opacity-60"
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
          <Link to="/signup" className="font-bold text-teal-400 hover:underline">
            Create a calm account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

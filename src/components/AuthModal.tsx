import React, { useState } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Bot
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthMode, UserProfile } from "../types";
import { loginUser, registerUser, resetPassword } from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const translateFirebaseError = (errMsg: string): string => {
    if (errMsg.includes("auth/invalid-credential") || errMsg.includes("auth/wrong-password")) {
      return "ভুল ইমেইল বা পাসওয়ার্ড দেওয়া হয়েছে।";
    }
    if (errMsg.includes("auth/user-not-found")) {
      return "এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্টার করুন।";
    }
    if (errMsg.includes("auth/email-already-in-use")) {
      return "এই ইমেইলটি দিয়ে ইতিমধ্যে একাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।";
    }
    if (errMsg.includes("auth/weak-password")) {
      return "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
    }
    if (errMsg.includes("auth/invalid-email")) {
      return "সঠিক ইমেইল এড্রেস লিখুন।";
    }
    if (errMsg.includes("auth/network-request-failed")) {
      return "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
    }
    return errMsg || "একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("ইমেইল দেওয়া আবশ্যক।");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMessage("আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!");
      } catch (err: any) {
        setError(translateFirebaseError(err.message || String(err)));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError("পাসওয়ার্ড দেওয়া আবশ্যক।");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("আপনার নাম লিখুন।");
        return;
      }
      if (password.length < 6) {
        setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
        return;
      }
      if (password !== confirmPassword) {
        setError("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।");
        return;
      }
    }

    setLoading(true);
    try {
      let profile: UserProfile;
      if (mode === "register") {
        profile = await registerUser(name.trim(), email.trim(), password);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        profile = await loginUser(email.trim(), password);
      }

      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(translateFirebaseError(err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {mode === "login"
              ? "Sajjat AI-তে লগইন করুন"
              : mode === "register"
              ? "নতুন একাউন্ট তৈরি করুন"
              : "পাসওয়ার্ড রিসেট করুন"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Firebase Authentication ও Realtime Database দিয়ে সুরক্ষিত
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              লগইন
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              রেজিস্টার
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name for Register */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                আপনার পুরো নাম
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ সাকিব হোসেন"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ইমেইল এড্রেস
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password (if not forgot mode) */}
          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  পাসওয়ার্ড
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬টি অক্ষর"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password for Register */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>প্রক্রিয়াধীন...</span>
              </>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </>
            ) : mode === "register" ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>একাউন্ট তৈরি করুন</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>রিসেট লিংক পাঠান</span>
              </>
            )}
          </button>
        </form>

        {/* Back to login if forgot */}
        {mode === "forgot" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              ← লগইন পেজে ফিরে যান
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

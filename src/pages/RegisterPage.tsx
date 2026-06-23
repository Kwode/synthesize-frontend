import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import {
  FlaskConical,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role] = useState("user"); // default role
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      setSuccessMsg(
        "Account registered successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error("REGISTER ERROR:", err.response?.data || err);

      const data = err.response?.data;

      if (data?.error) {
        setErrorMsg(data.error);
      } else if (data?.detail) {
        setErrorMsg(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      } else {
        setErrorMsg("Failed to communicate with the server.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="bg-indigo-950/45 p-4 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.15)]">
            <FlaskConical className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-100">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Advanced Research Assistant Framework
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#121214] border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex gap-2 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                {successMsg}
              </div>
            )}

            {/* NAME */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 text-sm"
                placeholder="John Doe"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 text-sm"
                placeholder="name@company.com"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase font-mono">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 font-mono">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
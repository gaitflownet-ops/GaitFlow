import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const images = {
  hero: "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80",
};

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — EquiSales" },
      { name: "description", content: "Sign in to your EquiSales account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <div className="auth-dark min-h-screen flex">
      {/* ── Left panel (hero) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img
          src={images.hero}
          alt="Premium equestrian"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.14_0.025_155/0.92)] via-[oklch(0.14_0.025_155/0.6)] to-transparent" />

        <div className="relative flex flex-col justify-between p-12 text-white h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[16px] font-semibold">
              ES
            </div>
            <div>
              <div className="font-display text-2xl tracking-tight">EquiSales</div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-white/50">
                Premium Equine Platform
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="animate-fade-up-delay-1">
            <blockquote className="font-display text-4xl leading-[1.1] text-white max-w-sm">
              "The future operating system of the premium equine industry."
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/50">
                EquiSales · 2026
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 animate-fade-up-delay-2">
            {[
              { v: "3,200+", k: "Horses managed" },
              { v: "$48M", k: "Transactions logged" },
              { v: "140+", k: "Premium farms" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/10 backdrop-blur p-4">
                <div className="font-display text-2xl text-white">{s.v}</div>
                <div className="text-[11px] text-white/60 mt-1">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen bg-[oklch(0.14_0.025_155)]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[14px] font-semibold">
            ES
          </div>
          <span className="font-display text-2xl text-white">EquiSales</span>
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">
          <h1 className="font-display text-4xl text-white leading-tight">Welcome back.</h1>
          <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[15px]">
            Sign in to your EquiSales account.
          </p>

          {/* Forgot password */}
          {showForgot ? (
            <div className="mt-8">
              {forgotSent ? (
                <div className="rounded-2xl border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] p-6 text-center">
                  <p className="font-display text-xl text-white mb-2">Check your inbox</p>
                  <p className="text-[13px] text-[oklch(0.65_0.02_155)]">
                    We sent a reset link to <strong className="text-white">{forgotEmail}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgot(false);
                      setForgotSent(false);
                    }}
                    className="mt-4 text-[13px] text-[var(--gold)] hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4 mt-4">
                  <p className="text-[14px] text-[oklch(0.65_0.02_155)]">
                    Enter your email and we'll send you a reset link.
                  </p>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    id="forgot-email"
                    className="w-full bg-[oklch(0.2_0.03_155)] border border-[oklch(0.28_0.04_155)] rounded-xl px-4 py-3 text-white placeholder:text-[oklch(0.5_0.02_155)] outline-none focus:border-[var(--gold)] text-[14px] transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="flex-1 rounded-full bg-[oklch(0.2_0.03_155)] text-white py-2.5 text-sm hover:bg-[oklch(0.24_0.035_155)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="forgot-submit"
                      className="flex-1 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-2.5 text-sm font-semibold hover:opacity-95"
                    >
                      Send link
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] tracking-[0.18em] uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="marisol@liveoakstables.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="login-email"
                  className="w-full bg-[oklch(0.2_0.03_155)] border border-[oklch(0.28_0.04_155)] rounded-xl px-4 py-3 text-white placeholder:text-[oklch(0.5_0.02_155)] outline-none focus:border-[var(--gold)] text-[14px] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] tracking-[0.18em] uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    id="login-password"
                    className="w-full bg-[oklch(0.2_0.03_155)] border border-[oklch(0.28_0.04_155)] rounded-xl px-4 py-3 pr-12 text-white placeholder:text-[oklch(0.5_0.02_155)] outline-none focus:border-[var(--gold)] text-[14px] transition-colors"
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.5_0.02_155)] hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--gold)]"
                  />
                  <span className="text-[13px] text-[oklch(0.65_0.02_155)]">Remember me</span>
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => setShowForgot(true)}
                  className="text-[13px] text-[var(--gold)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] text-red-400 bg-red-400/10 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3.5 text-[15px] font-semibold hover:opacity-95 transition-opacity disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[oklch(0.28_0.04_155)]" />
                <span className="text-[11px] text-[oklch(0.5_0.02_155)]">or continue with</span>
                <div className="flex-1 h-px bg-[oklch(0.28_0.04_155)]" />
              </div>

              {/* Social placeholders */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "login-google", label: "Google" },
                  { id: "login-apple", label: "Apple" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    id={id}
                    className="flex items-center justify-center gap-2 rounded-full bg-[oklch(0.2_0.03_155)] border border-[oklch(0.28_0.04_155)] py-2.5 text-[13px] text-white hover:bg-[oklch(0.24_0.035_155)] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Register link */}
              <p className="text-center text-[13px] text-[oklch(0.65_0.02_155)] mt-4">
                New to EquiSales?{" "}
                <Link
                  to="/register"
                  id="go-to-register"
                  className="text-[var(--gold)] hover:underline font-medium"
                >
                  Create an account
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

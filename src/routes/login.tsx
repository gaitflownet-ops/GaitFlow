import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { images } from "@/lib/images";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — GaitFlow" },
      {
        name: "description",
        content: "Bienvenido a GaitFlow — la plataforma de élite para el Caballo Criollo Colombiano.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case "invalid_credentials":
        return "Correo o contraseña incorrectos. Por favor, revisa tus datos e intenta de nuevo.";
      case "user_not_found":
        return "No encontramos ninguna cuenta con ese correo.";
      case "too_many_requests":
        return "Demasiados intentos. Tómate un tinto y vuelve a intentarlo en unos minutos.";
      case "email_not_confirmed":
        return "Falta confirmar tu correo. Revisa tu bandeja de entrada o la carpeta de spam.";
      default:
        return "Algo salió mal al intentar ingresar. Por favor, inténtalo de nuevo.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getErrorMessage(authError.message));
      setLoading(false);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate forgot password action
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
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[14px] font-semibold">
              GF
            </div>
            <div>
              <div className="font-display text-2xl tracking-tight">GaitFlow</div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-white/50">
                Plataforma de Operaciones Equinas
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="animate-fade-up-delay-1">
            <blockquote className="font-display text-4xl leading-[1.1] text-white max-w-sm">
              "La herramienta definitiva que nuestra caballada estaba esperando."
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/50">
                GaitFlow · Sabana de Bogotá, CO
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 animate-fade-up-delay-2">
            {[
              { v: "3,200+", k: "Ejemplares" },
              { v: "15,000+", k: "Pajillas Listas" },
              { v: "140+", k: "Criaderos Élite" },
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
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[13px] font-semibold">
            GF
          </div>
          <span className="font-display text-2xl text-white">GaitFlow</span>
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">
          <h1 className="font-display text-4xl text-white leading-tight">Bienvenido de vuelta.</h1>
          <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[15px]">
            Ingresa a tu cuenta y toma las riendas de tu criadero.
          </p>

          {/* Forgot password */}
          {showForgot ? (
            <div className="mt-8">
              {forgotSent ? (
                <div className="rounded-2xl border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] p-6 text-center">
                  <p className="font-display text-xl text-white mb-2">Revisa tu bandeja</p>
                  <p className="text-[13px] text-[oklch(0.65_0.02_155)]">
                    Enviamos un enlace de recuperación a <strong className="text-white">{forgotEmail}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgot(false);
                      setForgotSent(false);
                    }}
                    className="mt-4 text-[13px] text-[var(--gold)] hover:underline"
                  >
                    Volver a iniciar sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-[14px] text-[oklch(0.65_0.02_155)]">
                    Ingresa tu correo y te enviaremos el enlace para recuperar tu acceso.
                  </p>
                  <input
                    type="email"
                    placeholder="ejemplo@criadero.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full rounded-full border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] px-4 py-3 text-[14px] text-white focus:border-[var(--gold)] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="flex-1 rounded-full bg-[oklch(0.2_0.03_155)] text-white py-2.5 text-sm hover:bg-[oklch(0.24_0.035_155)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-2.5 text-sm font-semibold hover:opacity-95"
                    >
                      Enviar enlace
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[11px] tracking-[0.18em] uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@criadero.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-full border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] px-4 py-3 text-[14px] text-white focus:border-[var(--gold)] focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] tracking-[0.18em] uppercase text-[oklch(0.65_0.02_155)]">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-[var(--gold)] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-full border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] px-4 py-3 text-[14px] text-white focus:border-[var(--gold)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider text-[oklch(0.5_0.02_155)] hover:text-white"
                  >
                    {showPw ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--gold)]"
                />
                <span className="text-[13px] text-[oklch(0.65_0.02_155)]">Recordarme</span>
              </label>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--gold)] py-3 text-[14px] font-semibold text-[oklch(0.18_0.018_60)] hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Ingresar al Criadero <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[oklch(0.28_0.04_155)]" />
                <span className="text-[11px] text-[oklch(0.5_0.02_155)]">o continuar con</span>
                <div className="flex-1 h-px bg-[oklch(0.28_0.04_155)]" />
              </div>

              {/* Social Login placeholders */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-full border border-[oklch(0.28_0.04_155)] bg-transparent py-2.5 hover:bg-[oklch(0.18_0.03_155)] transition-colors"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" />
                  <span className="text-[13px] text-white">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-full border border-[oklch(0.28_0.04_155)] bg-transparent py-2.5 hover:bg-[oklch(0.18_0.03_155)] transition-colors"
                >
                  <img src="https://www.svgrepo.com/show/448234/apple-logo.svg" className="w-4 h-4 invert" alt="Apple" />
                  <span className="text-[13px] text-white">Apple</span>
                </button>
              </div>

              {/* Register link */}
              <p className="text-center text-[13px] text-[oklch(0.65_0.02_155)] pt-4">
                ¿No tienes tu criadero registrado aún?{" "}
                <Link to="/register" className="text-white hover:underline">
                  Comienza aquí
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { buildProfileInput, upsertProfile } from "@/lib/auth-profile";
import { insertLeadCapture, storeUTM } from "@/lib/leads";

const images = {
  farm: "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80",
};

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crear Criadero — GaitFlow" },
      {
        name: "description",
        content: "Registra tu criadero en GaitFlow — la plataforma élite para el Caballo Criollo Colombiano.",
      },
    ],
  }),
  component: RegisterPage,
});

type Role = "Owner" | "Trainer" | "Farm" | "Farrier" | "Vet";

const roles: { value: Role; label: string; description: string }[] = [
  {
    value: "Owner",
    label: "Criador / Propietario",
    description: "Maneja tus ejemplares, cruces y la administración general de tu criadero",
  },
  {
    value: "Trainer",
    label: "Montador / Chalán",
    description: "Registra los entrenamientos, arrendadas y salidas a pista",
  },
  {
    value: "Farm",
    label: "Administrador / Mayordomo",
    description: "Control total operativo de la finca, personal y labores diarias",
  },
  {
    value: "Vet",
    label: "Médico Veterinario",
    description: "Lleva las hojas clínicas, palpaciones y cronogramas de sanidad",
  },
];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const confirmationSetupHint =
  "Si quieres probar el flujo sin correo de confirmación, desactiva 'Confirm sign up' en Auth > Settings de Supabase.";

const getAuthErrorMessage = (error: { message?: string; code?: string } | null) => {
  switch (error?.code) {
    case "over_email_send_rate_limit":
      return `Se enviaron demasiadas solicitudes. Espera unos minutos antes de intentarlo de nuevo. ${confirmationSetupHint}`;
    case "email_address_invalid":
      return "El correo electrónico no es válido. Usa una dirección real.";
    case "user_already_exists":
      return "Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.";
    case "weak_password":
      return "La contraseña es muy débil. Usa al menos 8 caracteres.";
    default:
      return error?.message || "No pudimos crear la cuenta. Inténtalo de nuevo.";
  }
};

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [stable, setStable] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    setConfirmationPending(false);
    setConfirmationEmail("");

    try {
      if (!emailValid) {
        setError("Ingresa un correo electrónico válido.");
        return;
      }

      if (!passwordValid) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      const appUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const profileName = name || "Usuario CCC";
      const safeRole = role ?? "Owner";

      const profileInput = buildProfileInput({
        id: "pending",
        name: profileName,
        role: safeRole,
        stableName: stable,
        phone,
      });

      // 1. Sign up user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: profileName,
            role: safeRole === "Owner" ? "Propietario" : safeRole, // Mapeo si es necesario
            stable_name: stable || null,
            phone: phone || null,
            initials: profileInput.initials,
          },
          emailRedirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
        },
      });

      if (authError) {
        setError(getAuthErrorMessage(authError));
        return;
      }

      if (!data.user || !data.session) {
        setConfirmationPending(true);
        setConfirmationEmail(email);
        setError("Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.");
        return;
      }

      try {
        await upsertProfile({ ...profileInput, id: data.user.id });
      } catch (profileError) {
        setError(
          profileError instanceof Error ? profileError.message : "No pudimos crear tu perfil.",
        );
        return;
      }

      // Log lead capture in DB (non-fatal)
      try {
        storeUTM();
        await insertLeadCapture({
          full_name: profileName,
          email,
          stable_name: stable || undefined,
          plan_interest: undefined,
          form_type: "registration",
          profile_id: data.user.id,
        });
      } catch (e) {
        console.warn("Non-fatal lead capture error", e);
      }

      navigate({ to: "/dashboard", search: { onboarding: "true" } as any });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Error inesperado al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[oklch(0.2_0.03_155)] border border-[oklch(0.28_0.04_155)] rounded-xl px-4 py-3 text-white placeholder:text-[oklch(0.5_0.02_155)] outline-none focus:border-[var(--gold)] text-[14px] transition-colors";

  return (
    <div className="auth-dark min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden">
        <img src={images.farm} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.14_0.025_155/0.92)] to-transparent" />
        <div className="relative flex flex-col justify-between p-12 text-white h-full">
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
          <div>
            <p className="font-display text-5xl text-white leading-[1.05] max-w-xs">
              Hecho para los criaderos más exigentes.
            </p>
            <p className="mt-4 text-white/60 text-[15px] max-w-xs">
              Únete a más de 140 criaderos élite que usan GaitFlow para potenciar sus reproductores, llevar el día a día de sus fincas y llegar preparados a las grandes ferias.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Historial médico y calendario de sanidad",
              "Gestión de personal y labores de pesebreras",
              "Control de saltos, receptoras y destetes",
              "Proyección financiera y costos por ejemplar",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-[13px] text-white/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[oklch(0.14_0.025_155)]">
        <div className="w-full max-w-[420px]">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[13px] font-semibold lg:hidden">
                  GF
                </div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-[oklch(0.65_0.02_155)]">
                  Paso {step} de {totalSteps}
                </span>
              </div>
              <span className="text-[11px] text-[oklch(0.5_0.02_155)]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-[oklch(0.22_0.035_155)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">¿Cuál es tu cargo?</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Selecciona el rol principal que desempeñas en la finca.
              </p>
              <div className="mt-6 space-y-3">
                {roles.map(({ value, label, description }) => (
                  <button
                    key={value}
                    id={`role-${value.toLowerCase()}`}
                    onClick={() => setRole(value)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      role === value
                        ? "border-[var(--gold)] bg-[oklch(0.2_0.03_155)]"
                        : "border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] hover:border-[oklch(0.35_0.04_155)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-medium text-white">{label}</div>
                        <div className="text-[12px] text-[oklch(0.65_0.02_155)] mt-0.5">
                          {description}
                        </div>
                      </div>
                      {role === value && (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                id="register-next-1"
                disabled={!role}
                onClick={() => setStep(2)}
                className="w-full mt-6 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3.5 text-[15px] font-semibold hover:opacity-95 transition-opacity disabled:opacity-40"
              >
                Siguiente Paso <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">Tu Perfil</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Cuéntanos sobre ti y tu criadero.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Nombre Completo
                  </label>
                  <input
                    id="register-name"
                    className={inputClass}
                    placeholder="Mario Gaviria"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Nombre del Criadero
                  </label>
                  <input
                    id="register-stable"
                    className={inputClass}
                    placeholder="Criadero San Juan"
                    value={stable}
                    onChange={(e) => setStable(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Teléfono Celular
                  </label>
                  <input
                    id="register-phone"
                    className={inputClass}
                    placeholder="300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Ubicación (Dpto / Ciudad)
                  </label>
                  <input
                    id="register-location"
                    className={inputClass}
                    placeholder="Antioquia, Rionegro"
                    onChange={(e) => {}}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <button
                  id="register-next-2"
                  onClick={() => setStep(3)}
                  disabled={!name}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-40"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">Datos de Acceso</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Crea tus credenciales para ingresar a la plataforma.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    className={inputClass}
                    placeholder="tucorreo@criadero.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    className={inputClass}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    id="register-confirm"
                    type="password"
                    className={inputClass}
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <button
                  id="register-next-3"
                  onClick={() => {
                    if (email && password && password === confirm) setStep(4);
                  }}
                  disabled={
                    !email || !password || password !== confirm || !emailValid || !passwordValid
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-40"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">¡Casi listos!</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Revisa tus datos antes de abrir las puertas de tu cuenta.
              </p>
              <div className="mt-6 rounded-2xl border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] divide-y divide-[oklch(0.28_0.04_155)]">
                {[
                  { k: "Cargo", v: roles.find(r => r.value === role)?.label || role },
                  { k: "Nombre", v: name },
                  { k: "Criadero", v: stable || "—" },
                  { k: "Correo", v: email },
                ].map(({ k, v }) => (
                  <div key={k} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[12px] text-[oklch(0.65_0.02_155)]">{k}</span>
                    <span className="text-[14px] text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
              {confirmationPending && (
                <div className="mt-4 rounded-2xl border border-[var(--gold)]/40 bg-[oklch(0.2_0.03_155)] px-4 py-4">
                  <p className="text-[13px] font-semibold text-[var(--gold)]">
                    Revisa tu correo para confirmar la cuenta
                  </p>
                  <p className="mt-2 text-[13px] text-[oklch(0.75_0.02_155)]">
                    Enviamos las instrucciones a{" "}
                    <span className="font-medium text-white">{confirmationEmail || email}</span>.
                    Cuando hagas clic en el enlace, volverás a la plataforma y podrás iniciar sesión.
                  </p>
                </div>
              )}
              {error && !confirmationPending && (
                <p className="mt-4 text-[13px] text-red-400 bg-red-400/10 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <button
                  id="register-submit"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Registrar Criadero <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-[13px] text-[oklch(0.65_0.02_155)]">
            ¿Ya tienes un criadero registrado?{" "}
            <Link
              to="/login"
              id="go-to-login"
              className="text-[var(--gold)] hover:underline font-medium"
            >
              Ingresa aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { images } from "@/lib/data";
import type { User } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — EquiSales" },
      { name: "description", content: "Join EquiSales — the premium equine platform." },
    ],
  }),
  component: RegisterPage,
});

type Role = "Owner" | "Trainer" | "Farm" | "Farrier" | "Vet";

const roles: { value: Role; label: string; description: string }[] = [
  { value: "Owner", label: "Horse Owner", description: "Manage and track your horses" },
  { value: "Trainer", label: "Trainer", description: "Log sessions and competitions" },
  { value: "Farm", label: "Farm / Stable", description: "Full operations for your operation" },
  { value: "Farrier", label: "Farrier / Vet", description: "Record visits and health data" },
];

function RegisterPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [stable, setStable] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleComplete = () => {
    setLoading(true);
    const user: User = {
      id: `user-${Date.now()}`,
      name: name || "New User",
      email,
      role: role ?? "Owner",
      stableName: stable || "My Stable",
      initials: name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US",
      phone,
    };
    setTimeout(() => {
      login(user);
      navigate({ to: "/" });
    }, 1500);
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
          <div>
            <p className="font-display text-5xl text-white leading-[1.05] max-w-xs">
              Built for the world's finest horses.
            </p>
            <p className="mt-4 text-white/60 text-[15px] max-w-xs">
              Join 140+ premium farms and studs using EquiSales to manage, track, and grow their equine operations.
            </p>
          </div>
          <div className="space-y-3">
            {["Unlimited horse profiles", "Competition tracking & analytics", "Team collaboration tools", "Health & wellness records"].map((f) => (
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
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[13px] font-semibold lg:hidden">
                  ES
                </div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-[oklch(0.65_0.02_155)]">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <span className="text-[11px] text-[oklch(0.5_0.02_155)]">{Math.round(progress)}%</span>
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
              <h1 className="font-display text-3xl text-white">I am a…</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Choose the role that best describes you.
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
                        <div className="text-[12px] text-[oklch(0.65_0.02_155)] mt-0.5">{description}</div>
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
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">Your profile</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">
                Tell us about you and your operation.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Full name</label>
                  <input id="register-name" className={inputClass} placeholder="Marisol Vega" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Stable / Farm name</label>
                  <input id="register-stable" className={inputClass} placeholder="Live Oak Stables" value={stable} onChange={(e) => setStable(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Phone number</label>
                  <input id="register-phone" className={inputClass} placeholder="+1 (352) 555-0000" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button id="register-next-2" onClick={() => setStep(3)} disabled={!name} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-40">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">Account details</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">Create your login credentials.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Email address</label>
                  <input id="register-email" type="email" className={inputClass} placeholder="you@stablename.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Password</label>
                  <input id="register-password" type="password" className={inputClass} placeholder="min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-[oklch(0.65_0.02_155)] mb-1.5">Confirm password</label>
                  <input id="register-confirm" type="password" className={inputClass} placeholder="repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  id="register-next-3"
                  onClick={() => { if (email && password && password === confirm) setStep(4); }}
                  disabled={!email || !password || password !== confirm}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-3xl text-white">Almost there.</h1>
              <p className="mt-2 text-[oklch(0.65_0.02_155)] text-[14px]">Review your details and launch your account.</p>
              <div className="mt-6 rounded-2xl border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] divide-y divide-[oklch(0.28_0.04_155)]">
                {[
                  { k: "Role", v: role },
                  { k: "Name", v: name },
                  { k: "Stable", v: stable || "—" },
                  { k: "Email", v: email },
                ].map(({ k, v }) => (
                  <div key={k} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[12px] text-[oklch(0.65_0.02_155)]">{k}</span>
                    <span className="text-[14px] text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 rounded-full bg-[oklch(0.2_0.03_155)] text-white px-5 py-3 text-sm hover:bg-[oklch(0.24_0.035_155)]">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  id="register-submit"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] py-3 text-[15px] font-semibold hover:opacity-95 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Launch EquiSales <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-[13px] text-[oklch(0.65_0.02_155)]">
            Already have an account?{" "}
            <Link to="/login" id="go-to-login" className="text-[var(--gold)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

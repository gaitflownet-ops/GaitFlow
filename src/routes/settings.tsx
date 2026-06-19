import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useState } from "react";
import { User, Bell, Shield, CreditCard, Trash2, Check, Camera } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GaitFlow" },
      { name: "description", content: "Manage your GaitFlow account and preferences." },
    ],
  }),
  component: Settings,
});

type Tab = "profile" | "stable" | "notifications" | "billing" | "danger";

const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "stable", label: "Stable", icon: Shield },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "danger", label: "Danger zone", icon: Trash2 },
];

function Settings() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const user = state.user;

  // Profile form state
  const [name, setName] = useState(user?.name ?? "Marisol Vega");
  const [email, setEmail] = useState("marisol@liveoakstables.com");
  const [phone, setPhone] = useState(user?.phone ?? "+1 (352) 555-0182");

  // Notification prefs
  const [prefs, setPrefs] = useState({
    competitions: true,
    health: true,
    training: true,
    farrier: false,
    media: true,
    reminders: true,
    weekly: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="eyebrow">Account</div>
      <h1 className="font-display text-4xl lg:text-5xl mt-2">Settings</h1>
      <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
        Manage your profile, stable configuration, and platform preferences.
      </p>

      <div className="mt-10 flex flex-col lg:flex-row gap-8">
        {/* Sidebar tabs */}
        <nav className="lg:w-[220px] shrink-0" aria-label="Settings sections">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {tabs.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                id={`settings-tab-${value}`}
                onClick={() => setTab(value)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] whitespace-nowrap transition-colors text-left ${
                  tab === value
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                } ${value === "danger" ? "text-destructive hover:text-destructive" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl space-y-6">
          {/* ── Profile ── */}
          {tab === "profile" && (
            <div className="animate-fade-up space-y-6">
              {/* Avatar */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Profile photo</h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-charcoal font-display text-2xl">
                      {user?.initials ?? "MV"}
                    </div>
                    <button
                      id="change-avatar-btn"
                      className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{user?.name ?? "Marisol Vega"}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {user?.role} · {user?.stable_name}
                    </p>
                    <button
                      id="upload-photo-btn"
                      className="mt-2 text-[12px] text-primary hover:underline"
                    >
                      Upload new photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Personal information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Full name</label>
                    <input
                      className="lux-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      id="settings-name"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Email address</label>
                    <input
                      type="email"
                      className="lux-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      id="settings-email"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Phone number</label>
                    <input
                      className="lux-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      id="settings-phone"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Role</label>
                    <select className="lux-select" id="settings-role">
                      {["Owner", "Trainer", "Farm", "Vet", "Farrier"].map((r) => (
                        <option key={r} value={r} selected={r === user?.role}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    id="settings-save-profile"
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" /> Saved
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Stable ── */}
          {tab === "stable" && (
            <div className="animate-fade-up space-y-6">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Stable information</h2>
                <div className="space-y-4">
                  {[
                    {
                      id: "stable-name",
                      label: "Stable / Farm name",
                      placeholder: "Live Oak Stables",
                    },
                    { id: "stable-location", label: "Location", placeholder: "Ocala, FL 34471" },
                    {
                      id: "stable-website",
                      label: "Website",
                      placeholder: "https://liveoakstables.com",
                    },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id}>
                      <label className="eyebrow block mb-1.5">{label}</label>
                      <input className="lux-input" id={id} placeholder={placeholder} />
                    </div>
                  ))}
                  <div>
                    <label className="eyebrow block mb-1.5">Number of horses</label>
                    <select className="lux-select" id="stable-horses">
                      {["1–5", "6–15", "16–30", "30+"].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  id="settings-save-stable"
                  onClick={handleSave}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved
                    </>
                  ) : (
                    "Save stable settings"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="animate-fade-up">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Notification preferences</h2>
                <div className="space-y-1">
                  {[
                    {
                      key: "competitions" as const,
                      label: "Competition results",
                      description: "Win notifications and placings",
                    },
                    {
                      key: "health" as const,
                      label: "Health alerts",
                      description: "Vet visits, vaccination reminders",
                    },
                    {
                      key: "training" as const,
                      label: "Training updates",
                      description: "Session logs from trainers",
                    },
                    {
                      key: "farrier" as const,
                      label: "Farrier services",
                      description: "Appointment completions",
                    },
                    {
                      key: "media" as const,
                      label: "Media uploads",
                      description: "Photos and videos from your team",
                    },
                    {
                      key: "reminders" as const,
                      label: "Reminders",
                      description: "Upcoming events and tasks",
                    },
                    {
                      key: "weekly" as const,
                      label: "Weekly digest",
                      description: "Summary of the week every Monday",
                    },
                  ].map(({ key, label, description }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-4 border-b border-border last:border-b-0"
                    >
                      <div>
                        <p className="text-[14px] font-medium">{label}</p>
                        <p className="text-[12px] text-muted-foreground">{description}</p>
                      </div>
                      <button
                        id={`notif-toggle-${key}`}
                        onClick={() => togglePref(key)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key] ? "bg-primary" : "bg-muted"}`}
                        role="switch"
                        aria-checked={prefs[key]}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? "translate-x-5" : ""}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === "billing" && (
            <div className="animate-fade-up space-y-5">
              <div className="lux-card p-6 bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)] text-primary-foreground border-transparent">
                <div className="eyebrow !text-primary-foreground/60">Current plan</div>
                <div className="font-display text-4xl mt-2 gold-text">GaitFlow Pro</div>
                <p className="text-[14px] text-primary-foreground/70 mt-2">
                  Unlimited horses · Full team access · Priority support
                </p>
                <div className="mt-4 inline-flex items-baseline gap-1">
                  <span className="font-display text-3xl">$199</span>
                  <span className="text-primary-foreground/60 text-sm">/month</span>
                </div>
              </div>
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Payment method</h2>
                <div className="flex items-center gap-4 p-4 bg-secondary rounded-2xl">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border text-[10px] font-bold text-muted-foreground">
                    VISA
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">Visa ending in 4242</p>
                    <p className="text-[12px] text-muted-foreground">Expires 08/2028</p>
                  </div>
                  <button
                    id="update-payment"
                    className="ml-auto text-[13px] text-primary hover:underline"
                  >
                    Update
                  </button>
                </div>
                <button
                  id="billing-history"
                  className="mt-4 text-[13px] text-muted-foreground hover:text-foreground underline"
                >
                  View billing history
                </button>
              </div>
            </div>
          )}

          {/* ── Danger zone ── */}
          {tab === "danger" && (
            <div className="animate-fade-up">
              <div className="lux-card p-6 border-destructive/30">
                <h2 className="font-display text-xl text-destructive mb-2">Danger zone</h2>
                <p className="text-[13px] text-muted-foreground mb-6">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">Delete all data</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Remove all horses, records and media
                      </p>
                    </div>
                    <button
                      id="delete-data-btn"
                      className="rounded-full border border-destructive text-destructive px-4 py-2 text-[13px] font-medium hover:bg-destructive hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">Close account</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Permanently remove your GaitFlow account
                      </p>
                    </div>
                    <button
                      id="close-account-btn"
                      className="rounded-full border border-destructive text-destructive px-4 py-2 text-[13px] font-medium hover:bg-destructive hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { useUpdateProfile } from "@/lib/hooks/useProfiles";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Trash2,
  Check,
  Camera,
  Loader2,
  LogOut,
  Key,
  Globe,
  ChevronRight,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Download,
  RefreshCcw,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — GaitFlow" },
      {
        name: "description",
        content: "Manage your GaitFlow account, profile, plan, and preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

type Tab = "overview" | "profile" | "security" | "plan" | "notifications" | "danger";

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "overview", label: "Overview", icon: User },
  { value: "profile", label: "Edit Profile", icon: Building2 },
  { value: "security", label: "Security", icon: Shield },
  { value: "plan", label: "Plan & Billing", icon: CreditCard },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "danger", label: "Danger Zone", icon: Trash2 },
];

const ACCOUNT_STATS = [
  { label: "Horses managed", value: "24", icon: Star, color: "var(--gold)" },
  { label: "Tasks completed", value: "1,840", icon: Zap, color: "var(--forest)" },
  { label: "Days on GaitFlow", value: "187", icon: Clock, color: "var(--bronze)" },
  { label: "Reports generated", value: "62", icon: TrendingUp, color: "var(--leather)" },
];

const ACTIVITY = [
  { action: "Created health record for Northern Flame", time: "2 hours ago", type: "health" },
  { action: "Invoice #GF-0041 marked as paid", time: "Yesterday", type: "finance" },
  { action: "Added 3 new tasks to Flow Engine", time: "2 days ago", type: "task" },
  { action: "Ember Rose listed in Marketplace", time: "3 days ago", type: "market" },
  { action: "Breeding cycle registered for Luna Mare", time: "5 days ago", type: "breeding" },
];

const ACTIVITY_COLORS: Record<string, string> = {
  health: "var(--gold)",
  finance: "var(--forest)",
  task: "var(--bronze)",
  market: "var(--primary)",
  breeding: "var(--leather)",
};

function ProfilePage() {
  const { state, dispatch, logout } = useApp();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const [tab, setTab] = useState<Tab>("overview");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const user = state.user;

  // Profile form
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? "Owner");
  const [stableName, setStableName] = useState(user?.stable_name ?? "");
  const [location, setLocation] = useState("Ocala, FL 34471");
  const [website, setWebsite] = useState("https://liveoakstables.com");
  const [bio, setBio] = useState(
    "Owner and operator of Live Oak Stables, specializing in sport horse breeding and training.",
  );

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    health_alerts: true,
    task_reminders: true,
    marketplace_inquiries: true,
    breeding_updates: true,
    financial_alerts: true,
    weekly_digest: true,
    marketing: false,
  });

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
    setRole(user.role);
    setStableName(user.stable_name ?? "");
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaveError("");
    try {
      const updatedProfile = await updateProfile.mutateAsync({
        id: user.id,
        updates: {
          name,
          phone: phone || null,
          role,
          stable_name: stableName || null,
          initials:
            name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "US",
        },
      });
      dispatch({
        type: "AUTH_STATE_CHANGE",
        payload: { isAuthenticated: true, user: updatedProfile },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save profile.");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const initials = user?.initials ?? "MV";
  const displayName = user?.name ?? "Marisol Vega";
  const displayRole = user?.role ?? "Owner";
  const displayStable = user?.stable_name ?? "Live Oak Stables";

  // ── Plan badge helper ──
  const planBadge = { label: "Professional", color: "var(--gold)" };

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <div className="eyebrow">Account</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-1">My Profile</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            Manage your identity, security, and GaitFlow subscription.
          </p>
        </div>
        <button
          id="profile-logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left sidebar ── */}
        <aside className="lg:w-[260px] shrink-0 space-y-4">
          {/* Avatar card */}
          <div className="lux-card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[oklch(0.18_0.018_60)] font-display text-3xl mx-auto">
                {initials}
              </div>
              <button
                id="profile-avatar-btn"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
                aria-label="Change avatar"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="font-display text-xl">{displayName}</div>
            <div className="text-[12px] text-muted-foreground mt-1">
              {displayRole} · {displayStable}
            </div>
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest"
              style={{
                backgroundColor: `color-mix(in oklab, ${planBadge.color} 15%, transparent)`,
                color: planBadge.color,
              }}
            >
              <Award className="h-3 w-3" />
              {planBadge.label}
            </div>
          </div>

          {/* Tab nav */}
          <nav aria-label="Profile sections">
            <div className="flex flex-col gap-0.5">
              {TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  id={`profile-tab-${value}`}
                  onClick={() => setTab(value)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] text-left transition-colors ${
                    tab === value
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  } ${value === "danger" ? "!text-destructive hover:!text-destructive" : ""}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 opacity-30 transition-opacity ${tab === value ? "opacity-70" : ""}`}
                  />
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* ════ OVERVIEW ════ */}
          {tab === "overview" && (
            <div className="animate-fade-up space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {ACCOUNT_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="lux-card p-5 flex flex-col gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${stat.color} 15%, transparent)`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: stat.color }} />
                      </div>
                      <div>
                        <div className="font-display text-2xl">{stat.value}</div>
                        <div className="text-[12px] text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Account info summary */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Account details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: User, label: "Full name", value: displayName },
                    { icon: Mail, label: "Email", value: "marisol@liveoakstables.com" },
                    { icon: Phone, label: "Phone", value: user?.phone ?? "+1 (352) 555-0182" },
                    { icon: Building2, label: "Stable", value: displayStable },
                    { icon: MapPin, label: "Location", value: location },
                    { icon: Calendar, label: "Member since", value: "January 2025" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          {label}
                        </div>
                        <div className="text-[14px] font-medium text-foreground">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  id="overview-edit-btn"
                  onClick={() => setTab("profile")}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-4 py-2 text-[13px] font-medium hover:bg-secondary/80 transition-colors"
                >
                  Edit profile
                </button>
              </div>

              {/* Recent activity */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Recent activity</h2>
                <div className="space-y-0">
                  {ACTIVITY.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 py-3.5 border-b border-border last:border-b-0"
                    >
                      <div
                        className="h-2 w-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: ACTIVITY_COLORS[item.type] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-foreground">{item.action}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ PROFILE ════ */}
          {tab === "profile" && (
            <div className="animate-fade-up space-y-6">
              {/* Avatar upload */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Profile photo</h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[oklch(0.18_0.018_60)] font-display text-2xl">
                      {initials}
                    </div>
                    <button
                      className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <button
                      id="upload-photo-btn"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      Upload new photo
                    </button>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      PNG or JPG · Max 2MB · Square recommended
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Personal information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1.5">Full name</label>
                    <input
                      id="profile-name"
                      className="lux-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Email address</label>
                    <input
                      id="profile-email"
                      type="email"
                      className="lux-input bg-secondary/50 cursor-not-allowed"
                      value="marisol@liveoakstables.com"
                      readOnly
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Contact support to change your email.
                    </p>
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Phone number</label>
                    <input
                      id="profile-phone"
                      className="lux-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (352) 555-0000"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Role</label>
                    <select
                      id="profile-role"
                      className="lux-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {["Owner", "Trainer", "Farm Manager", "Vet", "Farrier", "Investor"].map(
                        (r) => (
                          <option key={r}>{r}</option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Location</label>
                    <input
                      id="profile-location"
                      className="lux-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1.5">Bio</label>
                    <textarea
                      id="profile-bio"
                      className="lux-input min-h-[80px] resize-y"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Stable info */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Stable information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Stable / Farm name</label>
                    <input
                      id="profile-stable"
                      className="lux-input"
                      value={stableName}
                      onChange={(e) => setStableName(e.target.value)}
                      placeholder="Live Oak Stables"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Website</label>
                    <input
                      id="profile-website"
                      className="lux-input"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Number of horses</label>
                    <select id="profile-horses" className="lux-select">
                      {["1–5", "6–15", "16–30", "31–50", "50+"].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Primary discipline</label>
                    <select id="profile-discipline" className="lux-select">
                      {[
                        "Show Jumping",
                        "Dressage",
                        "Eventing",
                        "Racing",
                        "Breeding",
                        "Western",
                        "Polo",
                      ].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-5 py-4 text-[13px] text-destructive flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  id="profile-save-btn"
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-[13px] font-medium hover:opacity-95 transition-opacity disabled:opacity-60"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved!
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
                {saved && (
                  <span className="text-[13px] text-muted-foreground">
                    Your profile has been updated.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ════ SECURITY ════ */}
          {tab === "security" && (
            <div className="animate-fade-up space-y-6">
              {/* Password */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-1">Change password</h2>
                <p className="text-[13px] text-muted-foreground mb-5">
                  Use a strong password with at least 12 characters.
                </p>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="eyebrow block mb-1.5">Current password</label>
                    <input
                      id="security-current-pw"
                      type="password"
                      className="lux-input"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">New password</label>
                    <input
                      id="security-new-pw"
                      type="password"
                      className="lux-input"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Confirm new password</label>
                    <input
                      id="security-confirm-pw"
                      type="password"
                      className="lux-input"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                  <button
                    id="security-save-pw"
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-[13px] font-medium hover:opacity-95"
                  >
                    <Key className="h-4 w-4" /> Update password
                  </button>
                </div>
              </div>

              {/* MFA */}
              <div className="lux-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl mb-1">Two-factor authentication</h2>
                    <p className="text-[13px] text-muted-foreground">
                      Add an extra layer of security to your account with an authenticator app.
                    </p>
                  </div>
                  <button
                    id="security-mfa-toggle"
                    onClick={() => setMfaEnabled((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 mt-1 ${mfaEnabled ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={mfaEnabled}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mfaEnabled ? "translate-x-5" : ""}`}
                    />
                  </button>
                </div>
                {mfaEnabled && (
                  <div className="mt-4 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 px-5 py-4">
                    <p className="text-[13px] text-[var(--gold)] font-medium">
                      2FA is enabled on your account. ✓
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Managed via your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                  </div>
                )}
              </div>

              {/* Active sessions */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Active sessions</h2>
                <div className="space-y-3">
                  {[
                    {
                      device: "MacBook Pro — Chrome 124",
                      location: "Ocala, FL · Current session",
                      current: true,
                    },
                    {
                      device: "iPhone 15 — Safari",
                      location: "Ocala, FL · 2 hours ago",
                      current: false,
                    },
                    {
                      device: "Windows 11 — Edge 124",
                      location: "Miami, FL · Yesterday",
                      current: false,
                    },
                  ].map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[14px] font-medium">{session.device}</p>
                          <p className="text-[12px] text-muted-foreground">{session.location}</p>
                        </div>
                      </div>
                      {session.current ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--forest)]/15 text-[var(--forest)] font-medium uppercase tracking-widest">
                          Current
                        </span>
                      ) : (
                        <button
                          id={`revoke-session-${i}`}
                          className="text-[12px] text-destructive hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ PLAN & BILLING ════ */}
          {tab === "plan" && (
            <div className="animate-fade-up space-y-6">
              {/* Current plan */}
              <div className="lux-card p-6 bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)] text-primary-foreground border-transparent overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.78_0.13_80/0.12)_0%,_transparent_70%)]" />
                <div className="relative z-10">
                  <div className="eyebrow !text-primary-foreground/50 mb-2">Current plan</div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <div className="font-display text-4xl gold-text">GaitFlow Professional</div>
                      <p className="text-primary-foreground/60 text-[13px] mt-1">
                        50 horses · 8 team members · Full Holt-Winters suite
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl">$159</div>
                      <div className="text-primary-foreground/50 text-[12px]">
                        /month · billed annually
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-primary-foreground/10 flex flex-wrap gap-3">
                    <button
                      id="plan-upgrade"
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] px-5 py-2.5 text-[12px] font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      <Zap className="h-3.5 w-3.5" /> Upgrade to Enterprise
                    </button>
                    <button
                      id="plan-manage"
                      className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground px-5 py-2.5 text-[12px] font-medium uppercase tracking-widest hover:bg-primary-foreground/10 transition-colors"
                    >
                      Manage plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing cycle & next charge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Next charge", value: "Jul 10, 2026", sub: "$159.00" },
                  { label: "Billing cycle", value: "Annual", sub: "Saves 20% vs monthly" },
                  { label: "Seats used", value: "6 / 8", sub: "Team members" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="lux-card p-5">
                    <div className="eyebrow mb-1">{label}</div>
                    <div className="font-display text-xl">{value}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Payment method</h2>
                <div className="flex items-center gap-4 rounded-2xl bg-secondary p-4">
                  <div className="grid h-10 w-14 place-items-center rounded-xl bg-card border border-border text-[10px] font-bold text-muted-foreground tracking-wider">
                    VISA
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium">Visa ending in 4242</p>
                    <p className="text-[12px] text-muted-foreground">
                      Expires 08/2028 · Billing email: marisol@liveoakstables.com
                    </p>
                  </div>
                  <button id="update-payment" className="text-[13px] text-primary hover:underline">
                    Update
                  </button>
                </div>
              </div>

              {/* Invoice history */}
              <div className="lux-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl">Invoice history</h2>
                  <button
                    id="download-all-invoices"
                    className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" /> Download all
                  </button>
                </div>
                <div className="space-y-0">
                  {[
                    { date: "Jun 10, 2026", amount: "$159.00", status: "Paid", id: "GF-INV-0006" },
                    { date: "May 10, 2026", amount: "$159.00", status: "Paid", id: "GF-INV-0005" },
                    { date: "Apr 10, 2026", amount: "$159.00", status: "Paid", id: "GF-INV-0004" },
                    { date: "Mar 10, 2026", amount: "$159.00", status: "Paid", id: "GF-INV-0003" },
                  ].map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-3.5 border-b border-border last:border-b-0 gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[var(--forest)]/15 text-[var(--forest)] font-medium">
                          {inv.status}
                        </span>
                        <div>
                          <p className="text-[14px] font-medium">{inv.id}</p>
                          <p className="text-[12px] text-muted-foreground">{inv.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-[14px]">{inv.amount}</span>
                        <button
                          id={`download-${inv.id}`}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ NOTIFICATIONS ════ */}
          {tab === "notifications" && (
            <div className="animate-fade-up">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-2">Notification preferences</h2>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Choose what you're notified about via email and in-app alerts.
                </p>
                <div className="space-y-0">
                  {[
                    {
                      key: "health_alerts" as const,
                      label: "Health alerts",
                      desc: "Vaccine reminders, vet appointments, risk index alerts",
                    },
                    {
                      key: "task_reminders" as const,
                      label: "Task reminders",
                      desc: "Overdue and upcoming tasks from your Flow Engine",
                    },
                    {
                      key: "marketplace_inquiries" as const,
                      label: "Marketplace inquiries",
                      desc: "Buyer messages and listing activity",
                    },
                    {
                      key: "breeding_updates" as const,
                      label: "Breeding updates",
                      desc: "Gestation milestones and reproductive cycle alerts",
                    },
                    {
                      key: "financial_alerts" as const,
                      label: "Financial alerts",
                      desc: "Overdue invoices, expense anomalies, revenue deviations",
                    },
                    {
                      key: "weekly_digest" as const,
                      label: "Weekly digest",
                      desc: "Summary of operations every Monday morning",
                    },
                    {
                      key: "marketing" as const,
                      label: "Product updates & news",
                      desc: "GaitFlow feature releases and industry insights",
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-4 border-b border-border last:border-b-0 gap-4"
                    >
                      <div>
                        <p className="text-[14px] font-medium">{label}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <button
                        id={`notif-${key}`}
                        onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${notifs[key] ? "bg-primary" : "bg-muted"}`}
                        role="switch"
                        aria-checked={notifs[key]}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifs[key] ? "translate-x-5" : ""}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  id="save-notifications"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-[13px] font-medium hover:opacity-95"
                >
                  <Check className="h-4 w-4" /> Save preferences
                </button>
              </div>
            </div>
          )}

          {/* ════ DANGER ZONE ════ */}
          {tab === "danger" && (
            <div className="animate-fade-up space-y-6">
              <div className="lux-card p-6 border-destructive/25">
                <h2 className="font-display text-xl text-destructive mb-1">Danger zone</h2>
                <p className="text-[13px] text-muted-foreground mb-6">
                  These actions are permanent and cannot be undone.
                </p>

                <div className="space-y-4">
                  {/* Export data */}
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 p-5 gap-4">
                    <div>
                      <p className="text-[14px] font-medium">Export your data</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Download a full copy of all your horses, health records, tasks, and
                        financial data.
                      </p>
                    </div>
                    <button
                      id="export-data-btn"
                      className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary transition-colors"
                    >
                      <Download className="h-4 w-4" /> Export
                    </button>
                  </div>

                  {/* Reset data */}
                  <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-5 gap-4">
                    <div>
                      <p className="text-[14px] font-medium">Reset all data</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Permanently delete all horses, records, tasks, and documents. Your account
                        stays active.
                      </p>
                    </div>
                    <button
                      id="reset-data-btn"
                      className="shrink-0 rounded-full border border-destructive text-destructive px-4 py-2 text-[13px] font-medium hover:bg-destructive hover:text-white transition-colors"
                    >
                      <RefreshCcw className="h-4 w-4 inline mr-1.5" />
                      Reset
                    </button>
                  </div>

                  {/* Close account */}
                  <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-5 gap-4">
                    <div>
                      <p className="text-[14px] font-medium">Close account</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Permanently delete your GaitFlow account and all associated data. This
                        cannot be reversed.
                      </p>
                    </div>
                    <button
                      id="close-account-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="shrink-0 rounded-full border border-destructive text-destructive px-4 py-2 text-[13px] font-medium hover:bg-destructive hover:text-white transition-colors"
                    >
                      Close account
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm && (
                <div className="lux-card p-6 border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <h3 className="font-display text-lg text-destructive">
                      Confirm account deletion
                    </h3>
                  </div>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    Type <strong className="text-foreground">DELETE MY ACCOUNT</strong> to confirm.
                    This will permanently remove all your data.
                  </p>
                  <input
                    id="delete-confirm-input"
                    className="lux-input mb-4"
                    placeholder="DELETE MY ACCOUNT"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      id="confirm-delete-btn"
                      disabled={deleteInput !== "DELETE MY ACCOUNT"}
                      className="rounded-full bg-destructive text-white px-5 py-2.5 text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                      Permanently delete account
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteInput("");
                      }}
                      className="rounded-full border border-border bg-card px-5 py-2.5 text-[13px] font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-24 lg:h-12" />

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="lux-card p-8 max-w-sm w-full mx-4 shadow-[var(--shadow-modal)] animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 mb-5">
              <LogOut className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="font-display text-2xl mb-2">¿Cerrar sesión en GaitFlow?</h2>
            <p className="text-[13px] text-muted-foreground mb-6">
              Tendrás que volver a iniciar sesión para acceder a tu criadero.
            </p>
            <div className="flex gap-3">
              <button
                id="confirm-logout-btn"
                onClick={handleLogout}
                className="flex-1 rounded-full bg-foreground text-background py-2.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-[13px] font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

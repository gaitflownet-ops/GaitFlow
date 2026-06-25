import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useEffect, useState } from "react";
import { User, Bell, Shield, CreditCard, Trash2, Check, Camera, Loader2, Users, ClipboardList } from "lucide-react";
import { useUpdateProfile } from "@/lib/hooks/useProfiles";
import {
  useOrganization,
  useUpdateOrganization,
  useOrganizationMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/lib/hooks/useOrganization";
import { useAuditLogs } from "@/lib/hooks/useActivities";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configuración — GaitFlow" },
      { name: "description", content: "Gestiona tu cuenta y preferencias de GaitFlow." },
    ],
  }),
  component: Settings,
});

type Tab = "profile" | "stable" | "team" | "notifications" | "billing" | "audit" | "danger";

const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "profile", label: "Perfil", icon: User },
  { value: "stable", label: "Finca / Org", icon: Shield },
  { value: "team", label: "Equipo y Roles", icon: Users },
  { value: "notifications", label: "Notificaciones", icon: Bell },
  { value: "billing", label: "Facturación", icon: CreditCard },
  { value: "audit", label: "Registros de Auditoría", icon: ClipboardList },
  { value: "danger", label: "Zona de Peligro", icon: Trash2 },
];

function Settings() {
  const { state, dispatch } = useApp();
  const updateProfile = useUpdateProfile();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const user = state.user;

  // SaaS Organization & Team Hooks
  const { data: org } = useOrganization(user?.organization_id);
  const updateOrg = useUpdateOrganization();
  const { data: members = [] } = useOrganizationMembers(user?.organization_id);
  const inviteMember = useInviteMember();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { data: auditLogs = [] } = useAuditLogs();

  // Profile form state
  const [name, setName] = useState(user?.name ?? "Juan Pérez");
  const [email, setEmail] = useState("juan@criadero.com");
  const [phone, setPhone] = useState(user?.phone ?? "+57 (604) 555-0182");
  const [role, setRole] = useState(user?.role ?? "Propietario");

  // Org form state
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  // Invite member form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Observador");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
    setRole(user.role);
  }, [user]);

  useEffect(() => {
    if (org) {
      setOrgName(org.name || "");
      setOrgAddress(org.address || "");
      setOrgPhone(org.phone || "");
    }
  }, [org]);

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
          initials:
            name
              .split(" ")
              .map((word) => word[0])
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
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
    }
  };

  return (
    <AppShell>
      <div className="eyebrow">Cuenta</div>
      <h1 className="font-display text-4xl lg:text-5xl mt-2">Configuración</h1>
      <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
        Gestiona tu perfil, configuración del criadero, roles del equipo y preferencias de la plataforma.
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
                <h2 className="font-display text-xl mb-4">Foto de perfil</h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-charcoal font-display text-2xl">
                      {user?.initials ?? "JP"}
                    </div>
                    <button
                      id="change-avatar-btn"
                      className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{user?.name ?? "Juan Pérez"}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {user?.role} · {org?.name || "Criadero Personal"}
                    </p>
                    <button
                      id="upload-photo-btn"
                      className="mt-2 text-[12px] text-primary hover:underline"
                    >
                      Subir nueva foto
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Información personal</h2>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Nombre completo</label>
                    <input
                      className="lux-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      id="settings-name"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Correo electrónico</label>
                    <input
                      type="email"
                      className="lux-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      id="settings-email"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Número de teléfono</label>
                    <input
                      className="lux-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      id="settings-phone"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Rol</label>
                    <select
                      className="lux-select"
                      id="settings-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {["Propietario", "Administrador / Mayordomo", "Veterinario", "Montador", "Jinete", "Palafrenero", "Contador", "Observador"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {saveError && (
                  <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {saveError}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    id="settings-save-profile"
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando
                      </>
                    ) : saved ? (
                      <>
                        <Check className="h-4 w-4" /> Guardado
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Stable/Org ── */}
          {tab === "stable" && (
            <div className="animate-fade-up space-y-6">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Información de la organización</h2>
                <div className="space-y-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Nombre de la Organización / Criadero</label>
                    <input
                      className="lux-input"
                      id="org-name"
                      placeholder="Criadero La Estrella"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Dirección</label>
                    <input
                      className="lux-input"
                      id="org-address"
                      placeholder="Rionegro, Antioquia"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Teléfono</label>
                    <input
                      className="lux-input"
                      id="org-phone"
                      placeholder="+57 (604) 555-0182"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Plan de Suscripción</label>
                    <div className="p-3 bg-secondary/40 rounded-xl font-display text-lg gold-text w-max px-4">
                      {org?.plan || "Starter"}
                    </div>
                  </div>
                </div>
                <button
                  id="settings-save-stable"
                  onClick={async () => {
                    if (user?.organization_id) {
                      await updateOrg.mutateAsync({
                        id: user.organization_id,
                        updates: { name: orgName, address: orgAddress, phone: orgPhone },
                      });
                      setSaved(true);
                      setTimeout(() => setSaved(false), 2000);
                    }
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95"
                >
                  {updateOrg.isPending ? "Guardando..." : saved ? "¡Guardado!" : "Guardar configuración de la organización"}
                </button>
              </div>
            </div>
          )}

          {/* ── Team & Roles ── */}
          {tab === "team" && (
            <div className="animate-fade-up space-y-6">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Miembros del equipo</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Gestiona los usuarios que tienen acceso a los datos de esta organización.
                </p>
                <div className="space-y-3 mb-8">
                  {members.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-xl border border-border/40">
                      <div>
                        <div className="font-medium text-sm">{m.profiles?.name || "Miembro"}</div>
                        <div className="text-[11px] text-muted-foreground">Se unió {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ""}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          className="lux-select !py-1.5 !px-3 text-xs w-[140px]"
                          value={m.role}
                          onChange={(e) => {
                            if (user?.organization_id) {
                              updateMemberRole.mutate({
                                organizationId: user.organization_id,
                                userId: m.user_id,
                                role: e.target.value,
                              });
                            }
                          }}
                          disabled={m.user_id === user?.id}
                        >
                          {["Propietario", "Administrador / Mayordomo", "Veterinario", "Montador", "Jinete", "Palafrenero", "Contador", "Observador"].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                          onClick={() => {
                            if (user?.organization_id) {
                              removeMember.mutate({
                                organizationId: user.organization_id,
                                userId: m.user_id,
                              });
                            }
                          }}
                          disabled={m.user_id === user?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="font-display text-lg mb-3">Invitar nuevo miembro</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="lux-input flex-1"
                    type="email"
                    placeholder="miembro@criadero.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select
                    className="lux-select sm:w-[150px]"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    {["Propietario", "Administrador / Mayordomo", "Veterinario", "Montador", "Jinete", "Palafrenero", "Contador", "Observador"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                    disabled={inviteMember.isPending}
                    onClick={async () => {
                      if (user?.organization_id && inviteEmail) {
                        await inviteMember.mutateAsync({
                          organizationId: user.organization_id,
                          email: inviteEmail,
                          role: inviteRole,
                        });
                        setInviteEmail("");
                      }
                    }}
                  >
                    {inviteMember.isPending ? "Invitando..." : "Invitar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="animate-fade-up">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-5">Preferencias de notificaciones</h2>
                <div className="space-y-1">
                  {[
                    {
                      key: "competitions" as const,
                      label: "Resultados de ferias",
                      description: "Notificaciones de victorias y clasificaciones",
                    },
                    {
                      key: "health" as const,
                      label: "Alertas de sanidad",
                      description: "Visitas veterinarias, recordatorios de vacunación",
                    },
                    {
                      key: "training" as const,
                      label: "Actualizaciones de entrenamiento",
                      description: "Registros de sesiones de montadores",
                    },
                    {
                      key: "farrier" as const,
                      label: "Servicios de herrería",
                      description: "Finalización de citas",
                    },
                    {
                      key: "media" as const,
                      label: "Carga de multimedia",
                      description: "Fotos y videos de tu equipo",
                    },
                    {
                      key: "reminders" as const,
                      label: "Recordatorios",
                      description: "Eventos y labores próximas",
                    },
                    {
                      key: "weekly" as const,
                      label: "Resumen semanal",
                      description: "Resumen de la semana todos los lunes",
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
                <div className="eyebrow !text-primary-foreground/60">Plan actual</div>
                <div className="font-display text-4xl mt-2 gold-text">GaitFlow {org?.plan || "Starter"}</div>
                <p className="text-[14px] text-primary-foreground/70 mt-2">
                  Ejemplares ilimitados · Acceso completo del equipo · Soporte prioritario
                </p>
                <div className="mt-4 inline-flex items-baseline gap-1">
                  <span className="font-display text-3xl">{org?.plan === "Elite" ? "$850k" : org?.plan === "Professional" ? "$649k" : "$249k"}</span>
                  <span className="text-primary-foreground/60 text-sm">/mes</span>
                </div>
              </div>
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Método de pago</h2>
                <div className="flex items-center gap-4 p-4 bg-secondary rounded-2xl">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border text-[10px] font-bold text-muted-foreground">
                    VISA
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">Visa terminada en 4242</p>
                    <p className="text-[12px] text-muted-foreground">Expira 08/2028</p>
                  </div>
                  <button
                    id="update-payment"
                    className="ml-auto text-[13px] text-primary hover:underline"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Audit Logs ── */}
          {tab === "audit" && (
            <div className="animate-fade-up space-y-6">
              <div className="lux-card p-6">
                <h2 className="font-display text-xl mb-4">Registros de Auditoría</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Historial de todas las operaciones de escritura realizadas en esta organización.
                </p>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-widest text-[9px]">
                        <th className="py-2.5">Usuario</th>
                        <th className="py-2.5">Acción</th>
                        <th className="py-2.5">Tabla</th>
                        <th className="py-2.5">ID Registro</th>
                        <th className="py-2.5 text-right">Fecha/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {auditLogs.slice(0, 50).map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/20">
                          <td className="py-3 font-medium">{log.profiles?.name || "Sistema"}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                              log.action === 'INSERT' ? 'bg-green-500/10 text-green-500' :
                              log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>{log.action}</span>
                          </td>
                          <td className="py-3 font-mono">{log.table_name}</td>
                          <td className="py-3 font-mono text-muted-foreground">{log.record_id?.slice(0, 8) || "—"}</td>
                          <td className="py-3 text-right text-muted-foreground">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auditLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Sin operaciones registradas aún.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Danger zone ── */}
          {tab === "danger" && (
            <div className="animate-fade-up">
              <div className="lux-card p-6 border-destructive/30">
                <h2 className="font-display text-xl text-destructive mb-2">Zona de Peligro</h2>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Estas acciones son irreversibles. Procede con precaución.
                </p>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">Eliminar todos los datos</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Eliminar todos los ejemplares, registros y archivos multimedia
                      </p>
                    </div>
                    <button
                      id="delete-data-btn"
                      className="rounded-full border border-destructive text-destructive px-4 py-2 text-[13px] font-medium hover:bg-destructive hover:text-white transition-colors"
                    >
                      Eliminar
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

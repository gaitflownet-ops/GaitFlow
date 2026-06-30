import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  Shield,
  Mail,
  Phone,
  Copy,
  X,
  Check,
  AlertTriangle,
  Loader2,
  UserCog,
  Trash2,
  RefreshCw,
  Clock,
  Plus
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { Modal } from "@/components/modals/Modal";
import { AddTeamModal } from "@/components/modals/AddTeamModal";
import { WorkerProfileModal } from "@/components/modals/WorkerProfileModal";
import { useOrganizationMembers, useUpdateMemberRole, useRemoveMember } from "@/lib/hooks/useOrganization";
import { useInvitations, useCreateInvitation, useRevokeInvitation, getInviteUrl } from "@/lib/hooks/useInvitations";
import { useRolePermissions, useUpdatePermission, useResetPermissions, useSeedAllPermissions } from "@/lib/hooks/usePermissions";
import { useTeams, useDeleteTeam, type FullTeam } from "@/lib/hooks/useTeams";
import { CCC_ROLES, PLATFORM_MODULES, getRoleDefinition, type CccRole } from "@/lib/roles";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [{ title: "Equipo — GaitFlow" }],
  }),
  component: TeamPage,
});

type Tab = "miembros" | "cuadrillas" | "invitaciones" | "permisos";

function TeamPage() {
  const { state } = useApp();
  const user = state.user;
  const orgId = user?.organization_id;
  const isOwner = user?.role === "Owner" || user?.role === "Propietario";

  const [activeTab, setActiveTab] = useState<Tab>("miembros");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-background">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
                Equipo de Trabajo
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestiona los colaboradores de tu criadero, sus roles y permisos.
              </p>
            </div>
            {isOwner && activeTab !== "permisos" && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" /> Invitar Colaborador
              </button>
            )}
          </div>

          <div className="mb-6 flex gap-2 border-b border-border overflow-x-auto pb-1">
            <TabButton active={activeTab === "miembros"} onClick={() => setActiveTab("miembros")}>
              Personal
            </TabButton>
            <TabButton active={activeTab === "cuadrillas"} onClick={() => setActiveTab("cuadrillas")}>
              Cuadrillas y Turnos
            </TabButton>
            {isOwner && (
              <>
                <TabButton active={activeTab === "invitaciones"} onClick={() => setActiveTab("invitaciones")}>
                  Invitaciones Pendientes
                </TabButton>
                <TabButton active={activeTab === "permisos"} onClick={() => setActiveTab("permisos")}>
                  Permisos
                </TabButton>
              </>
            )}
          </div>

          <div className="mt-6">
            {activeTab === "miembros" && <MiembrosTab orgId={orgId} isOwner={isOwner} />}
            {activeTab === "cuadrillas" && <CuadrillasTab orgId={orgId} isOwner={isOwner} />}
            {activeTab === "invitaciones" && isOwner && <InvitacionesTab orgId={orgId} />}
            {activeTab === "permisos" && isOwner && <PermisosTab orgId={orgId} />}
          </div>
        </main>
      </div>

      {isOwner && (
        <InviteModal
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          orgId={orgId}
        />
      )}
    </AppShell>
  );
}

// ─── Componentes Auxiliares ────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Pestaña: Miembros ──────────────────────────────────────────────────────

function MiembrosTab({ orgId, isOwner }: { orgId?: string | null; isOwner: boolean }) {
  const { data: members = [], isLoading } = useOrganizationMembers(orgId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>("");

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const profile = member.profiles || {};
        const roleDef = getRoleDefinition(member.role || "Propietario");
        
        // Render availability tag
        const availability = member.availability_status || 'Available';
        const isAvail = availability === 'Available';
        const isBusy = availability === 'Busy';

        return (
          <div 
            key={member.user_id} 
            className="lux-card p-5 border border-border relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              setSelectedWorkerId(member.user_id);
              setSelectedWorkerName(profile.name || "Usuario");
            }}
          >
            <div className={`absolute top-0 right-0 w-2 h-full ${isAvail ? 'bg-emerald-500' : isBusy ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] font-semibold text-charcoal">
                  {profile.initials || "US"}
                </div>
                <div>
                  <div className="font-medium text-foreground">{profile.name || "Usuario"}</div>
                  {profile.phone && (
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${roleDef.color} ${roleDef.textColor} ${roleDef.borderColor}`}>
                <span>{roleDef.icon}</span> {roleDef.label}
              </div>
              <div className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-1 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-500' : isBusy ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                {availability === 'Available' ? 'Disponible' : availability === 'Busy' ? 'Ocupado' : 'Ausente'}
              </div>
            </div>

            {isOwner && member.role !== "Owner" && member.role !== "Propietario" && (
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("¿Estás seguro de que quieres eliminar a este miembro del equipo?")) {
                      removeMember.mutate({ organizationId: orgId!, userId: member.user_id });
                    }
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors inline-flex items-center gap-1.5 text-sm"
                  title="Eliminar del equipo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>

      <WorkerProfileModal 
        open={!!selectedWorkerId} 
        onClose={() => setSelectedWorkerId(null)}
        userId={selectedWorkerId}
        userName={selectedWorkerName}
      />
    </>
  );
}

// ─── Pestaña: Cuadrillas y Turnos ───────────────────────────────────────────

function CuadrillasTab({ orgId, isOwner }: { orgId?: string | null; isOwner: boolean }) {
  const { data: teams = [], isLoading } = useTeams(orgId);
  const deleteTeam = useDeleteTeam();
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 lux-card border border-border">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">No hay cuadrillas configuradas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Crea cuadrillas operativas para agrupar tu personal y asignar responsables a los ejemplares.
        </p>
        {isOwner && (
          <button 
            onClick={() => setAddTeamModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Crear Cuadrilla
          </button>
        )}
        <AddTeamModal open={addTeamModalOpen} onOpenChange={setAddTeamModalOpen} team={editingTeam} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setEditingTeam(null);
              setAddTeamModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nueva Cuadrilla
          </button>
        </div>
      )}

      <AddTeamModal open={addTeamModalOpen} onOpenChange={(open) => {
        setAddTeamModalOpen(open);
        if (!open) setTimeout(() => setEditingTeam(null), 300);
      }} team={editingTeam} />

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="lux-card border border-border p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  {team.name}
                  {team.is_temporary && (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Temporal
                    </span>
                  )}
                </h3>
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                )}
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTeam(team);
                      setAddTeamModalOpen(true);
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que quieres eliminar esta cuadrilla?")) {
                        deleteTeam.mutate({ id: team.id, orgId: orgId! });
                      }
                    }}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {team.is_temporary && team.destination && (
              <div className="mb-4 bg-secondary/50 rounded-lg p-3 text-xs border border-border">
                <span className="block font-medium text-foreground mb-1">Destino: {team.destination}</span>
                {team.start_date && <span className="text-muted-foreground">Inicia: {new Date(team.start_date).toLocaleDateString()}</span>}
                {team.end_date && <span className="text-muted-foreground ml-3">Finaliza: {new Date(team.end_date).toLocaleDateString()}</span>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Miembros ({team.members.length})
                </h4>
                <div className="space-y-1">
                  {team.members.map(m => (
                    <div key={m.id} className="text-sm flex items-center justify-between">
                      <span className="truncate">{m.profiles?.name || 'Desconocido'}</span>
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                        {m.role || 'Miembro'}
                      </span>
                    </div>
                  ))}
                  {team.members.length === 0 && <span className="text-sm text-muted-foreground italic">Sin miembros</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Turnos ({team.shifts.length})
                </h4>
                <div className="space-y-1">
                  {team.shifts.map(s => (
                    <div key={s.id} className="text-sm flex items-center justify-between">
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                  {team.shifts.length === 0 && <span className="text-sm text-muted-foreground italic">Sin turnos</span>}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                🐴 Matriz de Ejemplares Asignados ({team.horses.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {team.horses.map(h => (
                  <span key={h.id} className="inline-flex items-center text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    {h.horses?.name || 'Ejemplar'}
                  </span>
                ))}
                {team.horses.length === 0 && <span className="text-sm text-muted-foreground italic">Ninguno</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pestaña: Invitaciones ──────────────────────────────────────────────────

function InvitacionesTab({ orgId }: { orgId?: string | null }) {
  const { data: invitations = [], isLoading } = useInvitations(orgId);
  const revoke = useRevokeInvitation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const pendientes = invitations.filter(i => i.status === "pendiente");

  if (pendientes.length === 0) {
    return (
      <div className="text-center py-12 lux-card border border-border">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">No hay invitaciones pendientes</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Las invitaciones que envíes y no hayan sido aceptadas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="lux-card border border-border overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 border-b border-border text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-6 py-3 font-medium">Invitado</th>
            <th className="px-6 py-3 font-medium">Rol Asignado</th>
            <th className="px-6 py-3 font-medium">Expiración</th>
            <th className="px-6 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pendientes.map(inv => {
            const roleDef = getRoleDefinition(inv.role);
            const daysLeft = Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const url = getInviteUrl(inv.token);

            return (
              <tr key={inv.id} className="hover:bg-secondary/20">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{inv.name}</div>
                  <div className="text-muted-foreground text-xs">{inv.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border ${roleDef.color} ${roleDef.textColor} ${roleDef.borderColor}`}>
                    <span>{roleDef.icon}</span> {roleDef.label.split(" / ")[0]}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {daysLeft} días
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        setCopiedId(inv.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {copiedId === inv.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === inv.id ? "Copiado" : "Copiar Enlace"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Revocar esta invitación? El enlace dejará de funcionar.")) {
                          revoke.mutate({ id: inv.id, orgId: orgId! });
                        }
                      }}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Revocar invitación"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pestaña: Permisos ──────────────────────────────────────────────────────

function PermisosTab({ orgId }: { orgId?: string | null }) {
  const [selectedRole, setSelectedRole] = useState<CccRole>("Palafrenero");
  const { data: permissions = [], isLoading } = useRolePermissions(selectedRole, orgId);
  const updatePerm = useUpdatePermission();
  const resetPerms = useResetPermissions();
  const seedPerms = useSeedAllPermissions();

  const handleToggle = (id: string, field: "can_view" | "can_create" | "can_edit" | "can_delete", currentValue: boolean) => {
    updatePerm.mutate({ id, updates: { [field]: !currentValue } });
  };

  const roleDef = getRoleDefinition(selectedRole);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // Si no hay permisos en la base de datos para este rol (primera vez)
  if (permissions.length === 0) {
    return (
      <div className="text-center py-12 lux-card border border-border">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-4">El sistema de permisos no está inicializado</h3>
        <button
          onClick={() => seedPerms.mutate(orgId)}
          disabled={seedPerms.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {seedPerms.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Inicializar Permisos por Defecto
        </button>
      </div>
    );
  }

  return (
    <div className="lux-card border border-border">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/20">
        <div>
          <label className="eyebrow block mb-2">Seleccionar Rol para Editar</label>
          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as CccRole)}
              className={`lux-select text-sm font-medium ${roleDef.textColor} bg-transparent border-border`}
            >
              {CCC_ROLES.filter(r => r.value !== "Propietario").map((r) => (
                <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground hidden sm:block max-w-xs">
              {roleDef.description}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`¿Restablecer los permisos de ${selectedRole} a sus valores predeterminados?`)) {
              resetPerms.mutate({ role: selectedRole, organizationId: orgId });
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Restablecer por Defecto
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Módulo</th>
              <th className="px-6 py-3 font-medium text-center w-24">Ver</th>
              <th className="px-6 py-3 font-medium text-center w-24">Crear</th>
              <th className="px-6 py-3 font-medium text-center w-24">Editar</th>
              <th className="px-6 py-3 font-medium text-center w-24">Borrar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PLATFORM_MODULES.map((mod) => {
              const perm = permissions.find(p => p.module === mod.key);
              if (!perm) return null;

              return (
                <tr key={mod.key} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground flex items-center gap-2">
                    <span className="text-base">{mod.icon}</span> {mod.label}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <PermissionToggle checked={perm.can_view} onChange={() => handleToggle(perm.id, "can_view", perm.can_view)} />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <PermissionToggle checked={perm.can_create} onChange={() => handleToggle(perm.id, "can_create", perm.can_create)} />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <PermissionToggle checked={perm.can_edit} onChange={() => handleToggle(perm.id, "can_edit", perm.can_edit)} />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <PermissionToggle checked={perm.can_delete} onChange={() => handleToggle(perm.id, "can_delete", perm.can_delete)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
        checked ? "bg-emerald-500" : "bg-secondary"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-2" : "-translate-x-2"
        }`}
      />
    </button>
  );
}

// ─── Modal: Invitar Colaborador ─────────────────────────────────────────────

function InviteModal({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId?: string | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CccRole>("Palafrenero");
  
  const createInvite = useCreateInvitation();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    try {
      const result = await createInvite.mutateAsync({
        organization_id: orgId,
        name,
        email,
        phone,
        role,
      });
      
      setCreatedUrl(getInviteUrl(result.token));
    } catch (error: any) {
      console.error(error);
      alert("Error al crear la invitación: " + (error?.message || JSON.stringify(error)));
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("Palafrenero");
    setCreatedUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Invitar Colaborador">
      {!createdUrl ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Generaremos un enlace único que podrás compartir con tu colaborador por WhatsApp o correo.
          </p>
          
          <div>
            <label className="eyebrow block mb-1">Nombre completo</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej. Carlos Pérez"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1">Email (requerido)</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="carlos@correo.com"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Teléfono (opcional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="300..."
              />
            </div>
          </div>
          
          <div>
            <label className="eyebrow block mb-1">Rol Operativo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CccRole)}
              className="lux-select w-full"
            >
              {CCC_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              {getRoleDefinition(role).description}
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createInvite.isPending || !name || !email}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Enlace"}
            </button>
          </div>
        </form>
      ) : (
        <div className="py-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="font-display text-xl mb-2">¡Invitación Creada!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Copia el siguiente enlace y envíaselo a {name}.
          </p>
          
          <div className="flex items-center gap-2 bg-secondary p-2 rounded-xl border border-border mb-6">
            <input 
              readOnly
              value={createdUrl}
              className="flex-1 bg-transparent border-none text-xs text-muted-foreground px-2 focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="shrink-0 bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Hecho
          </button>
        </div>
      )}
    </Modal>
  );
}

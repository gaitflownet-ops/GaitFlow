// ─── Definición Central de Roles CCC ─────────────────────────────────────────
// Módulo D.2 — Gestión Multi-Perfil de Colaboradores
// Caballo Criollo Colombiano (CCC) Industry Roles

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CccRole = 
  | "Propietario" 
  | "Mayordomo"
  | "Palafrenero"
  | "Montador"
  | "Veterinario"
  | "Herrero"
  | "Técnico de Reproducción"
  | "Nutricionista"
  | "Personal de Competencia"
  | "Transportador";

export interface RoleDefinition {
  value: CccRole;
  label: string;
  description: string;
  icon: string;
  color: string;        // Tailwind bg color class
  textColor: string;    // Tailwind text color class
  borderColor: string;  // Tailwind border color class
}

export interface ModuleDefinition {
  key: string;
  label: string;
  icon: string;
}

export interface ModulePermission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

// ─── Roles CCC ───────────────────────────────────────────────────────────────

export const CCC_ROLES: RoleDefinition[] = [
  {
    value: "Propietario",
    label: "Propietario / Administrador",
    description: "Acceso total a todos los módulos. Crea, edita, elimina y configura.",
    icon: "👑",
    color: "bg-amber-500/15",
    textColor: "text-amber-600",
    borderColor: "border-amber-500/30",
  },
  {
    value: "Mayordomo",
    label: "Mayordomo",
    description: "Gestión operativa del criadero, supervisión de personal y ejemplares.",
    icon: "📋",
    color: "bg-zinc-500/15",
    textColor: "text-zinc-600",
    borderColor: "border-zinc-500/30",
  },
  {
    value: "Palafrenero",
    label: "Palafrenero",
    description: "Cuidado básico, alimentación, limpieza y registro en bitácoras diarias.",
    icon: "🧹",
    color: "bg-violet-500/15",
    textColor: "text-violet-600",
    borderColor: "border-violet-500/30",
  },
  {
    value: "Montador",
    label: "Montador",
    description: "Entrenamiento, calendario de ejercicios y preparación deportiva.",
    icon: "🏇",
    color: "bg-emerald-500/15",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500/30",
  },
  {
    value: "Veterinario",
    label: "Veterinario",
    description: "Salud integral, historial médico, tratamientos y emergencias.",
    icon: "🩺",
    color: "bg-blue-500/15",
    textColor: "text-blue-600",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Herrero",
    label: "Herrero",
    description: "Cuidado de cascos, aplomos y herraje ortopédico.",
    icon: "🔨",
    color: "bg-orange-500/15",
    textColor: "text-orange-600",
    borderColor: "border-orange-500/30",
  },
  {
    value: "Técnico de Reproducción",
    label: "Técnico de Reproducción",
    description: "Manejo de saltos, embriones, palpaciones y genealogía.",
    icon: "🧬",
    color: "bg-pink-500/15",
    textColor: "text-pink-600",
    borderColor: "border-pink-500/30",
  },
  {
    value: "Nutricionista",
    label: "Nutricionista",
    description: "Gestión de dietas, suplementos y peso corporal de los ejemplares.",
    icon: "🌾",
    color: "bg-lime-500/15",
    textColor: "text-lime-600",
    borderColor: "border-lime-500/30",
  },
  {
    value: "Personal de Competencia",
    label: "Personal de Competencia",
    description: "Logística y preparación de ejemplares para ferias y exhibiciones.",
    icon: "🏆",
    color: "bg-yellow-500/15",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500/30",
  },
  {
    value: "Transportador",
    label: "Transportador",
    description: "Traslados seguros de ejemplares entre ferias, criaderos y clínicas.",
    icon: "🚛",
    color: "bg-slate-500/15",
    textColor: "text-slate-600",
    borderColor: "border-slate-500/30",
  }
];

// ─── Módulos de la Plataforma ────────────────────────────────────────────────

export const PLATFORM_MODULES: ModuleDefinition[] = [
  { key: "dashboard",     label: "Panel Principal",    icon: "📊" },
  { key: "horses",        label: "Ejemplares",         icon: "🐴" },
  { key: "health",        label: "Salud y Cuidado",    icon: "🏥" },
  { key: "tasks",         label: "Tareas Operativas",  icon: "✅" },
  { key: "nutrition",     label: "Nutrición",          icon: "🥕" },
  { key: "breeding",      label: "Reproducción",       icon: "🧬" },
  { key: "competitions",  label: "Competencias",       icon: "🏆" },
  { key: "financials",    label: "Finanzas",           icon: "💰" },
  { key: "vault",         label: "Documentos",         icon: "📁" },
  { key: "team",          label: "Cuadrillas",         icon: "👥" },
  { key: "marketplace",   label: "Marketplace",        icon: "🛒" },
  { key: "locations",     label: "Instalaciones",      icon: "📍" },
];

// ─── Permisos por Defecto ────────────────────────────────────────────────────

const ALL: ModulePermission    = { can_view: true,  can_create: true,  can_edit: true,  can_delete: true };
const VIEW: ModulePermission   = { can_view: true,  can_create: false, can_edit: false, can_delete: false };
const EDIT: ModulePermission   = { can_view: true,  can_create: false, can_edit: true,  can_delete: false };
const CREATE: ModulePermission = { can_view: true,  can_create: true,  can_edit: true,  can_delete: false };
const NONE: ModulePermission   = { can_view: false, can_create: false, can_edit: false, can_delete: false };

const DEFAULT_PERMISSIONS: Record<CccRole, Record<string, ModulePermission>> = {
  Propietario: {
    dashboard: ALL, horses: ALL, health: ALL, tasks: ALL, nutrition: ALL,
    breeding: ALL, competitions: ALL, financials: ALL, vault: ALL,
    team: ALL, marketplace: ALL, locations: ALL,
  },
  Mayordomo: {
    dashboard: ALL, horses: ALL, health: ALL, tasks: ALL, nutrition: ALL,
    breeding: VIEW, competitions: VIEW, financials: NONE, vault: VIEW,
    team: ALL, marketplace: NONE, locations: ALL,
  },
  Palafrenero: {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: EDIT,
    breeding: NONE, competitions: NONE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: VIEW,
  },
  Montador: {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: NONE,
    breeding: NONE, competitions: VIEW, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: VIEW,
  },
  Veterinario: {
    dashboard: VIEW, horses: VIEW, health: CREATE, tasks: EDIT, nutrition: VIEW,
    breeding: VIEW, competitions: NONE, financials: NONE, vault: VIEW,
    team: VIEW, marketplace: NONE, locations: VIEW,
  },
  Herrero: {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: NONE,
    breeding: NONE, competitions: NONE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: NONE,
  },
  "Técnico de Reproducción": {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: NONE,
    breeding: CREATE, competitions: NONE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: NONE,
  },
  Nutricionista: {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: CREATE,
    breeding: NONE, competitions: NONE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: VIEW,
  },
  "Personal de Competencia": {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: NONE,
    breeding: NONE, competitions: CREATE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: VIEW,
  },
  Transportador: {
    dashboard: VIEW, horses: VIEW, health: NONE, tasks: EDIT, nutrition: NONE,
    breeding: NONE, competitions: NONE, financials: NONE, vault: NONE,
    team: VIEW, marketplace: NONE, locations: VIEW,
  }
};

/**
 * Retorna la matriz de permisos predeterminada para un rol CCC.
 */
export function getDefaultPermissions(role: CccRole): Record<string, ModulePermission> {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.Palafrenero;
}

/**
 * Busca la definición visual de un rol por su valor.
 */
export function getRoleDefinition(role: string): RoleDefinition {
  return CCC_ROLES.find(r => r.value === role) || CCC_ROLES.find(r => r.value === "Palafrenero")!;
}

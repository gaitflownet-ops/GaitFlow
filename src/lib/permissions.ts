// ============================================================
// permissions.ts — GaitFlow RBAC Permission System
// ============================================================
// Centraliza todas las definiciones de roles y permisos.
// Usado por usePermission() y PermissionGuard para decidir
// qué ve y puede hacer cada usuario en la UI.
// ============================================================

/** Roles del sistema, alineados con el ENUM user_role en la DB */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'STABLE_ADMIN'
  | 'VETERINARIAN'
  | 'TRAINER'
  | 'GROOM'
  | 'FARRIER'
  | 'DENTIST';

/** Módulos de la aplicación */
export type Module =
  | 'horses'
  | 'health'
  | 'tasks'
  | 'financial'
  | 'documents'
  | 'marketplace'
  | 'breeding'
  | 'users'
  | 'nutrition'
  | 'locations'
  | 'competitions';

/** Acciones posibles sobre un módulo */
export type Action = 'read' | 'create' | 'update' | 'delete';

/** Jerarquía de roles (menor número = más privilegios) */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN:   0,
  OWNER:         1,
  STABLE_ADMIN:  2,
  VETERINARIAN:  3,
  TRAINER:       4,
  FARRIER:       5,
  DENTIST:       5,
  GROOM:         6,
};

/** Roles que requieren MFA obligatorio */
export const MFA_REQUIRED_ROLES: UserRole[] = ['OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN'];

/** Roles que pueden acceder a la sección de administración */
export const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'OWNER', 'STABLE_ADMIN'];

/** Matriz de permisos frontend — espejo de role_permissions en la DB */
type PermissionMatrix = Record<UserRole, Partial<Record<Module, Record<Action, boolean>>>>;

export const PERMISSION_MATRIX: PermissionMatrix = {
  SUPER_ADMIN: {
    horses:      { read: true, create: true, update: true, delete: true },
    health:      { read: true, create: true, update: true, delete: true },
    tasks:       { read: true, create: true, update: true, delete: true },
    financial:   { read: true, create: true, update: true, delete: true },
    documents:   { read: true, create: true, update: true, delete: true },
    marketplace: { read: true, create: true, update: true, delete: true },
    breeding:    { read: true, create: true, update: true, delete: true },
    users:       { read: true, create: true, update: true, delete: true },
    nutrition:   { read: true, create: true, update: true, delete: true },
    locations:   { read: true, create: true, update: true, delete: true },
    competitions:{ read: true, create: true, update: true, delete: true },
  },
  OWNER: {
    horses:      { read: true, create: true, update: true, delete: true },
    health:      { read: true, create: true, update: true, delete: true },
    tasks:       { read: true, create: true, update: true, delete: true },
    financial:   { read: true, create: true, update: true, delete: true },
    documents:   { read: true, create: true, update: true, delete: true },
    marketplace: { read: true, create: true, update: true, delete: true },
    breeding:    { read: true, create: true, update: true, delete: true },
    users:       { read: true, create: true, update: true, delete: true },
    nutrition:   { read: true, create: true, update: true, delete: true },
    locations:   { read: true, create: true, update: true, delete: true },
    competitions:{ read: true, create: true, update: true, delete: true },
  },
  STABLE_ADMIN: {
    horses:      { read: true, create: true, update: true, delete: true },
    health:      { read: true, create: true, update: true, delete: true },
    tasks:       { read: true, create: true, update: true, delete: true },
    financial:   { read: true, create: true, update: false, delete: false },
    documents:   { read: true, create: true, update: true, delete: true },
    marketplace: { read: true, create: true, update: true, delete: false },
    breeding:    { read: true, create: true, update: true, delete: false },
    users:       { read: true, create: true, update: true, delete: false },
    nutrition:   { read: true, create: true, update: true, delete: false },
    locations:   { read: true, create: true, update: true, delete: false },
    competitions:{ read: true, create: true, update: true, delete: false },
  },
  VETERINARIAN: {
    horses:      { read: true,  create: false, update: false, delete: false },
    health:      { read: true,  create: true,  update: true,  delete: false },
    tasks:       { read: true,  create: false, update: true,  delete: false },
    financial:   { read: false, create: false, update: false, delete: false },
    documents:   { read: true,  create: true,  update: false, delete: false },
    marketplace: { read: false, create: false, update: false, delete: false },
    breeding:    { read: true,  create: true,  update: true,  delete: false },
    users:       { read: false, create: false, update: false, delete: false },
    nutrition:   { read: true,  create: false, update: false, delete: false },
    locations:   { read: true,  create: false, update: false, delete: false },
    competitions:{ read: true,  create: false, update: false, delete: false },
  },
  TRAINER: {
    horses:      { read: true,  create: false, update: false, delete: false },
    health:      { read: true,  create: false, update: false, delete: false },
    tasks:       { read: true,  create: false, update: true,  delete: false },
    financial:   { read: false, create: false, update: false, delete: false },
    documents:   { read: false, create: false, update: false, delete: false },
    marketplace: { read: false, create: false, update: false, delete: false },
    breeding:    { read: false, create: false, update: false, delete: false },
    users:       { read: false, create: false, update: false, delete: false },
    nutrition:   { read: true,  create: false, update: false, delete: false },
    locations:   { read: true,  create: false, update: false, delete: false },
    competitions:{ read: true,  create: true,  update: true,  delete: false },
  },
  GROOM: {
    horses:      { read: true,  create: false, update: false, delete: false },
    health:      { read: false, create: false, update: false, delete: false },
    tasks:       { read: true,  create: false, update: true,  delete: false },
    financial:   { read: false, create: false, update: false, delete: false },
    documents:   { read: false, create: false, update: false, delete: false },
    marketplace: { read: false, create: false, update: false, delete: false },
    breeding:    { read: false, create: false, update: false, delete: false },
    users:       { read: false, create: false, update: false, delete: false },
    nutrition:   { read: true,  create: false, update: false, delete: false },
    locations:   { read: true,  create: false, update: false, delete: false },
    competitions:{ read: false, create: false, update: false, delete: false },
  },
  FARRIER: {
    horses:      { read: true,  create: false, update: false, delete: false },
    health:      { read: true,  create: true,  update: true,  delete: false },
    tasks:       { read: true,  create: false, update: true,  delete: false },
    financial:   { read: false, create: false, update: false, delete: false },
    documents:   { read: false, create: false, update: false, delete: false },
    marketplace: { read: false, create: false, update: false, delete: false },
    breeding:    { read: false, create: false, update: false, delete: false },
    users:       { read: false, create: false, update: false, delete: false },
    nutrition:   { read: false, create: false, update: false, delete: false },
    locations:   { read: true,  create: false, update: false, delete: false },
    competitions:{ read: false, create: false, update: false, delete: false },
  },
  DENTIST: {
    horses:      { read: true,  create: false, update: false, delete: false },
    health:      { read: true,  create: true,  update: true,  delete: false },
    tasks:       { read: true,  create: false, update: true,  delete: false },
    financial:   { read: false, create: false, update: false, delete: false },
    documents:   { read: false, create: false, update: false, delete: false },
    marketplace: { read: false, create: false, update: false, delete: false },
    breeding:    { read: false, create: false, update: false, delete: false },
    users:       { read: false, create: false, update: false, delete: false },
    nutrition:   { read: false, create: false, update: false, delete: false },
    locations:   { read: true,  create: false, update: false, delete: false },
    competitions:{ read: false, create: false, update: false, delete: false },
  },
};

/**
 * Verifica si un rol tiene permiso para realizar una acción en un módulo.
 * Función pura — puede usarse fuera de React.
 */
export function checkPermission(
  role: UserRole | null | undefined,
  module: Module,
  action: Action,
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true; // Acceso total sin restricciones
  return PERMISSION_MATRIX[role]?.[module]?.[action] ?? false;
}

/**
 * Verifica si un rol es mayor o igual en jerarquía que el rol mínimo requerido.
 */
export function hasMinimumRole(
  userRole: UserRole | null | undefined,
  minimumRole: UserRole,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[minimumRole];
}

/**
 * Verifica si el rol requiere MFA obligatorio.
 */
export function requiresMFA(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return MFA_REQUIRED_ROLES.includes(role);
}

/**
 * Etiquetas legibles para cada rol (para uso en la UI).
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:   'Super Admin',
  OWNER:         'Owner',
  STABLE_ADMIN:  'Stable Admin',
  VETERINARIAN:  'Veterinarian',
  TRAINER:       'Trainer',
  GROOM:         'Groom',
  FARRIER:       'Farrier',
  DENTIST:       'Dentist',
};

/**
 * Colores de badge para cada rol (para uso en la UI).
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN:   'oklch(0.55 0.18 30)',   // Rojo
  OWNER:         'oklch(0.65 0.18 55)',   // Dorado
  STABLE_ADMIN:  'oklch(0.55 0.15 240)',  // Azul
  VETERINARIAN:  'oklch(0.55 0.15 160)',  // Verde
  TRAINER:       'oklch(0.55 0.15 280)',  // Púrpura
  GROOM:         'oklch(0.55 0.1 220)',   // Azul claro
  FARRIER:       'oklch(0.55 0.12 35)',   // Naranja
  DENTIST:       'oklch(0.55 0.12 195)',  // Cian
};

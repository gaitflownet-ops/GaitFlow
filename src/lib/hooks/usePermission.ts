// ============================================================
// usePermission.ts — GaitFlow Permission Hook
// ============================================================
// Hook React que verifica si el usuario actual tiene permiso
// para realizar una acción en un módulo dado.
// Se integra con el AppStore para obtener el rol del usuario.
// ============================================================

import { useCallback } from 'react';
import { useApp } from '@/lib/store';
import {
  checkPermission,
  hasMinimumRole,
  type Module,
  type Action,
  type UserRole,
} from '@/lib/permissions';

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook que expone métodos de verificación de permisos
 * basados en el rol del usuario autenticado actual.
 *
 * @example
 * ```tsx
 * const { can, isOwner, isAdmin } = usePermission();
 *
 * // Verificar permiso específico
 * if (can('horses', 'delete')) { ... }
 *
 * // Verificar jerarquía mínima
 * if (isAtLeast('STABLE_ADMIN')) { ... }
 * ```
 */
export function usePermission() {
  const { state } = useApp();
  const role = (state.user?.user_role ?? null) as UserRole | null;

  /**
   * Verifica si el usuario puede realizar `action` en `module`.
   */
  const can = useCallback(
    (module: Module, action: Action): boolean => {
      return checkPermission(role, module, action);
    },
    [role],
  );

  /**
   * Verifica si el usuario tiene al menos el nivel de rol especificado.
   * Ejemplo: isAtLeast('STABLE_ADMIN') retorna true para OWNER, STABLE_ADMIN y SUPER_ADMIN.
   */
  const isAtLeast = useCallback(
    (minimumRole: UserRole): boolean => {
      return hasMinimumRole(role, minimumRole);
    },
    [role],
  );

  /**
   * Verifica múltiples permisos a la vez.
   * Retorna true solo si TODOS los permisos son válidos.
   */
  const canAll = useCallback(
    (checks: Array<{ module: Module; action: Action }>): boolean => {
      return checks.every(({ module, action }) => checkPermission(role, module, action));
    },
    [role],
  );

  /**
   * Verifica múltiples permisos a la vez.
   * Retorna true si AL MENOS UNO de los permisos es válido.
   */
  const canAny = useCallback(
    (checks: Array<{ module: Module; action: Action }>): boolean => {
      return checks.some(({ module, action }) => checkPermission(role, module, action));
    },
    [role],
  );

  // Shortcuts de roles comunes
  const isSuperAdmin   = role === 'SUPER_ADMIN';
  const isOwner        = role === 'OWNER' || isSuperAdmin;
  const isAdmin        = isOwner || role === 'STABLE_ADMIN';
  const isVet          = role === 'VETERINARIAN';
  const isTrainer      = role === 'TRAINER';
  const isGroom        = role === 'GROOM';
  const isFarrier      = role === 'FARRIER';
  const isDentist      = role === 'DENTIST';
  const isAuthenticated = state.isAuthenticated;
  const userRole       = role;
  const stableId       = state.user?.stable_id ?? null;

  return {
    can,
    canAll,
    canAny,
    isAtLeast,
    isSuperAdmin,
    isOwner,
    isAdmin,
    isVet,
    isTrainer,
    isGroom,
    isFarrier,
    isDentist,
    isAuthenticated,
    userRole,
    stableId,
  };
}

export type UsePermissionReturn = ReturnType<typeof usePermission>;

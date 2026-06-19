// ============================================================
// PermissionGuard.tsx — GaitFlow UI Access Control Component
// ============================================================
// Componente que envuelve secciones de la UI para bloquear
// el acceso visual a usuarios sin los permisos necesarios.
//
// Uso:
//   <PermissionGuard module="financial" action="read">
//     <FinancialDashboard />
//   </PermissionGuard>
//
//   <PermissionGuard role="OWNER">
//     <DeleteStableButton />
//   </PermissionGuard>
// ============================================================

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';
import type { Module, Action, UserRole } from '@/lib/permissions';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PermissionGuardProps =
  | {
      /** Verifica permiso: el usuario necesita poder hacer `action` en `module` */
      module: Module;
      action: Action;
      role?: never;
      minimumRole?: never;
      children: ReactNode;
      /** Componente alternativo a mostrar si no tiene permiso (default: null) */
      fallback?: ReactNode;
      /** Si true, muestra un mensaje de acceso denegado en lugar de null */
      showDenied?: boolean;
    }
  | {
      /** Verifica rol exacto */
      role: UserRole | UserRole[];
      module?: never;
      action?: never;
      minimumRole?: never;
      children: ReactNode;
      fallback?: ReactNode;
      showDenied?: boolean;
    }
  | {
      /** Verifica jerarquía mínima de rol */
      minimumRole: UserRole;
      module?: never;
      action?: never;
      role?: never;
      children: ReactNode;
      fallback?: ReactNode;
      showDenied?: boolean;
    };

// ─── Componente de Acceso Denegado ────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/30 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
        <Lock className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Access Restricted</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You don't have permission to view this section.
          Contact your Stable Admin if you need access.
        </p>
      </div>
    </div>
  );
}

// ─── PermissionGuard ─────────────────────────────────────────────────────────

/**
 * Bloquea el renderizado de `children` si el usuario no tiene permiso.
 *
 * @example
 * // Basado en permiso de módulo
 * <PermissionGuard module="financial" action="read">
 *   <RevenueChart />
 * </PermissionGuard>
 *
 * @example
 * // Basado en rol exacto
 * <PermissionGuard role={['OWNER', 'STABLE_ADMIN']}>
 *   <ManageUsersButton />
 * </PermissionGuard>
 *
 * @example
 * // Basado en jerarquía mínima
 * <PermissionGuard minimumRole="STABLE_ADMIN">
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * @example
 * // Con mensaje de acceso denegado visible
 * <PermissionGuard module="documents" action="delete" showDenied>
 *   <DeleteDocumentButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  fallback = null,
  showDenied = false,
  ...props
}: PermissionGuardProps) {
  const { can, isAtLeast, userRole } = usePermission();

  let hasAccess = false;

  if ('module' in props && props.module) {
    // Verificación por módulo + acción
    hasAccess = can(props.module, props.action!);
  } else if ('role' in props && props.role) {
    // Verificación por rol exacto
    const roles = Array.isArray(props.role) ? props.role : [props.role];
    hasAccess = userRole !== null && roles.includes(userRole);
  } else if ('minimumRole' in props && props.minimumRole) {
    // Verificación por jerarquía mínima
    hasAccess = isAtLeast(props.minimumRole);
  }

  if (!hasAccess) {
    if (showDenied) return <AccessDenied />;
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
}

// ─── HOC: withPermission ─────────────────────────────────────────────────────

/**
 * Higher-Order Component que envuelve un componente con un guard de permiso.
 *
 * @example
 * const ProtectedChart = withPermission(RevenueChart, 'financial', 'read');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  module: Module,
  action: Action,
  fallback?: ReactNode,
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard module={module} action={action} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

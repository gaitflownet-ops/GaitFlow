import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";
import type { Database } from "../supabase.types";
import { getDefaultPermissions, PLATFORM_MODULES, type CccRole } from "../roles";

export type Permission = Database["public"]["Tables"]["permissions"]["Row"];

export function usePermissions() {
  const { state } = useApp();
  const role = state.user?.role || "Viewer";
  const orgId = state.user?.organization_id || null;

  return useQuery<Permission[]>({
    queryKey: ["permissions", role, orgId],
    queryFn: async () => {
      // Query permissions matching the role.
      // We look for tenant-specific overrides OR global defaults (organization_id IS NULL)
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .eq("role", role);

      if (error) throw error;

      // Filter: if there is a tenant override for this module, prefer it over the global default (null)
      const permissionsList = data as Permission[];
      const filtered: Permission[] = [];
      const modules = Array.from(new Set(permissionsList.map((p) => p.module)));

      for (const mod of modules) {
        const modPerms = permissionsList.filter((p) => p.module === mod);
        const tenantSpecific = modPerms.find((p) => p.organization_id === orgId);
        const globalDefault = modPerms.find((p) => p.organization_id === null);
        
        if (tenantSpecific) {
          filtered.push(tenantSpecific);
        } else if (globalDefault) {
          filtered.push(globalDefault);
        }
      }

      return filtered;
    },
    enabled: !!state.user,
  });
}

export function useHasPermission(module: string, action: "view" | "create" | "edit" | "delete") {
  const { data: permissions = [], isLoading } = usePermissions();
  const { state } = useApp();

  // If user is Owner, they always have all permissions
  if (state.user?.role === "Owner" || state.user?.role === "Propietario") {
    return { hasPermission: true, isLoading: false };
  }

  const modulePerm = permissions.find((p) => p.module === module);
  if (!modulePerm) {
    // Default to false for security, unless it's a viewer view
    return { hasPermission: false, isLoading };
  }

  let hasPermission = false;
  if (action === "view") hasPermission = modulePerm.can_view;
  else if (action === "create") hasPermission = modulePerm.can_create;
  else if (action === "edit") hasPermission = modulePerm.can_edit;
  else if (action === "delete") hasPermission = modulePerm.can_delete;

  return { hasPermission, isLoading };
}

// ─── Hooks de Edición de Permisos (D.2) ──────────────────────────────────────

/**
 * Obtiene los permisos de un rol específico para el panel de edición.
 */
export function useRolePermissions(role?: string, orgId?: string | null) {
  return useQuery<Permission[]>({
    queryKey: ["role-permissions", role, orgId],
    queryFn: async () => {
      if (!role) return [];
      let query = supabase
        .from("permissions")
        .select("*")
        .eq("role", role);
        
      if (orgId) {
        query = query.eq("organization_id", orgId);
      } else {
        query = query.is("organization_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!role,
  });
}

/**
 * Actualiza un permiso individual (un toggle en la grilla).
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Permission, "can_view" | "can_create" | "can_edit" | "can_delete">>;
    }) => {
      const { data, error } = await (supabase.from("permissions") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}

/**
 * Restaura los permisos predeterminados de un rol.
 * Elimina los registros existentes y crea nuevos basados en la matriz CCC.
 */
export function useResetPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, organizationId }: { role: CccRole; organizationId?: string | null }) => {
      const defaults = getDefaultPermissions(role);

      // Eliminar permisos actuales para este rol
      await (supabase.from("permissions") as any)
        .delete()
        .eq("role", role);

      // Insertar permisos por defecto
      const inserts = PLATFORM_MODULES.map(mod => ({
        role,
        module: mod.key,
        can_view: defaults[mod.key]?.can_view ?? false,
        can_create: defaults[mod.key]?.can_create ?? false,
        can_edit: defaults[mod.key]?.can_edit ?? false,
        can_delete: defaults[mod.key]?.can_delete ?? false,
        organization_id: organizationId || null,
      }));

      const { error } = await (supabase.from("permissions") as any).insert(inserts);
      if (error) throw error;

      return { role, count: inserts.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}

/**
 * Inserta permisos masivos para todos los roles CCC.
 * Usado para la semilla inicial de datos.
 */
export function useSeedAllPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId?: string | null) => {
      const roles: CccRole[] = ["Propietario", "Veterinario", "Montador", "Herrador", "Palafrenero"];
      const allInserts: any[] = [];

      for (const role of roles) {
        const defaults = getDefaultPermissions(role);
        for (const mod of PLATFORM_MODULES) {
          allInserts.push({
            role,
            module: mod.key,
            can_view: defaults[mod.key]?.can_view ?? false,
            can_create: defaults[mod.key]?.can_create ?? false,
            can_edit: defaults[mod.key]?.can_edit ?? false,
            can_delete: defaults[mod.key]?.can_delete ?? false,
            organization_id: organizationId || null,
          });
        }
      }

      const { error } = await (supabase.from("permissions") as any).insert(allInserts);
      if (error) throw error;

      return { count: allInserts.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  token: string;
  status: "pendiente" | "aceptada" | "revocada" | "expirada";
  expires_at: string;
  accepted_by: string | null;
  created_at: string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las invitaciones de una organización.
 */
export function useInvitations(orgId?: string | null) {
  return useQuery<Invitation[]>({
    queryKey: ["invitations", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase.from("invitations") as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Auto-marcar como expiradas las que ya pasaron su fecha
      const now = new Date();
      return (data as Invitation[]).map(inv => ({
        ...inv,
        status: inv.status === "pendiente" && new Date(inv.expires_at) < now
          ? "expirada" as const
          : inv.status,
      }));
    },
    enabled: !!orgId,
  });
}

/**
 * Crea una nueva invitación con token único y expiración a 7 días.
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organization_id: string;
      email: string;
      name: string;
      phone?: string;
      role: string;
    }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await (supabase.from("invitations") as any)
        .insert({
          organization_id: input.organization_id,
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          role: input.role,
          status: "pendiente",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Invitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", variables.organization_id] });
    },
  });
}

/**
 * Revoca una invitación pendiente.
 */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { data, error } = await (supabase.from("invitations") as any)
        .update({ status: "revocada" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", variables.orgId] });
    },
  });
}

/**
 * Acepta una invitación validando el token.
 * Retorna los datos de la invitación para el proceso de registro.
 */
export function useValidateInvitation(token?: string) {
  return useQuery<Invitation | null>({
    queryKey: ["invitation-validate", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await (supabase.from("invitations") as any)
        .select("*")
        .eq("token", token)
        .eq("status", "pendiente")
        .single();

      if (error) return null;

      const invitation = data as Invitation;
      // Verificar expiración
      if (new Date(invitation.expires_at) < new Date()) {
        return null;
      }
      return invitation;
    },
    enabled: !!token,
  });
}

/**
 * Marca una invitación como aceptada y vincula al usuario con la organización.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, userId, orgId, role }: {
      invitationId: string;
      userId: string;
      orgId: string;
      role: string;
    }) => {
      // 1. Marcar invitación como aceptada
      await (supabase.from("invitations") as any)
        .update({ status: "aceptada", accepted_by: userId })
        .eq("id", invitationId);

      // 2. Agregar al usuario como miembro de la organización
      const { error: memberError } = await (supabase.from("organization_members") as any)
        .upsert({
          organization_id: orgId,
          user_id: userId,
          role: role,
        });

      if (memberError) throw memberError;

      // 3. Actualizar el perfil del usuario con el rol y la organización
      await (supabase.from("profiles") as any)
        .update({
          role: role,
          organization_id: orgId,
        })
        .eq("id", userId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

/**
 * Genera la URL completa de invitación para compartir.
 */
export function getInviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgMember = Database["public"]["Tables"]["organization_members"]["Row"];

export function useOrganization(orgId?: string | null) {
  return useQuery<Organization | null>({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Database["public"]["Tables"]["organizations"]["Update"]>;
    }) => {
      const { data, error } = await (supabase.from("organizations") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization", variables.id] });
    },
  });
}

export function useOrganizationMembers(orgId?: string | null) {
  return useQuery<any[]>({
    queryKey: ["organization-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      // Join organization_members with profiles to get user names and emails
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          organization_id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            name,
            phone,
            initials
          )
        `)
        .eq("organization_id", orgId);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      email,
      role,
    }: {
      organizationId: string;
      email: string;
      role: string;
    }) => {
      // Insert in the real 'invitations' table
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

      const { data, error } = await (supabase.from("invitations") as any)
        .insert({
          organization_id: organizationId,
          email,
          name: email.split("@")[0],
          role: role,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ["organization-invitations", variables.organizationId] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      userId,
      role,
    }: {
      organizationId: string;
      userId: string;
      role: string;
    }) => {
      const { data, error } = await (supabase.from("organization_members") as any)
        .update({ role })
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", variables.organizationId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      userId,
    }: {
      organizationId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", organizationId)
        .eq("user_id", userId);

      if (error) throw error;
      return { organizationId, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", data.organizationId] });
    },
  });
}

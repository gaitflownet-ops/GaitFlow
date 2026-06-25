import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type ActivityItem = Database["public"]["Tables"]["activities"]["Row"];
export type AuditLogItem = Database["public"]["Tables"]["audit_logs"]["Row"];

export function useActivities() {
  return useQuery<any[]>({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          profiles:user_id (
            name,
            initials
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newActivity: Omit<Database["public"]["Tables"]["activities"]["Insert"], "organization_id" | "user_id">) => {
      // Get the logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const payload = {
        ...newActivity,
        user_id: user.id,
      };

      const { data, error } = await (supabase.from("activities") as any)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useAuditLogs() {
  return useQuery<any[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          profiles:user_id (
            name,
            initials
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

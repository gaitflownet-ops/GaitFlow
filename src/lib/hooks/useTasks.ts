import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";
import { useApp } from "../store";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export function useTasks(farmId?: string, orgId?: string | null) {
  const { state } = useApp();
  const activeOrgId = orgId || state.user?.organization_id;

  return useQuery({
    queryKey: ["tasks", farmId, activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      let query = (supabase.from("tasks") as any).select(`
        *,
        horses ( name ),
        profiles:assignee_id ( name )
      `).eq("organization_id", activeOrgId);
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data as (Task & {
        horses: { name: string } | null;
        profiles: { name: string } | null;
      })[];
    },
    enabled: true,
  });
}

// Hook to activate Realtime Subscriptions on the tasks table
export function useTasksSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("Realtime Task Change received:", payload);
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Database["public"]["Tables"]["tasks"]["Insert"]) => {
      const { data, error } = await (supabase.from("tasks") as any)
        .insert([task])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Database["public"]["Tables"]["tasks"]["Update"] & { id: string }) => {
      const { data, error } = await (supabase.from("tasks") as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("tasks") as any).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

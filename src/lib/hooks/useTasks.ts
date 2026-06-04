import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

export interface Task {
  id: string;
  farm_id: string;
  horse_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  recurrence: string | null;
  notes: string | null;
}

export function useTasks(farmId?: string) {
  return useQuery({
    queryKey: ["tasks", farmId],
    queryFn: async () => {
      let query = supabase.from("tasks").select(`
        *,
        horses ( name ),
        profiles:assignee_id ( name )
      `);
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data as (Task & { horses: { name: string } | null; profiles: { name: string } | null })[];
    },
    enabled: true,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
      const { data, error } = await (supabase.from("tasks") as any).insert([task as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await (supabase.from("tasks") as any).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

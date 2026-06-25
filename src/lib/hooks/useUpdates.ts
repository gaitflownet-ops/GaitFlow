import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Update = Database["public"]["Tables"]["updates"]["Row"];

export function useUpdates(horseId?: string) {
  return useQuery<Update[]>({
    queryKey: ["updates", horseId],
    queryFn: async () => {
      let query = (supabase.from("updates") as any).select("*").order("created_at", { ascending: false });

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Update[];
    },
  });
}

export function useCreateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUpdate: Database["public"]["Tables"]["updates"]["Insert"]) => {
      const { data, error } = await (supabase.from("updates") as any)
        .insert([newUpdate])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      if (variables.horse_id) {
        try {
          await (supabase.from("horses") as any)
            .update({ latest_achievement: variables.title } as any)
            .eq("id", variables.horse_id);
        } catch (err) {
          console.error("Failed to auto-update horse latest achievement:", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["updates"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["updates", variables.horse_id] });
        queryClient.invalidateQueries({ queryKey: ["horse", variables.horse_id] });
      }
    },
  });
}

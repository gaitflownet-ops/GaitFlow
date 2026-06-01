import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Update = Database["public"]["Tables"]["updates"]["Row"];

export function useUpdates(horseId?: string) {
  return useQuery<Update[]>({
    queryKey: ["updates", horseId],
    queryFn: async () => {
      let query = supabase.from("updates").select("*").order("created_at", { ascending: false });

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
      const { data, error } = await (supabase.from("updates") as any).insert(newUpdate).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["updates", variables.horse_id] });
      }
    },
  });
}

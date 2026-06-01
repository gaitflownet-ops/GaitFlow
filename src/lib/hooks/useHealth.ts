import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type HealthRecord = Database["public"]["Tables"]["health_records"]["Row"];

export function useHealthRecords(horseId?: string) {
  return useQuery<HealthRecord[]>({
    queryKey: ["health_records", horseId],
    queryFn: async () => {
      let query = supabase.from("health_records").select("*").order("date", { ascending: false });

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Database["public"]["Tables"]["health_records"]["Insert"]) => {
      const { data, error } = await (supabase.from("health_records") as any)
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["health_records", variables.horse_id] });
      }
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Competition = Database["public"]["Tables"]["competitions"]["Row"];

export function useCompetitions(horseId?: string) {
  return useQuery<Competition[]>({
    queryKey: ["competitions", horseId],
    queryFn: async () => {
      let query = supabase.from("competitions").select("*").order("date", { ascending: false });

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Competition[];
    },
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();

  return useMutation<Competition, Error, Database["public"]["Tables"]["competitions"]["Insert"]>({
    mutationFn: async (newComp: Database["public"]["Tables"]["competitions"]["Insert"]) => {
      const { data, error } = await supabase.from("competitions").insert(newComp).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["competitions", variables.horse_id] });
      }
    },
  });
}

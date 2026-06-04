import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

export interface Location {
  id: string;
  farm_id: string;
  name: string;
  type: string;
  capacity: number | null;
  status: string | null;
  notes: string | null;
}

export function useLocations(farmId?: string) {
  return useQuery({
    queryKey: ["locations", farmId],
    queryFn: async () => {
      let query = supabase.from("locations").select("*");
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return data as Location[];
    },
    enabled: true,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: Omit<Location, "id">) => {
      const { data, error } = await (supabase.from("locations") as any).insert([location as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

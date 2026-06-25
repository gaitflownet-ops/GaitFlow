import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Farm = Database["public"]["Tables"]["farms"]["Row"];

export const mapFarmImageFallback = (f: Farm): Farm => {
  if (f.cover_image_url?.startsWith('/src/assets/')) {
    f.cover_image_url = f.cover_image_url.replace('/src/assets/', '/media/');
  }
  return f;
};

export function useFarms() {
  return useQuery<Farm[]>({
    queryKey: ["farms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Farm[]).map(mapFarmImageFallback);
    },
  });
}

export function useFarm(slugOrId: string) {
  return useQuery<Farm>({
    queryKey: ["farm", slugOrId],
    queryFn: async () => {
      const { data: farmBySlug, error } = await supabase
        .from("farms")
        .select("*")
        .eq("slug", slugOrId)
        .single();
      let data = farmBySlug;

      if (error && error.code === "PGRST116") {
        const { data: byIdData, error: byIdError } = await supabase
          .from("farms")
          .select("*")
          .eq("id", slugOrId)
          .single();
        if (byIdError) throw byIdError;
        data = byIdData;
      } else if (error) {
        throw error;
      }

      return mapFarmImageFallback(data as unknown as Farm);
    },
    enabled: !!slugOrId,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farm: Omit<Database["public"]["Tables"]["farms"]["Insert"], "id">) => {
      const { data, error } = await (supabase as any)
        .from("farms")
        .insert([farm as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

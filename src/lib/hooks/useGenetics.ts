import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type GeneticItem = Database["public"]["Tables"]["genetics_inventory"]["Row"];

export function useGenetics() {
  return useQuery<GeneticItem[]>({
    queryKey: ["genetics"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("genetics_inventory") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as GeneticItem[]).map((g) => {
        if (g.image_url?.startsWith('/src/assets/')) {
          g.image_url = g.image_url.replace('/src/assets/', '/media/');
        }
        return g;
      });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type GeneticItem = Database["public"]["Tables"]["genetics"]["Row"];

export function useGenetics() {
  return useQuery<GeneticItem[]>({
    queryKey: ["genetics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genetics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneticItem[];
    },
  });
}

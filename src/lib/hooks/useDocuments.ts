import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Document = Database["public"]["Tables"]["documents"]["Row"];

export function useDocuments(horseId?: string) {
  return useQuery<Document[]>({
    queryKey: ["documents", horseId],
    queryFn: async () => {
      if (!horseId) return [];
      
      const { data, error } = await (supabase
        .from("documents") as any)
        .select("*")
        .eq("horse_id", horseId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("relation \"documents\" does not exist")) {
          return [];
        }
        throw error;
      }
      return data as Document[];
    },
    enabled: !!horseId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDoc: Database["public"]["Tables"]["documents"]["Insert"]) => {
      const { data, error } = await (supabase.from("documents") as any)
        .insert([newDoc])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["documents", variables.horse_id] });
      }
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, horseId }: { id: string; horseId: string }) => {
      const { error } = await (supabase.from("documents") as any).delete().eq("id", id);
      if (error) throw error;
      return { id, horseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", data.horseId] });
    },
  });
}

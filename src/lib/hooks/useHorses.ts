import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Horse = Database["public"]["Tables"]["horses"]["Row"];

export function useHorses() {
  return useQuery<Horse[]>({
    queryKey: ["horses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Horse[];
    },
  });
}

export function useHorse(slugOrId: string) {
  return useQuery<Horse>({
    queryKey: ["horse", slugOrId],
    queryFn: async () => {
      // Try to fetch by slug first, then ID
      const { data: horseBySlug, error } = await supabase
        .from("horses")
        .select("*")
        .eq("slug", slugOrId)
        .single();
      let data = horseBySlug;

      if (error && error.code === "PGRST116") {
        const { data: byIdData, error: byIdError } = await supabase
          .from("horses")
          .select("*")
          .eq("id", slugOrId)
          .single();
        if (byIdError) throw byIdError;
        data = byIdData;
      } else if (error) {
        throw error;
      }

      return data as unknown as Horse;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newHorse: Database["public"]["Tables"]["horses"]["Insert"]) => {
      const { data, error } = await (supabase.from("horses") as any).insert(newHorse).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useUpdateHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Database["public"]["Tables"]["horses"]["Update"];
    }) => {
      const { data, error } = await (supabase.from("horses") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (horse: any) => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse", horse?.slug] });
      queryClient.invalidateQueries({ queryKey: ["horse", horse?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useDeleteHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("horses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

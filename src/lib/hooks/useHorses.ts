import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";
import { horses as mockHorses } from "../data";

export type Horse = Database["public"]["Tables"]["horses"]["Row"];

export const mapHorseImageFallback = (h: Horse): Horse => {
  if (h.name) {
    const nameLower = h.name.toLowerCase();
    if (nameLower.includes("carbonero")) {
      if (!h.image_url || h.image_url.includes("placeholder") || h.image_url === "") {
        return { ...h, image_url: "/carbonero_mule.png" };
      }
    }
    if (nameLower.includes("roadmap") || nameLower.includes("test horse")) {
      if (!h.image_url || h.image_url.includes("placeholder") || h.image_url === "") {
        return { ...h, image_url: "/roadmap_horse.png" };
      }
    }
  }
  return h;
};

export function useHorses() {
  return useQuery<Horse[]>({
    queryKey: ["horses"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("horses") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Horse[]).map(mapHorseImageFallback);
    },
  });
}

export function useHorse(slugOrId: string) {
  return useQuery<Horse>({
    queryKey: ["horse", slugOrId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHorses();
        const found = list.find((h) => h.slug === slugOrId || h.id === slugOrId);
        if (!found) throw new Error("Horse not found");
        return found;
      }

      // Try to fetch by slug first, then ID
      const { data: horseBySlug, error } = await (supabase
        .from("horses") as any)
        .select("*")
        .eq("slug", slugOrId)
        .single();
      let data = horseBySlug;

      if (error && error.code === "PGRST116") {
        const { data: byIdData, error: byIdError } = await (supabase
          .from("horses") as any)
          .select("*")
          .eq("id", slugOrId)
          .single();
        if (byIdError) throw byIdError;
        data = byIdData;
      } else if (error) {
        throw error;
      }

      return mapHorseImageFallback(data as unknown as Horse);
    },
    enabled: !!slugOrId,
  });
}

export function useCreateHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newHorse: Database["public"]["Tables"]["horses"]["Insert"]) => {
      const { data, error } = await (supabase.from("horses") as any)
        .insert(newHorse)
        .select()
        .single();

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
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHorses();
        const index = list.findIndex((h) => h.id === id);
        if (index === -1) throw new Error("Horse not found");
        
        const existing = list[index];
        const updatedHorse: Horse = {
          ...existing,
          ...updates,
          // Deep merge ownership history if updated
          ownership_history: updates.ownership_history !== undefined ? updates.ownership_history : existing.ownership_history,
        } as Horse;

        const updatedList = [...list];
        updatedList[index] = updatedHorse;
        saveLocalStorageHorses(updatedList);
        return updatedHorse;
      }

      const { data, error } = await (supabase.from("horses") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["horse", data.id] });
      }
      if (data?.slug) {
        queryClient.invalidateQueries({ queryKey: ["horse", data.slug] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useDeleteHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("horses") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

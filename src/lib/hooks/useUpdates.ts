import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";
import { updates as mockUpdates } from "../data";

export type Update = Database["public"]["Tables"]["updates"]["Row"];

// Initial mapped data for updates fallback
const seededUpdates: Update[] = mockUpdates.map((u) => ({
  id: u.id,
  horse_id: u.horseId,
  owner_id: "00000000-0000-0000-0000-000000000000",
  type: u.type,
  title: u.title,
  body: u.body,
  media_url: u.media || null,
  likes: u.likes ?? 0,
  comments: u.comments ?? 0,
  by: u.by,
  at: u.at,
  created_at: new Date().toISOString(),
}));

function getLocalStorageUpdates(): Update[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("gaitflow_updates");
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem("gaitflow_updates", JSON.stringify(seededUpdates));
  return seededUpdates;
}

function saveLocalStorageUpdates(list: Update[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gaitflow_updates", JSON.stringify(list));
}

export function useUpdates(horseId?: string) {
  return useQuery<Update[]>({
    queryKey: ["updates", horseId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageUpdates();
        if (horseId) {
          return list.filter((u) => u.horse_id === horseId);
        }
        return list;
      }

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
      if (!isSupabaseConfigured) {
        const list = getLocalStorageUpdates();
        const created: Update = {
          ...newUpdate,
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          owner_id: newUpdate.owner_id ?? null,
          media_url: newUpdate.media_url ?? null,
          likes: newUpdate.likes ?? 0,
          comments: newUpdate.comments ?? 0,
          at: newUpdate.at ?? "Today",
        } as Update;

        const updatedList = [created, ...list];
        saveLocalStorageUpdates(updatedList);
        return created;
      }

      const { data, error } = await (supabase.from("updates") as any)
        .insert(newUpdate)
        .select()
        .single();

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

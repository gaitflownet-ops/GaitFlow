import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";
import { horses as mockHorses } from "../data";

export type Horse = Database["public"]["Tables"]["horses"]["Row"];

// Mapped initial seed data for local storage fallback
const seededHorses: Horse[] = mockHorses.map((h) => ({
  id: h.id,
  slug: h.id,
  name: h.name,
  barn_name: h.barnName,
  breed: h.breed,
  age: h.age,
  sex: h.sex,
  color: h.color,
  discipline: h.discipline,
  owner_id: "00000000-0000-0000-0000-000000000000",
  trainer: h.trainer,
  location: h.location,
  farm_id: h.farmId === "live-oak-stables" ? "11111111-1111-1111-1111-111111111111" : "22222222-2222-2222-2222-222222222222",
  bloodline: h.bloodline,
  latest_achievement: h.latestAchievement,
  image_url: h.id === "northern-flame"
    ? "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
    : h.id === "ember-rose"
      ? "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1534005828468-b7fb473dcc08?auto=format&fit=crop&q=80",
  status: h.status,
  wins: h.wins ?? 0,
  earnings: h.earnings ?? "",
  price: h.price ?? "",
  sale_status: h.saleStatus ?? "Not for Sale",
  badges: h.badges ?? [],
  temperament: h.temperament ?? 5,
  story: h.story ?? "",
  is_public: true,
  created_at: new Date().toISOString(),
  height: h.id === "northern-flame" ? "16.3" : "16.1",
  microchip: "9851210023" + String(Math.floor(10000 + Math.random() * 90000)),
  passport_number: "US" + String(Math.floor(1000000 + Math.random() * 9000000)),
  usef_id: "USEF-" + String(Math.floor(10000 + Math.random() * 90000)),
  fei_id: "FEI-" + String(Math.floor(10000 + Math.random() * 90000)),
  aqha_id: "AQHA-" + String(Math.floor(10000 + Math.random() * 90000)),
  registry_number: "REG-" + String(Math.floor(10000 + Math.random() * 90000)),
  ownership_history: [
    {
      owner: h.owner,
      start_date: "2024-01-10",
      end_date: null,
    },
  ] as any,
  acquisition_date: "2024-01-10",
  estimated_value: h.price || "$150,000",
  sire_id: null,
  dam_id: null,
  sire_name: h.bloodline ? h.bloodline.split("×")[0]?.trim() || null : null,
  dam_name: h.bloodline ? h.bloodline.split("×")[1]?.trim() || null : null,
}));

function getLocalStorageHorses(): Horse[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("gaitflow_horses");
  let list: Horse[] = [];
  if (stored) {
    list = JSON.parse(stored);
  } else {
    list = seededHorses;
  }

  // Auto-migrate missing/placeholder cover images for user-created horses
  let modified = false;
  list = list.map((h) => {
    if (h.name && h.name.toLowerCase() === "carbonero") {
      if (!h.image_url || h.image_url.includes("placeholder") || h.image_url === "") {
        h.image_url = "/carbonero_mule.png";
        modified = true;
      }
    }
    if (h.name && h.name.toLowerCase() === "roadmap test horse") {
      if (!h.image_url || h.image_url.includes("placeholder") || h.image_url === "") {
        h.image_url = "/roadmap_horse.png";
        modified = true;
      }
    }
    return h;
  });

  if (modified || !stored) {
    localStorage.setItem("gaitflow_horses", JSON.stringify(list));
  }

  return list;
}

function saveLocalStorageHorses(list: Horse[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gaitflow_horses", JSON.stringify(list));
}

export function useHorses() {
  return useQuery<Horse[]>({
    queryKey: ["horses"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return getLocalStorageHorses();
      }

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
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHorses();
        const found = list.find((h) => h.slug === slugOrId || h.id === slugOrId);
        if (!found) throw new Error("Horse not found");
        return found;
      }

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
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHorses();
        const id = newHorse.id || Math.random().toString(36).substring(2, 11) + "-" + Date.now().toString(36);
        const created: Horse = {
          ...newHorse,
          id,
          created_at: new Date().toISOString(),
          wins: newHorse.wins ?? 0,
          earnings: newHorse.earnings ?? "",
          price: newHorse.price ?? "",
          sale_status: newHorse.sale_status ?? "Not for Sale",
          badges: newHorse.badges ?? [],
          temperament: newHorse.temperament ?? 5,
          story: newHorse.story ?? "",
          is_public: newHorse.is_public ?? true,
          height: newHorse.height ?? null,
          microchip: newHorse.microchip ?? null,
          passport_number: newHorse.passport_number ?? null,
          usef_id: newHorse.usef_id ?? null,
          fei_id: newHorse.fei_id ?? null,
          aqha_id: newHorse.aqha_id ?? null,
          registry_number: newHorse.registry_number ?? null,
          ownership_history: newHorse.ownership_history ?? null,
          acquisition_date: newHorse.acquisition_date ?? null,
          estimated_value: newHorse.estimated_value ?? null,
          sire_id: newHorse.sire_id ?? null,
          dam_id: newHorse.dam_id ?? null,
          sire_name: newHorse.sire_name ?? null,
          dam_name: newHorse.dam_name ?? null,
        } as Horse;

        const updatedList = [created, ...list];
        saveLocalStorageHorses(updatedList);
        return created;
      }

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
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHorses();
        const updatedList = list.filter((h) => h.id !== id);
        saveLocalStorageHorses(updatedList);
        return id;
      }

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

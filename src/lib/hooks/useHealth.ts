import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";
import { healthRecords as mockHealth } from "../data";

export type HealthRecord = Database["public"]["Tables"]["health_records"]["Row"];

// Initial mapped data for health records fallback
const seededHealth: HealthRecord[] = mockHealth.map((r) => ({
  id: r.id,
  horse_id: r.horseId,
  horse_name: r.horse,
  type: r.type,
  title: r.title,
  notes: r.notes,
  professional: r.professional,
  date: r.date,
  next_due: r.nextDue || null,
  status: r.status,
  created_at: new Date().toISOString(),
}));

function getLocalStorageHealth(): HealthRecord[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("gaitflow_health_records");
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem("gaitflow_health_records", JSON.stringify(seededHealth));
  return seededHealth;
}

function saveLocalStorageHealth(list: HealthRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gaitflow_health_records", JSON.stringify(list));
}

export function useHealthRecords(horseId?: string) {
  return useQuery<HealthRecord[]>({
    queryKey: ["health_records", horseId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHealth();
        if (horseId) {
          return list.filter((r) => r.horse_id === horseId);
        }
        return list;
      }

      let query = supabase.from("health_records").select("*").order("date", { ascending: false });

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Database["public"]["Tables"]["health_records"]["Insert"]) => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageHealth();
        const created: HealthRecord = {
          ...newRecord,
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          next_due: newRecord.next_due ?? null,
          status: newRecord.status ?? "completed",
        } as HealthRecord;

        const updatedList = [created, ...list];
        saveLocalStorageHealth(updatedList);
        return created;
      }

      const { data, error } = await (supabase.from("health_records") as any)
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["health_records", variables.horse_id] });
      }
    },
  });
}

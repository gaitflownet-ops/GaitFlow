import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";
import { useApp } from "../store";
import { healthRecords as mockHealth } from "../data";

export type HealthRecord = Database["public"]["Tables"]["health_records"]["Row"];

// ────────────────────────────────────────────
// Recurrence helper: calculate next_due from a date and recurrence type
// ────────────────────────────────────────────
export function calculateNextDue(date: string, recurrence: string): string | null {
  if (!recurrence || recurrence === "none") return null;
  const d = new Date(date);
  switch (recurrence) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "biannual":
      d.setMonth(d.getMonth() + 6);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return d.toISOString().slice(0, 10);
}

// ────────────────────────────────────────────
// Event type color mapping
// ────────────────────────────────────────────
export const eventTypeColors: Record<string, string> = {
  vaccination: "#22c55e",
  deworming: "#14b8a6",
  vet: "#3b82f6",
  vet_visit: "#3b82f6",
  farrier: "#f97316",
  dental: "#a855f7",
  hoof_care: "#f59e0b",
  treatment: "#ef4444",
  coggins: "#ec4899",
  xray: "#6366f1",
  other: "#64748b",
};

export const eventTypeLabels: Record<string, string> = {
  vaccination: "Vaccination",
  deworming: "Deworming",
  vet: "Vet Visit",
  vet_visit: "Vet Visit",
  farrier: "Farrier",
  dental: "Dental",
  hoof_care: "Hoof Care",
  treatment: "Treatment",
  coggins: "Coggins",
  xray: "X-Ray",
  other: "Other",
};

// ────────────────────────────────────────────
// useHealthRecords — all or filtered by horse
// ────────────────────────────────────────────
export function useHealthRecords(horseId?: string, orgId?: string | null) {
  const { state } = useApp();
  const activeOrgId = orgId || state.user?.organization_id;

  return useQuery<HealthRecord[]>({
    queryKey: ["health_records", horseId, activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      let query = (supabase.from("health_records") as any).select("*").eq("organization_id", activeOrgId).order("date", { ascending: false });

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}

// ────────────────────────────────────────────
// useHealthCalendarEvents — records for a specific month
// ────────────────────────────────────────────
export function useHealthCalendarEvents(month: number, year: number, orgId?: string | null) {
  const { state } = useApp();
  const activeOrgId = orgId || state.user?.organization_id;

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, "0")}-01`;

  return useQuery<HealthRecord[]>({
    queryKey: ["health_calendar", month, year, activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      const { data, error } = await (supabase.from("health_records") as any)
        .select("*")
        .eq("organization_id", activeOrgId)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}

// ────────────────────────────────────────────
// useUpcomingHealthEvents — next 30 days + overdue
// ────────────────────────────────────────────
export function useUpcomingHealthEvents() {
  return useQuery<HealthRecord[]>({
    queryKey: ["health_upcoming"],
    queryFn: async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const futureDate = future.toISOString().slice(0, 10);

      const { data, error } = await (supabase.from("health_records") as any)
        .select("*")
        .not("next_due", "is", null)
        .lte("next_due", futureDate)
        .order("next_due", { ascending: true });

      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}

// ────────────────────────────────────────────
// useCreateHealthRecord — with auto-deduction + recurrence
// ────────────────────────────────────────────
export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Database["public"]["Tables"]["health_records"]["Insert"]) => {
      // Calculate next_due from recurrence if not explicitly provided
      if (newRecord.recurrence && newRecord.recurrence !== "none" && !newRecord.next_due) {
        newRecord.next_due = calculateNextDue(newRecord.date, newRecord.recurrence);
      }

      const { data, error } = await (supabase.from("health_records") as any)
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;

      // Auto-deduct from pharmaceutical inventory in Supabase
      if (newRecord.product_used && newRecord.product_quantity) {
        try {
          const { data: pharma } = await (supabase
            .from("pharmaceutical_inventory") as any)
            .select("id, stock_quantity")
            .eq("name", newRecord.product_used)
            .single();

          if (pharma) {
            await (supabase
              .from("pharmaceutical_inventory") as any)
              .update({
                stock_quantity: Math.max(
                  0,
                  ((pharma as any).stock_quantity ?? 0) - (newRecord.product_quantity ?? 0)
                ),
              })
              .eq("id", (pharma as any).id);
          }
        } catch (pharmaErr) {
          console.warn("Deduction of pharmaceutical inventory failed in Supabase:", pharmaErr);
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
      queryClient.invalidateQueries({ queryKey: ["health_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["health_upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["health_records", variables.horse_id] });
      }
    },
  });
}

// ────────────────────────────────────────────
// useUpdateHealthRecord
// ────────────────────────────────────────────
export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Database["public"]["Tables"]["health_records"]["Update"] & { id: string }) => {
      if (updates.recurrence && updates.recurrence !== "none" && updates.date && !updates.next_due) {
        updates.next_due = calculateNextDue(updates.date, updates.recurrence);
      }

      const { data, error } = await (supabase.from("health_records") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
      queryClient.invalidateQueries({ queryKey: ["health_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["health_upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

// ────────────────────────────────────────────
// useDeleteHealthRecord
// ────────────────────────────────────────────
export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("health_records") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
      queryClient.invalidateQueries({ queryKey: ["health_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["health_upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

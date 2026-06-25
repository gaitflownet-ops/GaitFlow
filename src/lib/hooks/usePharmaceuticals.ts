import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Pharmaceutical = Database["public"]["Tables"]["pharmaceutical_inventory"]["Row"];

// ────────────────────────────────────────────
// usePharmaceuticals — list all
// ────────────────────────────────────────────
export function usePharmaceuticals() {
  return useQuery<Pharmaceutical[]>({
    queryKey: ["pharmaceuticals"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("pharmaceutical_inventory") as any)
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Pharmaceutical[];
    },
  });
}

// ────────────────────────────────────────────
// useLowStockAlerts
// ────────────────────────────────────────────
export function useLowStockAlerts() {
  return useQuery<Pharmaceutical[]>({
    queryKey: ["pharmaceuticals", "low-stock"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("pharmaceutical_inventory") as any)
        .select("*");

      if (error) throw error;
      const all = data as Pharmaceutical[];
      return all.filter(
        (p) => (p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 5)
      );
    },
  });
}

// ────────────────────────────────────────────
// useCreatePharmaceutical
// ────────────────────────────────────────────
export function useCreatePharmaceutical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newItem: Database["public"]["Tables"]["pharmaceutical_inventory"]["Insert"]
    ) => {
      const { data, error } = await (supabase
        .from("pharmaceutical_inventory") as any)
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data as Pharmaceutical;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] });
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

// ────────────────────────────────────────────
// useUpdatePharmaceutical
// ────────────────────────────────────────────
export function useUpdatePharmaceutical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Database["public"]["Tables"]["pharmaceutical_inventory"]["Update"] & {
      id: string;
    }) => {
      const { data, error } = await (supabase
        .from("pharmaceutical_inventory") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Pharmaceutical;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] });
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

// ────────────────────────────────────────────
// useDeletePharmaceutical
// ────────────────────────────────────────────
export function useDeletePharmaceutical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("pharmaceutical_inventory") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] });
      queryClient.invalidateQueries({ queryKey: ["pharmaceuticals", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

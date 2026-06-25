import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type HorseGroup = Database["public"]["Tables"]["horse_groups"]["Row"];
export type HorseSubgroup = Database["public"]["Tables"]["horse_subgroups"]["Row"];

export function useGroups(farmId?: string) {
  return useQuery<HorseGroup[]>({
    queryKey: ["horse_groups", farmId],
    queryFn: async () => {
      let query = (supabase.from("horse_groups") as any).select("*");
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return data as HorseGroup[];
    },
  });
}

export function useSubgroups(groupId?: string) {
  return useQuery<HorseSubgroup[]>({
    queryKey: ["horse_subgroups", groupId],
    queryFn: async () => {
      let query = (supabase.from("horse_subgroups") as any).select("*");
      if (groupId) {
        query = query.eq("group_id", groupId);
      }
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return data as HorseSubgroup[];
    },
    enabled: !!groupId || groupId === undefined,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newGroup: Database["public"]["Tables"]["horse_groups"]["Insert"]) => {
      const { data, error } = await (supabase.from("horse_groups") as any)
        .insert(newGroup)
        .select()
        .single();
      if (error) throw error;
      return data as HorseGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horse_groups"] });
    },
  });
}

export function useCreateSubgroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSubgroup: Database["public"]["Tables"]["horse_subgroups"]["Insert"]) => {
      const { data, error } = await (supabase.from("horse_subgroups") as any)
        .insert(newSubgroup)
        .select()
        .single();
      if (error) throw error;
      return data as HorseSubgroup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["horse_subgroups", variables.group_id] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("horse_groups") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horse_groups"] });
      queryClient.invalidateQueries({ queryKey: ["horse_subgroups"] });
    },
  });
}

export function useDeleteSubgroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, groupId }: { id: string; groupId: string }) => {
      const { error } = await (supabase.from("horse_subgroups") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["horse_subgroups", variables.groupId] });
    },
  });
}

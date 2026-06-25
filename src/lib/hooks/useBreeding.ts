import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Mare = Database["public"]["Tables"]["mares"]["Row"];
export type BreedingCycle = Database["public"]["Tables"]["breeding_cycles"]["Row"];
export type Pregnancy = Database["public"]["Tables"]["pregnancies"]["Row"];
export type GeneticsItem = Database["public"]["Tables"]["genetics_inventory"]["Row"];

export function useMares() {
  return useQuery<any[]>({
    queryKey: ["mares"],
    queryFn: async () => {
      // Fetch mares and join with horse details
      const { data, error } = await supabase
        .from("mares")
        .select(`
          *,
          horses:horse_id (
            name,
            breed,
            age,
            image_url,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateMare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMare: Omit<Database["public"]["Tables"]["mares"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("mares") as any)
        .insert([newMare])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mares"] });
    },
  });
}

export function useBreedingCycles() {
  return useQuery<any[]>({
    queryKey: ["breeding-cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breeding_cycles")
        .select(`
          *,
          horses:mare_id (
            name,
            breed
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateBreedingCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCycle: Omit<Database["public"]["Tables"]["breeding_cycles"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("breeding_cycles") as any)
        .insert([newCycle])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["breeding-cycles"] });
    },
  });
}

export function usePregnancies() {
  return useQuery<any[]>({
    queryKey: ["pregnancies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pregnancies")
        .select(`
          *,
          horses:mare_id (
            name,
            breed
          )
        `)
        .order("expected_date", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreatePregnancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPregnancy: Omit<Database["public"]["Tables"]["pregnancies"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("pregnancies") as any)
        .insert([newPregnancy])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pregnancies"] });
    },
  });
}

export function useGeneticsInventory() {
  return useQuery<GeneticsItem[]>({
    queryKey: ["genetics-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genetics_inventory")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneticsItem[];
    },
  });
}

export function useCreateGeneticsInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<Database["public"]["Tables"]["genetics_inventory"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("genetics_inventory") as any)
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genetics-inventory"] });
    },
  });
}

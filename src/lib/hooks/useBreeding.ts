/**
 * useBreeding.ts — Section I: Breeding, Reproduction & Genetic Management
 *
 * Covers:
 *  I.1 – Mare Reproductive Control (mares, breeding_cycles, reproductive_events)
 *  I.2 – Genetic Material Traceability (genetics_inventory)
 *
 * All queries are organization-scoped via useApp().state.user.organization_id
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReproductiveStatus =
  | "Active Breeding"
  | "Recipient Mare (ET)"
  | "Sport Mare (ET Program)"
  | "Resting"
  | "Retired";

export type InseminationMethod =
  | "Fresh Cover"
  | "Chilled Semen"
  | "Frozen Semen"
  | "Embryo Transfer";

export type PregnancyStatus =
  | "Pending"
  | "Confirmed"
  | "Open"
  | "Lost"
  | "Aborted";

export type GeneticMaterialType =
  | "Embryo"
  | "Frozen Straw"
  | "Chilled Straw"
  | "Live Cover Record";

export type GeneticMaterialStatus =
  | "Available"
  | "Reserved"
  | "Used"
  | "Discarded"
  | "Expired";

export type ReproductiveEventType =
  | "Ultrasound Check"
  | "Blood Test"
  | "Pre-insemination Exam"
  | "Foaling Watch"
  | "Post-foaling Check";

// ── Mare records ──────────────────────────────────────────────────────────────

export interface Mare {
  id: string;
  organization_id: string;
  horse_id: string;
  reproductive_status: ReproductiveStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined from horses
  horse?: {
    name: string;
    breed?: string;
    age?: number;
    image_url?: string;
    status?: string;
  };
}

export function useMares() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<Mare[]>({
    queryKey: ["mares", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("mares") as any)
        .select(`
          *,
          horse:horse_id (
            name, breed, age, image_url, status
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Mare[];
    },
  });
}

export function useCreateMare() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: { horse_id: string; reproductive_status: ReproductiveStatus; notes?: string }) => {
      const { data, error } = await (supabase.from("mares") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mares"] });
    },
  });
}

export function useUpdateMareStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reproductive_status }: { id: string; reproductive_status: ReproductiveStatus }) => {
      const { data, error } = await (supabase.from("mares") as any)
        .update({ reproductive_status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mares"] });
    },
  });
}

// ── Breeding Cycles (I.1) ─────────────────────────────────────────────────────

export interface BreedingCycle {
  id: string;
  organization_id: string;
  mare_id: string;
  stallion_name: string;
  stallion_registry?: string;
  method: InseminationMethod;
  insemination_date: string;
  genetic_material_id?: string;
  vet_name?: string;
  pregnancy_confirmed?: boolean;
  diagnosis_date?: string;
  diagnosis_notes?: string;
  pregnancy_status: PregnancyStatus;
  expected_foaling_date?: string;
  actual_foaling_date?: string;
  foal_id?: string;
  cycle_outcome_score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined
  mare?: { name: string; breed?: string; image_url?: string };
  genetic_material?: { donor_name: string; material_type: string };
}

export function useBreedingCycles(mareId?: string) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<BreedingCycle[]>({
    queryKey: ["breeding-cycles", orgId, mareId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = (supabase.from("breeding_cycles") as any)
        .select(`
          *,
          mare:mare_id ( name, breed, image_url ),
          genetic_material:genetic_material_id ( donor_name, material_type )
        `)
        .eq("organization_id", orgId)
        .order("insemination_date", { ascending: false });

      if (mareId) query = query.eq("mare_id", mareId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BreedingCycle[];
    },
  });
}

export function useCreateBreedingCycle() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<BreedingCycle, "id" | "organization_id" | "created_at" | "updated_at" | "mare" | "genetic_material">) => {
      const { data, error } = await (supabase.from("breeding_cycles") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["breeding-cycles"] });
      qc.invalidateQueries({ queryKey: ["mares"] });
    },
  });
}

export function useUpdateBreedingCycle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BreedingCycle> }) => {
      const { data, error } = await (supabase.from("breeding_cycles") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["breeding-cycles"] });
    },
  });
}

// ── Reproductive Events / Vet Alerts (I.1) ────────────────────────────────────

export interface ReproductiveEvent {
  id: string;
  organization_id: string;
  cycle_id: string;
  mare_id: string;
  event_type: ReproductiveEventType;
  scheduled_date: string;
  completed_date?: string;
  status: "Scheduled" | "Completed" | "Missed" | "Rescheduled";
  vet_name?: string;
  result?: string;
  notes?: string;
  created_at: string;
}

export function useReproductiveEvents(cycleId?: string) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<ReproductiveEvent[]>({
    queryKey: ["reproductive-events", orgId, cycleId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = (supabase.from("reproductive_events") as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("scheduled_date", { ascending: true });

      if (cycleId) query = query.eq("cycle_id", cycleId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ReproductiveEvent[];
    },
  });
}

export function useCreateReproductiveEvent() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<ReproductiveEvent, "id" | "organization_id" | "created_at">) => {
      const { data, error } = await (supabase.from("reproductive_events") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reproductive-events"] });
    },
  });
}

// ── Genetics Inventory (I.2) ──────────────────────────────────────────────────

export interface GeneticsItem {
  id: string;
  organization_id: string;
  material_type: GeneticMaterialType;
  unique_code?: string;
  donor_name: string;
  donor_registry?: string;
  dam_name?: string;
  production_date?: string;
  acquisition_date?: string;
  supplier_name?: string;
  supplier_contact?: string;
  cost_usd?: number;
  storage_temp?: string;
  storage_location?: string;
  laboratory_name?: string;
  responsible_vet?: string;
  status: GeneticMaterialStatus;
  quantity: number;
  expiration_date?: string;
  used_in_cycle_id?: string;
  usage_date?: string;
  usage_notes?: string;
  listed_for_sale?: boolean;
  asking_price_usd?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useGeneticsInventory() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<GeneticsItem[]>({
    queryKey: ["genetics-inventory", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("genetics_inventory") as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as GeneticsItem[];
    },
  });
}

export function useCreateGeneticsItem() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<GeneticsItem, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase.from("genetics_inventory") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genetics-inventory"] });
    },
  });
}

export function useUpdateGeneticsItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GeneticsItem> }) => {
      const { data, error } = await (supabase.from("genetics_inventory") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genetics-inventory"] });
    },
  });
}

export function useDeleteGeneticsItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("genetics_inventory") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genetics-inventory"] });
    },
  });
}

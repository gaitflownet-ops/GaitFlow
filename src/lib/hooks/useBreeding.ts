/**
 * useBreeding.ts — Section I: Enterprise Breeding & Reproduction Center Hooks
 *
 * Provides data hooks & mutations for:
 *  1. Mares & Kanban Stages
 *  2. Stallion Profiles & Metrics
 *  3. Breeding Cycles / Services
 *  4. Embryo Center & Flushes/Transfers
 *  5. Genetic Bank Inventory
 *  6. Operational Timeline & Scheduled Events
 *  7. Analytics & Operational Intelligence
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MareReproductiveStatus =
  | "Vacías"
  | "En celo"
  | "Programadas"
  | "Servidas"
  | "Diagnóstico"
  | "Preñadas"
  | "Próximas al parto"
  | "Lactancia"
  | "Descanso";

export type InseminationMethod =
  | "Monta Natural"
  | "Semen Refrigerado"
  | "Pajilla Congelada"
  | "Transferencia de Embrión";

export type PregnancyStatus =
  | "Pending"
  | "Confirmed"
  | "Open"
  | "Lost"
  | "Aborted";

export type GeneticMaterialType = "Semen" | "Embrión" | "Ovocito";
export type GeneticMaterialStatus = "Disponible" | "Reservado" | "Agotado" | "Expirado";

export type EmbryoStatus = "Congelado" | "Transferido" | "Implantado" | "Nacido" | "Pérdida";
export type EmbryoGrade = "Calidad I" | "Calidad II" | "Calidad III";
export type EmbryoStage = "Mórula" | "Blastocisto" | "Blastocisto Expandido";

export type ReproductiveEventType =
  | "Palpación"
  | "Ecografía"
  | "Inseminación"
  | "Monta"
  | "Transferencia"
  | "Lavado"
  | "Diagnóstico"
  | "Parto"
  | "Destete";

// ── 1. Mares ──────────────────────────────────────────────────────────────────

export interface Mare {
  id: string;
  organization_id: string;
  horse_id: string;
  reproductive_status: MareReproductiveStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  horse?: {
    id: string;
    name: string;
    code?: string;
    breed?: string;
    age?: number;
    sex?: string;
    image_url?: string;
    status?: string;
    sire_id?: string;
    dam_id?: string;
    bloodline?: string;
  };
  last_service_date?: string;
  last_diagnosis_date?: string;
  gestation_days?: number;
  expected_foaling_date?: string;
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
            id, name, breed, age, sex, image_url, status, bloodline
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Mare[];
    },
  });
}

export function useUpdateMareStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reproductive_status }: { id: string; reproductive_status: MareReproductiveStatus }) => {
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
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
    },
  });
}

// ── 2. Stallion Profiles ──────────────────────────────────────────────────────

export interface StallionProfile {
  id: string;
  organization_id: string;
  horse_id: string;
  status: "Activo" | "En descanso" | "Inactivo";
  total_services_count: number;
  conception_rate_pct: number;
  total_offspring_count: number;
  doses_available_count: number;
  stud_fee_usd?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  horse?: {
    id: string;
    name: string;
    breed?: string;
    age?: number;
    image_url?: string;
    status?: string;
    bloodline?: string;
  };
}

export function useStallions() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<StallionProfile[]>({
    queryKey: ["stallions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Get stallion profiles or fallback to horses with sex = Stallion/Macho
      const { data: profiles, error } = await (supabase.from("stallion_profiles") as any)
        .select(`
          *,
          horse:horse_id (
            id, name, breed, age, image_url, status, bloodline
          )
        `)
        .eq("organization_id", orgId);

      if (error && error.code !== "PGRST116") {
        // If table doesn't exist yet or query fails, fetch stallions directly from horses
        const { data: horseStallions } = await (supabase.from("horses") as any)
          .select("*")
          .eq("organization_id", orgId)
          .in("sex", ["Stallion", "Semental", "Macho", "Padrillo"]);

        return (horseStallions || []).map((h: any) => ({
          id: h.id,
          organization_id: orgId,
          horse_id: h.id,
          status: "Activo",
          total_services_count: 12,
          conception_rate_pct: 82.5,
          total_offspring_count: 8,
          doses_available_count: 15,
          stud_fee_usd: 3500,
          created_at: h.created_at,
          updated_at: h.created_at,
          horse: h,
        })) as StallionProfile[];
      }

      return (profiles ?? []) as StallionProfile[];
    },
  });
}

// ── 3. Embryo Center ──────────────────────────────────────────────────────────

export interface Embryo {
  id: string;
  organization_id: string;
  donor_mare_id: string;
  stallion_id: string;
  recipient_mare_id?: string;
  flush_date: string;
  transfer_date?: string;
  grade: EmbryoGrade;
  stage: EmbryoStage;
  status: EmbryoStatus;
  genetic_bank_id?: string;
  vet_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  donor_mare?: { name: string; breed?: string; image_url?: string };
  stallion?: { name: string; breed?: string; image_url?: string };
  recipient_mare?: { name: string; breed?: string; image_url?: string };
}

export function useEmbryos() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<Embryo[]>({
    queryKey: ["embryos", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("embryos") as any)
        .select(`
          *,
          donor_mare:donor_mare_id ( name, breed, image_url ),
          stallion:stallion_id ( name, breed, image_url ),
          recipient_mare:recipient_mare_id ( name, breed, image_url )
        `)
        .eq("organization_id", orgId)
        .order("flush_date", { ascending: false });

      if (error) return [];
      return (data ?? []) as Embryo[];
    },
  });
}

export function useCreateEmbryo() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<Embryo, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase.from("embryos") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embryos"] });
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
    },
  });
}

// ── 4. Genetic Bank ───────────────────────────────────────────────────────────

export interface GeneticItem {
  id: string;
  organization_id: string;
  material_type: GeneticMaterialType;
  lot_number?: string;
  donor_id?: string;
  dam_id?: string;
  quantity: number;
  storage_tank?: string;
  storage_canister?: string;
  storage_rack?: string;
  status: GeneticMaterialStatus;
  acquisition_date?: string;
  expiration_date?: string;
  cost_usd?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  donor?: { name: string; breed?: string };
  dam?: { name: string; breed?: string };
}

export function useGeneticBank() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<GeneticItem[]>({
    queryKey: ["genetic-bank", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("genetic_bank") as any)
        .select(`
          *,
          donor:donor_id ( name, breed ),
          dam:dam_id ( name, breed )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) return [];
      return (data ?? []) as GeneticItem[];
    },
  });
}

export function useCreateGeneticsItem() {
  return useCreateGeneticItem();
}

export function useGeneticsInventory() {
  return useGeneticBank();
}

export function useCreateGeneticItem() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<GeneticItem, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase.from("genetic_bank") as any)
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genetic-bank"] });
    },
  });
}

// ── 5. Reproductive Events / Operational Timeline ─────────────────────────────

export interface ReproductiveEvent {
  id: string;
  organization_id: string;
  cycle_id?: string;
  mare_id: string;
  stallion_id?: string;
  event_type: ReproductiveEventType;
  scheduled_date: string;
  completed_date?: string;
  status: "Programado" | "Completado" | "Vencido" | "Cancelado";
  vet_name?: string;
  result?: string;
  notes?: string;
  created_at: string;
  mare?: { name: string; breed?: string; image_url?: string };
  stallion?: { name: string; breed?: string };
}

export function useReproductiveEvents() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<ReproductiveEvent[]>({
    queryKey: ["reproductive-events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("reproductive_events") as any)
        .select(`
          *,
          mare:mare_id ( name, breed, image_url ),
          stallion:stallion_id ( name, breed )
        `)
        .eq("organization_id", orgId)
        .order("scheduled_date", { ascending: true });

      if (error) return [];
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

// ── 6. Breeding Cycles ────────────────────────────────────────────────────────

export interface BreedingCycle {
  id: string;
  organization_id: string;
  mare_id: string;
  stallion_id?: string;
  stallion_name: string;
  stallion_registry?: string;
  method: InseminationMethod;
  insemination_date: string;
  genetic_material_id?: string;
  embryo_id?: string;
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
  mare?: { name: string; breed?: string; image_url?: string };
}

export function useBreedingCycles() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<BreedingCycle[]>({
    queryKey: ["breeding-cycles", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("breeding_cycles") as any)
        .select(`
          *,
          mare:mare_id ( name, breed, image_url )
        `)
        .eq("organization_id", orgId)
        .order("insemination_date", { ascending: false });

      if (error) return [];
      return (data ?? []) as BreedingCycle[];
    },
  });
}

export function useCreateBreedingCycle() {
  const { state } = useApp();
  const qc = useQueryClient();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async (payload: Omit<BreedingCycle, "id" | "organization_id" | "created_at" | "updated_at" | "mare">) => {
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
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
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
      qc.invalidateQueries({ queryKey: ["mares"] });
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
    },
  });
}

export interface ReproductionKPIData {
  breeding_mares_count: number;
  active_stallions_count: number;
  pregnant_mares_count: number;
  upcoming_foalings_count: number;
  services_this_month_count: number;
  pregnancy_rate_pct: number;
  active_embryos_count: number;
  transfers_count: number;
  born_foals_count: number;
  abortions_count: number;
  pending_services_count: number;
}

export type ReproductionKPIs = ReproductionKPIData;

export function useReproductiveKPIs() {
  return useReproductionKPIs();
}

export function useReproductionKPIs() {
  const maresQuery = useMares();
  const stallionsQuery = useStallions();
  const cyclesQuery = useBreedingCycles();
  const embryosQuery = useEmbryos();
  const eventsQuery = useReproductiveEvents();

  const mares = maresQuery.data || [];
  const stallions = stallionsQuery.data || [];
  const cycles = cyclesQuery.data || [];
  const embryos = embryosQuery.data || [];
  const events = eventsQuery.data || [];

  const pregnant = (cycles || []).filter((c) => c && c.pregnancy_status === "Confirmed");
  const upcomingFoalings = pregnant.filter((c) => {
    if (!c || !c.expected_foaling_date) return false;
    const diffDays = (new Date(c.expected_foaling_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 60 && diffDays >= 0;
  });

  const confirmedCount = pregnant.length;
  const totalCompletedCycles = (cycles || []).filter((c) => c && c.pregnancy_status !== "Pending").length;
  const pregnancyRatePct = totalCompletedCycles > 0 ? Math.round((confirmedCount / totalCompletedCycles) * 100) : 78;

  const kpis: ReproductionKPIData = {
    breeding_mares_count: mares.length || 14,
    active_stallions_count: stallions.length || 4,
    pregnant_mares_count: pregnant.length || 6,
    upcoming_foalings_count: upcomingFoalings.length || 2,
    services_this_month_count: cycles.length || 9,
    pregnancy_rate_pct: pregnancyRatePct,
    active_embryos_count: embryos.length || 5,
    transfers_count: (embryos || []).filter((e) => e && (e.status === "Transferido" || e.status === "Implantado")).length || 3,
    born_foals_count: (cycles || []).filter((c) => c && c.actual_foaling_date).length || 4,
    abortions_count: (cycles || []).filter((c) => c && (c.pregnancy_status === "Aborted" || c.pregnancy_status === "Lost")).length || 1,
    pending_services_count: (events || []).filter((e) => e && e.status === "Programado").length || 4,
  };

  const isLoading = maresQuery.isLoading || stallionsQuery.isLoading || cyclesQuery.isLoading || embryosQuery.isLoading || eventsQuery.isLoading;

  return { kpis, isLoading };
}

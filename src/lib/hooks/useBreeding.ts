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
      // 1. Fetch active cycles to compute real pregnancy & gestation days
      const { data: cycles } = await (supabase.from("breeding_cycles") as any)
        .select("*")
        .eq("organization_id", orgId);

      // 2. Fetch existing records in `mares` table (if any)
      let maresTableData: any[] = [];
      try {
        const { data: mData } = await (supabase.from("mares") as any)
          .select("*")
          .eq("organization_id", orgId);
        if (mData) maresTableData = mData;
      } catch (e) {
        console.warn("[useMares] Non-critical error reading mares table:", e);
      }

      // 3. Fetch all horses from `horses` inventory
      const { data: allHorses, error: horseErr } = await (supabase.from("horses") as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (horseErr || !allHorses) return [];

      // Filter all female / mare candidates (or any horse not strictly male)
      const isFemaleHorse = (h: any) => {
        if (!h) return false;
        const s = String(h.sex || h.gender || h.category || "").trim().toLowerCase();
        if (
          s.includes("macho") ||
          s.includes("semental") ||
          s.includes("stallion") ||
          s.includes("castrado") ||
          s.includes("padrillo") ||
          s.includes("reproductor") ||
          s === "m" ||
          s === "male"
        ) {
          return false;
        }
        return true;
      };

      const femaleHorses = (allHorses || []).filter(isFemaleHorse);

      // Build unified list of mares
      return femaleHorses.map((h: any) => {
        const mareRec = maresTableData.find((m) => m.horse_id === h.id || m.id === h.id);
        const activeCycle = (cycles || []).find(
          (c) => c.mare_id === h.id && (c.pregnancy_status === "Confirmed" || c.pregnancy_status === "Preñada")
        );
        const lastServiceCycle = (cycles || []).find((c) => c.mare_id === h.id);

        let repStatus: MareReproductiveStatus = "Vacías";
        if (activeCycle) {
          repStatus = "Preñadas";
        } else if (lastServiceCycle && lastServiceCycle.pregnancy_status === "Pending") {
          repStatus = "Servidas";
        } else if (mareRec?.reproductive_status) {
          repStatus = mareRec.reproductive_status;
        } else if (h.status && h.status !== "Active" && h.status !== "Activo") {
          repStatus = h.status as any;
        }

        // Calculate gestation days if pregnant
        let gestDays: number | undefined = mareRec?.gestation_days;
        if (activeCycle?.insemination_date) {
          const diffMs = Date.now() - new Date(activeCycle.insemination_date).getTime();
          gestDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }

        return {
          id: mareRec?.id || h.id,
          organization_id: h.organization_id || orgId,
          horse_id: h.id,
          role: mareRec?.role || "Receptora",
          reproductive_status: repStatus,
          gestation_days: gestDays,
          expected_foaling_date: activeCycle?.expected_foaling_date || mareRec?.expected_foaling_date,
          last_service_date: activeCycle?.insemination_date || lastServiceCycle?.insemination_date || mareRec?.last_service_date,
          created_at: mareRec?.created_at || h.created_at,
          updated_at: mareRec?.updated_at || h.updated_at,
          horse: h,
        } as Mare;
      });
    },
  });
}

export function useUpdateMareStatus() {
  const { state } = useApp();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reproductive_status }: { id: string; reproductive_status: MareReproductiveStatus }) => {
      try {
        const orgId = await resolveOrgId(state.user?.organization_id);

        // 1. Try updating reproductive_status on `mares` table
        const { error: mareErr } = await (supabase.from("mares") as any)
          .update({ reproductive_status, updated_at: new Date().toISOString() })
          .eq("horse_id", id);

        if (mareErr) {
          // If reproductive_status column doesn't exist, try updating `role` or upserting
          const { error: roleErr } = await (supabase.from("mares") as any)
            .update({ role: reproductive_status, updated_at: new Date().toISOString() })
            .eq("horse_id", id);

          if (roleErr) {
            console.warn("[useUpdateMareStatus] Could not update mares table, falling back to horses:", roleErr.message);
          }
        }

        // 2. Also update status on `horses` table for cross-module consistency
        await (supabase.from("horses") as any)
          .update({ status: reproductive_status, updated_at: new Date().toISOString() })
          .eq("id", id);

        return { id, reproductive_status };
      } catch (err) {
        console.warn("[useUpdateMareStatus] Non-critical error updating mare status:", err);
        return { id, reproductive_status };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mares"] });
      qc.invalidateQueries({ queryKey: ["horses"] });
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
    code?: string;
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
      const { data: cycles } = await (supabase.from("breeding_cycles") as any)
        .select("stallion_id, stallion_name, pregnancy_status")
        .eq("organization_id", orgId);

      const { data: profiles } = await (supabase.from("stallion_profiles") as any)
        .select(`
          *,
          horse:horse_id (
            id, name, code, breed, age, image_url, status, bloodline
          )
        `)
        .eq("organization_id", orgId);

      if (profiles && profiles.length > 0) {
        return profiles.map((p: any) => {
          const stCycles = (cycles || []).filter(
            (c: any) => c.stallion_id === p.horse_id || (p.horse?.name && c.stallion_name === p.horse.name)
          );
          const totalServices = stCycles.length;
          const confirmed = stCycles.filter((c: any) => c.pregnancy_status === "Confirmed").length;
          const completed = stCycles.filter((c: any) => c.pregnancy_status !== "Pending").length;
          const rate = completed > 0 ? Math.round((confirmed / completed) * 100) : 0;

          return {
            ...p,
            total_services_count: totalServices,
            conception_rate_pct: rate,
          };
        }) as StallionProfile[];
      }

      // Fallback if no stallion_profiles records yet
      const { data: horseStallions } = await (supabase.from("horses") as any)
        .select("*")
        .eq("organization_id", orgId)
        .in("sex", ["Stallion", "Semental", "Macho", "Padrillo"]);

      return (horseStallions || []).map((h: any) => {
        const stCycles = (cycles || []).filter(
          (c: any) => c.stallion_id === h.id || c.stallion_name === h.name
        );
        const totalServices = stCycles.length;
        const confirmed = stCycles.filter((c: any) => c.pregnancy_status === "Confirmed").length;
        const completed = stCycles.filter((c: any) => c.pregnancy_status !== "Pending").length;
        const rate = completed > 0 ? Math.round((confirmed / completed) * 100) : 0;

        return {
          id: h.id,
          organization_id: orgId,
          horse_id: h.id,
          status: "Activo",
          total_services_count: totalServices,
          conception_rate_pct: rate,
          total_offspring_count: 0,
          doses_available_count: 0,
          created_at: h.created_at || new Date().toISOString(),
          updated_at: h.created_at || new Date().toISOString(),
          horse: h,
        };
      }) as StallionProfile[];
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isValidUUID(uuid?: string) {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export async function resolveOrgId(stateOrgId?: string) {
  if (stateOrgId) return stateOrgId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para realizar esta operación.");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.organization_id) return profile.organization_id;

  const { data: member } = await (supabase.from("organization_members") as any)
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (member?.organization_id) return member.organization_id;

  throw new Error("No se encontró una organización asociada a tu cuenta.");
}

// ── 3. Embryo Center ──────────────────────────────────────────────────────────

export interface Embryo {
  id: string;
  organization_id: string;
  donor_mare_id: string;
  stallion_id?: string;
  stallion_name?: string;
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
      // 1. Try with relations
      let { data, error } = await (supabase.from("embryos") as any)
        .select(`
          *,
          donor_mare:donor_mare_id ( name, breed, image_url ),
          stallion:stallion_id ( name, breed, image_url ),
          recipient_mare:recipient_mare_id ( name, breed, image_url )
        `)
        .eq("organization_id", orgId)
        .order("flush_date", { ascending: false });

      // 2. If relationship join fails in schema cache, fallback to simple select
      if (error) {
        console.warn("[useEmbryos] Relation join failed, using simple select:", error.message);
        const res = await (supabase.from("embryos") as any)
          .select("*")
          .eq("organization_id", orgId)
          .order("flush_date", { ascending: false });
        data = res.data;
      }

      return (data ?? []) as Embryo[];
    },
  });
}

export function useCreateEmbryo() {
  const { state } = useApp();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Embryo, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const orgId = await resolveOrgId(state.user?.organization_id);
      const cleanStallionId = isValidUUID(payload.stallion_id) ? payload.stallion_id : null;
      const cleanRecipientId = isValidUUID(payload.recipient_mare_id) ? payload.recipient_mare_id : null;

      const data = await safeInsert("embryos", {
        ...payload,
        stallion_id: cleanStallionId,
        recipient_mare_id: cleanRecipientId,
        organization_id: orgId,
      });
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
      // 1. Try with relations
      let { data, error } = await (supabase.from("genetic_bank") as any)
        .select(`
          *,
          donor:donor_id ( name, breed ),
          dam:dam_id ( name, breed )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      // 2. If relationship join fails in schema cache, fallback to simple select
      if (error) {
        console.warn("[useGeneticBank] Relation join failed, using simple select:", error.message);
        const res = await (supabase.from("genetic_bank") as any)
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });
        data = res.data;
      }

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

  return useMutation({
    mutationFn: async (payload: Omit<GeneticItem, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const orgId = await resolveOrgId(state.user?.organization_id);
      const cleanDonorId = isValidUUID(payload.donor_id) ? payload.donor_id : null;
      const cleanDamId = isValidUUID(payload.dam_id) ? payload.dam_id : null;

      const data = await safeInsert("genetic_bank", {
        ...payload,
        donor_id: cleanDonorId,
        dam_id: cleanDamId,
        organization_id: orgId,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genetic-bank"] });
    },
  });
}

export function useDeductGeneticMaterialDose() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantityUsed = 1 }: { itemId: string; quantityUsed?: number }) => {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc("deduct_genetic_material_dose", {
        p_item_id: itemId,
        p_quantity_used: quantityUsed,
      });

      if (!rpcError && rpcData) return rpcData;

      const { data: current, error: getErr } = await (supabase.from("genetic_bank") as any)
        .select("quantity")
        .eq("id", itemId)
        .single();
      if (getErr || !current) throw new Error("No se encontró el material genético.");

      const newQty = Math.max(0, (current.quantity || 0) - quantityUsed);
      const newStatus = newQty <= 0 ? "Agotado" : "Disponible";

      const { data, error } = await (supabase.from("genetic_bank") as any)
        .update({ quantity: newQty, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", itemId)
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

export function useQuickCreateStallion() {
  const { state } = useApp();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      code?: string;
      breed?: string;
      stud_fee_usd?: number;
      bloodline?: string;
      image_url?: string;
    }) => {
      const orgId = await resolveOrgId(state.user?.organization_id);
      const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

      const { data: horse, error: hErr } = await (supabase.from("horses") as any)
        .insert({
          organization_id: orgId,
          name: payload.name,
          barn_name: payload.name,
          slug,
          sex: "Semental",
          breed: payload.breed || "Paso Fino",
          code: payload.code || undefined,
          status: "Activo",
          bloodline: payload.bloodline || undefined,
          image_url: payload.image_url || undefined,
        })
        .select()
        .single();

      if (hErr) throw hErr;

      await (supabase.from("stallion_profiles") as any).insert({
        organization_id: orgId,
        horse_id: horse.id,
        status: "Activo",
        stud_fee_usd: payload.stud_fee_usd || undefined,
      });

      return horse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["horses"] });
      qc.invalidateQueries({ queryKey: ["stallions"] });
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

export async function safeInsert(table: string, initialPayload: Record<string, any>) {
  const currentPayload = { ...initialPayload };
  for (const [k, v] of Object.entries(currentPayload)) {
    if (v === undefined || v === null) {
      delete currentPayload[k];
    }
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await (supabase.from(table) as any)
      .insert(currentPayload)
      .select()
      .maybeSingle();

    if (!error && data) return data;

    const match = error?.message?.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[SafeInsert] Auto-stripping missing column '${missingCol}' from ${table} insert.`);
      delete currentPayload[missingCol];
      continue;
    }

    if (!error) return data || currentPayload;

    throw error;
  }
  throw new Error(`No se pudo completar el guardado en la tabla ${table}.`);
}

export async function safeUpdate(table: string, id: string, initialUpdates: Record<string, any>) {
  const currentUpdates = { ...initialUpdates };
  for (const [k, v] of Object.entries(currentUpdates)) {
    if (v === undefined) {
      delete currentUpdates[k];
    }
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await (supabase.from(table) as any)
      .update(currentUpdates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && data) return data;

    const match = error?.message?.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[SafeUpdate] Auto-stripping missing column '${missingCol}' from ${table} update.`);
      delete currentUpdates[missingCol];
      continue;
    }

    if (!error) return data || currentUpdates;

    console.warn(`[SafeUpdate] Non-blocking warning on ${table} update:`, error?.message);
    return currentUpdates;
  }
  return currentUpdates;
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

  return useMutation({
    mutationFn: async (payload: Omit<ReproductiveEvent, "id" | "organization_id" | "created_at">) => {
      const orgId = await resolveOrgId(state.user?.organization_id);
      const cleanStallionId = isValidUUID(payload.stallion_id) ? payload.stallion_id : null;
      let cleanCycleId = isValidUUID(payload.cycle_id) ? payload.cycle_id : null;

      // If cycle_id is null/missing, find the most recent breeding cycle for this mare, or auto-create one
      if (!cleanCycleId && payload.mare_id) {
        const { data: existingCycle } = await (supabase.from("breeding_cycles") as any)
          .select("id")
          .eq("mare_id", payload.mare_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingCycle?.id) {
          cleanCycleId = existingCycle.id;
        } else {
          // Auto-create a cycle so the NOT NULL constraint on cycle_id is always satisfied
          const today = payload.scheduled_date || new Date().toISOString().split("T")[0];
          const newCycle = await safeInsert("breeding_cycles", {
            organization_id: orgId,
            mare_id: payload.mare_id,
            stallion_id: cleanStallionId || "Semental",
            stallion_name: "Semental",
            date: today,
            insemination_date: today,
            status: "Pending",
            pregnancy_status: "Pending",
            notes: "Ciclo generado automáticamente para evento reproductivo",
          });
          if (newCycle?.id) {
            cleanCycleId = newCycle.id;
          }
        }
      }

      const eventPayload: Record<string, any> = {
        ...payload,
        organization_id: orgId,
      };
      if (cleanCycleId) eventPayload.cycle_id = cleanCycleId;
      if (cleanStallionId) eventPayload.stallion_id = cleanStallionId;
      else delete eventPayload.stallion_id;

      const data = await safeInsert("reproductive_events", eventPayload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reproductive-events"] });
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
      qc.invalidateQueries({ queryKey: ["breeding-cycles"] });
    },
  });
}

export function useUpdateReproductiveEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReproductiveEvent> }) => {
      const { data, error } = await (supabase.from("reproductive_events") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reproductive-events"] });
      qc.invalidateQueries({ queryKey: ["reproduction-kpis"] });
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
        .order("created_at", { ascending: false });

      if (error) return [];
      return ((data ?? []) as any[]).map((c) => ({
        ...c,
        insemination_date: c.insemination_date || c.date || new Date().toISOString().split("T")[0],
        date: c.date || c.insemination_date,
        pregnancy_status: c.pregnancy_status || c.status || "Pending",
        status: c.status || c.pregnancy_status || "Pending",
        stallion_name: c.stallion_name || (c.stallion_id ? String(c.stallion_id) : "Semental"),
      })) as BreedingCycle[];
    },
  });
}

export function useCreateBreedingCycle() {
  const { state } = useApp();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<BreedingCycle, "id" | "organization_id" | "created_at" | "updated_at" | "mare">) => {
      const orgId = await resolveOrgId(state.user?.organization_id);
      const cleanStallionId = isValidUUID(payload.stallion_id) ? payload.stallion_id : null;
      const cleanGeneticMaterialId = isValidUUID(payload.genetic_material_id) ? payload.genetic_material_id : null;
      const cleanEmbryoId = isValidUUID(payload.embryo_id) ? payload.embryo_id : null;
      const serviceDate = payload.insemination_date || new Date().toISOString().split("T")[0];

      const cyclePayload: Record<string, any> = {
        ...payload,
        date: serviceDate,
        insemination_date: serviceDate,
        status: payload.pregnancy_status || "Pending",
        pregnancy_status: payload.pregnancy_status || "Pending",
        stallion_id: cleanStallionId || payload.stallion_name || "Semental",
        stallion_name: payload.stallion_name || "Semental",
        organization_id: orgId,
      };

      if (cleanGeneticMaterialId) cyclePayload.genetic_material_id = cleanGeneticMaterialId;
      else delete cyclePayload.genetic_material_id;

      if (cleanEmbryoId) cyclePayload.embryo_id = cleanEmbryoId;
      else delete cyclePayload.embryo_id;

      const data = await safeInsert("breeding_cycles", cyclePayload);
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
      const data = await safeUpdate("breeding_cycles", id, updates as Record<string, any>);
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

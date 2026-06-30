import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";

export interface Location {
  id: string;
  farm_id: string;
  name: string;
  type: string;
  capacity: number | null;
  status: string | null;
  notes: string | null;
  address?: string | null;
  daily_boarding_cost?: number;
  area_hectares?: number;
  grass_type?: string;
  rotation_status?: string;
}

export interface StallUnit {
  id: string;
  location_id: string;
  stall_number: string;
  availability: boolean;
  horse_id: string | null;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocationMovement {
  id: string;
  horse_id: string;
  previous_location_id: string | null;
  new_location_id: string | null;
  stall_unit_id: string | null;
  start_date: string;
  end_date: string | null;
  responsible_id: string | null;
  reason: string | null;
  organization_id: string;
  created_at?: string;
  horse?: { name: string };
  previous_location?: { name: string };
  new_location?: { name: string };
  responsible?: { name: string };
  stall_unit?: { stall_number: string } | null;
}

export interface QuarantineRecord {
  id: string;
  horse_id: string;
  start_date: string;
  end_date: string | null;
  reason: string;
  responsible_id: string | null;
  notes: string | null;
  status: string;
  organization_id: string;
  created_at?: string;
  horse?: { name: string };
  responsible?: { name: string };
}

export interface TransportRecord {
  id: string;
  horse_id: string;
  origin: string;
  destination: string;
  date: string;
  reason: string | null;
  carrier_name: string | null;
  cost: number;
  invoice_id: string | null;
  notes: string | null;
  organization_id: string;
  created_at?: string;
  horse?: { name: string };
}

export function useLocations(farmId?: string, orgId?: string | null) {
  const { state } = useApp();
  const activeOrgId = orgId || state.user?.organization_id;

  return useQuery({
    queryKey: ["locations", farmId, activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];
      let query = (supabase as any).from("locations").select("*").eq("organization_id", activeOrgId);
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return data as Location[];
    },
    enabled: true,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: Omit<Location, "id">) => {
      const { data, error } = await (supabase as any).from("locations")
        .insert([location as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("locations").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useStallUnits(locationId?: string | null) {
  return useQuery<any[]>({
    queryKey: ["stall-units", locationId],
    queryFn: async () => {
      if (!locationId) return [];
      const { data, error } = await (supabase as any)
        .from("stall_units")
        .select(`
          *,
          horses:horse_id (
            name,
            breed,
            image_url
          )
        `)
        .eq("location_id", locationId)
        .order("stall_number", { ascending: true });

      if (error) throw error;
      const sorted = (data as any[] || []).sort((a, b) =>
        a.stall_number.localeCompare(b.stall_number, undefined, { numeric: true, sensitivity: 'base' })
      );
      return sorted;
    },
    enabled: !!locationId,
  });
}

export function useCreateStallUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStall: Omit<StallUnit, "id">) => {
      const { data, error } = await (supabase as any).from("stall_units")
        .insert([newStall])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stall-units", variables.location_id] });
    },
  });
}

export function useLocationHistory(horseId?: string, locationId?: string) {
  return useQuery<LocationMovement[]>({
    queryKey: ["location-history", horseId, locationId],
    queryFn: async () => {
      let query = (supabase as any).from("ccc_location_movements").select(`
        *,
        horse:horse_id(name),
        previous_location:previous_location_id(name),
        new_location:new_location_id(name),
        responsible:responsible_id(name),
        stall_unit:stall_unit_id(stall_number)
      `);
      if (horseId) query = query.eq("horse_id", horseId);
      if (locationId) query = query.eq("new_location_id", locationId);
      const { data, error } = await query.order("start_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useAssignHorseToStall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stallId,
      locationId,
      horseId,
      locationName,
      stallNumber,
      reason,
      responsibleId,
    }: {
      stallId: string | null;
      locationId: string;
      horseId: string;
      locationName: string;
      stallNumber: string | null;
      reason?: string;
      responsibleId?: string;
    }) => {
      // 1. Fetch location details
      const { data: loc, error: locError } = await (supabase as any)
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .single();
      if (locError) throw locError;

      // 2. Fetch horse details
      const { data: horse, error: horseError } = await (supabase as any)
        .from("horses")
        .select("name")
        .eq("id", horseId)
        .single();
      if (horseError) throw horseError;

      // 3. Find current active assignment to set end_date
      const { data: activeMovements, error: activeErr } = await (supabase as any)
        .from("ccc_location_movements")
        .select("id, new_location_id")
        .eq("horse_id", horseId)
        .is("end_date", null)
        .order("start_date", { ascending: false });
      if (activeErr) throw activeErr;

      const prevLocId = activeMovements && activeMovements.length > 0 ? activeMovements[0].new_location_id : null;
      if (activeMovements && activeMovements.length > 0) {
        const { error: updateMoveErr } = await (supabase as any)
          .from("ccc_location_movements")
          .update({ end_date: new Date().toISOString() })
          .eq("id", activeMovements[0].id);
        if (updateMoveErr) throw updateMoveErr;
      }

      // 4. Create new movement record
      const { data: movement, error: movError } = await (supabase as any).from("ccc_location_movements")
        .insert({
          horse_id: horseId,
          previous_location_id: prevLocId,
          new_location_id: locationId,
          stall_unit_id: stallId,
          start_date: new Date().toISOString(),
          responsible_id: responsibleId || null,
          reason: reason || "Traslado general",
        })
        .select()
        .single();
      if (movError) throw movError;

      // 4.5. Clear horse from any previous stalls
      const { error: clearStallErr } = await (supabase as any)
        .from("stall_units")
        .update({ horse_id: null, availability: true })
        .eq("horse_id", horseId);
      if (clearStallErr) throw clearStallErr;

      // 5. Update stall unit if provided
      if (stallId) {
        const { error: updateStallErr } = await (supabase as any)
          .from("stall_units")
          .update({ horse_id: horseId, availability: false })
          .eq("id", stallId);
        if (updateStallErr) throw updateStallErr;
      }

      // 6. Update the horse's location text field
      let horseLocationText = locationName;
      if (stallNumber) {
        horseLocationText += ` · Pesebrera ${stallNumber}`;
      }
      const { error: updateHorseErr } = await (supabase as any)
        .from("horses")
        .update({ location: horseLocationText })
        .eq("id", horseId);
      if (updateHorseErr) throw updateHorseErr;

      // 7. Automated Clinical Integration
      if (loc.type?.toLowerCase() === "clinic" || loc.type?.toLowerCase() === "clínica") {
        // Fetch profiles to get professional name
        let responsibleName = "Personal del Criadero";
        if (responsibleId) {
          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("name")
            .eq("id", responsibleId)
            .single();
          if (profile) responsibleName = profile.name;
        }

        await (supabase as any).from("health_records")
          .insert({
            horse_id: horseId,
            horse_name: horse.name,
            type: "Procedimiento",
            title: "Traslado Clínico a " + loc.name,
            notes: reason || "Ingreso a clínica veterinaria para observación.",
            professional: responsibleName,
            date: new Date().toISOString().split("T")[0],
            status: "clear",
            category: "Clínica",
          });
      }

      // 8. Automated Financial Integration (Boarding Expense)
      if (loc.daily_boarding_cost && Number(loc.daily_boarding_cost) > 0) {
        await (supabase as any).from("invoices")
          .insert({
            farm_id: loc.farm_id,
            type: "Expense",
            category: "Boarding",
            amount: Number(loc.daily_boarding_cost),
            status: "Pending",
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Gasto estimado por hospedaje diario en ${loc.name} para ${horse.name} (${reason || 'Hospedaje'})`,
          });
      }

      return movement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stall-units"] });
      queryClient.invalidateQueries({ queryKey: ["location-history"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["health_records"] });
    },
  });
}

export function useVacateStall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stallId,
      locationId,
      horseId,
    }: {
      stallId: string | null;
      locationId: string;
      horseId?: string | null;
    }) => {
      // 1. Update the stall unit if provided
      if (stallId) {
        await (supabase as any)
          .from("stall_units")
          .update({ horse_id: null, availability: true })
          .eq("id", stallId);
      }

      // 2. Mark active movement as ended
      if (horseId) {
        const { data: activeMovements } = await (supabase as any)
          .from("ccc_location_movements")
          .select("id, new_location_id")
          .eq("horse_id", horseId)
          .is("end_date", null)
          .order("start_date", { ascending: false });

        if (activeMovements && activeMovements.length > 0) {
          await (supabase as any)
            .from("ccc_location_movements")
            .update({ end_date: new Date().toISOString() })
            .eq("id", activeMovements[0].id);
        }

        // Reset horse's location field
        await (supabase as any)
          .from("horses")
          .update({ location: "Sin Pesebrera Asignada" })
          .eq("id", horseId);
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stall-units"] });
      queryClient.invalidateQueries({ queryKey: ["location-history"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
    },
  });
}

export function useQuarantineHistory(horseId?: string) {
  return useQuery<QuarantineRecord[]>({
    queryKey: ["quarantine-history", horseId],
    queryFn: async () => {
      let query = (supabase as any).from("ccc_quarantine_records").select(`
        *,
        horse:horse_id(name),
        responsible:responsible_id(name)
      `);
      if (horseId) query = query.eq("horse_id", horseId);
      const { data, error } = await query.order("start_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<QuarantineRecord, "id" | "organization_id" | "created_at">) => {
      const { data, error } = await (supabase as any).from("ccc_quarantine_records")
        .insert([record])
        .select()
        .single();
      if (error) throw error;

      // End active location movement
      const { data: activeMovements } = await (supabase as any)
        .from("ccc_location_movements")
        .select("id")
        .eq("horse_id", record.horse_id)
        .is("end_date", null)
        .order("start_date", { ascending: false });

      if (activeMovements && activeMovements.length > 0) {
        await (supabase as any)
          .from("ccc_location_movements")
          .update({ end_date: new Date().toISOString() })
          .eq("id", activeMovements[0].id);
      }

      // Automatically set the horse's location status to quarantined
      await (supabase as any)
        .from("horses")
        .update({ location: "Área de Cuarentena / Aislamiento" })
        .eq("id", record.horse_id);

      // Clear horse from any previous stalls
      await (supabase as any)
        .from("stall_units")
        .update({ horse_id: null, availability: true })
        .eq("horse_id", record.horse_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarantine-history"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
      queryClient.invalidateQueries({ queryKey: ["stall-units"] });
    },
  });
}

export function useReleaseQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, horseId, notes }: { id: string; horseId: string; notes?: string }) => {
      const { data, error } = await (supabase as any).from("ccc_quarantine_records")
        .update({ status: "Released", end_date: new Date().toISOString(), notes })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Reset location of the horse
      await (supabase as any)
        .from("horses")
        .update({ location: "Liberado de Cuarentena" })
        .eq("id", horseId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarantine-history"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
    },
  });
}

export function useTransportHistory(horseId?: string) {
  return useQuery<TransportRecord[]>({
    queryKey: ["transport-history", horseId],
    queryFn: async () => {
      let query = (supabase as any).from("ccc_transports").select(`
        *,
        horse:horse_id(name)
      `);
      if (horseId) query = query.eq("horse_id", horseId);
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<TransportRecord, "id" | "organization_id" | "created_at" | "invoice_id">) => {
      // 1. Fetch first farm to ensure we have a valid farm_id
      const { data: farms } = await (supabase as any).from("farms").select("id").limit(1);
      const farmId = farms && farms.length > 0 ? farms[0].id : "live-oak-stables";

      // 2. If cost > 0, generate expense invoice
      let invoiceId: string | null = null;
      if (record.cost && Number(record.cost) > 0) {
        const { data: invoice } = await (supabase as any).from("invoices")
          .insert({
            farm_id: farmId,
            type: "Expense",
            category: "Supplies", // transport supplies/fees
            amount: Number(record.cost),
            status: "Pending",
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Gasto de transporte: ${record.origin} ➔ ${record.destination} (${record.carrier_name || 'Particular'})`,
          })
          .select()
          .single();

        if (invoice) {
          invoiceId = invoice.id;
        }
      }

      // 3. Create transport record
      const { data, error } = await (supabase as any).from("ccc_transports")
        .insert([{ ...record, invoice_id: invoiceId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-history"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCompetitionLocations(horseId?: string) {
  return useQuery<any[]>({
    queryKey: ["competition-locations", horseId],
    queryFn: async () => {
      let query = (supabase as any).from("ccc_competition_locations").select(`
        *,
        horse:horse_id(name)
      `);
      if (horseId) query = query.eq("horse_id", horseId);
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateCompetitionLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: { horse_id: string; event_name: string; date: string; location: string; status: string }) => {
      const { data, error } = await (supabase as any).from("ccc_competition_locations")
        .insert([record])
        .select()
        .single();
      if (error) throw error;

      // End active location movement
      const { data: activeMovements } = await (supabase as any)
        .from("ccc_location_movements")
        .select("id")
        .eq("horse_id", record.horse_id)
        .is("end_date", null)
        .order("start_date", { ascending: false });

      if (activeMovements && activeMovements.length > 0) {
        await (supabase as any)
          .from("ccc_location_movements")
          .update({ end_date: new Date().toISOString() })
          .eq("id", activeMovements[0].id);
      }

      // Sync horse current location
      await (supabase as any)
        .from("horses")
        .update({ location: `Feria: ${record.event_name} (${record.location})` })
        .eq("id", record.horse_id);

      // Clear horse from any previous stalls
      await (supabase as any)
        .from("stall_units")
        .update({ horse_id: null, availability: true })
        .eq("horse_id", record.horse_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-locations"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["horse"] });
      queryClient.invalidateQueries({ queryKey: ["stall-units"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Partial<Location> & { id: string }) => {
      const { data, error } = await (supabase as any).from("locations")
        .update(location)
        .eq("id", location.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

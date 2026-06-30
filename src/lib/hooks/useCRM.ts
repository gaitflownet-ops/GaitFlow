import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInteraction = Database["public"]["Tables"]["contact_interactions"]["Row"];

// We define custom types for the new tables since they might not be in supabase.types yet (until regenerated)
export type ActivityTimelineLog = {
  id: string;
  organization_id: string;
  user_id: string | null;
  date: string;
  module_source: string;
  action_type: string;
  action_details: string | null;
  horse_id: string | null;
  contact_id: string | null;
  reference_id: string | null;
  created_at: string;
  horses?: { name: string } | null;
  contacts?: { name: string } | null;
};

export type HorseContact = {
  id: string;
  organization_id: string;
  horse_id: string;
  contact_id: string;
  relationship_category: string;
  relationship_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useContacts(typeFilter?: string) {
  return useQuery<Contact[]>({
    queryKey: ["contacts", typeFilter],
    queryFn: async () => {
      let query = supabase.from("contacts").select("*").order("name", { ascending: true });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContact: Omit<Database["public"]["Tables"]["contacts"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("contacts") as any)
        .insert([newContact])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Database["public"]["Tables"]["contacts"]["Update"]>;
    }) => {
      const { data, error } = await (supabase.from("contacts") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useContactInteractions(contactId: string) {
  return useQuery<ContactInteraction[]>({
    queryKey: ["contact-interactions", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as ContactInteraction[];
    },
    enabled: !!contactId,
  });
}

export function useCreateContactInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newInteraction: Omit<Database["public"]["Tables"]["contact_interactions"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("contact_interactions") as any)
        .insert([newInteraction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-interactions", variables.contact_id] });
    },
  });
}

// -----------------------------------------
// NEW HOOKS: ACTIVITY TIMELINE LOGS
// -----------------------------------------

export function useActivityTimeline(contactId?: string, horseId?: string) {
  return useQuery<ActivityTimelineLog[]>({
    queryKey: ["activity-timeline", contactId, horseId],
    queryFn: async () => {
      let query = supabase
        .from("activity_timeline_logs")
        .select(`
          *,
          horses:horse_id ( name ),
          contacts:contact_id ( name )
        `)
        .order("date", { ascending: false });

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }
      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      // If neither is provided, we fetch all org timeline
      const { data, error } = await query.limit(100); // reasonable limit for timeline

      if (error && error.code !== '42P01') throw error; // ignore relation does not exist yet (before SQL script)
      return (data || []) as ActivityTimelineLog[];
    },
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLog: Omit<ActivityTimelineLog, "id" | "created_at">) => {
      const { data, error } = await (supabase.from("activity_timeline_logs") as any)
        .insert([newLog])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activity-timeline"] });
    },
  });
}

// -----------------------------------------
// NEW HOOKS: HORSE CONTACTS (Relationships)
// -----------------------------------------

export function useHorseContacts(contactId?: string, horseId?: string) {
  return useQuery<(HorseContact & { horses?: { name: string }, contacts?: { name: string, type: string } })[]>({
    queryKey: ["horse-contacts", contactId, horseId],
    queryFn: async () => {
      let query = supabase
        .from("horse_contacts")
        .select(`
          *,
          horses:horse_id ( name ),
          contacts:contact_id ( name, type )
        `)
        .order("start_date", { ascending: false });

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }
      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query;
      if (error && error.code !== '42P01') throw error; // ignore relation does not exist yet
      return data || [];
    },
  });
}

export function useCreateHorseContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRel: Omit<HorseContact, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase.from("horse_contacts") as any)
        .insert([newRel])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["horse-contacts"] });
    },
  });
}

export function useDeleteHorseContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("horse_contacts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horse-contacts"] });
    },
  });
}

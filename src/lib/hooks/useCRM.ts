import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInteraction = Database["public"]["Tables"]["contact_interactions"]["Row"];

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

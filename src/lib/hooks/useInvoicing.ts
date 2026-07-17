import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  contact?: {
    first_name: string;
    last_name: string;
    company_name: string | null;
    email: string | null;
  };
  items?: InvoiceItem[];
};
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export type InvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"];
export type InvoicePaymentInsert = Database["public"]["Tables"]["invoice_payments"]["Insert"];

export type InvoiceTemplate = Database["public"]["Tables"]["invoice_templates"]["Row"];

export function useInvoices(organizationId?: string) {
  return useQuery({
    queryKey: ["invoices", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contact:contact_id (first_name, last_name, company_name, email)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!organizationId,
  });
}

export function useInvoiceDetails(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contact:contact_id (first_name, last_name, company_name, email, phone),
          items:invoice_items (*)
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!invoiceId,
  });
}

export function useInvoicePayments(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice-payments", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as InvoicePayment[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: InvoiceInsert;
      items: Omit<InvoiceItemInsert, "invoice_id">[];
    }) => {
      // 1. Crear Factura
      const { data: createdInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert(invoice)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 2. Crear Items
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          invoice_id: createdInvoice.id,
        }));
        
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert);
          
        if (itemsError) {
          console.error("Error inserting items:", itemsError);
          // Opcionalmente se podría borrar la factura aquí (rollback) o intentar de nuevo
        }
      }

      return createdInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
    },
  });
}

export function useAddInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: InvoicePaymentInsert) => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-payments", data.invoice_id] });
    },
  });
}

// ── Plantillas de Factura ──

export function useInvoiceTemplate(organizationId?: string) {
  return useQuery({
    queryKey: ["invoice-template", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      // Si no existe, supabase tira error PGROUTINE (0 rows) y lo ignoramos si es "PGRST116"
      if (error && error.code !== "PGRST116") throw error;
      return data as InvoiceTemplate | null;
    },
    enabled: !!organizationId,
  });
}

export function useSaveInvoiceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Database["public"]["Tables"]["invoice_templates"]["Insert"]) => {
      const { data, error } = await supabase
        .from("invoice_templates")
        .upsert(template, { onConflict: "organization_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-template", variables.organization_id] });
    },
  });
}

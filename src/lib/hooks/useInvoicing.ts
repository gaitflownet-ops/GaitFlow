import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  contact?: {
    name: string;
    email: string | null;
    phone?: string | null;
    tax_id?: string | null;
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
          contact:contact_id (name, email, phone, tax_id)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const now = new Date().toISOString().split("T")[0];
      return (data as Invoice[]).map(inv => ({
        ...inv,
        status: (inv.status === "pending" && inv.due_date < now) ? "overdue" : inv.status
      }));
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
          contact:contact_id (name, email, phone, tax_id),
          items:invoice_items (*)
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      const inv = data as Invoice;
      const now = new Date().toISOString().split("T")[0];
      if (inv.status === "pending" && inv.due_date < now) {
        inv.status = "overdue";
      }
      return inv;
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

export function useSaveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: Record<string, any>;
      items: Record<string, any>[];
    }) => {
      const isUpdate = !!invoice.id;
      let savedInvoice;

      if (isUpdate) {
        // Update
        const { data, error } = await (supabase as any)
          .from("invoices")
          .update(invoice)
          .eq("id", invoice.id)
          .select()
          .single();
        if (error) throw new Error("Error al actualizar factura: " + error.message);
        savedInvoice = data;

        // Delete old items
        await (supabase as any).from("invoice_items").delete().eq("invoice_id", invoice.id);
      } else {
        // Insert
        const { data, error } = await (supabase as any)
          .from("invoices")
          .insert(invoice)
          .select()
          .single();
        if (error) throw new Error("Error al crear factura: " + error.message);
        savedInvoice = data;
      }

      // 2. Insert Items
      const validItems = items.filter((item) => item.product_name?.trim());
      if (validItems.length > 0) {
        const itemsToInsert = validItems.map((item) => {
          const { id, ...rest } = item; // Quitar ID para evitar conflictos
          return { ...rest, invoice_id: savedInvoice.id };
        });

        const { error: itemsError } = await (supabase as any)
          .from("invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw new Error("Error al guardar conceptos: " + itemsError.message);
      }

      return savedInvoice;
    },
    onSuccess: () => {
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

      // Automatización: Crear transacción financiera automáticamente
      try {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("organization_id, document_type, contact_id, cost_center_id, invoice_number")
          .eq("id", payment.invoice_id)
          .single();

        if (invoice) {
          const { data: defaultAccount } = await supabase
            .from("financial_accounts")
            .select("id")
            .eq("organization_id", invoice.organization_id)
            .eq("is_default", true)
            .maybeSingle();

          const transType = (invoice.document_type === "invoice" || invoice.document_type === "debit_note") ? "income" : "expense";
          
          await supabase
            .from("financial_transactions")
            .insert({
              organization_id: invoice.organization_id,
              type: transType,
              account_id: defaultAccount?.id || null,
              cost_center_id: invoice.cost_center_id || null,
              amount: payment.amount_applied,
              currency: "COP",
              description: `Abono/Pago a factura ${invoice.invoice_number}`,
              date: payment.payment_date,
              status: "completed",
              contact_id: invoice.contact_id,
              invoice_id: payment.invoice_id,
              source_module: "invoicing",
              source_ref_id: data.id,
              source_ref_type: "invoice_payment"
            } as any);
        }
      } catch (err) {
        console.error("Error al crear transacción financiera automática:", err);
        // No bloqueamos el pago si la transacción falla
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-payments", data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
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
    mutationFn: async (template: Record<string, any>) => {
      // Cast as any para soportar columnas nuevas: city, website, tax_regime, invoice_prefix, legal_text
      const { data, error } = await (supabase as any)
        .from("invoice_templates")
        .upsert(template, { onConflict: "organization_id" })
        .select()
        .single();

      if (error) throw new Error("Error: " + error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-template", variables.organization_id] });
    },
  });
}

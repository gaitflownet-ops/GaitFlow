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
        status: (inv.status === "pending" && inv.due_date && inv.due_date < now) ? "overdue" : inv.status
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
      if (inv.status === "pending" && inv.due_date && inv.due_date < now) {
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
      // [ARQ-001]: La transacción en el libro mayor y la notificación en Event Bus ahora 
      // son generadas de forma atómica en el servidor por el trigger trg_invoice_payment_to_ledger
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

// ─── RESOLUCIONES DE FACTURACIÓN (DIAN / SAT / SRI) ─────────────────────────

export interface InvoiceResolution {
  id: string;
  organization_id: string;
  resolution_number: string;
  prefix: string;
  start_number: number;
  end_number: number;
  current_number: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

export function useInvoiceResolutions(organizationId?: string) {
  return useQuery<InvoiceResolution[]>({
    queryKey: ["invoice-resolutions", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await (supabase as any)
        .from("invoice_resolutions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateInvoiceResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (res: Partial<InvoiceResolution>) => {
      const { data, error } = await (supabase as any)
        .from("invoice_resolutions")
        .insert(res)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-resolutions", data.organization_id] });
    },
  });
}

// ─── AUTOMATION DISPATCHER & CORREOS ELECTRÓNICOS ───────────────────────────

export function useProcessAutomationQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (limit: number = 25) => {
      const { data, error } = await (supabase as any).rpc("process_automation_queue", { p_limit: limit });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["global-timeline"] });
    },
  });
}

export function useSendInvoiceEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      email,
      organizationId,
      invoiceNumber,
    }: {
      invoiceId: string;
      email: string;
      organizationId: string;
      invoiceNumber: string;
    }) => {
      // 1. Despachar evento a la cola
      const { error: evErr } = await (supabase as any)
        .from("system_events_queue")
        .insert({
          organization_id: organizationId,
          module: "invoicing",
          event_name: "invoice.email.sent",
          payload: {
            invoice_id: invoiceId,
            recipient_email: email,
            description: `Factura ${invoiceNumber} enviada por correo electrónico a ${email}`,
          },
          status: "pending",
        });
      if (evErr) throw evErr;

      // 2. Ejecutar procesamiento de cola de inmediato (simula Edge Worker en caliente)
      await (supabase as any).rpc("process_automation_queue", { p_limit: 10 });

      // 3. Actualizar estado de factura a 'sent' si estaba como borrador
      const { error: updErr } = await (supabase as any)
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId)
        .eq("status", "draft");

      if (updErr) throw updErr;
      return { success: true };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", vars.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["global-timeline"] });
    },
  });
}

// ─── CONVERSIÓN DE COTIZACIÓN A FACTURA DE VENTA ────────────────────────────

export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quoteId,
      organizationId,
    }: {
      quoteId: string;
      organizationId: string;
    }) => {
      // 1. Obtener la cotización original
      const { data: quote, error: quoteErr } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*)")
        .eq("id", quoteId)
        .single();

      if (quoteErr || !quote) throw quoteErr || new Error("Cotización no encontrada");

      // 2. Crear nueva factura de venta oficial
      const newInvoiceNumber = `FACT-${Date.now().toString().slice(-6)}`;
      const { data: newInvoice, error: invErr } = await (supabase as any)
        .from("invoices")
        .insert({
          organization_id: organizationId,
          contact_id: quote.contact_id,
          invoice_number: newInvoiceNumber,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: quote.due_date,
          status: "draft",
          subtotal: quote.subtotal,
          total_tax: quote.total_tax,
          total_amount: quote.total_amount,
          balance_due: quote.total_amount,
          notes: `Factura generada desde Cotización #${quote.invoice_number}. ${quote.notes || ""}`,
          terms: quote.terms,
          currency: (quote as any).currency || "COP",
          document_type: "invoice",
          parent_invoice_id: quote.id,
        })
        .select()
        .single();

      if (invErr) throw invErr;

      // 3. Copiar las líneas de ítems
      const itemsToInsert = ((quote as any).items || []).map((item: any) => ({
        invoice_id: newInvoice.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.total,
        horse_id: item.horse_id,
        category: item.category,
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsErr } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert);
        if (itemsErr) throw itemsErr;
      }

      // 4. Marcar cotización como pagada/facturada en el sistema
      await (supabase as any)
        .from("invoices")
        .update({ status: "paid", notes: `${quote.notes || ""} [Facturada -> ${newInvoiceNumber}]` })
        .eq("id", quoteId);

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ─── REVERSIÓN DE PAGO / ABONO ──────────────────────────────────────────────

export function useReverseInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      invoiceId,
      amount,
    }: {
      paymentId: string;
      invoiceId: string;
      amount: number;
    }) => {
      // 1. Eliminar o registrar reversión en invoice_payments
      const { error: delErr } = await supabase
        .from("invoice_payments")
        .delete()
        .eq("id", paymentId);

      if (delErr) throw delErr;

      // 2. Restaurar saldo balance_due en la factura
      const { data: currentInv, error: getErr } = await supabase
        .from("invoices")
        .select("balance_due, total_amount")
        .eq("id", invoiceId)
        .single();

      if (getErr || !currentInv) throw getErr || new Error("Factura no encontrada");

      const newBalance = Number(currentInv.balance_due || 0) + Number(amount);
      const newStatus = newBalance >= Number(currentInv.total_amount || 0) ? "pending" : "partial";

      const { error: updErr } = await (supabase as any)
        .from("invoices")
        .update({
          balance_due: newBalance,
          status: newStatus,
        })
        .eq("id", invoiceId);

      if (updErr) throw updErr;
      return { success: true };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", vars.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoice-payments", vars.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
    },
  });
}


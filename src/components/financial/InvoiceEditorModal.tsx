import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Save, Send, ChevronDown, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { useCreateInvoice } from "@/lib/hooks/useInvoicing";
import { useContacts } from "@/lib/hooks/useCRM";
import { useHorses } from "@/lib/hooks/useHorses";
import { toast } from "sonner";
import type { InvoiceItemInsert } from "@/lib/hooks/useInvoicing";

// ─── Tipos de Documento ───────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: "invoice",      label: "Factura de Venta",   color: "text-blue-600"    },
  { value: "quote",        label: "Cotización / Presupuesto", color: "text-amber-600" },
  { value: "debit_note",   label: "Nota Débito",        color: "text-orange-600"  },
  { value: "credit_note",  label: "Nota Crédito",       color: "text-emerald-600" },
];

const PAYMENT_CONDITIONS = [
  { value: "immediate", label: "Pago de Contado" },
  { value: "15_days",   label: "A 15 días" },
  { value: "30_days",   label: "A 30 días" },
  { value: "60_days",   label: "A 60 días" },
];

const fmtCurrency = (v: number, currency: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

// ─── Componente principal ─────────────────────────────────────────────────────

export function InvoiceEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const createMutation = useCreateInvoice();

  const { data: contacts } = useContacts();
  const { data: horses }   = useHorses();

  // ── Estado del formulario ──
  const [documentType,      setDocumentType]      = useState("invoice");
  const [contactId,         setContactId]         = useState("");
  const [currency,          setCurrency]          = useState("COP");
  const [paymentCondition,  setPaymentCondition]  = useState("immediate");
  const [issueDate,         setIssueDate]         = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate,           setDueDate]           = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split("T")[0];
  });
  const [notes,  setNotes]  = useState("");
  const [terms,  setTerms]  = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);

  const [items, setItems] = useState<Partial<InvoiceItemInsert & { discount_pct: number }>[]>([
    { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 }
  ]);

  // Auto-calcular vencimiento según condición de pago
  useEffect(() => {
    if (!issueDate) return;
    const base = new Date(issueDate);
    const days: Record<string, number> = { immediate: 0, "15_days": 15, "30_days": 30, "60_days": 60 };
    base.setDate(base.getDate() + (days[paymentCondition] ?? 0));
    setDueDate(base.toISOString().split("T")[0]);
  }, [paymentCondition, issueDate]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setContactId(""); setDocumentType("invoice"); setGlobalDiscount(0);
      setItems([{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 }]);
      setNotes(""); setTerms(""); setPaymentCondition("immediate");
    }
  }, [open]);

  // ── Cálculos en tiempo real ──
  const calculations = useMemo(() => {
    let subtotal = 0;
    let tax_amount = 0;
    let total_discounts = 0;

    const validItems = items.map(item => {
      const q   = Number(item.quantity)     || 0;
      const p   = Number(item.unit_price)   || 0;
      const t   = Number(item.tax_rate)     || 0;
      const d   = Number((item as any).discount_pct) || 0;

      const lineBase     = q * p;
      const lineDiscount = lineBase * (d / 100);
      const lineNet      = lineBase - lineDiscount;
      const lineTax      = lineNet * (t / 100);
      const lineTotal    = lineNet + lineTax;

      subtotal        += lineNet;
      tax_amount      += lineTax;
      total_discounts += lineDiscount;

      return { ...item, total: lineTotal };
    });

    const discountGlobal = subtotal * (globalDiscount / 100);
    const finalSubtotal  = subtotal - discountGlobal;
    const total          = finalSubtotal + tax_amount;

    return { subtotal, tax_amount, total_discounts: total_discounts + discountGlobal, total, validItems };
  }, [items, globalDiscount]);

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "sent") => {
    if (!orgId)      return toast.error("Sin organización");
    if (!contactId)  return toast.error("Selecciona un cliente");
    if (!items[0]?.product_name) return toast.error("Añade al menos un concepto");

    try {
      const prefix = documentType === "quote" ? "COT" : documentType === "debit_note" ? "ND" : documentType === "credit_note" ? "NC" : "GF";
      const invNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await createMutation.mutateAsync({
        invoice: {
          organization_id: orgId,
          contact_id: contactId,
          invoice_number: invNumber,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          status,
          document_type: documentType,
          payment_condition: paymentCondition,
          subtotal: calculations.subtotal,
          tax_amount: calculations.tax_amount,
          discount_amount: calculations.total_discounts,
          total: calculations.total,
          balance_due: calculations.total,
          notes,
          terms,
        } as any,
        items: calculations.validItems as any,
      });

      toast.success(status === "sent" ? "Factura emitida" : "Borrador guardado");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la factura");
    }
  };

  const addItem    = () => setItems(p => [...p, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => {
    setItems(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
  };

  const selectedDocType = DOCUMENT_TYPES.find(d => d.value === documentType);

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-3 -translate-x-1/2 w-full max-w-5xl max-h-[97vh] overflow-hidden flex flex-col bg-card rounded-2xl shadow-2xl z-50 border border-border/50">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <Dialog.Title className="text-lg font-display leading-none">
                  Nuevo Documento
                </Dialog.Title>
                <p className={`text-xs mt-0.5 font-medium ${selectedDocType?.color}`}>
                  {selectedDocType?.label}
                </p>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-hidden flex">

            {/* Formulario principal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ── BLOQUE 1: Información General ── */}
              <section className="inv-section">
                <h3 className="inv-section-title">
                  <span className="inv-section-num">1</span>
                  Información General
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Tipo de Documento */}
                  <div className="col-span-2 form-group">
                    <label>Tipo de Documento *</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {DOCUMENT_TYPES.map(dt => (
                        <button
                          key={dt.value}
                          type="button"
                          onClick={() => setDocumentType(dt.value)}
                          className={`inv-type-btn ${documentType === dt.value ? "active" : ""}`}
                        >
                          {dt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="col-span-2 form-group">
                    <label>Cliente *</label>
                    <select
                      className="form-input"
                      value={contactId}
                      onChange={e => setContactId(e.target.value)}
                    >
                      <option value="">Selecciona un cliente...</option>
                      {contacts?.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}{c.company_name ? ` — ${c.company_name}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Moneda */}
                  <div className="form-group">
                    <label>Moneda</label>
                    <div className="flex mt-1 rounded-lg border border-border overflow-hidden">
                      {["COP", "USD"].map(cur => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setCurrency(cur)}
                          className={`flex-1 py-2 text-sm font-medium transition-colors ${
                            currency === cur
                              ? "bg-card text-foreground shadow-sm"
                              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── BLOQUE 2: Información Comercial ── */}
              <section className="inv-section">
                <h3 className="inv-section-title">
                  <span className="inv-section-num">2</span>
                  Información Comercial
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group">
                    <label>Fecha de Emisión</label>
                    <input type="date" className="form-input" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Condición de Pago</label>
                    <select className="form-input" value={paymentCondition} onChange={e => setPaymentCondition(e.target.value)}>
                      {PAYMENT_CONDITIONS.map(pc => (
                        <option key={pc.value} value={pc.value}>{pc.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha de Vencimiento</label>
                    <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  <div className="col-span-2 md:col-span-4 form-group">
                    <label>Observaciones / Notas para el cliente</label>
                    <textarea className="form-input text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pago de pensión mes de julio 2026" />
                  </div>
                </div>
              </section>

              {/* ── BLOQUE 3: Conceptos ── */}
              <section className="inv-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="inv-section-title mb-0">
                    <span className="inv-section-num">3</span>
                    Conceptos a Facturar
                  </h3>
                  <button type="button" onClick={addItem} className="btn-secondary text-sm py-1.5 px-3">
                    <Plus size={14} /> Añadir línea
                  </button>
                </div>

                {/* Cabecera tabla */}
                <div className="inv-table-header">
                  <div className="flex-1 min-w-[180px]">Servicio / Producto</div>
                  <div className="w-28 text-center">Caballo</div>
                  <div className="w-14 text-center">Cant.</div>
                  <div className="w-28 text-right">Precio Unit.</div>
                  <div className="w-16 text-center">Desc. %</div>
                  <div className="w-16 text-center">IVA %</div>
                  <div className="w-28 text-right">Subtotal</div>
                  <div className="w-8"></div>
                </div>

                {/* Filas de ítems */}
                <div className="space-y-2 mt-1">
                  {items.map((item, idx) => {
                    const q = Number(item.quantity) || 0;
                    const p = Number(item.unit_price) || 0;
                    const d = Number((item as any).discount_pct) || 0;
                    const t = Number(item.tax_rate) || 0;
                    const lineTotal = (q * p * (1 - d/100)) * (1 + t/100);

                    return (
                      <div key={idx} className="inv-item-row">
                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            className="form-input text-sm"
                            placeholder="Descripción del servicio..."
                            value={item.product_name}
                            onChange={e => updateItem(idx, "product_name", e.target.value)}
                          />
                        </div>
                        <div className="w-28">
                          <select
                            className="form-input text-xs text-muted-foreground"
                            value={item.horse_id || ""}
                            onChange={e => updateItem(idx, "horse_id", e.target.value || null)}
                          >
                            <option value="">— Ninguno —</option>
                            {horses?.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                        </div>
                        <div className="w-14">
                          <input
                            type="number" min="1"
                            className="form-input text-sm text-center px-1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            className="form-input text-sm text-right"
                            placeholder="0"
                            value={item.unit_price}
                            onChange={e => updateItem(idx, "unit_price", e.target.value)}
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number" min="0" max="100"
                            className="form-input text-sm text-center px-1"
                            placeholder="0"
                            value={(item as any).discount_pct || ""}
                            onChange={e => updateItem(idx, "discount_pct", e.target.value)}
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number" min="0" max="100"
                            className="form-input text-sm text-center px-1"
                            placeholder="0"
                            value={item.tax_rate || ""}
                            onChange={e => updateItem(idx, "tax_rate", e.target.value)}
                          />
                        </div>
                        <div className="w-28 text-right text-sm font-medium self-center pr-1">
                          {fmtCurrency(lineTotal, currency)}
                        </div>
                        <div className="w-8 self-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors rounded-md hover:bg-red-500/10">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── BLOQUE 4: Términos ── */}
              <section className="inv-section">
                <h3 className="inv-section-title">
                  <span className="inv-section-num">4</span>
                  Términos y Condiciones
                </h3>
                <textarea
                  className="form-input text-sm w-full"
                  rows={2}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  placeholder="Ej: El pago debe realizarse por transferencia bancaria a Bancolombia #001-23456-78..."
                />
              </section>

            </div>

            {/* ── Sidebar Resumen (sticky) ── */}
            <div className="inv-summary-sidebar">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Resumen</h4>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal bruto</span>
                  <span>{fmtCurrency(calculations.subtotal + calculations.total_discounts - (calculations.subtotal * (globalDiscount/100) > 0 ? calculations.total_discounts - calculations.subtotal * (globalDiscount/100) : 0), currency)}</span>
                </div>
                {calculations.total_discounts > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuentos</span>
                    <span>−{fmtCurrency(calculations.total_discounts, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal neto</span>
                  <span className="font-medium">{fmtCurrency(calculations.subtotal, currency)}</span>
                </div>
                {calculations.tax_amount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Impuestos</span>
                    <span>+{fmtCurrency(calculations.tax_amount, currency)}</span>
                  </div>
                )}
              </div>

              {/* Descuento global */}
              <div className="mt-4 pt-4 border-t border-border">
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Descuento global (%)</label>
                <input
                  type="number" min="0" max="100"
                  className="form-input text-sm w-full"
                  placeholder="0"
                  value={globalDiscount || ""}
                  onChange={e => setGlobalDiscount(Number(e.target.value))}
                />
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total {currency}</span>
                  <span className="text-2xl font-display font-bold text-foreground">{fmtCurrency(calculations.total, currency)}</span>
                </div>
              </div>

              {/* Info de tipo */}
              {documentType === "quote" && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Las cotizaciones no tienen validez fiscal. Son documentos de oferta comercial.</span>
                </div>
              )}

              {/* Acciones */}
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  onClick={() => handleSubmit("sent")}
                  disabled={createMutation.isPending}
                >
                  <Send size={15} />
                  {documentType === "quote" ? "Emitir Cotización" : "Emitir Documento"}
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full justify-center"
                  onClick={() => handleSubmit("draft")}
                  disabled={createMutation.isPending}
                >
                  <Save size={15} /> Guardar Borrador
                </button>
                <button type="button" className="btn-ghost w-full justify-center text-sm" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

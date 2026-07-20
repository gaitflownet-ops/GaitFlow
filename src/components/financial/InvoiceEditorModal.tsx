import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Save, Send, ChevronDown, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { useSaveInvoice, useInvoiceDetails } from "@/lib/hooks/useInvoicing";
import { useContacts, useCreateContact } from "@/lib/hooks/useCRM";
import { useHorses } from "@/lib/hooks/useHorses";
import { useFinancialCostCenters } from "@/lib/hooks/useFinancialCostCenters";
import { toast } from "sonner";
import type { InvoiceItemInsert } from "@/lib/hooks/useInvoicing";

// ─── Tipos de Documento ───────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: "invoice",      label: "Factura de Venta" },
  { value: "quote",        label: "Cotización / Presupuesto" },
  { value: "debit_note",   label: "Nota Débito" },
  { value: "credit_note",  label: "Nota Crédito" },
];

const PAYMENT_CONDITIONS = [
  { value: "immediate", label: "Contado" },
  { value: "15_days",   label: "Crédito a 15 días" },
  { value: "30_days",   label: "Crédito a 30 días" },
  { value: "60_days",   label: "Crédito a 60 días" },
];

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Consignación bancaria" },
  { value: "cash",          label: "Efectivo" },
  { value: "credit_card",   label: "Tarjeta de Crédito" },
  { value: "other",         label: "Otro" },
];

const ITEM_CATEGORIES = [
  { value: "service", label: "Servicio" },
  { value: "product", label: "Producto" },
  { value: "fee",     label: "Cargo / Cuota" },
  { value: "other",   label: "Otro" },
];

const fmtCurrency = (v: number, currency: string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

// ─── Componente principal ─────────────────────────────────────────────────────

export function InvoiceEditorModal({ open, onClose, initialInvoiceId }: { open: boolean; onClose: () => void; initialInvoiceId?: string | null }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const saveMutation = useSaveInvoice();
  const createContactMutation = useCreateContact();

  const { data: contacts } = useContacts();
  const { data: horses }   = useHorses();
  const { data: costCenters } = useFinancialCostCenters();
  const { data: initialInvoice } = useInvoiceDetails(initialInvoiceId || undefined);

  // ── Estado del formulario ──
  const [documentType,      setDocumentType]      = useState("invoice");
  const [contactId,         setContactId]         = useState("");
  const [currency,          setCurrency]          = useState("COP");
  const [paymentCondition,  setPaymentCondition]  = useState("immediate");
  const [paymentMethod,     setPaymentMethod]     = useState("bank_transfer");
  const [costCenterId,      setCostCenterId]      = useState("");
  const [issueDate,         setIssueDate]         = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate,           setDueDate]           = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split("T")[0];
  });
  const [notes,  setNotes]  = useState("");
  const [terms,  setTerms]  = useState("");

  const [items, setItems] = useState<Partial<InvoiceItemInsert & { discount_pct: number }>[]>([
    { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0, category: "", horse_id: "" }
  ]);

  // Quick Create Contact State
  const [showQuickContact, setShowQuickContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactType, setNewContactType] = useState("person");
  const [newContactTaxId, setNewContactTaxId] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

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
      if (initialInvoiceId && initialInvoice) {
        setDocumentType(initialInvoice.document_type || "invoice");
        setContactId(initialInvoice.contact_id);
        setCurrency(initialInvoice.currency || "COP");
        setPaymentCondition(initialInvoice.payment_condition || "immediate");
        setPaymentMethod(initialInvoice.payment_method || "bank_transfer");
        setCostCenterId(initialInvoice.cost_center_id || "");
        setIssueDate(initialInvoice.issue_date);
        setDueDate(initialInvoice.due_date);
        setNotes(initialInvoice.notes || "");
        setTerms(initialInvoice.terms || "");
        
        if (initialInvoice.items && initialInvoice.items.length > 0) {
          setItems(initialInvoice.items.map(item => ({
            id: item.id,
            product_name: item.product_name,
            description: item.description || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount_pct: (item as any).discount_pct || 0,
            category: (item as any).category || "",
            horse_id: item.horse_id || ""
          })));
        }
      } else {
        setContactId(""); setDocumentType("invoice");
        setItems([{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0, category: "", horse_id: "" }]);
        setNotes(""); setTerms(""); setPaymentCondition("immediate"); setPaymentMethod("bank_transfer");
        setCostCenterId("");
      }
      setShowQuickContact(false);
    }
  }, [open, initialInvoiceId, initialInvoice]);

  const handleQuickCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newContactName) return;
    try {
      const res = await createContactMutation.mutateAsync({
        organization_id: orgId,
        name: newContactName,
        type: newContactType,
        tax_id: newContactTaxId || null,
        email: newContactEmail || null,
        phone: newContactPhone || null,
        status: "active"
      } as any);
      toast.success("Cliente creado");
      setContactId(res.id);
      setShowQuickContact(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear cliente");
    }
  };

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

      subtotal        += lineBase; // Subtotal BRUTO de la línea
      tax_amount      += lineTax;
      total_discounts += lineDiscount;

      return { ...item, total: lineTotal };
    });

    const netSubtotal = subtotal - total_discounts;
    const total = netSubtotal + tax_amount;

    return { subtotal, tax_amount, total_discounts, total, validItems };
  }, [items]);

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "sent") => {
    if (!orgId)      return toast.error("Sin organización");
    if (!contactId)  return toast.error("Selecciona un cliente");
    if (!items[0]?.product_name) return toast.error("Añade al menos un concepto");

    try {
      const isUpdate = !!initialInvoiceId;
      const prefix = documentType === "quote" ? "COT" : documentType === "debit_note" ? "ND" : documentType === "credit_note" ? "NC" : "GF";
      const invNumber = isUpdate && initialInvoice ? initialInvoice.invoice_number : `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await saveMutation.mutateAsync({
        invoice: {
          id: initialInvoiceId || undefined,
          organization_id: orgId,
          contact_id: contactId,
          invoice_number: invNumber,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          status,
          document_type: documentType,
          payment_condition: paymentCondition,
          payment_method: paymentMethod,
          cost_center_id: costCenterId || null,
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

      toast.success("Factura creada");
      onClose();
    } catch (err: any) {
      console.error("Error saving invoice:", err);
      toast.error(err.message || "Error al guardar la factura");
    }
  };

  const addItem    = () => setItems(p => [...p, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0, category: "", horse_id: "" }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => {
    setItems(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-4 -translate-x-1/2 w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col bg-card rounded-xl shadow-2xl z-50">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-card">
            <Dialog.Title className="text-xl font-display font-semibold">Nueva Factura</Dialog.Title>
            <Dialog.Close className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X size={20} />
            </Dialog.Close>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto bg-card">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              
              {/* Row 1: Tipo y Moneda */}
              <div className="flex flex-wrap gap-8">
                <div className="w-72">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo de Factura</label>
                  <select 
                    className="form-input text-sm w-full bg-transparent border-b border-0 border-border rounded-none px-0 focus:ring-0 focus:border-primary"
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Moneda</label>
                  <div className="flex gap-2">
                    {["COP", "USD"].map(cur => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={`text-sm px-3 py-1 rounded-md transition-colors ${
                          currency === cur ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Cliente y Fechas */}
              <div className="flex flex-wrap lg:flex-nowrap gap-8">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</label>
                    <button type="button" className="text-[11px] font-semibold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded">Consumidor final</button>
                  </div>
                  <div className="relative">
                    {!showQuickContact ? (
                      <div className="flex gap-2">
                        <select
                          className="form-input text-sm w-full"
                          value={contactId}
                          onChange={e => setContactId(e.target.value)}
                        >
                          <option value="">Seleccione Cliente</option>
                          {contacts?.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name || "Sin nombre"} {c.tax_id ? `- NIT: ${c.tax_id}` : ""}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setShowQuickContact(true)} className="shrink-0 w-10 h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-secondary/80 border border-border">
                          <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg bg-secondary/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Crear nuevo cliente</h4>
                          <button type="button" onClick={() => setShowQuickContact(false)} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs mb-1">Nombre *</label>
                            <input type="text" className="form-input text-sm w-full" value={newContactName} onChange={e => setNewContactName(e.target.value)} required />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Tipo *</label>
                            <select className="form-input text-sm w-full" value={newContactType} onChange={e => setNewContactType(e.target.value)}>
                              <option value="person">Persona Natural</option>
                              <option value="company">Empresa / Jurídica</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Documento / NIT</label>
                            <input type="text" className="form-input text-sm w-full" value={newContactTaxId} onChange={e => setNewContactTaxId(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Teléfono</label>
                            <input type="text" className="form-input text-sm w-full" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
                          </div>
                        </div>
                        <button type="button" onClick={handleQuickCreateContact} className="btn-primary w-full mt-2" disabled={createContactMutation.isPending || !newContactName}>
                          {createContactMutation.isPending ? "Creando..." : "Guardar Cliente"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-56 shrink-0">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Fecha Emisión</label>
                  <input type="date" className="form-input text-sm w-full" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                </div>

                <div className="w-56 shrink-0">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Fecha Vencimiento</label>
                  <input type="date" className="form-input text-sm w-full bg-secondary/30" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-muted-foreground">
                    PLAZO 
                    <button type="button" className="hover:text-foreground" onClick={() => setPaymentCondition("30_days")}>30</button>
                    <button type="button" className="hover:text-foreground" onClick={() => setPaymentCondition("60_days")}>60</button>
                    <button type="button" className="hover:text-foreground">90</button>
                  </div>
                </div>
              </div>

              {/* Row 3: Métodos de pago y Centro de Costo */}
              <div className="flex flex-wrap lg:flex-nowrap gap-8">
                <div className="w-56 shrink-0">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Método de Pago</label>
                  <select className="form-input text-sm w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                  </select>
                </div>
                <div className="w-56 shrink-0">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo de Pago</label>
                  <select className="form-input text-sm w-full" value={paymentCondition} onChange={e => setPaymentCondition(e.target.value)}>
                    {PAYMENT_CONDITIONS.map(pc => <option key={pc.value} value={pc.value}>{pc.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Centro de Costo</label>
                  <select className="form-input text-sm w-full" value={costCenterId} onChange={e => setCostCenterId(e.target.value)}>
                    <option value="">Seleccionar (Opcional)</option>
                    {costCenters?.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                </div>
              </div>

              {/* ── TABLA DE ÍTEMS ── */}
              <div className="mt-10">
                <div className="flex text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  <div className="w-6 text-center">#</div>
                  <div className="flex-1 px-2">Descripción del concepto</div>
                  <div className="w-36 px-2">Caballo / Cat</div>
                  <div className="w-20 px-2">Cant.</div>
                  <div className="w-28 px-2">Precio</div>
                  <div className="w-20 px-2">Desc %</div>
                  <div className="w-24 px-2">Imp.</div>
                  <div className="w-28 text-right px-2">Subtotal</div>
                  <div className="w-28 text-right px-2">Total</div>
                  <div className="w-10"></div>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const q = Number(item.quantity) || 0;
                    const p = Number(item.unit_price) || 0;
                    const d = Number((item as any).discount_pct) || 0;
                    const t = Number(item.tax_rate) || 0;
                    
                    const subtotalBruto = q * p;
                    const subtotalNeto = subtotalBruto * (1 - d/100);
                    const totalLinea = subtotalNeto * (1 + t/100);

                    return (
                      <div key={idx} className="flex items-center text-sm gap-1 group">
                        <div className="w-6 text-center text-xs font-medium text-muted-foreground">{idx + 1}</div>
                        <div className="flex-1">
                          <input type="text" className="form-input text-sm w-full py-1.5 px-3 bg-secondary/20 border-transparent focus:border-primary focus:bg-transparent transition-colors" placeholder="Concepto (ej. Mensualidad)" value={item.product_name} onChange={e => updateItem(idx, "product_name", e.target.value)} />
                        </div>
                        <div className="w-36 space-y-1">
                          <select className="form-input text-xs w-full py-1 px-2" value={(item as any).horse_id || ""} onChange={e => updateItem(idx, "horse_id", e.target.value)}>
                            <option value="">Caballo...</option>
                            {horses?.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                          <select className="form-input text-xs w-full py-1 px-2" value={(item as any).category || ""} onChange={e => updateItem(idx, "category", e.target.value)}>
                            <option value="">Categoría...</option>
                            {ITEM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="w-20">
                          <input type="number" min="1" className="form-input text-sm w-full py-1.5 px-2 text-center" value={item.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))} />
                        </div>
                        <div className="w-28 relative">
                          <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">$</span>
                          <input type="number" className="form-input text-sm w-full py-1.5 pl-5 pr-2" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", Number(e.target.value))} />
                        </div>
                        <div className="w-20 relative">
                          <input type="number" className="form-input text-sm w-full py-1.5 pr-5 pl-2" value={(item as any).discount_pct} onChange={e => updateItem(idx, "discount_pct", Number(e.target.value))} />
                          <span className="absolute right-2 top-1.5 text-muted-foreground text-xs">%</span>
                        </div>
                        <div className="w-24">
                          <select className="form-input text-sm w-full py-1.5 px-2" value={item.tax_rate} onChange={e => updateItem(idx, "tax_rate", Number(e.target.value))}>
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={19}>19%</option>
                          </select>
                        </div>
                        <div className="w-28 text-right px-2 font-medium text-muted-foreground">
                          {fmtCurrency(subtotalNeto, currency)}
                        </div>
                        <div className="w-28 text-right px-2 font-bold text-foreground">
                          {fmtCurrency(totalLinea, currency)}
                        </div>
                        <div className="w-10 flex justify-end">
                          <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50" disabled={items.length === 1}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end mt-2 pr-10">
                  <button type="button" onClick={addItem} className="bg-secondary/50 hover:bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                    <Plus size={14} /> Línea
                  </button>
                </div>
              </div>

              {/* ── TOTALES Y BOTONES INFERIORES ── */}
              <div className="flex justify-between items-start mt-8 pt-8 border-t border-border">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button type="button" className="bg-secondary/50 text-muted-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                      Agregar Retención
                    </button>
                    <button type="button" className="bg-secondary/50 text-muted-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                      Agregar Términos
                    </button>
                  </div>
                  <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mt-4">
                    Notas <Plus size={14} className="bg-foreground text-background rounded-full p-0.5" />
                  </button>
                </div>

                <div className="w-72 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{fmtCurrency(calculations.subtotal, currency)}</span>
                  </div>
                  {calculations.total_discounts > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Descuentos</span>
                      <span>−{fmtCurrency(calculations.total_discounts, currency)}</span>
                    </div>
                  )}
                  {calculations.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuestos</span>
                      <span>{fmtCurrency(calculations.tax_amount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-display font-semibold pt-3 border-t border-border mt-3">
                    <span>Total</span>
                    <span>{fmtCurrency(calculations.total, currency)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div className="flex justify-end gap-3 p-4 border-t border-border bg-secondary/10 shrink-0">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn-secondary" onClick={() => handleSubmit("draft")} disabled={saveMutation.isPending}>
              <Save size={16} /> Guardar Borrador
            </button>
            <button type="button" className="btn-primary" onClick={() => handleSubmit("sent")} disabled={saveMutation.isPending}>
              <Send size={16} /> Emitir Factura
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

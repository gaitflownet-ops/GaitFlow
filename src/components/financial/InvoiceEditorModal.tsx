import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Save, Send } from "lucide-react";
import { useApp } from "@/lib/store";
import { useCreateInvoice } from "@/lib/hooks/useInvoicing";
import { useContacts } from "@/lib/hooks/useCRM";
import { useHorses } from "@/lib/hooks/useHorses";
import { toast } from "sonner";
import type { InvoiceItemInsert } from "@/lib/hooks/useInvoicing";

export function InvoiceEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const createMutation = useCreateInvoice();
  
  // Data for selectors
  const { data: contacts } = useContacts();
  const { data: horses } = useHorses();

  const [contactId, setContactId] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [currency, setCurrency] = useState("COP");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const [items, setItems] = useState<Partial<InvoiceItemInsert>[]>([
    { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }
  ]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setContactId("");
      setItems([{ product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);
      setNotes("");
      setTerms("");
    }
  }, [open]);

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let tax_amount = 0;
    
    const validItems = items.map(item => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unit_price) || 0;
      const t = Number(item.tax_rate) || 0;
      
      const lineTotal = q * p;
      const lineTax = lineTotal * (t / 100);
      
      subtotal += lineTotal;
      tax_amount += lineTax;
      
      return { ...item, total: lineTotal + lineTax };
    });

    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total, validItems };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "sent" = "draft") => {
    e.preventDefault();
    if (!orgId) return;
    if (!contactId) return toast.error("Selecciona un cliente");
    if (items.length === 0 || !items[0].product_name) return toast.error("Añade al menos un ítem a la factura");

    try {
      const invNumber = `GF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await createMutation.mutateAsync({
        invoice: {
          organization_id: orgId,
          contact_id: contactId,
          invoice_number: invNumber,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          status,
          subtotal: calculations.subtotal,
          tax_amount: calculations.tax_amount,
          discount_amount: 0,
          total: calculations.total,
          balance_due: calculations.total,
          notes,
          terms
        },
        items: calculations.validItems as any
      });
      
      toast.success(status === "sent" ? "Factura enviada" : "Borrador guardado");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la factura");
    }
  };

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof InvoiceItemInsert, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-card rounded-2xl shadow-2xl z-50">
          
          <div className="flex items-center justify-between p-6 border-b shrink-0 bg-secondary/20">
            <div>
              <Dialog.Title className="text-xl font-display">Nueva Factura</Dialog.Title>
              <p className="text-sm text-muted-foreground mt-1">Crea una factura para cobrar servicios o venta de animales.</p>
            </div>
            <Dialog.Close className="p-2 hover:bg-secondary rounded-full transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Cliente y Fechas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-primary">Cliente a Facturar *</label>
                  <select 
                    className="form-input w-full bg-secondary/30 font-medium" 
                    value={contactId} 
                    onChange={e => setContactId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un cliente...</option>
                    {contacts?.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company_name ? `(${c.company_name})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Emisión</label>
                    <input type="date" className="form-input w-full" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vencimiento</label>
                    <input type="date" className="form-input w-full" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Ajustes Generales */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Moneda</label>
                  <div className="flex gap-2">
                    <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium border ${currency === 'COP' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`} onClick={() => setCurrency('COP')}>
                      COP (Pesos)
                    </button>
                    <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-medium border ${currency === 'USD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`} onClick={() => setCurrency('USD')}>
                      USD (Dólares)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notas / Observaciones</label>
                  <textarea className="form-input w-full text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pago de pensión mensual"></textarea>
                </div>
              </div>
            </div>

            {/* Ítems */}
            <div className="mb-6">
              <h3 className="font-medium mb-4 flex items-center justify-between">
                Conceptos a Facturar
                <button type="button" onClick={addItem} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Plus size={14} /> Añadir ítem
                </button>
              </h3>
              
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-secondary/10 p-3 rounded-xl border border-border/50">
                    <div className="flex-1 min-w-[200px]">
                      <input 
                        type="text" className="form-input w-full text-sm font-medium" placeholder="Descripción del producto o servicio"
                        value={item.product_name} onChange={e => updateItem(idx, "product_name", e.target.value)}
                      />
                      <select 
                        className="form-input w-full text-xs mt-2 text-muted-foreground bg-transparent"
                        value={item.horse_id || ""} onChange={e => updateItem(idx, "horse_id", e.target.value || null)}
                      >
                        <option value="">-- Sin vincular a caballo --</option>
                        {horses?.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                    
                    <div className="w-20">
                      <input type="number" min="1" className="form-input w-full text-sm text-center" placeholder="Cant." value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} />
                    </div>
                    
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground text-sm">$</span>
                        <input type="number" className="form-input w-full pl-6 text-sm" placeholder="Precio" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)} />
                      </div>
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <input type="number" className="form-input w-full pr-6 text-sm text-right" placeholder="0" value={item.tax_rate} onChange={e => updateItem(idx, "tax_rate", e.target.value)} />
                        <span className="absolute right-3 top-2 text-muted-foreground text-sm">%</span>
                      </div>
                    </div>

                    <div className="w-28 text-right font-medium py-2 text-sm whitespace-nowrap">
                      {new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(((Number(item.quantity)||0) * (Number(item.unit_price)||0)) * (1 + (Number(item.tax_rate)||0)/100))}
                    </div>

                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg mt-0.5">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="flex justify-end pt-6 border-t">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(calculations.subtotal)}</span>
                </div>
                {calculations.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span className="font-medium text-amber-600">+{new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(calculations.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-display pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary">{new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(calculations.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-secondary/10 flex justify-end gap-3 shrink-0">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button 
              type="button" 
              className="btn-secondary flex items-center gap-2"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={createMutation.isPending}
            >
              <Save size={16} /> Guardar Borrador
            </button>
            <button 
              type="button" 
              className="btn-primary flex items-center gap-2"
              onClick={(e) => handleSubmit(e, "sent")}
              disabled={createMutation.isPending}
            >
              <Send size={16} /> Emitir y Enviar
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

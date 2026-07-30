import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "@/lib/store";
import { useInvoices } from "@/lib/hooks/useInvoicing";
import { useHorses } from "@/lib/hooks/useHorses";
import { useGenerateSyndicateInvoices } from "@/lib/hooks/useFinancialCenter";
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle, FileEdit, Users, X } from "lucide-react";
import { toast } from "sonner";
import { InvoiceEditorModal } from "./InvoiceEditorModal";
import { InvoiceTemplateModal } from "./InvoiceTemplateModal";
import { InvoiceViewerModal } from "./InvoiceViewerModal";

export function InvoicingPanel() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { data: invoices, isLoading } = useInvoices(orgId);
  const { data: horses = [] } = useHorses();
  const syndicateMutation = useGenerateSyndicateInvoices();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInvoiceId, setEditorInvoiceId] = useState<string | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [viewerInvoiceId, setViewerInvoiceId] = useState<string | null>(null);

  // Syndicate billing state
  const [isSyndicateOpen, setIsSyndicateOpen] = useState(false);
  const [syndicateHorseId, setSyndicateHorseId] = useState("");
  const [syndicateMonth, setSyndicateMonth] = useState(() => new Date().getMonth() + 1);
  const [syndicateYear, setSyndicateYear] = useState(() => new Date().getFullYear());

  const handleGenerateSyndicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !syndicateHorseId) {
      toast.error("Selecciona un ejemplar");
      return;
    }
    try {
      const res = await syndicateMutation.mutateAsync({
        orgId,
        horseId: syndicateHorseId,
        month: Number(syndicateMonth),
        year: Number(syndicateYear),
      });
      const generatedCount = res?.length || 0;
      if (generatedCount === 0) {
        toast.info("No se encontraron gastos o copropietarios activos en ese mes para este ejemplar.");
      } else {
        toast.success(`¡Generadas ${generatedCount} facturas proporcionales con éxito!`);
        setIsSyndicateOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al generar facturación de copropiedad");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando facturas...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"><FileEdit size={12}/> Borrador</span>;
      case "sent":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600"><FileText size={12}/> Emitida</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600"><Clock size={12}/> Pendiente</span>;
      case "partial":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600"><Clock size={12}/> Parcial</span>;
      case "paid":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600"><CheckCircle2 size={12}/> Pagada</span>;
      case "overdue":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600"><AlertTriangle size={12}/> Vencida</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-medium">Facturación</h2>
          <p className="text-sm text-muted-foreground mt-1">Crea, envía y gestiona las facturas de tus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => setIsSyndicateOpen(true)}>
            <Users size={16} /> Facturar Co-propiedad
          </button>
          <button className="btn-secondary" onClick={() => setIsTemplateOpen(true)}>
            <FileText size={16} /> Configurar Plantilla
          </button>
          <button className="btn-primary" onClick={() => { setEditorInvoiceId(null); setIsEditorOpen(true); }}>
            <Plus size={16} /> Nueva Factura
          </button>
        </div>
      </div>

      <div className="lux-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground w-32">Nº Factura</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-32">Emisión</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-32">Vencimiento</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right w-36">Monto Total</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right w-36">Saldo Pendiente</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-32">Estado</th>
              </tr>
            </thead>
            <tbody>
              {!invoices?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No hay facturas registradas. Crea la primera factura para empezar.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => setViewerInvoiceId(inv.id)}
                  >
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.contact?.name || "Sin cliente"}</td>
                    <td className="px-4 py-3">{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {new Intl.NumberFormat("es-CO", { style: "currency", currency: inv.currency || "COP", minimumFractionDigits: 0 }).format(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.balance_due > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {new Intl.NumberFormat("es-CO", { style: "currency", currency: inv.currency || "COP", minimumFractionDigits: 0 }).format(inv.balance_due)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceEditorModal 
        open={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        initialInvoiceId={editorInvoiceId}
      />
      <InvoiceTemplateModal open={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} />
      <InvoiceViewerModal 
        invoiceId={viewerInvoiceId} 
        open={!!viewerInvoiceId} 
        onClose={() => setViewerInvoiceId(null)} 
        onEdit={(id) => {
          setViewerInvoiceId(null);
          setEditorInvoiceId(id);
          setIsEditorOpen(true);
        }}
      />

      {/* Modal de Sindicación y Co-propiedad (Syndicate Billing) */}
      <Dialog.Root open={isSyndicateOpen} onOpenChange={setIsSyndicateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card p-6 rounded-2xl shadow-xl z-50 border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-display font-semibold">Facturación por Co-propiedad</Dialog.Title>
                  <p className="text-xs text-muted-foreground">División de gastos mensuales entre copropietarios</p>
                </div>
              </div>
              <Dialog.Close className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleGenerateSyndicate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Ejemplar / Caballo</label>
                <select
                  className="form-input text-sm w-full"
                  value={syndicateHorseId}
                  onChange={(e) => setSyndicateHorseId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Ejemplar --</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Mes</label>
                  <select
                    className="form-input text-sm w-full"
                    value={syndicateMonth}
                    onChange={(e) => setSyndicateMonth(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <option key={m} value={m}>Mes {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Año</label>
                  <input
                    type="number"
                    className="form-input text-sm w-full"
                    value={syndicateYear}
                    onChange={(e) => setSyndicateYear(Number(e.target.value))}
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/40 rounded-lg text-xs text-muted-foreground">
                <strong>Nota:</strong> Se sumarán todos los gastos operativos del mes para este ejemplar y se emitirá una factura en borrador para cada copropietario en proporción a su porcentaje (%) de propiedad.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setIsSyndicateOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary bg-purple-600 hover:bg-purple-700 text-white" disabled={syndicateMutation.isPending}>
                  {syndicateMutation.isPending ? "Generando..." : "Generar Facturas Proporcionales"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

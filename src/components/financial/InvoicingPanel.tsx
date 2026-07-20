import { useState } from "react";
import { useApp } from "@/lib/store";
import { useInvoices } from "@/lib/hooks/useInvoicing";
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle, FileEdit } from "lucide-react";
import { InvoiceEditorModal } from "./InvoiceEditorModal";
import { InvoiceTemplateModal } from "./InvoiceTemplateModal";
import { InvoiceViewerModal } from "./InvoiceViewerModal";

export function InvoicingPanel() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { data: invoices, isLoading } = useInvoices(orgId);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInvoiceId, setEditorInvoiceId] = useState<string | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [viewerInvoiceId, setViewerInvoiceId] = useState<string | null>(null);

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
    </div>
  );
}

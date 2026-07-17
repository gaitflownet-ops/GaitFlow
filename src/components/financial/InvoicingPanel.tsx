import { useState } from "react";
import { useOrganization } from "@/lib/store";
import { useInvoices } from "@/lib/hooks/useInvoicing";
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle, FileEdit } from "lucide-react";
import { InvoiceEditorModal } from "./InvoiceEditorModal";
import { InvoiceTemplateModal } from "./InvoiceTemplateModal";
import { InvoiceViewerModal } from "./InvoiceViewerModal";

export function InvoicingPanel() {
  const { currentOrganization } = useOrganization();
  const { data: invoices, isLoading } = useInvoices(currentOrganization?.id);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600"><FileText size={12}/> Enviada</span>;
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Facturas Emitidas</h2>
          <p className="text-sm text-muted-foreground">Gestiona tus cobros y cartera a clientes.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setIsTemplateOpen(true)}>
            <FileEdit size={16} /> Plantilla y Logo
          </button>
          <button className="btn-primary" onClick={() => setIsEditorOpen(true)}>
            <Plus size={16} /> Crear Factura
          </button>
        </div>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Factura #</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha Emisión</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Saldo Pendiente</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay facturas creadas.
                  </td>
                </tr>
              ) : (
                invoices?.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => setViewerInvoiceId(inv.id)}
                  >
                    <td className="px-4 py-3 font-medium text-primary">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      {inv.contact ? `${inv.contact.first_name} ${inv.contact.last_name}` : "Cliente Desconocido"}
                    </td>
                    <td className="px-4 py-3">{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {new Intl.NumberFormat("es-CO", { style: "currency", currency: inv.currency }).format(inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      {inv.balance_due > 0 ? (
                        <span className="font-medium text-red-500">
                          {new Intl.NumberFormat("es-CO", { style: "currency", currency: inv.currency }).format(inv.balance_due)}
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

      <InvoiceEditorModal open={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
      <InvoiceTemplateModal open={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} />
      <InvoiceViewerModal invoiceId={viewerInvoiceId} open={!!viewerInvoiceId} onClose={() => setViewerInvoiceId(null)} />
    </div>
  );
}

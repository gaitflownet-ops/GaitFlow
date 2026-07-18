import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, DollarSign, Download, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { useInvoiceDetails, useInvoiceTemplate, useAddInvoicePayment, useUpdateInvoiceStatus } from "@/lib/hooks/useInvoicing";
import { toast } from "sonner";

export function InvoiceViewerModal({ invoiceId, open, onClose }: { invoiceId: string | null; open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { data: invoice, isLoading } = useInvoiceDetails(invoiceId || undefined);
  const { data: template } = useInvoiceTemplate(orgId);
  const paymentMutation = useAddInvoicePayment();
  const updateStatusMutation = useUpdateInvoiceStatus();
  
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!invoiceId) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    
    toast.info("Generando PDF de alta calidad...", { id: "pdf-gen" });
    
    try {
      const { toPng } = await import('html-to-image');
      const { default: jsPDF } = await import('jspdf');
      
      const dataUrl = await toPng(invoiceRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factura_${invoice.invoice_number || 'borrador'}.pdf`);
      
      toast.success("PDF descargado correctamente", { id: "pdf-gen" });
    } catch (err: any) {
      console.error("PDF generation failed", err);
      toast.error(err.message || "Error al generar el PDF", { id: "pdf-gen" });
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !paymentAmount || paymentAmount <= 0) return;

    try {
      await paymentMutation.mutateAsync({
        invoice_id: invoice.id,
        amount_applied: Number(paymentAmount),
        payment_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Abono registrado correctamente");
      setShowPayment(false);
      setPaymentAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el abono");
    }
  };

  const handleMarkAsVoid = async () => {
    if (!invoice) return;
    if (confirm("¿Estás seguro de anular esta factura?")) {
      await updateStatusMutation.mutateAsync({ id: invoice.id, status: "void" });
      toast.success("Factura anulada");
      onClose();
    }
  };

  const primaryColor = template?.primary_color || "#111827";

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-4 -translate-x-1/2 w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-transparent z-[100] print:relative print:translate-x-0 print:translate-y-0 print:left-0 print:top-0 print:w-full print:h-auto print:max-h-none print:overflow-visible">
          
          {/* Action Bar (Hidden when printing) */}
          <div className="bg-card p-4 rounded-2xl shadow-xl flex items-center justify-between mb-4 print:hidden">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-xl">Factura {invoice?.invoice_number}</h2>
              {invoice?.status === "void" ? (
                <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded-full text-xs font-medium">Anulada</span>
              ) : invoice?.status === "paid" ? (
                <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium">Pagada</span>
              ) : null}
            </div>
            <div className="flex gap-2">
              {invoice?.status !== "void" && invoice?.status !== "paid" && (
                <button className="btn-secondary text-emerald-600 hover:bg-emerald-50" onClick={() => setShowPayment(!showPayment)}>
                  <DollarSign size={16} /> Registrar Abono
                </button>
              )}
              <button className="btn-secondary" onClick={handleDownloadPDF}>
                <Download size={16} /> Descargar PDF
              </button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Imprimir / Guardar PDF
              </button>
              {invoice?.status === "draft" && (
                <button className="btn-danger-ghost" onClick={handleMarkAsVoid}>
                  Anular
                </button>
              )}
              <Dialog.Close className="p-2 hover:bg-secondary rounded-full ml-2">
                <X size={20} />
              </Dialog.Close>
            </div>
          </div>

          {/* Payment form overlay (Hidden when printing) */}
          {showPayment && (
            <div className="bg-card p-6 rounded-2xl shadow-xl mb-4 print:hidden animate-in slide-in-from-top-4">
              <h3 className="font-medium text-lg mb-4">Registrar Abono</h3>
              <form onSubmit={handleAddPayment} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Monto a abonar (Máximo {new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice?.currency || "COP" }).format(invoice?.balance_due || 0)})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                    <input 
                      type="number" 
                      className="form-input pl-8 w-full" 
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      max={invoice?.balance_due}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary mb-0.5" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? "Guardando..." : "Confirmar Pago"}
                </button>
              </form>
            </div>
          )}

          {/* Invoice A4 Container */}
          <div ref={invoiceRef} className="bg-white text-slate-900 w-full max-w-4xl mx-auto min-h-[1056px] shadow-2xl print:shadow-none print:w-full print:m-0 print:p-0">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">Cargando documento...</div>
            ) : invoice ? (
              <div className="p-12 sm:p-16 flex flex-col min-h-full">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 pb-8" style={{ borderBottomColor: primaryColor }}>
                  <div className="flex-1">
                    {template?.logo_url ? (
                      <img src={template.logo_url} alt="Logo" className="max-h-20 max-w-[200px] object-contain mb-4" />
                    ) : (
                      <div className="text-3xl font-bold tracking-tighter mb-4" style={{ color: primaryColor }}>
                        {template?.company_name || state.user?.first_name || "Nuestra Empresa"}
                      </div>
                    )}
                    <div className="text-sm text-slate-500 space-y-1">
                      {template?.tax_id && <p>NIT/RUT: {template.tax_id}</p>}
                      {template?.address && <p>{template.address}</p>}
                      {template?.phone && <p>Tel: {template.phone}</p>}
                      {template?.email && <p>{template.email}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-light text-slate-800 tracking-tight">FACTURA</h1>
                    <p className="text-xl font-medium mt-1" style={{ color: primaryColor }}>{invoice.invoice_number}</p>
                    
                    <div className="mt-6 space-y-2 text-sm text-slate-600">
                      <div className="flex justify-end gap-8">
                        <span className="font-medium text-slate-400">Fecha Emisión:</span>
                        <span className="w-24 font-medium text-slate-800">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-end gap-8">
                        <span className="font-medium text-slate-400">Vencimiento:</span>
                        <span className="w-24 font-medium text-slate-800">{new Date(invoice.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="py-8 flex justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Facturar A:</p>
                    <div className="text-base text-slate-800">
                      <p className="font-bold">{invoice.contact?.name}</p>
                      {invoice.contact?.tax_id && <p className="text-slate-500 text-sm mt-1">NIT/CC: {invoice.contact.tax_id}</p>}
                      {invoice.contact?.email && <p className="text-slate-500 text-sm mt-1">{invoice.contact.email}</p>}
                      {invoice.contact?.phone && <p className="text-slate-500 text-sm">{invoice.contact.phone}</p>}
                    </div>
                  </div>
                  {invoice.status === "paid" && (
                    <div className="flex items-center justify-center opacity-80 rotate-12 origin-center print:opacity-100">
                      <div className="border-4 border-emerald-500 text-emerald-500 px-6 py-2 text-2xl font-bold uppercase tracking-widest rounded-lg inline-block">
                        PAGADO
                      </div>
                    </div>
                  )}
                  {invoice.status === "void" && (
                    <div className="flex items-center justify-center opacity-80 rotate-12 origin-center">
                      <div className="border-4 border-red-500 text-red-500 px-6 py-2 text-2xl font-bold uppercase tracking-widest rounded-lg inline-block">
                        ANULADA
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="mt-4 flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2" style={{ borderBottomColor: primaryColor }}>
                        <th className="py-3 font-bold text-slate-700">Descripción</th>
                        <th className="py-3 font-bold text-slate-700 text-center">Cant.</th>
                        <th className="py-3 font-bold text-slate-700 text-right">Precio Unitario</th>
                        <th className="py-3 font-bold text-slate-700 text-right">Impuesto</th>
                        <th className="py-3 font-bold text-slate-700 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-4">
                            <p className="font-medium text-slate-800">{item.product_name}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                          </td>
                          <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-4 text-right text-slate-600">
                            {new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(item.unit_price)}
                          </td>
                          <td className="py-4 text-right text-slate-600">
                            {item.tax_rate}%
                          </td>
                          <td className="py-4 text-right font-medium text-slate-800">
                            {new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end pt-8">
                  <div className="w-80">
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(invoice.subtotal)}</span>
                      </div>
                      {invoice.tax_amount > 0 && (
                        <div className="flex justify-between">
                          <span>Impuestos</span>
                          <span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(invoice.tax_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                        <span className="font-bold text-slate-800">Total</span>
                        <span className="font-bold text-slate-800">{new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(invoice.total)}</span>
                      </div>
                      
                      {invoice.total > invoice.balance_due && (
                        <div className="flex justify-between text-emerald-600 pt-2 border-t border-slate-200 border-dashed">
                          <span>Abonos / Pagos Recibidos</span>
                          <span>- {new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(invoice.total - invoice.balance_due)}</span>
                        </div>
                      )}

                      <div className="flex justify-between bg-slate-50 p-4 rounded-lg mt-4 items-center">
                        <span className="font-bold text-slate-600">Saldo a Pagar</span>
                        <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                          {new Intl.NumberFormat("es-CO", { style: "currency", currency: invoice.currency || "COP" }).format(invoice.balance_due)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Notes & Terms */}
                <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
                  <div>
                    {invoice.notes && (
                      <div className="mb-4">
                        <p className="font-bold text-slate-700 mb-1">Notas:</p>
                        <p className="whitespace-pre-line">{invoice.notes}</p>
                      </div>
                    )}
                    {template?.default_notes && !invoice.notes && (
                      <div className="mb-4">
                        <p className="font-bold text-slate-700 mb-1">Notas:</p>
                        <p className="whitespace-pre-line">{template.default_notes}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    {invoice.terms && (
                      <div>
                        <p className="font-bold text-slate-700 mb-1">Términos y Condiciones:</p>
                        <p className="whitespace-pre-line">{invoice.terms}</p>
                      </div>
                    )}
                    {template?.default_terms && !invoice.terms && (
                      <div>
                        <p className="font-bold text-slate-700 mb-1">Términos y Condiciones:</p>
                        <p className="whitespace-pre-line">{template.default_terms}</p>
                      </div>
                    )}
                  </div>
                </div>

                {template?.footer_text && (
                  <div className="mt-8 text-center text-xs text-slate-400">
                    <p>{template.footer_text}</p>
                  </div>
                )}
                
              </div>
            ) : null}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

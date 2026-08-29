/**
 * CloseSaleModal.tsx — Enterprise sale closing wizard.
 * Step 1: Confirm price & buyer details
 * Step 2: Review auto-actions (invoice, vault, status update)
 * Step 3: Confirmation & PDF download link
 */
import { useState } from "react";
import { CheckCircle2, FileText, Receipt, Loader2, ArrowRight, X, AlertTriangle } from "lucide-react";
import { useCloseSale, type EnterpriseListing } from "@/lib/hooks/useMarketplace";
import { toast } from "sonner";

interface Props {
  listing: EnterpriseListing;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CloseSaleModal({ listing, onClose, onSuccess }: Props) {
  const closeSale = useCloseSale();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerCountry: "Colombia",
    salePrice: String(listing.price || ""),
    currency: (listing.currency || "USD") as "USD" | "COP" | "EUR",
    notes: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const h = listing.horses;
  const title = listing.title || h?.name || "Ejemplar";

  const handleClose = async () => {
    if (!form.buyerName || !form.salePrice) {
      toast.error("Por favor completa el nombre del comprador y el precio final.");
      return;
    }

    try {
      await closeSale.mutateAsync({
        listingId: listing.id,
        horseId: h?.id || listing.horse_id || undefined,
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerPhone: form.buyerPhone || undefined,
        buyerCountry: form.buyerCountry,
        salePrice: Number(form.salePrice),
        currency: form.currency,
        notes: form.notes || undefined,
      });
      setStep(3);
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Error al cerrar la venta: ${err.message || "inténtalo de nuevo"}`);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-bold">Cerrar Venta</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[220px]">{title}</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Buyer & Price */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Datos del Comprador
          </h4>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Nombre del Comprador *</label>
            <input
              required
              value={form.buyerName}
              onChange={set("buyerName")}
              placeholder="Nombre completo o empresa"
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email del Comprador</label>
              <input
                type="email"
                value={form.buyerEmail}
                onChange={set("buyerEmail")}
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Teléfono</label>
              <input
                value={form.buyerPhone}
                onChange={set("buyerPhone")}
                placeholder="+57 300..."
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">País del Comprador</label>
            <select
              value={form.buyerCountry}
              onChange={set("buyerCountry")}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              {["Colombia", "México", "Estados Unidos", "Venezuela", "Argentina", "Brasil", "Chile", "España", "Panamá", "Ecuador", "Otro"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Precio Final de Venta *</label>
              <input
                required
                type="number"
                value={form.salePrice}
                onChange={set("salePrice")}
                placeholder="50000"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={set("currency")}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="COP">COP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Notas Adicionales</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Condiciones especiales, fecha de entrega, etc."
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!form.buyerName || !form.salePrice}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Confirm Auto-Actions */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm">Al cerrar esta venta se ejecutará automáticamente:</h4>

          {/* Summary */}
          <div className="lux-card p-4 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Comprador:</span> <span className="font-semibold">{form.buyerName}</span></p>
            <p><span className="text-muted-foreground">Precio:</span> <span className="font-bold text-primary">{form.currency} {Number(form.salePrice).toLocaleString()}</span></p>
            {form.buyerEmail && <p><span className="text-muted-foreground">Email:</span> {form.buyerEmail}</p>}
            {form.buyerCountry && <p><span className="text-muted-foreground">País:</span> {form.buyerCountry}</p>}
          </div>

          {/* Auto actions */}
          <div className="space-y-2">
            {[
              { icon: Receipt, label: `Factura por ${form.currency} ${Number(form.salePrice).toLocaleString()} en módulo Finanzas`, color: "text-emerald-500" },
              { icon: FileText, label: `Registro de venta archivado en el sistema`, color: "text-blue-500" },
              { icon: CheckCircle2, label: `Estado del ejemplar cambia a "Vendido"`, color: "text-amber-500" },
              { icon: AlertTriangle, label: `Publicación queda archivada como vendida`, color: "text-zinc-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={closeSale.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {closeSale.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                "✅ Confirmar Venta"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-in fade-in duration-200">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="font-display text-xl font-bold">¡Venta Cerrada!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            La venta de <strong>{title}</strong> a <strong>{form.buyerName}</strong> ha sido registrada exitosamente.
            La factura fue generada en el módulo Financiero.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

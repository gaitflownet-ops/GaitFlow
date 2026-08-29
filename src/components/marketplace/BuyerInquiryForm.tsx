/**
 * BuyerInquiryForm.tsx — Contact form for prospective buyers.
 * Captures: name, email, phone, country, inquiry type, and personalized message.
 * Submits to useCreateInquiry and auto-links to seller's CRM.
 */
import { useState } from "react";
import { MessageCircle, Send, Loader2, CheckCircle2, X } from "lucide-react";
import { useCreateInquiry } from "@/lib/hooks/useMarketplace";
import { toast } from "sonner";

interface Props {
  listingId: string;
  listingTitle?: string;
  onClose: () => void;
}

export function BuyerInquiryForm({ listingId, listingTitle, onClose }: Props) {
  const createInquiry = useCreateInquiry();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_country: "Colombia",
    inquiry_type: "Information",
    message: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyer_name || !form.buyer_email || !form.message) return;

    try {
      await createInquiry.mutateAsync({
        listing_id: listingId,
        message: form.message,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone || undefined,
        buyer_country: form.buyer_country,
        inquiry_type: form.inquiry_type,
        target_price: (form as any).target_price ? Number((form as any).target_price) : undefined,
        target_currency: (form as any).target_currency || "COP",
      } as any);
      setSubmitted(true);
      toast.success("¡Consulta enviada! El vendedor te contactará pronto.");
    } catch (err) {
      toast.error("Error al enviar la consulta. Inténtalo de nuevo.");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="font-display text-xl font-bold">¡Consulta Enviada!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          El vendedor ha recibido tu solicitud y se pondrá en contacto contigo en las próximas 24 horas.
        </p>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Contactar al Vendedor</h3>
            {listingTitle && (
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                Sobre: {listingTitle}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Full Name */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Nombre Completo *
          </label>
          <input
            required
            value={form.buyer_name}
            onChange={set("buyer_name")}
            placeholder="Ej. Juan Carlos Mora"
            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Email + Phone row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Correo Electrónico *
            </label>
            <input
              required
              type="email"
              value={form.buyer_email}
              onChange={set("buyer_email")}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              value={form.buyer_phone}
              onChange={set("buyer_phone")}
              placeholder="+57 300..."
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Country + Inquiry Type row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              País
            </label>
            <select
              value={form.buyer_country}
              onChange={set("buyer_country")}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              {["Colombia", "México", "Estados Unidos", "Venezuela", "Argentina", "Brasil", "Chile", "España", "Panamá", "Ecuador", "Perú", "Otro"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Tipo de Interés
            </label>
            <select
              value={form.inquiry_type}
              onChange={set("inquiry_type")}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="Solicitar información">Solicitar información</option>
              <option value="Quiero comprar">Quiero comprar</option>
              <option value="Negociar precio">Negociar precio</option>
              <option value="Solicitar visita">Solicitar visita</option>
              <option value="Solicitar video">Solicitar video</option>
            </select>
          </div>
        </div>

        {form.inquiry_type === "Negociar precio" && (
          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Oferta (COP)
              </label>
              <input
                type="number"
                value={(form as any).target_price || ""}
                onChange={set("target_price" as any)}
                placeholder="Valor de tu oferta"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Moneda
              </label>
              <select
                value={(form as any).target_currency || "COP"}
                onChange={set("target_currency" as any)}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Mensaje / Pregunta *
          </label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={set("message")}
            placeholder="Hola, estoy interesado en este ejemplar. ¿Podría compartirme más detalles sobre...?"
            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createInquiry.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {createInquiry.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
          ) : (
            <><Send className="h-4 w-4" /> Enviar Consulta</>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          Tu información es confidencial y solo será compartida con el vendedor.
        </p>
      </form>
    </div>
  );
}

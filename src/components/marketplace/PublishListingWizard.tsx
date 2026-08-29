/**
 * PublishListingWizard.tsx — 5-step wizard to create a new marketplace listing.
 * Step 1: Choose type (horse / embryo / semen / breeding service)
 * Step 2: Select asset from real inventory
 * Step 3: Pricing & negotiation terms
 * Step 4: Commercial description & discipline
 * Step 5: Review & publish
 */
import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Dna,
  Droplets,
  Handshake,
  X,
} from "lucide-react";
import { useCreateListing } from "@/lib/hooks/useMarketplace";
import { useHorses } from "@/lib/hooks/useHorses";
import { useEmbryos } from "@/lib/hooks/useBreeding";
import { toast } from "sonner";
import { useApp } from "@/lib/store";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

type ListingType = "horse" | "embryo" | "semen" | "breeding service";

const DISCIPLINES = [
  "Paso Fino", "Salto", "Doma Clásica", "Polo", "Endurance",
  "Trabajo de Llano", "Show Jumping", "Western", "Trail", "Vaquejada", "Otro",
];

const COUNTRIES = [
  "Colombia", "México", "Estados Unidos", "Venezuela", "Argentina",
  "Brasil", "Chile", "España", "Panamá", "Ecuador", "Perú",
];

const TYPE_OPTIONS: { value: ListingType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "horse", label: "Ejemplar", icon: ShoppingBag, desc: "Publica un caballo de tu inventario" },
  { value: "embryo", label: "Embrión", icon: Dna, desc: "Embriones disponibles del banco criogénico" },
  { value: "semen", label: "Semen / Material Genético", icon: Droplets, desc: "Dosis de semen de tus reproductores" },
  { value: "breeding service", label: "Servicio de Monta", icon: Handshake, desc: "Ofrece saltos de tus sementales" },
];

export function PublishListingWizard({ onClose, onSuccess }: Props) {
  const createListing = useCreateListing();
  const { data: horses = [] } = useHorses();
  const { data: embryos = [] } = useEmbryos();
  const { state } = useApp();
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(false);

  const [form, setForm] = useState({
    type: "horse" as ListingType,
    selectedHorseId: "",
    selectedEmbryoId: "",
    title: "",
    price: "",
    currency: "USD" as "USD" | "COP" | "EUR",
    negotiation_terms: "",
    description: "",
    discipline: "",
    location_country: "Colombia",
    location_city: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Auto-populate title from selected horse
  const selectedHorse = useMemo(() => horses.find((h) => h.id === form.selectedHorseId), [horses, form.selectedHorseId]);
  const selectedEmbryo = useMemo(() => embryos.find((e) => e.id === form.selectedEmbryoId), [embryos, form.selectedEmbryoId]);

  const handleHorseSelect = (horseId: string) => {
    const h = horses.find((h) => h.id === horseId);
    setForm((prev) => ({
      ...prev,
      selectedHorseId: horseId,
      title: h?.name || prev.title,
      discipline: (h as any)?.discipline || prev.discipline,
      location_country: (h as any)?.location?.split(",").pop()?.trim() || prev.location_country,
    }));
  };

  const handlePublish = async () => {
    try {
      const horseId = form.type === "horse" ? form.selectedHorseId || undefined
        : form.type === "embryo" ? (selectedEmbryo as any)?.horse_id || undefined
        : undefined;

      await createListing.mutateAsync({
        type: form.type,
        title: form.title,
        price: form.price ? Number(form.price) : undefined,
        description: form.description || undefined,
        horse_id: horseId || null,
        seller_id: state.user?.id || "",
        status: "Active",
        listing_status: "Active",
        currency: form.currency,
        negotiation_terms: form.negotiation_terms || undefined,
        discipline: form.discipline || undefined,
        location_country: form.location_country || undefined,
        location_city: form.location_city || undefined,
      } as any);

      setPublished(true);
      onSuccess?.();
      toast.success("¡Publicación creada exitosamente!");
    } catch (err: any) {
      toast.error(`Error al publicar: ${err.message || "inténtalo de nuevo"}`);
    }
  };

  const canNextStep1 = !!form.type;
  const canNextStep2 =
    form.type === "horse" ? !!form.selectedHorseId :
    form.type === "embryo" ? !!form.selectedEmbryoId :
    true; // semen & service don't need asset selection
  const canNextStep3 = !!form.price;
  const canNextStep4 = !!form.title && !!form.description;

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="font-display text-2xl font-bold">¡Publicado!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu publicación ya está visible en el catálogo del Mercado GaitFlow.
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
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold">Publicar en el Mercado</h3>
          <p className="text-xs text-muted-foreground">Paso {step} de 5</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm text-muted-foreground mb-4">¿Qué deseas publicar?</h4>
          {TYPE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: value }))}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                form.type === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${form.type === value ? "bg-primary/10" : "bg-secondary"}`}>
                <Icon className={`h-5 w-5 ${form.type === value ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Asset Selection */}
      {step === 2 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {form.type === "horse" && (
            <>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Selecciona el ejemplar de tu inventario</h4>
              {horses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tienes caballos en tu inventario todavía.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {horses.map((h: any) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleHorseSelect(h.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.selectedHorseId === h.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-secondary"
                      }`}
                    >
                      <div className="h-12 w-12 rounded-xl bg-secondary overflow-hidden shrink-0">
                        {h.image_url && <img src={h.image_url} alt={h.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{h.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {[h.breed, h.sex, h.age ? `${h.age} años` : null].filter(Boolean).join(" · ")}
                        </p>
                        {h.status === "Vendido" && (
                          <span className="text-[10px] text-red-500 font-semibold">Ya vendido</span>
                        )}
                      </div>
                      {form.selectedHorseId === h.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {form.type === "embryo" && (
            <>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Selecciona el embrión del banco criogénico</h4>
              {embryos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay embriones disponibles en el banco genético.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {embryos.filter((e: any) => e.status === "Disponible" || e.status === "Congelado").map((e: any) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, selectedEmbryoId: e.id, title: `Embrión ${e.grade || ""} — ${e.stage || ""}`.trim() }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.selectedEmbryoId === e.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-secondary"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Dna className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{e.grade || "Embrión"} — {e.stage || ""}</p>
                        <p className="text-[11px] text-muted-foreground">{e.status} · {e.collection_date ? new Date(e.collection_date).toLocaleDateString("es-CO") : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {(form.type === "semen" || form.type === "breeding service") && (
            <div className="py-6 text-center space-y-2">
              <Droplets className="h-10 w-10 text-primary/50 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {form.type === "semen"
                  ? "Define el título y precio del material genético en los próximos pasos."
                  : "Define el título y precio del servicio de monta en los próximos pasos."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Precio y Condiciones</h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Precio de Venta *</label>
              <input
                required
                type="number"
                value={form.price}
                onChange={set("price")}
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
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Términos de Negociación</label>
            <input
              value={form.negotiation_terms}
              onChange={set("negotiation_terms")}
              placeholder='Ej. "Precio negociable para compradores serios"'
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">País del Establo</label>
              <select
                value={form.location_country}
                onChange={set("location_country")}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Ciudad</label>
              <input
                value={form.location_city}
                onChange={set("location_city")}
                placeholder="Bogotá"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Description */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Descripción Comercial</h4>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Título de la Publicación *</label>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder="Ej. Yegua Paso Fino de Elite — Sangre Campeona"
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Disciplina Principal</label>
            <select
              value={form.discipline}
              onChange={set("discipline")}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Selecciona disciplina...</option>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Descripción Comercial *</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe el ejemplar, sus logros, temperamento, historial de salud, pedigrí destacado..."
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Revisión Final</h4>

          <div className="lux-card p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-semibold capitalize">{form.type}</span>
            </div>
            {selectedHorse && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ejemplar</span>
                <span className="font-semibold">{(selectedHorse as any).name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Título</span>
              <span className="font-semibold text-right max-w-[180px] truncate">{form.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio</span>
              <span className="font-bold text-primary">{form.currency} {Number(form.price).toLocaleString()}</span>
            </div>
            {form.discipline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disciplina</span>
                <span className="font-semibold">{form.discipline}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ubicación</span>
              <span className="font-semibold">{[form.location_city, form.location_country].filter(Boolean).join(", ")}</span>
            </div>
          </div>

          {form.description && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-xs text-muted-foreground line-clamp-4">{form.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as any)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            disabled={
              step === 1 ? !canNextStep1 :
              step === 2 ? !canNextStep2 :
              step === 3 ? !canNextStep3 :
              !canNextStep4
            }
            onClick={() => setStep((s) => (s + 1) as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={createListing.isPending}
            onClick={handlePublish}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {createListing.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
            ) : (
              "🚀 Publicar en el Mercado"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

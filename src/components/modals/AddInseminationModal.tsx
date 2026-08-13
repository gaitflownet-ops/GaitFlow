/**
 * AddInseminationModal.tsx — Enterprise Multi-step wizard for registering a breeding cycle
 * Step 1: Mare selection + Insemination Method
 * Step 2: Stallion Origin (Internal / Purchased Inventory / External Purchased Stud)
 * Step 3: Vet details, dates & automated schedules
 */
import { useState } from "react";
import { Modal } from "./Modal";
import {
  useBreedingCycles,
  useCreateBreedingCycle,
  useGeneticsInventory,
  type InseminationMethod,
} from "@/lib/hooks/useBreeding";
import { useHorses } from "@/lib/hooks/useHorses";
import { ChevronLeft, ChevronRight, Check, Dna, Syringe, CalendarCheck, Crown, ShoppingBag, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
}

const METHOD_LABELS: Record<InseminationMethod, { label: string; desc: string; color: string }> = {
  "Monta Natural":      { label: "Monta Natural", desc: "Cubierta directa con semental en el sitio", color: "text-amber-600" },
  "Semen Refrigerado":  { label: "Semen Refrigerado", desc: "Semen fresco refrigerado, uso en 24-48h", color: "text-blue-500" },
  "Pajilla Congelada":  { label: "Pajillas Congeladas", desc: "LN₂ · -196°C · larga conservación en banco", color: "text-indigo-500" },
  "Transferencia de Embrión": { label: "Transferencia de Embrión", desc: "Embrión lavado de yegua donadora a receptora", color: "text-rose-500" },
};

const METHODS: InseminationMethod[] = [
  "Monta Natural",
  "Semen Refrigerado",
  "Pajilla Congelada",
  "Transferencia de Embrión",
];

const STEPS = [
  { id: 1, label: "Yegua y Método", icon: Syringe },
  { id: 2, label: "Origen de Semental / Pajilla", icon: Dna },
  { id: 3, label: "Veterinario y Fechas", icon: CalendarCheck },
];

export function AddInseminationModal({ open, onClose, preselectedMareId }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: genetics = [] } = useGeneticsInventory();
  const createCycle = useCreateBreedingCycle();

  // Strict Filter for Female Mares (Yeguas)
  const isFemale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "yegua" || sex === "mare" || sex === "hembra" || sex === "female" || sex === "f";
  };
  const mares = horses.filter(isFemale);

  // Filter Male Stallions in Farm
  const isMale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "stallion" || sex === "semental" || sex === "macho" || sex === "padrillo" || sex === "male" || sex === "m" || sex === "potro";
  };
  const internalStallions = horses.filter(isMale);

  const [step, setStep] = useState(1);
  const [stallionSourceMode, setStallionSourceMode] = useState<"internal" | "inventory" | "external">("internal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    mare_id: preselectedMareId ?? "",
    method: "Semen Refrigerado" as InseminationMethod,
    stallion_id: "",
    stallion_name: "",
    stallion_registry: "",
    genetic_material_id: "",
    external_owner: "",
    insemination_date: new Date().toISOString().split("T")[0],
    vet_name: "",
    expected_foaling_date: computeExpectedFoaling(new Date().toISOString().split("T")[0]),
    notes: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function computeExpectedFoaling(insemDate: string) {
    if (!insemDate) return "";
    const d = new Date(insemDate);
    d.setDate(d.getDate() + 340);
    return d.toISOString().split("T")[0];
  }

  function handleInseminationDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      insemination_date: val,
      expected_foaling_date: computeExpectedFoaling(val),
    }));
  }

  function handleSelectInternalStallion(id: string) {
    const st = internalStallions.find((s) => s.id === id);
    setForm((f) => ({
      ...f,
      stallion_id: id,
      stallion_name: st ? st.name : "",
      stallion_registry: st ? (st.code || "") : "",
      genetic_material_id: "",
    }));
  }

  function handleSelectInventoryItem(itemId: string) {
    const item = genetics.find((g) => g.id === itemId);
    if (!item) return;
    const donorName = item.donor?.name || "Semental Inventario";
    setForm((f) => ({
      ...f,
      stallion_id: item.donor_id || "",
      stallion_name: donorName,
      stallion_registry: item.lot_number ? `Lote: ${item.lot_number}` : "",
      genetic_material_id: itemId,
    }));
  }

  async function handleSubmit() {
    if (!form.mare_id) {
      toast.error("Selecciona una yegua reproductora.");
      return;
    }
    if (!form.stallion_name) {
      toast.error("Ingresa o selecciona el semental reproductor.");
      return;
    }
    if (!form.insemination_date) {
      toast.error("Selecciona la fecha de inseminación/monta.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCycle.mutateAsync({
        mare_id: form.mare_id,
        method: form.method,
        stallion_id: form.stallion_id || undefined,
        stallion_name: form.stallion_name,
        stallion_registry: form.stallion_registry || undefined,
        genetic_material_id: form.genetic_material_id || undefined,
        insemination_date: form.insemination_date,
        vet_name: form.vet_name || undefined,
        expected_foaling_date: form.expected_foaling_date || undefined,
        notes: form.notes
          ? `${form.notes}${form.external_owner ? ` | Propietario/Criadero: ${form.external_owner}` : ""}`
          : form.external_owner ? `Propietario/Criadero: ${form.external_owner}` : undefined,
        pregnancy_status: "Pending",
      });

      toast.success("Inseminación/Monta registrada exitosamente");
      onClose();
      setStep(1);
      setForm({
        mare_id: preselectedMareId ?? "",
        method: "Semen Refrigerado",
        stallion_id: "",
        stallion_name: "",
        stallion_registry: "",
        genetic_material_id: "",
        external_owner: "",
        insemination_date: new Date().toISOString().split("T")[0],
        vet_name: "",
        expected_foaling_date: computeExpectedFoaling(new Date().toISOString().split("T")[0]),
        notes: "",
      });
    } catch (err: any) {
      console.error("Error al registrar inseminación:", err);
      toast.error(err.message || "Ocurrió un error al guardar el registro.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canNext1 = !!form.mare_id && !!form.method;
  const canNext2 = !!form.stallion_name;
  const canSubmit = canNext1 && canNext2 && !!form.insemination_date;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-3 border-b border-border bg-card">
        <div className="eyebrow mb-1">Sección I.1 · Reproducción Enterprise</div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Syringe className="h-6 w-6 text-primary" /> Registrar Inseminación / Monta
        </h2>
        {/* Step indicators */}
        <div className="flex items-center gap-0 mt-5">
          {STEPS.map((s, idx) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active ? "bg-primary text-primary-foreground shadow-sm" :
                  done ? "bg-primary/20 text-primary" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  {s.label}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-6 h-px mx-1 ${done ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-7 py-6 space-y-5 min-h-[360px]">
        {/* ── Step 1: Mare + Method ── */}
        {step === 1 && (
          <>
            <div>
              <label className="label-field font-semibold">Yegua Reproductora *</label>
              <select id="insem-mare" className="input-field mt-1.5" value={form.mare_id} onChange={set("mare_id")}>
                <option value="">Seleccionar yegua del catálogo...</option>
                {mares.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.code ? `(${m.code})` : ""} {m.breed ? `· ${m.breed}` : ""}
                  </option>
                ))}
              </select>
              {mares.length === 0 ? (
                <p className="text-xs text-amber-600 mt-1.5">
                  ⚠️ No se encontraron yeguas hembras. Asegúrate de registrar la ejemplar con sexo "Yegua" o "Hembra" en el módulo de Ejemplares.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Filtro activo: Únicamente ejemplares de sexo hembra ({mares.length} disponibles).
                </p>
              )}
            </div>

            <div>
              <label className="label-field font-semibold">Método Reproductivo *</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                {METHODS.map((m) => {
                  const info = METHOD_LABELS[m];
                  const selected = form.method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      id={`method-${m.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => setForm((f) => ({ ...f, method: m }))}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`text-xs font-bold ${selected ? "text-primary" : info.color}`}>{info.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{info.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Stallion / Genetic Material Source ── */}
        {step === 2 && (
          <>
            <div>
              <label className="label-field font-semibold mb-2 block">Origen del Semental / Salto *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStallionSourceMode("internal");
                    setForm((f) => ({ ...f, stallion_id: "", stallion_name: "", genetic_material_id: "" }));
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    stallionSourceMode === "internal"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  <span className="text-xs">Criadero Propio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStallionSourceMode("inventory");
                    setForm((f) => ({ ...f, stallion_id: "", stallion_name: "", genetic_material_id: "" }));
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    stallionSourceMode === "inventory"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs">Inventario (Saltos Comprados)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStallionSourceMode("external");
                    setForm((f) => ({ ...f, stallion_id: "", stallion_name: "", genetic_material_id: "" }));
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    stallionSourceMode === "external"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs">Semental Externo Directo</span>
                </button>
              </div>
            </div>

            {/* Option A: Internal Stallions */}
            {stallionSourceMode === "internal" && (
              <div>
                <label className="label-field font-semibold">Seleccionar Semental del Criadero *</label>
                <select
                  id="internal-stallion-select"
                  className="input-field mt-1.5"
                  value={form.stallion_id}
                  onChange={(e) => handleSelectInternalStallion(e.target.value)}
                >
                  <option value="">Seleccionar semental de la finca...</option>
                  {internalStallions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.breed ? `· ${s.breed}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Option B: Genetic Bank Inventory (Saltos Comprados) */}
            {stallionSourceMode === "inventory" && (
              <div>
                <label className="label-field font-semibold">Seleccionar Salto / Pajilla en Inventario Propio *</label>
                <select
                  id="inventory-genetics-select"
                  className="input-field mt-1.5"
                  value={form.genetic_material_id}
                  onChange={(e) => handleSelectInventoryItem(e.target.value)}
                >
                  <option value="">Seleccionar del banco genético...</option>
                  {genetics.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.donor?.name || "Semental de Banco"} · {g.material_type} · Cant: {g.quantity} {g.storage_tank ? `(${g.storage_tank})` : ""}
                    </option>
                  ))}
                </select>
                {genetics.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    No tienes dosis registradas en el Banco Genético. Puedes registrar sementales externos directamente en la opción de la derecha.
                  </p>
                )}
              </div>
            )}

            {/* Option C: External Purchased Stallion */}
            {stallionSourceMode === "external" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field font-semibold">Nombre del Semental *</label>
                    <input
                      id="stallion-name"
                      className="input-field mt-1"
                      value={form.stallion_name}
                      onChange={set("stallion_name")}
                      placeholder="Ej. Dulce Sueño de Lusitania"
                    />
                  </div>
                  <div>
                    <label className="label-field">N° Registro / Asoc</label>
                    <input
                      id="stallion-registry"
                      className="input-field mt-1"
                      value={form.stallion_registry}
                      onChange={set("stallion_registry")}
                      placeholder="Ej. CCC-98742"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-field">Criadero de Origen / Propietario del Salto</label>
                  <input
                    id="external-owner"
                    className="input-field mt-1"
                    value={form.external_owner}
                    onChange={set("external_owner")}
                    placeholder="Ej. Criadero San Marcos / Salto Comprado"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label-field">Notas del Servicio / Observaciones</label>
              <textarea
                id="cycle-notes"
                className="input-field resize-none h-20 mt-1"
                value={form.notes}
                onChange={set("notes")}
                placeholder="Condición folicular de la yegua, dosis empleadas, observaciones de la monta..."
              />
            </div>
          </>
        )}

        {/* ── Step 3: Vet + Dates ── */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field font-semibold">Fecha de Inseminación / Monta *</label>
                <input
                  id="insemination-date"
                  type="date"
                  className="input-field mt-1.5"
                  value={form.insemination_date}
                  onChange={handleInseminationDateChange}
                />
              </div>
              <div>
                <label className="label-field font-semibold">Fecha Probable de Parto</label>
                <input
                  id="expected-foaling-date"
                  type="date"
                  className="input-field mt-1.5"
                  value={form.expected_foaling_date}
                  onChange={set("expected_foaling_date")}
                />
                <p className="text-[11px] text-muted-foreground mt-1">Auto-calculado: +340 días de gestación</p>
              </div>
            </div>
            <div>
              <label className="label-field font-semibold">Médico Veterinario Responsable</label>
              <input
                id="vet-name"
                className="input-field mt-1.5"
                value={form.vet_name}
                onChange={set("vet_name")}
                placeholder="Dr. Juan Manuel Sierra"
              />
            </div>
            <div className="lux-card p-4 bg-primary/5 border-primary/20 rounded-xl">
              <div className="text-xs font-bold text-primary mb-1.5">Programación automática del timeline</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Diagnóstico ecográfico precoz (+14 días)</li>
                <li>• Confirmación de embrión/latido (+30 días)</li>
                <li>• Verificación de fijación de gestación (+60 días)</li>
                <li>• Preparación y seguimiento de parto (~330 días)</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5 bg-card">
        <button
          id="insem-back-btn"
          disabled={isSubmitting}
          onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? "Cancelar" : "Atrás"}
        </button>

        {step < 3 ? (
          <button
            id="insem-next-btn"
            disabled={step === 1 ? !canNext1 : !canNext2}
            onClick={() => setStep(s => s + 1)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            id="insem-submit-btn"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Registrar Inseminación
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
}

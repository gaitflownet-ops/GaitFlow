/**
 * AddInseminationModal.tsx — Multi-step wizard for registering a breeding cycle
 * Step 1: Mare selection + method
 * Step 2: Stallion / donor + genetic material
 * Step 3: Vet details + scheduling
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
import { ChevronLeft, ChevronRight, Check, Dna, Syringe, CalendarCheck } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
}

const METHODS: InseminationMethod[] = [
  "Fresh Cover",
  "Chilled Semen",
  "Frozen Semen",
  "Embryo Transfer",
];

const METHOD_LABELS: Record<InseminationMethod, { label: string; desc: string; color: string }> = {
  "Fresh Cover":    { label: "Monta Natural", desc: "Cubierta directa con semental en el sitio", color: "text-amber-600" },
  "Chilled Semen":  { label: "Semen Refrigerado", desc: "Semen fresco refrigerado, uso en 24-48h", color: "text-blue-500" },
  "Frozen Semen":   { label: "Pajillas Congeladas", desc: "LN₂ · -196°C · larga conservación", color: "text-indigo-500" },
  "Embryo Transfer":{ label: "Transferencia de Embrión", desc: "Embrión lavado de yegua donadora a receptora", color: "text-rose-500" },
};

const STEPS = [
  { id: 1, label: "Yegua y Método", icon: Syringe },
  { id: 2, label: "Semental / Material", icon: Dna },
  { id: 3, label: "Veterinario y Fechas", icon: CalendarCheck },
];

export function AddInseminationModal({ open, onClose, preselectedMareId }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: genetics = [] } = useGeneticsInventory();
  const createCycle = useCreateBreedingCycle();

  // Mares: filter horses by sex female
  const mares = horses.filter((h) => h.sex === "Yegua" || h.sex === "Female" || h.sex === "Mare");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    mare_id: preselectedMareId ?? "",
    method: "Chilled Semen" as InseminationMethod,
    stallion_name: "",
    stallion_registry: "",
    genetic_material_id: "",
    insemination_date: new Date().toISOString().split("T")[0],
    vet_name: "",
    expected_foaling_date: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const availableGenetics = genetics.filter(
    (g) => g.status === "Available" && (
      form.method === "Frozen Semen" ? g.material_type === "Frozen Straw" :
      form.method === "Chilled Semen" ? g.material_type === "Chilled Straw" :
      form.method === "Embryo Transfer" ? g.material_type === "Embryo" :
      false
    )
  );

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

  async function handleSubmit() {
    if (!form.mare_id || !form.stallion_name || !form.insemination_date) return;
    await createCycle.mutateAsync({
      mare_id: form.mare_id,
      method: form.method,
      stallion_name: form.stallion_name,
      stallion_registry: form.stallion_registry || undefined,
      genetic_material_id: form.genetic_material_id || undefined,
      insemination_date: form.insemination_date,
      vet_name: form.vet_name || undefined,
      expected_foaling_date: form.expected_foaling_date || undefined,
      notes: form.notes || undefined,
      pregnancy_status: "Pending",
    });
    onClose();
    setStep(1);
    setForm({ mare_id: preselectedMareId ?? "", method: "Chilled Semen", stallion_name: "", stallion_registry: "", genetic_material_id: "", insemination_date: new Date().toISOString().split("T")[0], vet_name: "", expected_foaling_date: "", notes: "" });
  }

  const canNext1 = !!form.mare_id && !!form.method;
  const canNext2 = !!form.stallion_name;
  const canSubmit = canNext1 && canNext2 && !!form.insemination_date;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-3 border-b border-border">
        <div className="eyebrow mb-1">Sección I.1</div>
        <h2 className="font-display text-2xl">Registrar Inseminación</h2>
        {/* Step indicators */}
        <div className="flex items-center gap-0 mt-5">
          {STEPS.map((s, idx) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? "bg-primary text-primary-foreground" :
                  done ? "bg-primary/20 text-primary" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
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

      <div className="px-7 py-6 space-y-5 min-h-[320px]">
        {/* ── Step 1: Mare + Method ── */}
        {step === 1 && (
          <>
            <div>
              <label className="label-field">Yegua *</label>
              <select id="insem-mare" className="input-field" value={form.mare_id} onChange={set("mare_id")}>
                <option value="">Seleccionar yegua...</option>
                {mares.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} {m.breed ? `· ${m.breed}` : ""}</option>
                ))}
              </select>
              {mares.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No hay yeguas registradas. Los caballos de sexo "Yegua" aparecerán aquí.</p>
              )}
            </div>
            <div>
              <label className="label-field">Método de Reproducción *</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {METHODS.map((m) => {
                  const info = METHOD_LABELS[m];
                  const selected = form.method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      id={`method-${m.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => setForm((f) => ({ ...f, method: m }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`text-xs font-semibold ${selected ? "text-primary" : info.color}`}>{info.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{info.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Stallion / Genetic Material ── */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Nombre del Semental *</label>
                <input id="stallion-name" className="input-field" value={form.stallion_name} onChange={set("stallion_name")} placeholder="Ej. Aristocrat de la Roca" />
              </div>
              <div>
                <label className="label-field">N° Registro (AQHA / USEF)</label>
                <input id="stallion-registry" className="input-field" value={form.stallion_registry} onChange={set("stallion_registry")} placeholder="Opcional" />
              </div>
            </div>

            {availableGenetics.length > 0 && (
              <div>
                <label className="label-field">Material Genético del Inventario</label>
                <select id="genetic-material" className="input-field" value={form.genetic_material_id} onChange={set("genetic_material_id")}>
                  <option value="">Sin vincular del inventario</option>
                  {availableGenetics.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.donor_name} · {g.material_type} · Cant. {g.quantity}
                      {g.unique_code ? ` · #${g.unique_code}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Vincular material del Inventario Genético descontará 1 unidad al guardar.
                </p>
              </div>
            )}

            <div>
              <label className="label-field">Notas de preparación</label>
              <textarea id="cycle-notes" className="input-field resize-none h-20" value={form.notes} onChange={set("notes")} placeholder="Condición de la yegua, preparación, observaciones previas..." />
            </div>
          </>
        )}

        {/* ── Step 3: Vet + Dates ── */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Fecha de Inseminación *</label>
                <input id="insemination-date" type="date" className="input-field" value={form.insemination_date} onChange={handleInseminationDateChange} />
              </div>
              <div>
                <label className="label-field">Fecha Probable de Parto</label>
                <input id="expected-foaling-date" type="date" className="input-field" value={form.expected_foaling_date} onChange={set("expected_foaling_date")} />
                <p className="text-[11px] text-muted-foreground mt-0.5">Auto-calculado: +340 días desde inseminación</p>
              </div>
            </div>
            <div>
              <label className="label-field">Médico Veterinario</label>
              <input id="vet-name" className="input-field" value={form.vet_name} onChange={set("vet_name")} placeholder="Nombre del veterinario responsable" />
            </div>
            <div className="lux-card p-4 bg-primary/5 border-primary/20">
              <div className="text-xs font-medium text-primary mb-2">Alertas automáticas que se crearán</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Diagnóstico de gestación: +14 días post-inseminación</li>
                <li>• Confirmación ecográfica: +30 días</li>
                <li>• Control reproductivo: +60 días</li>
                <li>• Vigilancia preparto: ~330 días</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5">
        <button
          id="insem-back-btn"
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            id="insem-submit-btn"
            disabled={!canSubmit || createCycle.isPending}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {createCycle.isPending ? "Guardando…" : <>
              <Check className="h-4 w-4" /> Registrar Inseminación
            </>}
          </button>
        )}
      </div>
    </Modal>
  );
}

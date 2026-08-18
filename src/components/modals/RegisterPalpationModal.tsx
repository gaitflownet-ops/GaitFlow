/**
 * RegisterPalpationModal.tsx — Enterprise Specialized Palpation & Follicular Ultrasound Wizard
 *
 * 5-Step Enterprise Flow:
 * 1. Mare Selection + Contextual Mini-Card & Heat Alerts
 * 2. Bilateral Ovarian & Uterine Examination (Left/Right Follicles mm, Uterine Tone, Edema)
 * 3. Gynecological Status & Veterinary Clinical Decision (Inseminate now, Induce ovulation, Treatment)
 * 4. Automatic & Customizable Calendar Follow-up Scheduling (+24h, +48h, etc.)
 * 5. Executive Summary & Continuous Actions
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import {
  useMares,
  useBreedingCycles,
  useCreateReproductiveEvent,
  useUpdateMareStatus,
} from "@/lib/hooks/useBreeding";

import {
  Stethoscope,
  Search,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

export function RegisterPalpationModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: maresList = [] } = useMares();
  const { data: activeCycles = [] } = useBreedingCycles();

  const createEvent = useCreateReproductiveEvent();
  const updateMareStatus = useUpdateMareStatus();

  // Wizard state (Steps 1 to 5)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Female Mares only
  const isFemale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "yegua" || sex === "mare" || sex === "hembra" || sex === "female" || sex === "f";
  };
  const femaleHorses = horses.filter(isFemale);

  const [mareSearch, setMareSearch] = useState("");

  // Form State
  const [form, setForm] = useState({
    mare_id: preselectedMareId || "",
    exam_date: new Date().toISOString().split("T")[0],
    exam_time: "09:30",
    vet_name: "",
    
    // Left Ovary
    left_follicle_mm: "36",
    left_corpus_luteum: false,
    left_notes: "",
    
    // Right Ovary
    right_follicle_mm: "22",
    right_corpus_luteum: false,
    right_notes: "",

    // Uterine Parameters
    uterine_tone: "Tono II (Folicular Activo)",
    endometrial_edema: "Grado 2 (Edema Moderado)",
    cervix_status: "Relajado / Abierto (Celo)",
    
    // Clinical Decision
    gynecological_status: "En celo / Folicular Activo",
    clinical_recommendation: "Apta para Servicio / Inseminar en 24-36h",
    treatment_applied: "",
    notes: "",

    // Follow-up
    schedule_next_exam: true,
    next_exam_hours: 24,
    schedule_service: false,
  });

  const setF = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Selected Mare
  const selectedMareHorse = femaleHorses.find((h) => h.id === form.mare_id);
  const selectedMareRecord = maresList.find((m) => m.horse_id === form.mare_id || m.id === form.mare_id);
  const currentActiveCycle = activeCycles.find(
    (c) => c.mare_id === form.mare_id && c.pregnancy_status === "Pending"
  );

  function getSuggestedNextDate() {
    if (!form.exam_date) return "";
    const d = new Date(form.exam_date);
    const addDays = Math.max(1, Math.round(Number(form.next_exam_hours) / 24));
    d.setDate(d.getDate() + addDays);
    return d.toISOString().split("T")[0];
  }

  async function handleSubmitPalpation() {
    if (!form.mare_id) {
      toast.error("Selecciona una yegua reproductora.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Primary Reproductive Event (Palpación / Ecografía)
      const findingsSummary = [
        `O. Izq: ${form.left_follicle_mm}mm ${form.left_corpus_luteum ? '(CL)' : ''}`,
        `O. Der: ${form.right_follicle_mm}mm ${form.right_corpus_luteum ? '(CL)' : ''}`,
        `Útero: ${form.uterine_tone}`,
        `Edema: ${form.endometrial_edema}`,
        `Cervix: ${form.cervix_status}`,
        `Dictamen: ${form.gynecological_status}`,
        `Conducta: ${form.clinical_recommendation}`,
        form.treatment_applied ? `Tratamiento: ${form.treatment_applied}` : null,
        form.notes || null,
      ].filter(Boolean).join(" | ");

      await createEvent.mutateAsync({
        cycle_id: currentActiveCycle?.id,
        mare_id: form.mare_id,
        event_type: "Palpación",
        scheduled_date: form.exam_date,
        completed_date: form.exam_date,
        status: "Completado",
        vet_name: form.vet_name || undefined,
        result: `${form.gynecological_status} — ${form.clinical_recommendation}`,
        notes: findingsSummary,
      });

      // 2. Schedule Follow-up Exam if selected
      if (form.schedule_next_exam) {
        const nextDate = getSuggestedNextDate();
        await createEvent.mutateAsync({
          cycle_id: currentActiveCycle?.id,
          mare_id: form.mare_id,
          event_type: "Palpación",
          scheduled_date: nextDate,
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: `Re-evaluación folicular de seguimiento (+${form.next_exam_hours}h post-examen)`,
        });
      }

      // 3. Update Mare status to "En celo" if diagnosed in heat
      if (form.gynecological_status.includes("En celo")) {
        await updateMareStatus.mutateAsync({
          id: form.mare_id,
          reproductive_status: "En celo",
        });
      }

      toast.success("Examen de palpación y agendamiento registrados con éxito");
      setStep(5); // Move to Executive Summary
    } catch (err: any) {
      console.error("Error al registrar palpación:", err);
      toast.error(err.message || "Error al guardar el examen de palpación.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <div className="eyebrow text-purple-600 font-bold">Sección I.2 · Ginecología Equina</div>
          <div className="text-xs font-semibold text-muted-foreground">Paso {step} de 5</div>
        </div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-purple-600" /> Registrar Palpación / Ecografía Folicular
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Body */}
      <div className="px-8 py-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
        {/* ── PASO 1: SELECCIÓN DE YEGUA ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label-field font-semibold text-sm mb-2 block">
                1. Seleccionar Yegua a Examinar *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="search-mare-palpation"
                  className="input-field pl-10 text-sm"
                  placeholder="Buscar yegua por nombre, código o raza..."
                  value={mareSearch}
                  onChange={(e) => setMareSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {femaleHorses
                .filter(
                  (m) =>
                    m.name.toLowerCase().includes(mareSearch.toLowerCase()) ||
                    (m.code && m.code.toLowerCase().includes(mareSearch.toLowerCase()))
                )
                .map((m) => {
                  const isSel = form.mare_id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mare_id: m.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/20"
                          : "border-border hover:border-purple-600/40 hover:bg-secondary/40"
                      }`}
                    >
                      <img
                        src={m.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                        alt={m.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {m.code ? `${m.code} · ` : ""}{m.breed || "Paso Fino"}
                        </div>
                      </div>
                      {isSel && <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {selectedMareHorse && (
              <div className="lux-card p-4 bg-card border border-purple-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedMareHorse.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                    alt={selectedMareHorse.name}
                    className="h-14 w-14 rounded-xl object-cover border border-border"
                  />
                  <div>
                    <h3 className="font-display font-bold text-base">{selectedMareHorse.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMareHorse.code || "Sin código"} · {selectedMareHorse.breed || "Paso Fino"} · {selectedMareHorse.age || 6} años
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 text-[11px] font-bold mt-1">
                      Estado Actual: {selectedMareRecord?.reproductive_status || "Vacía"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: EXAMEN DE OVARIOS Y ÚTERO ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                2. Hallazgos Ováricos y Uterinos
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Registra los diámetros foliculares observados por ultrasonografía o palpación manual.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Ovario Izquierdo */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Ovario Izquierdo
                </div>
                <div>
                  <label className="label-field text-xs">Folículo Dominante (mm)</label>
                  <input
                    type="number"
                    className="input-field mt-1 text-xs"
                    value={form.left_follicle_mm}
                    onChange={setF("left_follicle_mm")}
                    placeholder="Ej. 36"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.left_corpus_luteum}
                    onChange={(e) => setForm((f) => ({ ...f, left_corpus_luteum: e.target.checked }))}
                    className="rounded text-purple-600"
                  />
                  <span className="text-xs font-medium">Presencia de Cuerpo Lúteo (CL)</span>
                </label>
              </div>

              {/* Ovario Derecho */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Ovario Derecho
                </div>
                <div>
                  <label className="label-field text-xs">Folículo Dominante (mm)</label>
                  <input
                    type="number"
                    className="input-field mt-1 text-xs"
                    value={form.right_follicle_mm}
                    onChange={setF("right_follicle_mm")}
                    placeholder="Ej. 22"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.right_corpus_luteum}
                    onChange={(e) => setForm((f) => ({ ...f, right_corpus_luteum: e.target.checked }))}
                    className="rounded text-purple-600"
                  />
                  <span className="text-xs font-medium">Presencia de Cuerpo Lúteo (CL)</span>
                </label>
              </div>
            </div>

            {/* Parámetros Uterinos */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="label-field text-xs font-semibold">Tono Uterino</label>
                <select className="input-field mt-1 text-xs" value={form.uterine_tone} onChange={setF("uterine_tone")}>
                  <option>Tono I (En Celo)</option>
                  <option>Tono II (Folicular Activo)</option>
                  <option>Tono III (Edema Uterino)</option>
                  <option>Post-Ovulación / Tónico</option>
                  <option>Flácido (Anestro)</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Edema Endometrial</label>
                <select className="input-field mt-1 text-xs" value={form.endometrial_edema} onChange={setF("endometrial_edema")}>
                  <option>Grado 0 (Sin Edema)</option>
                  <option>Grado 1 (Edema Leve)</option>
                  <option>Grado 2 (Edema Moderado)</option>
                  <option>Grado 3 (Edema Marcado - Preovulatorio)</option>
                  <option>Patológico / Líquido Libre</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Estado del Cervix</label>
                <select className="input-field mt-1 text-xs" value={form.cervix_status} onChange={setF("cervix_status")}>
                  <option>Relajado / Abierto (Celo)</option>
                  <option>Cerrado / Rígido (Diestro)</option>
                  <option>Intermedio</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: DICTAMEN Y CONDUCTA CLÍNICA ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                3. Dictamen Ginecológico y Conducta Clínica *
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Define el diagnóstico del ciclo y la acción veterinaria a seguir.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Estado Ginecológico</label>
                <select className="input-field mt-1 text-xs" value={form.gynecological_status} onChange={setF("gynecological_status")}>
                  <option>En celo / Folicular Activo</option>
                  <option>Pre-Ovulatoria (Folículo {'>'} 35mm)</option>
                  <option>Post-Ovulación Reciente</option>
                  <option>Diestro / Fase Luteal</option>
                  <option>Anestro / Inactiva</option>
                  <option>Endometritis / Tratamiento Requerido</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Conducta Recomendada</label>
                <select className="input-field mt-1 text-xs" value={form.clinical_recommendation} onChange={setF("clinical_recommendation")}>
                  <option>Apta para Servicio / Inseminar en 24-36h</option>
                  <option>Servir Inmediatamente</option>
                  <option>Inducir Ovulación (hCG / Deslorelin)</option>
                  <option>Aplicar Prostaglandina (Lisis CL)</option>
                  <option>Lavado Uterino / Antibiótico</option>
                  <option>Repetir Chequeo en 48h</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Fecha Examen *</label>
                <input type="date" className="input-field mt-1 text-xs" value={form.exam_date} onChange={setF("exam_date")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Hora Examen</label>
                <input type="time" className="input-field mt-1 text-xs" value={form.exam_time} onChange={setF("exam_time")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Veterinario Responsable</label>
                <input className="input-field mt-1 text-xs" value={form.vet_name} onChange={setF("vet_name")} placeholder="Ej. Dr. Médico Veterinario" />
              </div>
            </div>

            <div>
              <label className="label-field text-xs font-semibold">Tratamiento / Medicación Aplicada</label>
              <input className="input-field mt-1 text-xs" value={form.treatment_applied} onChange={setF("treatment_applied")} placeholder="Ej. 1.5ml Prostaglandina IM, Dexametasona, etc." />
            </div>

            <div>
              <label className="label-field text-xs font-semibold">Notas Clínicas Adicionales</label>
              <textarea className="input-field mt-1 text-xs resize-none h-16" value={form.notes} onChange={setF("notes")} placeholder="Ej. Hallazgos adicionales, ecogenicidad, etc." />
            </div>
          </div>
        )}

        {/* ── PASO 4: SEGUIMIENTO AUTOMÁTICO EN CALENDARIO ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                4. Programación de Seguimiento Ginecológico
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                GaitFlow agendará el próximo control ginecológico en el Calendario y Timeline.
              </p>
            </div>

            <div className="lux-card p-4 border border-purple-500/20 bg-card rounded-2xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.schedule_next_exam}
                  onChange={(e) => setForm((f) => ({ ...f, schedule_next_exam: e.target.checked }))}
                  className="rounded text-purple-600 mt-1"
                />
                <div>
                  <div className="text-xs font-bold">☑ Programar Próxima Palpación / Control Folicular</div>
                  <div className="text-[11px] text-muted-foreground">
                    Intervalo: en <strong>{form.next_exam_hours} horas</strong> (Fecha sugerida: <strong>{getSuggestedNextDate()}</strong>)
                  </div>
                </div>
              </label>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                {[
                  { hours: 24, label: "En 24 Horas" },
                  { hours: 48, label: "En 48 Horas" },
                  { hours: 72, label: "En 3 Días" },
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, next_exam_hours: item.hours }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      form.next_exam_hours === item.hours
                        ? "border-purple-600 bg-purple-500/10 text-purple-700"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 5: RESUMEN EJECUTIVO ── */}
        {step === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-500/10 text-purple-600 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-display font-bold text-2xl">¡Examen Ginecológico Registrado!</h3>

            <div className="lux-card p-5 bg-card border-border rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Yegua:</span>
                <span className="font-bold">{selectedMareHorse?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Folículo Dominante:</span>
                <span className="font-bold">{Math.max(Number(form.left_follicle_mm) || 0, Number(form.right_follicle_mm) || 0)} mm</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Diagnóstico:</span>
                <span className="font-bold">{form.gynecological_status}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Conducta:</span>
                <span className="font-bold text-purple-700">{form.clinical_recommendation}</span>
              </div>
              {form.schedule_next_exam && (
                <div className="flex justify-between pt-1 text-purple-600 font-semibold">
                  <span>Próximo Control:</span>
                  <span>{getSuggestedNextDate()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateView) onNavigateView("yeguas");
                }}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
              >
                <FileText className="h-3.5 w-3.5 inline mr-1" /> Ver Ficha de Yegua
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateView) onNavigateView("calendario");
                }}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1" /> Ver Calendario
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setForm({
                    mare_id: "",
                    exam_date: new Date().toISOString().split("T")[0],
                    exam_time: "09:30",
                    vet_name: "",
                    left_follicle_mm: "36",
                    left_corpus_luteum: false,
                    left_notes: "",
                    right_follicle_mm: "22",
                    right_corpus_luteum: false,
                    right_notes: "",
                    uterine_tone: "Tono II (Folicular Activo)",
                    endometrial_edema: "Grado 2 (Edema Moderado)",
                    cervix_status: "Relajado / Abierto (Celo)",
                    gynecological_status: "En celo / Folicular Activo",
                    clinical_recommendation: "Apta para Servicio / Inseminar en 24-36h",
                    treatment_applied: "",
                    notes: "",
                    schedule_next_exam: true,
                    next_exam_hours: 24,
                    schedule_service: false,
                  });
                }}
                className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold"
              >
                Registrar Otra Palpación
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {step < 5 && (
        <div className="px-8 pb-7 pt-4 border-t border-border flex items-center justify-between bg-card">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancelar" : "Atrás"}
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 ? !form.mare_id : false}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !form.mare_id}
              onClick={handleSubmitPalpation}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando Examen...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Finalizar y Guardar Palpación
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

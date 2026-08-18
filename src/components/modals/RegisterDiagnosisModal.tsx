/**
 * RegisterDiagnosisModal.tsx — Enterprise Specialized Pregnancy Diagnosis Wizard
 *
 * 5-Step Enterprise Flow:
 * 1. Serviced Mare Selection + Days Post-Service Context Card
 * 2. Ultrasound & Clinical Diagnostic Findings (Embryonic vesicle mm, Heartbeat, Twins)
 * 3. Diagnostic Outcome (Preñada / Vacía / Duda / Reabsorción)
 * 4. Automatic Synchronization (State update, Foaling date calculation, Follow-up scheduling)
 * 5. Executive Confirmation Summary & Continuous Actions
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import {
  useMares,
  useBreedingCycles,
  useUpdateBreedingCycle,
  useCreateReproductiveEvent,
  useUpdateMareStatus,
  type PregnancyStatus,
} from "@/lib/hooks/useBreeding";

import {
  Activity,
  Search,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  AlertTriangle,
  Baby,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

export function RegisterDiagnosisModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: maresList = [] } = useMares();
  const { data: cyclesList = [] } = useBreedingCycles();

  const updateCycle = useUpdateBreedingCycle();
  const createEvent = useCreateReproductiveEvent();
  const updateMareStatus = useUpdateMareStatus();

  // Wizard state (Steps 1 to 5)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Female Mares only (any horse not strictly male)
  const isFemale = (h: any) => {
    if (!h) return false;
    const s = String(h.sex || h.gender || h.category || "").trim().toLowerCase();
    if (
      s.includes("macho") ||
      s.includes("semental") ||
      s.includes("stallion") ||
      s.includes("castrado") ||
      s.includes("padrillo") ||
      s.includes("reproductor") ||
      s === "m" ||
      s === "male"
    ) {
      return false;
    }
    return true;
  };
  const femaleHorses = horses.filter(isFemale);

  const [mareSearch, setMareSearch] = useState("");

  // Form State
  const [form, setForm] = useState({
    mare_id: preselectedMareId || "",
    diagnosis_date: new Date().toISOString().split("T")[0],
    diagnosis_method: "Ecografía Transrectal" as "Ecografía Transrectal" | "Palpación Manual Rectal" | "Análisis Hormonal (Progesterona/eCG)",
    vet_name: "",
    
    // Clinical Findings
    vesicle_diameter_mm: "18",
    heartbeat_detected: true,
    pregnancy_type: "Simple (Un Feto)" as "Simple (Un Feto)" | "Gemelar (Dos Vesículas)" | "No Identificable",
    twin_management: "Ablación Manual de una Vesícula",
    
    // Outcome
    outcome: "Confirmed" as "Confirmed" | "Open" | "Doubtful" | "Lost",
    notes: "",

    // Next actions
    schedule_followup: true,
    followup_days: 15,
  });

  const setF = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Selected Mare & Active Breeding Cycle
  const selectedMareHorse = femaleHorses.find((h) => h.id === form.mare_id);
  const selectedMareRecord = maresList.find((m) => m.horse_id === form.mare_id || m.id === form.mare_id);
  const activeCycle = cyclesList.find(
    (c) => c.mare_id === form.mare_id && c.pregnancy_status === "Pending"
  ) || cyclesList.find((c) => c.mare_id === form.mare_id);

  // Calculate days post-service
  function getDaysPostService() {
    if (!activeCycle?.insemination_date) return null;
    const diff = Math.floor((Date.now() - new Date(activeCycle.insemination_date).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }

  // Calculate expected foaling date (+340 days from service)
  function getCalculatedFoalingDate() {
    const baseDate = activeCycle?.insemination_date || form.diagnosis_date;
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 340);
    return d.toISOString().split("T")[0];
  }

  function getSuggestedFollowupDate() {
    const d = new Date(form.diagnosis_date);
    d.setDate(d.getDate() + Number(form.followup_days));
    return d.toISOString().split("T")[0];
  }

  async function handleSubmitDiagnosis() {
    if (!form.mare_id) {
      toast.error("Selecciona una yegua reproductora.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isConfirmed = form.outcome === "Confirmed";
      const isOpen = form.outcome === "Open";
      const isLost = form.outcome === "Lost";

      // 1. Update Breeding Cycle if active
      if (activeCycle) {
        const cycleStatus: PregnancyStatus = isConfirmed
          ? "Confirmed"
          : isLost
          ? "Lost"
          : isOpen
          ? "Open"
          : "Pending";

        await updateCycle.mutateAsync({
          id: activeCycle.id,
          updates: {
            pregnancy_status: cycleStatus,
            pregnancy_confirmed: isConfirmed,
            diagnosis_date: form.diagnosis_date,
            diagnosis_notes: [
              `Método: ${form.diagnosis_method}`,
              form.vesicle_diameter_mm ? `Vesícula: ${form.vesicle_diameter_mm}mm` : null,
              form.heartbeat_detected ? "Latido: Positivo (+)" : "Latido: Negativo (-)",
              `Tipo: ${form.pregnancy_type}`,
              form.notes || null,
            ].filter(Boolean).join(" | "),
            expected_foaling_date: isConfirmed ? getCalculatedFoalingDate() : undefined,
          },
        });
      }

      // 2. Create Reproductive Event for diagnosis
      const outcomeLabel = isConfirmed
        ? "PREÑEZ CONFIRMADA (+)"
        : isOpen
        ? "VACÍA / ABIERTA (-)"
        : isLost
        ? "REABSORCIÓN / PÉRDIDA"
        : "DIAGNÓSTICO DUDOSO";

      await createEvent.mutateAsync({
        cycle_id: activeCycle?.id,
        mare_id: form.mare_id,
        event_type: "Diagnóstico",
        scheduled_date: form.diagnosis_date,
        completed_date: form.diagnosis_date,
        status: "Completado",
        vet_name: form.vet_name || undefined,
        result: `${outcomeLabel} — ${form.diagnosis_method}`,
        notes: `Vesícula: ${form.vesicle_diameter_mm}mm | ${form.notes || ""}`,
      });

      // 3. Automated Next Follow-up in Calendar
      if (form.schedule_followup) {
        const nextDate = getSuggestedFollowupDate();
        const nextEventType = isConfirmed ? "Ecografía" : "Palpación";
        const nextNotes = isConfirmed
          ? "Control ecográfico de fijación y viabilidad fetal"
          : "Chequeo ginecológico para nuevo celo post-servicio negativo";

        await createEvent.mutateAsync({
          cycle_id: activeCycle?.id,
          mare_id: form.mare_id,
          event_type: nextEventType as any,
          scheduled_date: nextDate,
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: `${nextNotes} (+${form.followup_days} días)`,
        });
      }

      // 4. Update Mare Reproductive Status
      const nextMareStatus = isConfirmed ? "Preñadas" : "Vacías";
      await updateMareStatus.mutateAsync({
        id: form.mare_id,
        reproductive_status: nextMareStatus,
      });

      toast.success(`Diagnóstico guardado: ${outcomeLabel}`);
      setStep(5); // Move to Executive Summary
    } catch (err: any) {
      console.error("Error al registrar diagnóstico:", err);
      toast.error(err.message || "Error al procesar el diagnóstico.");
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
          <div className="eyebrow text-emerald-600 font-bold">Sección I.3 · Diagnóstico de Gestación</div>
          <div className="text-xs font-semibold text-muted-foreground">Paso {step} de 5</div>
        </div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-600" /> Registrar Diagnóstico de Gestación
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Body */}
      <div className="px-8 py-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
        {/* ── PASO 1: SELECCIÓN DE YEGUA CON SERVICIO ACTIVO ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label-field font-semibold text-sm mb-2 block">
                1. Seleccionar Yegua para Diagnóstico *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="search-mare-diag"
                  className="input-field pl-10 text-sm"
                  placeholder="Buscar yegua servida por nombre, código..."
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
                  const cycle = cyclesList.find((c) => c.mare_id === m.id && c.pregnancy_status === "Pending");
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mare_id: m.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-600/20"
                          : "border-border hover:border-emerald-600/40 hover:bg-secondary/40"
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
                          {cycle ? `Servicio con ${cycle.stallion_name}` : "Sin ciclo pendiente"}
                        </div>
                      </div>
                      {isSel && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {/* Context Card with Days Post-Service */}
            {selectedMareHorse && (
              <div className="lux-card p-4 bg-card border border-emerald-500/20 rounded-2xl space-y-3">
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                        Estado: {selectedMareRecord?.reproductive_status || "Servidas"}
                      </span>
                      {getDaysPostService() !== null && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {getDaysPostService()} días post-servicio
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: HALLAZGOS ECOGRÁFICOS ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                2. Método de Diagnóstico y Hallazgos Ecográficos
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Registra las mediciones de la vesícula embrionaria y signos vitales detectados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Método de Diagnóstico</label>
                <select className="input-field mt-1 text-xs" value={form.diagnosis_method} onChange={setF("diagnosis_method")}>
                  <option>Ecografía Transrectal</option>
                  <option>Palpación Manual Rectal</option>
                  <option>Análisis Hormonal (Progesterona/eCG)</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Tipo de Gestación Observada</label>
                <select className="input-field mt-1 text-xs" value={form.pregnancy_type} onChange={setF("pregnancy_type")}>
                  <option>Simple (Un Feto)</option>
                  <option>Gemelar (Dos Vesículas)</option>
                  <option>No Identificable</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Diámetro Vesícula (mm)</label>
                <input
                  type="number"
                  className="input-field mt-1 text-xs"
                  value={form.vesicle_diameter_mm}
                  onChange={setF("vesicle_diameter_mm")}
                  placeholder="Ej. 18"
                />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Fecha Diagnóstico *</label>
                <input type="date" className="input-field mt-1 text-xs" value={form.diagnosis_date} onChange={setF("diagnosis_date")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Veterinario Responsable</label>
                <input className="input-field mt-1 text-xs" value={form.vet_name} onChange={setF("vet_name")} placeholder="Ej. Dr. Médico Veterinario" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.heartbeat_detected}
                  onChange={(e) => setForm((f) => ({ ...f, heartbeat_detected: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-emerald-700">♥ Latido Cardíaco Embrionario / Fetal Detectado</span>
              </label>
              <p className="text-[11px] text-muted-foreground ml-6">
                Habitualmente visible por ecografía a partir del día 24-28 post-servicio.
              </p>
            </div>
          </div>
        )}

        {/* ── PASO 3: RESULTADO DEL DIAGNÓSTICO ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                3. Resultado Oficial del Diagnóstico *
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecciona la conclusión del chequeo ecográfico.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "Confirmed",
                  title: "Preñada (+)",
                  desc: "Vesícula embrionaria viable confirmada. Gestación en curso.",
                  badge: "Positivo",
                  color: "border-emerald-600 bg-emerald-500/10 text-emerald-700",
                },
                {
                  id: "Open",
                  title: "Vacía (-)",
                  desc: "Sin presencia de vesícula embrionaria. Lista para nuevo ciclo.",
                  badge: "Negativo",
                  color: "border-rose-600 bg-rose-500/10 text-rose-700",
                },
                {
                  id: "Doubtful",
                  title: "Dudoso / Re-evaluar",
                  desc: "Estructura no concluyente. Requiere re-chequeo en 3 a 5 días.",
                  badge: "Pendiente",
                  color: "border-amber-600 bg-amber-500/10 text-amber-700",
                },
                {
                  id: "Lost",
                  title: "Pérdida / Reabsorción",
                  desc: "Signos de involución o reabsorción embrionaria precoz.",
                  badge: "Pérdida",
                  color: "border-slate-600 bg-slate-500/10 text-slate-700",
                },
              ].map((res) => {
                const isSel = form.outcome === res.id;
                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, outcome: res.id as any }))}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSel ? `${res.color} ring-2 ring-emerald-600/30` : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{res.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border">{res.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{res.desc}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="label-field text-xs font-semibold">Observaciones Clínicas del Diagnóstico</label>
              <textarea
                className="input-field mt-1 text-xs resize-none h-16"
                value={form.notes}
                onChange={setF("notes")}
                placeholder="Ej. Fijación en cuerno uterino izquierdo, tono uterino tónico, cuerpo lúteo ipsilateral..."
              />
            </div>
          </div>
        )}

        {/* ── PASO 4: SEGUIMIENTO AUTOMÁTICO EN CALENDARIO ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                4. Programación de Controles Automáticos
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                GaitFlow programará los siguientes hitos reproductivos en el Calendario.
              </p>
            </div>

            <div className="lux-card p-4 border border-emerald-500/20 bg-card rounded-2xl space-y-3">
              {form.outcome === "Confirmed" && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Baby className="h-4 w-4 text-emerald-600" /> Fecha Estimada de Parto (+340 días):
                  </div>
                  <div className="text-sm font-extrabold">{getCalculatedFoalingDate()}</div>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.schedule_followup}
                  onChange={(e) => setForm((f) => ({ ...f, schedule_followup: e.target.checked }))}
                  className="rounded text-emerald-600 mt-1"
                />
                <div>
                  <div className="text-xs font-bold">
                    {form.outcome === "Confirmed"
                      ? "☑ Programar Control Ecográfico de Latido y Fijación (+15 Días)"
                      : "☑ Programar Chequeo de Celo y Reinicio de Protocolo (+7 Días)"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Fecha agendada automáticamente: <strong>{getSuggestedFollowupDate()}</strong>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── PASO 5: RESUMEN EJECUTIVO ── */}
        {step === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-display font-bold text-2xl">¡Diagnóstico Registrado con Éxito!</h3>

            <div className="lux-card p-5 bg-card border-border rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Yegua:</span>
                <span className="font-bold">{selectedMareHorse?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Resultado:</span>
                <span className={`font-bold ${form.outcome === "Confirmed" ? "text-emerald-600" : "text-rose-600"}`}>
                  {form.outcome === "Confirmed" ? "PREÑADA (+)" : "VACÍA (-)"}
                </span>
              </div>
              {form.outcome === "Confirmed" && (
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Parto Estimado:</span>
                  <span className="font-bold">{getCalculatedFoalingDate()}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Veterinario:</span>
                <span className="font-bold">{form.vet_name || "No especificado"}</span>
              </div>
              {form.schedule_followup && (
                <div className="flex justify-between pt-1 text-emerald-600 font-semibold">
                  <span>Próximo Control:</span>
                  <span>{getSuggestedFollowupDate()}</span>
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
                    diagnosis_date: new Date().toISOString().split("T")[0],
                    diagnosis_method: "Ecografía Transrectal",
                    vet_name: "",
                    vesicle_diameter_mm: "18",
                    heartbeat_detected: true,
                    pregnancy_type: "Simple (Un Feto)",
                    twin_management: "Ablación Manual de una Vesícula",
                    outcome: "Confirmed",
                    notes: "",
                    schedule_followup: true,
                    followup_days: 15,
                  });
                }}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold"
              >
                Registrar Otro Diagnóstico
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
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !form.mare_id}
              onClick={handleSubmitDiagnosis}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando Diagnóstico...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Finalizar y Guardar Diagnóstico
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

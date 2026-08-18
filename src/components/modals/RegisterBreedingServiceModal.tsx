/**
 * RegisterBreedingServiceModal.tsx — Enterprise Specialized Breeding Service Wizard
 *
 * 7-Step Enterprise Flow:
 * 1. Mare Selection + Compact Contextual Card & Real-time Alerts
 * 2. Procedure Type Selection (Monta Natural / Inseminación Artificial / Transferencia Embrionaria)
 * 3. Reproductive Source (Semental Criadero / Material Adquirido / Semental Externo)
 * 4. Stallion / Straw Selection + Contextual Quick Add Modals
 * 5. Progressive Clinical Service Details
 * 6. Automated & Customizable Follow-up Scheduling (Calendar & Timeline sync)
 * 7. Executive Registration Summary & Continuous Actions
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import {
  useMares,
  useStallions,
  useGeneticsInventory,
  useBreedingCycles,
  useCreateBreedingCycle,
  useCreateReproductiveEvent,
  useUpdateMareStatus,
  useDeductGeneticMaterialDose,
  type InseminationMethod,
  type GeneticItem,
} from "@/lib/hooks/useBreeding";
import { QuickAddStallionModal } from "./QuickAddStallionModal";
import { QuickAddExternalStallionModal, type ExternalStallionData } from "./QuickAddExternalStallionModal";
import { QuickAddGeneticMaterialModal } from "./QuickAddGeneticMaterialModal";

import {
  Syringe,
  Search,
  CheckCircle2,
  HeartPulse,
  Dna,
  Crown,
  ShoppingBag,
  ShieldCheck,
  Plus,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export interface CustomRevisionTask {
  id: string;
  title: string;
  daysPostService: number;
  notes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

export function RegisterBreedingServiceModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: maresList = [] } = useMares();
  const { data: stallionsList = [] } = useStallions();
  const { data: geneticsInventory = [] } = useGeneticsInventory();
  const { data: embryosList = [] } = useEmbryos();
  const { data: activeCycles = [] } = useBreedingCycles();

  const createCycle = useCreateBreedingCycle();
  const createEvent = useCreateReproductiveEvent();
  const updateMareStatus = useUpdateMareStatus();
  const deductDose = useDeductGeneticMaterialDose();

  // Wizard state (Steps 1 to 7)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add modals
  const [showQuickStallion, setShowQuickStallion] = useState(false);
  const [showQuickExternal, setShowQuickExternal] = useState(false);
  const [showQuickGenetics, setShowQuickGenetics] = useState(false);

  // Filter ONLY Female Mares
  const isFemale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "yegua" || sex === "mare" || sex === "hembra" || sex === "female" || sex === "f";
  };
  const femaleHorses = horses.filter(isFemale);

  // Filter Male Stallions
  const isMale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "stallion" || sex === "semental" || sex === "macho" || sex === "padrillo" || sex === "male" || sex === "m" || sex === "potro";
  };
  const maleStallions = horses.filter(isMale);

  // Search queries
  const [mareSearch, setMareSearch] = useState("");
  const [stallionSearch, setStallionSearch] = useState("");

  // Custom Revisions in Step 6
  const [customRevisions, setCustomRevisions] = useState<CustomRevisionTask[]>([]);
  const [newRevTitle, setNewRevTitle] = useState("");
  const [newRevDays, setNewRevDays] = useState("45");
  const [showAddRevInput, setShowAddRevInput] = useState(false);

  // Form State
  const [form, setForm] = useState({
    mare_id: preselectedMareId || "",
    service_type: "Inseminación Artificial" as "Monta natural" | "Inseminación Artificial" | "Transferencia embrionaria",
    method: "Semen Refrigerado" as InseminationMethod,
    service_source: "internal" as "internal" | "inventory" | "external",
    
    // Stallion Internal
    stallion_id: "",
    stallion_name: "",
    stallion_registry: "",
    
    // Genetic Item
    genetic_material_id: "",
    
    // External Stallion Metadata
    external_owner: "",
    external_country: "Colombia",
    external_contact: "",
    external_sire: "",
    external_dam: "",

    // Clinical Details
    insemination_date: new Date().toISOString().split("T")[0],
    insemination_time: "10:00",
    vet_name: "",
    follicle_size_mm: "38",
    uterine_tone: "Tono II (Folicular Activo)",
    semen_motility_pct: "85",
    doses_used: 1,
    notes: "",

    // Follow-up Scheduling Defaults
    schedule_diagnosis: true,
    diagnosis_days: 18,
    schedule_ultrasound: true,
    ultrasound_days: 30,
  });

  const setF = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Selected Mare Object
  const selectedMareHorse = femaleHorses.find((h) => h.id === form.mare_id);
  const selectedMareRecord = maresList.find((m) => m.horse_id === form.mare_id || m.id === form.mare_id);

  // Selected Mare's active breeding cycle
  const currentActiveCycle = activeCycles.find(
    (c) => c.mare_id === form.mare_id && c.pregnancy_status === "Pending"
  );

  // Calculate Mare Contextual Alerts
  function getMareAlerts() {
    if (!selectedMareHorse) return [];
    const alerts: { type: "warning" | "success" | "info"; msg: string }[] = [];

    const lastServiceDate = currentActiveCycle?.insemination_date;
    if (lastServiceDate) {
      const diffDays = Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86400000);
      if (diffDays >= 14 && diffDays <= 25) {
        alerts.push({
          type: "warning",
          msg: `⚠️ Esta yegua fue servida hace ${diffDays} días — Diagnóstico ecográfico pendiente.`,
        });
      } else {
        alerts.push({
          type: "info",
          msg: `ℹ️ Último servicio registrado hace ${diffDays} días (${lastServiceDate}).`,
        });
      }
    }

    const repStatus = selectedMareRecord?.reproductive_status || "Vacía";
    if (repStatus === "En celo" || repStatus === "Vacías" || repStatus === "Vacía") {
      alerts.push({
        type: "success",
        msg: "🟢 Yegua actualmente en ventana reproductiva óptima.",
      });
    } else if (repStatus === "Preñadas") {
      alerts.push({
        type: "warning",
        msg: "⚠️ ATENCIÓN: Esta yegua figura con diagnóstico de PREÑEZ activa.",
      });
    }

    return alerts;
  }

  // Handle Internal Stallion Selection
  function handleSelectInternalStallion(st: any) {
    setForm((f) => ({
      ...f,
      stallion_id: st.id,
      stallion_name: st.name,
      stallion_registry: st.code || "Sin registro",
    }));
  }

  // Handle Inventory Item Selection
  function handleSelectGeneticItem(item: GeneticItem) {
    if (item.quantity <= 0 || item.status === "Agotado") {
      toast.error("⚠️ Este lote de material genético se encuentra AGOTADO.");
      return;
    }
    const donorName = item.donor?.name || "Semental de Banco";
    setForm((f) => ({
      ...f,
      genetic_material_id: item.id,
      stallion_id: item.donor_id || "",
      stallion_name: donorName,
      stallion_registry: item.lot_number ? `Lote: ${item.lot_number}` : "Semen Banco",
    }));
  }

  // Add Custom Revision Task
  function handleAddCustomRevision() {
    if (!newRevTitle.trim()) {
      toast.error("Ingresa el título de la revisión.");
      return;
    }
    const days = Number(newRevDays) || 30;
    const newTask: CustomRevisionTask = {
      id: `rev-${Date.now().toString(36)}`,
      title: newRevTitle.trim(),
      daysPostService: days,
    };
    setCustomRevisions((prev) => [...prev, newTask]);
    setNewRevTitle("");
    setShowAddRevInput(false);
    toast.success(`Revisión "${newTask.title}" agregada al agendamiento`);
  }

  function handleRemoveCustomRevision(id: string) {
    setCustomRevisions((prev) => prev.filter((r) => r.id !== id));
  }

  // Suggested Diagnosis Date
  function getSuggestedDiagnosisDate() {
    if (!form.insemination_date) return "";
    const d = new Date(form.insemination_date);
    d.setDate(d.getDate() + Number(form.diagnosis_days));
    return d.toISOString().split("T")[0];
  }

  // Final Submit Handler
  async function handleSubmitService() {
    if (!form.mare_id) {
      toast.error("Selecciona una yegua reproductora.");
      return;
    }
    if (!form.stallion_name) {
      toast.error("Selecciona o ingresa el semental reproductor.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Calculate Foaling Date (+340 days)
      const expectedFoaling = new Date(form.insemination_date);
      expectedFoaling.setDate(expectedFoaling.getDate() + 340);

      // 2. If genetic material from inventory was selected, deduct 1 dose atomically
      if (form.service_source === "inventory" && form.genetic_material_id) {
        await deductDose.mutateAsync({
          itemId: form.genetic_material_id,
          quantityUsed: form.doses_used || 1,
        });
      }

      // 3. Create or reuse Breeding Cycle
      const cyclePayload = {
        mare_id: form.mare_id,
        method: form.service_type === "Monta natural" ? ("Monta Natural" as const) : form.method,
        stallion_id: form.stallion_id || undefined,
        stallion_name: form.stallion_name,
        stallion_registry: form.stallion_registry || undefined,
        genetic_material_id: form.genetic_material_id || undefined,
        insemination_date: form.insemination_date,
        expected_foaling_date: expectedFoaling.toISOString().split("T")[0],
        vet_name: form.vet_name || undefined,
        notes: [
          `Tipo: ${form.service_type}`,
          form.follicle_size_mm ? `Folículo: ${form.follicle_size_mm}mm` : null,
          form.uterine_tone ? `Tono: ${form.uterine_tone}` : null,
          form.semen_motility_pct ? `Motilidad: ${form.semen_motility_pct}%` : null,
          form.external_owner ? `Criadero Externo: ${form.external_owner}` : null,
          form.notes || null,
        ].filter(Boolean).join(" | "),
        pregnancy_status: "Pending" as const,
      };

      const cycle = await createCycle.mutateAsync(cyclePayload);

      // 4. Create primary Reproductive Event (Monta / Inseminación)
      const primaryEventType = form.service_type === "Monta natural" ? "Monta" : "Inseminación";
      await createEvent.mutateAsync({
        cycle_id: cycle?.id,
        mare_id: form.mare_id,
        stallion_id: form.stallion_id || undefined,
        event_type: primaryEventType as any,
        scheduled_date: form.insemination_date,
        completed_date: form.insemination_date,
        status: "Completado",
        vet_name: form.vet_name || undefined,
        result: `${form.service_type} realizada exitosamente con ${form.stallion_name}`,
        notes: `Hora: ${form.insemination_time} | Folículo: ${form.follicle_size_mm}mm`,
      });

      // 5. Automated Follow-up Tasks (Diagnosis + Ultrasound + Custom)
      if (form.schedule_diagnosis) {
        const diagDate = getSuggestedDiagnosisDate();
        await createEvent.mutateAsync({
          cycle_id: cycle?.id,
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: "Diagnóstico",
          scheduled_date: diagDate,
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: `Diagnóstico precoz de gestación (+${form.diagnosis_days} días post-servicio con ${form.stallion_name})`,
        });
      }

      if (form.schedule_ultrasound) {
        const dUs = new Date(form.insemination_date);
        dUs.setDate(dUs.getDate() + Number(form.ultrasound_days));
        await createEvent.mutateAsync({
          cycle_id: cycle?.id,
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: "Ecografía",
          scheduled_date: dUs.toISOString().split("T")[0],
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: "Confirmación ecográfica de vesícula embrionaria y latido",
        });
      }

      // Schedule Custom Revisions
      for (const rev of customRevisions) {
        const dRev = new Date(form.insemination_date);
        dRev.setDate(dRev.getDate() + Number(rev.daysPostService));
        await createEvent.mutateAsync({
          cycle_id: cycle?.id,
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: "Palpación",
          scheduled_date: dRev.toISOString().split("T")[0],
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: `${rev.title} (+${rev.daysPostService} días post-servicio)`,
        });
      }

      // 6. Move Mare to 'Servidas'
      await updateMareStatus.mutateAsync({
        id: form.mare_id,
        reproductive_status: "Servidas",
      });

      toast.success("Servicio reproductivo y agendamiento registrados con éxito");
      setStep(7); // Move to Executive Summary Step
    } catch (err: any) {
      console.error("Error al registrar servicio reproductivo:", err);
      toast.error(err.message || "Ocurrió un error al procesar el registro en el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        {/* Header */}
        <div className="px-8 pt-7 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-1">
            <div className="eyebrow text-primary font-bold">Sección I.1 · Enterprise Breeding ERP</div>
            <div className="text-xs font-semibold text-muted-foreground">Paso {step} de 7</div>
          </div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" /> Registrar Servicio Reproductivo
          </h2>

          {/* Progress bar */}
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Body */}
        <div className="px-8 py-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
          {/* ── PASO 1: SELECCIÓN DE YEGUA + COMPACT CONTEXT CARD ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label-field font-semibold text-sm mb-2 block">
                  1. Buscar y Seleccionar Yegua Reproductora *
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="search-mare-input"
                    className="input-field pl-10 text-sm"
                    placeholder="Buscar yegua por nombre, código o raza..."
                    value={mareSearch}
                    onChange={(e) => setMareSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Mare selector grid */}
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
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:bg-secondary/40"
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
                        {isSel && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
              </div>

              {/* Compact Contextual Card */}
              {selectedMareHorse && (
                <div className="lux-card p-4 bg-card border-primary/20 rounded-2xl space-y-3">
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
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold mt-1">
                        Estado: {selectedMareRecord?.reproductive_status || "Vacía"}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Dynamic Alerts */}
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    {getMareAlerts().map((alt, i) => (
                      <div
                        key={i}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                          alt.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                            : alt.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                        }`}
                      >
                        {alt.msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: TIPO DE SERVICIO ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label-field font-semibold text-sm mb-1 block">
                  2. Tipo de Procedimiento Reproductivo *
                </label>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecciona la modalidad técnica del servicio. El formulario adaptará sus campos progresivamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "Monta natural",
                    title: "Monta Natural",
                    desc: "Cubrición directa con semental reproductor en el sitio.",
                    icon: HeartPulse,
                    color: "border-amber-500/40 bg-amber-500/5 text-amber-600",
                  },
                  {
                    id: "Inseminación Artificial",
                    title: "Inseminación Artificial",
                    desc: "Inseminación con semen fresco, refrigerado o pajilla congelada.",
                    icon: Syringe,
                    color: "border-blue-500/40 bg-blue-500/5 text-blue-600",
                  },
                  {
                    id: "Transferencia embrionaria",
                    title: "Transferencia Embrionaria",
                    desc: "Lavado uterino de donadora y transferencia a yegua receptora.",
                    icon: Dna,
                    color: "border-rose-500/40 bg-rose-500/5 text-rose-600",
                  },
                ].map((item) => {
                  const isSel = form.service_type === item.id;
                  const IconC = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, service_type: item.id as any }))}
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSel
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div>
                        <IconC className={`h-6 w-6 mb-3 ${isSel ? "text-primary" : "text-muted-foreground"}`} />
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                      </div>
                      {isSel && <div className="mt-4 text-xs font-bold text-primary flex items-center gap-1">Seleccionado <Check className="h-4 w-4" /></div>}
                    </button>
                  );
                })}
              </div>

              {form.service_type === "Inseminación Artificial" && (
                <div className="lux-card p-4 bg-card border-border rounded-xl mt-4">
                  <label className="label-field font-semibold text-xs mb-2 block">Modalidad de Semen *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "Semen Refrigerado", label: "Semen Refrigerado" },
                      { id: "Pajilla Congelada", label: "Pajillas LN₂ Congeladas" },
                      { id: "Monta Natural", label: "Semen Fresco Directo" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, method: m.id as any }))}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                          form.method === m.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-secondary"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 3: FUENTE REPRODUCTIVA ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="label-field font-semibold text-sm mb-1 block">
                  3. Selección de la Fuente Reproductiva *
                </label>
                <p className="text-xs text-muted-foreground mb-4">
                  Especifica de dónde proviene el material reproductivo o el semental utilizado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "internal",
                    title: "A. Semental del Criadero",
                    desc: "Servicio o cubrición utilizando un semental propio del criadero.",
                    icon: Crown,
                    badge: "Propio",
                  },
                  {
                    id: "inventory",
                    title: "B. Material Adquirido",
                    desc: "Salto, semen refrigerado o pajilla adquirida e ingresada al Banco Genético.",
                    icon: ShoppingBag,
                    badge: "Banco Genético",
                  },
                  {
                    id: "external",
                    title: "C. Semental Externo",
                    desc: "Servicio con semental ajeno al criadero (sin alterar tu inventario de ejemplares).",
                    icon: ShieldCheck,
                    badge: "Terceros",
                  },
                ].map((src) => {
                  const isSel = form.service_source === src.id;
                  const IconS = src.icon;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          service_source: src.id as any,
                          stallion_id: "",
                          stallion_name: "",
                          genetic_material_id: "",
                        }))
                      }
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSel
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <IconS className={`h-6 w-6 ${isSel ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {src.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{src.title}</h4>
                        <p className="text-xs text-muted-foreground leading-snug">{src.desc}</p>
                      </div>
                      {isSel && <div className="mt-4 text-xs font-bold text-primary flex items-center gap-1">Seleccionado <Check className="h-4 w-4" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PASO 4: REPRODUCTOR / MATERIAL GENÉTICO + QUICK ADDS ── */}
          {step === 4 && (
            <div className="space-y-5">
              {/* OPCIÓN A: SEMENTAL PROPIO */}
              {form.service_source === "internal" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="label-field font-semibold text-sm">
                      4. Seleccionar Semental del Criadero *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickStallion(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Registrar Nuevo Semental
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      className="input-field pl-10 text-sm"
                      placeholder="Buscar semental del criadero..."
                      value={stallionSearch}
                      onChange={(e) => setStallionSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                    {maleStallions
                      .filter((s) => s.name.toLowerCase().includes(stallionSearch.toLowerCase()))
                      .map((s) => {
                        const isSel = form.stallion_id === s.id;
                        const prof = stallionsList.find((p) => p.horse_id === s.id || p.id === s.id);
                        const rateLabel = prof && prof.total_services_count > 0 ? `${prof.conception_rate_pct}%` : "Sin servicios previos";

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectInternalStallion(s)}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              isSel
                                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/40 hover:bg-secondary/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={s.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=200&q=80"}
                                alt={s.name}
                                className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">{s.name}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  {s.breed || "Paso Fino"} · {s.code || "Sin código"}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                  <span>Servicios: {prof?.total_services_count || 0}</span>
                                  <span>• Preñez: {rateLabel}</span>
                                </div>
                              </div>
                              {isSel && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* OPCIÓN B: BANCO GENÉTICO / MATERIAL ADQUIRIDO / EMBRIONES */}
              {form.service_source === "inventory" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="label-field font-semibold text-sm block">
                        4. {form.service_type === "Transferencia embrionaria" ? "Seleccionar Embrión del Banco Genético *" : "Seleccionar Lote del Banco Genético *"}
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        {form.service_type === "Transferencia embrionaria" ? "Selecciona el embrión a implantar en la receptora." : "Selecciona las pajillas o dosis de semen adquiridas."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickGenetics(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold hover:bg-blue-500/20 transition-colors shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Registrar Material Genético
                    </button>
                  </div>

                  {geneticsInventory.length === 0 && embryosList.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-3 bg-secondary/10">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div>
                        <div className="text-xs font-bold">No hay material genético en el inventario</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Registra saltos, pajillas congeladas o embriones adquiridos para utilizarlos en los servicios.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQuickGenetics(true)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar al Banco Genético
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {geneticsInventory.map((item) => {
                        const isSel = form.genetic_material_id === item.id;
                        const isAgotado = item.quantity <= 0 || item.status === "Agotado";
                        const isEmbryo = item.material_type === "Embrión";
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isAgotado}
                            onClick={() => handleSelectGeneticItem(item)}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              isAgotado
                                ? "opacity-40 border-border bg-secondary/20 cursor-not-allowed"
                                : isSel
                                ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                                : "border-border hover:border-blue-500/40 hover:bg-secondary/40"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold truncate">
                                {item.donor?.name || (isEmbryo ? "Embrión Preservado" : "Semental Banco")}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isAgotado
                                    ? "bg-rose-500/10 text-rose-600"
                                    : "bg-emerald-500/10 text-emerald-600"
                                }`}
                              >
                                {item.quantity} {isEmbryo ? "Embrión" : "Dosis"} {isAgotado ? "(Agotado)" : "Disp."}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>Lote: {item.lot_number || "LOTE-001"}</span>
                              <span className="font-semibold text-primary">{item.material_type}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              Tanque: {item.storage_tank || "LN2 Main"} {item.storage_canister ? `· Can: ${item.storage_canister}` : ""}
                            </div>
                          </button>
                        );
                      })}

                      {/* Also show Embryos from Embryo Center */}
                      {embryosList
                        .filter((emb) => !geneticsInventory.some((g) => g.id === emb.id))
                        .map((emb) => {
                          const isSel = form.genetic_material_id === emb.id;
                          return (
                            <button
                              key={emb.id}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  genetic_material_id: emb.id,
                                  stallion_id: emb.stallion_id || "",
                                  stallion_name: emb.stallion?.name || "Semental",
                                  stallion_registry: `Embrión: ${emb.grade} · ${emb.stage}`,
                                }));
                              }}
                              className={`p-3.5 rounded-2xl border text-left transition-all ${
                                isSel
                                  ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                                  : "border-border hover:border-cyan-500/40 hover:bg-secondary/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold truncate">
                                  {emb.donor_mare?.name || "Donadora"} × {emb.stallion?.name || "Semental"}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700">
                                  {emb.grade}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                Estadio: {emb.stage} · Lavado: {emb.flush_date}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* OPCIÓN C: SEMENTAL EXTERNO */}
              {form.service_source === "external" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="label-field font-semibold text-sm">
                      4. Metadatos del Semental Externo *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickExternal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold hover:bg-indigo-500/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Registrar Semental Externo
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field text-xs font-semibold">Nombre Semental *</label>
                      <input
                        id="ext-stallion-name"
                        className="input-field mt-1 text-xs"
                        value={form.stallion_name}
                        onChange={setF("stallion_name")}
                        placeholder="Ej. Nombre del Semental Externo"
                      />
                    </div>
                    <div>
                      <label className="label-field text-xs font-semibold">N° Registro / Asoc</label>
                      <input
                        id="ext-stallion-reg"
                        className="input-field mt-1 text-xs"
                        value={form.stallion_registry}
                        onChange={setF("stallion_registry")}
                        placeholder="Ej. REG-123456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field text-xs">Criadero / Propietario</label>
                      <input
                        id="ext-stallion-owner"
                        className="input-field mt-1 text-xs"
                        value={form.external_owner}
                        onChange={setF("external_owner")}
                        placeholder="Ej. Criadero Externo"
                      />
                    </div>
                    <div>
                      <label className="label-field text-xs">País de Origen</label>
                      <input
                        id="ext-stallion-country"
                        className="input-field mt-1 text-xs"
                        value={form.external_country}
                        onChange={setF("external_country")}
                        placeholder="Ej. Colombia, USA, etc."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 5: DETALLES CLÍNICOS DEL SERVICIO ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="label-field font-semibold text-sm mb-1 block">
                  5. Parámetros Clínicos del Servicio Reproductivo *
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Registra las mediciones foliculares y observaciones veterinarias para la ficha clínica.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field text-xs font-semibold">Fecha Servicio *</label>
                  <input
                    id="cli-date"
                    type="date"
                    className="input-field mt-1 text-xs"
                    value={form.insemination_date}
                    onChange={setF("insemination_date")}
                  />
                </div>
                <div>
                  <label className="label-field text-xs font-semibold">Hora Servicio</label>
                  <input
                    id="cli-time"
                    type="time"
                    className="input-field mt-1 text-xs"
                    value={form.insemination_time}
                    onChange={setF("insemination_time")}
                  />
                </div>
                <div>
                  <label className="label-field text-xs font-semibold">Veterinario Responsable</label>
                  <input
                    id="cli-vet"
                    className="input-field mt-1 text-xs"
                    value={form.vet_name}
                    onChange={setF("vet_name")}
                    placeholder="Ej. Dr. Médico Veterinario"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field text-xs">Tamaño Folicular (mm)</label>
                  <input
                    id="cli-follicle"
                    type="number"
                    className="input-field mt-1 text-xs"
                    value={form.follicle_size_mm}
                    onChange={setF("follicle_size_mm")}
                    placeholder="Ej. 38"
                  />
                </div>
                <div>
                  <label className="label-field text-xs">Tono Uterino</label>
                  <select id="cli-tone" className="input-field mt-1 text-xs" value={form.uterine_tone} onChange={setF("uterine_tone")}>
                    <option>Tono I (En Celo)</option>
                    <option>Tono II (Folicular Activo)</option>
                    <option>Tono III (Edema Uterino)</option>
                    <option>Post-Ovulación</option>
                  </select>
                </div>
                <div>
                  <label className="label-field text-xs">Motilidad Seminal (%)</label>
                  <input
                    id="cli-motility"
                    type="number"
                    className="input-field mt-1 text-xs"
                    value={form.semen_motility_pct}
                    onChange={setF("semen_motility_pct")}
                    placeholder="Ej. 85"
                  />
                </div>
              </div>

              <div>
                <label className="label-field text-xs font-semibold">Observaciones / Hallazgos Uterinos</label>
                <textarea
                  id="cli-notes"
                  className="input-field mt-1 text-xs resize-none h-20"
                  value={form.notes}
                  onChange={setF("notes")}
                  placeholder="Ej. Observaciones del examen, edema folicular, ovulación ecográfica..."
                />
              </div>
            </div>
          )}

          {/* ── PASO 6: SEGUIMIENTO AUTOMÁTICO Y PERSONALIZABLE EN CALENDARIO ── */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="label-field font-semibold text-sm mb-1 block">
                  6. Programación de Revisiones y Seguimiento Automático
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Configura o agrega las revisiones veterinarias que quedarán automáticamente agendadas en el Calendario.
                </p>
              </div>

              <div className="lux-card p-4 border border-primary/20 bg-card rounded-2xl space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.schedule_diagnosis}
                    onChange={(e) => setForm((f) => ({ ...f, schedule_diagnosis: e.target.checked }))}
                    className="rounded text-primary mt-1"
                  />
                  <div>
                    <div className="text-xs font-bold">☑ Programar Diagnóstico de Gestación Ecográfico</div>
                    <div className="text-[11px] text-muted-foreground">
                      Sugerido: +18 días post-servicio (Fecha sugerida: <strong>{getSuggestedDiagnosisDate()}</strong>)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer pt-2.5 border-t border-border">
                  <input
                    type="checkbox"
                    checked={form.schedule_ultrasound}
                    onChange={(e) => setForm((f) => ({ ...f, schedule_ultrasound: e.target.checked }))}
                    className="rounded text-primary mt-1"
                  />
                  <div>
                    <div className="text-xs font-bold">☑ Programar Ecografía de Latido / Vesícula (+30 Días)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Confirmación de embrión viabilizado e implante uterino seguro.
                    </div>
                  </div>
                </label>

                {/* Custom Revision List */}
                {customRevisions.length > 0 && (
                  <div className="pt-2.5 border-t border-border space-y-2">
                    <div className="text-xs font-bold text-primary">Revisiones Personalizadas Agregadas:</div>
                    {customRevisions.map((rev) => (
                      <div key={rev.id} className="flex items-center justify-between p-2 rounded-xl bg-secondary/50 border text-xs">
                        <div>
                          <span className="font-semibold">{rev.title}</span>
                          <span className="text-muted-foreground ml-2">(+{rev.daysPostService} días post-servicio)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRevision(rev.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Revision Input */}
                {!showAddRevInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAddRevInput(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
                  >
                    <Plus className="h-3.5 w-3.5" /> + Agregar otra revisión o control personalizado
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border bg-secondary/30 space-y-3 pt-3">
                    <div className="text-xs font-bold">Nueva Revisión Personalizada</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-field text-[11px]">Título de la revisión</label>
                        <input
                          className="input-field text-xs mt-1"
                          placeholder="Ej. Control folicular, Vacuna..."
                          value={newRevTitle}
                          onChange={(e) => setNewRevTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-field text-[11px]">Días post-servicio</label>
                        <input
                          type="number"
                          className="input-field text-xs mt-1"
                          placeholder="45"
                          value={newRevDays}
                          onChange={(e) => setNewRevDays(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRevInput(false)}
                        className="px-3 py-1 rounded-full border text-xs hover:bg-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomRevision}
                        className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                      >
                        Agregar Revisión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PASO 7: RESUMEN EJECUTIVO Y ACCIONES CONTINUAS ── */}
          {step === 7 && (
            <div className="space-y-5 text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-display font-bold text-2xl">¡Servicio Reproductivo Registrado!</h3>

              <div className="lux-card p-5 bg-card border-border rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Yegua:</span>
                  <span className="font-bold">{selectedMareHorse?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Semental:</span>
                  <span className="font-bold">{form.stallion_name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Tipo de Servicio:</span>
                  <span className="font-bold">{form.service_type}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-bold">{form.insemination_date}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted-foreground">Veterinario:</span>
                  <span className="font-bold">{form.vet_name || "No especificado"}</span>
                </div>
                <div className="flex justify-between pt-1 text-primary">
                  <span>Próximo Diagnóstico:</span>
                  <span className="font-bold">{getSuggestedDiagnosisDate()}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateView) onNavigateView("yeguas");
                  }}
                  className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
                >
                  <FileText className="h-3.5 w-3.5 inline mr-1" /> Ver Ficha Reproductiva
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
                      service_type: "Inseminación Artificial",
                      method: "Semen Refrigerado",
                      service_source: "internal",
                      stallion_id: "",
                      stallion_name: "",
                      stallion_registry: "",
                      genetic_material_id: "",
                      external_owner: "",
                      external_country: "Colombia",
                      external_contact: "",
                      external_sire: "",
                      external_dam: "",
                      insemination_date: new Date().toISOString().split("T")[0],
                      insemination_time: "10:00",
                      vet_name: "",
                      follicle_size_mm: "38",
                      uterine_tone: "Tono II (Folicular Activo)",
                      semen_motility_pct: "85",
                      doses_used: 1,
                      notes: "",
                      schedule_diagnosis: true,
                      diagnosis_days: 18,
                      schedule_ultrasound: true,
                      ultrasound_days: 30,
                    });
                  }}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                >
                  Registrar Otro Servicio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        {step < 7 && (
          <div className="px-8 pb-7 pt-4 border-t border-border flex items-center justify-between bg-card">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancelar" : "Atrás"}
            </button>

            {step < 6 ? (
              <button
                type="button"
                disabled={step === 1 ? !form.mare_id : step === 4 ? !form.stallion_name : false}
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !form.mare_id || !form.stallion_name}
                onClick={handleSubmitService}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando Servicio ERP...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Finalizar y Registrar Servicio
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Quick Add Sub-Modals */}
      <QuickAddStallionModal
        open={showQuickStallion}
        onClose={() => setShowQuickStallion(false)}
        onSuccess={(st) => {
          setForm((f) => ({
            ...f,
            stallion_id: st.id,
            stallion_name: st.name,
            stallion_registry: st.code || "Sin registro",
          }));
        }}
      />

      <QuickAddExternalStallionModal
        open={showQuickExternal}
        onClose={() => setShowQuickExternal(false)}
        onSuccess={(extData) => {
          setForm((f) => ({
            ...f,
            stallion_name: extData.name,
            stallion_registry: extData.registry || "",
            external_owner: extData.owner_criadero || "",
            external_country: extData.country || "Colombia",
            external_sire: extData.sire_name || "",
            external_dam: extData.dam_name || "",
          }));
        }}
      />

      <QuickAddGeneticMaterialModal
        open={showQuickGenetics}
        onClose={() => setShowQuickGenetics(false)}
        onSuccess={(genItem) => {
          setForm((f) => ({
            ...f,
            genetic_material_id: genItem.id,
            stallion_name: genItem.donor_name,
            stallion_registry: genItem.lot_number ? `Lote: ${genItem.lot_number}` : "Semen Banco",
          }));
        }}
      />
    </>
  );
}

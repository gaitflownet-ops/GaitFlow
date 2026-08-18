/**
 * RegisterEmbryoModal.tsx — Enterprise Specialized Embryo Flushing, Grading & Transfer Wizard
 *
 * 5-Step Enterprise Flow:
 * 1. Donor Mare & Sire Selection + Context Cards
 * 2. Flushing Details & Embryo Grading (Quality Grade I-IV, Developmental Stage)
 * 3. Destination Strategy (Immediate Transfer to Recipient Mare OR Genetic Bank Cryopreservation)
 * 4. Automatic Synchronization (Embryo creation, Recipient scheduling, Dose management)
 * 5. Executive Confirmation Summary & Continuous Actions
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import {
  useMares,
  useStallions,
  useCreateEmbryo,
  useCreateReproductiveEvent,
  useCreateGeneticItem,
  type EmbryoGrade,
  type EmbryoStage,
} from "@/lib/hooks/useBreeding";

import {
  Dna,
  Search,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

export function RegisterEmbryoModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: maresList = [] } = useMares();
  const { data: stallionsList = [] } = useStallions();

  const createEmbryo = useCreateEmbryo();
  const createEvent = useCreateReproductiveEvent();
  const createGeneticItem = useCreateGeneticItem();

  // Wizard state (Steps 1 to 5)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Female Mares & Male Stallions (any horse not strictly male is female candidate)
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

  const isMale = (h: any) => {
    if (!h) return false;
    const s = String(h.sex || h.gender || h.category || "").trim().toLowerCase();
    return (
      s.includes("stallion") ||
      s.includes("semental") ||
      s.includes("macho") ||
      s.includes("padrillo") ||
      s.includes("male") ||
      s.includes("potro") ||
      s.includes("reproductor") ||
      s === "m"
    );
  };
  const maleStallions = horses.filter(isMale);

  const [donorSearch, setDonorSearch] = useState("");
  const [stallionSearch, setStallionSearch] = useState("");

  // Form State
  const [form, setForm] = useState({
    donor_mare_id: preselectedMareId || "",
    stallion_id: "",
    stallion_name: "",
    flushing_date: new Date().toISOString().split("T")[0],
    days_post_ovulation: "8",
    vet_name: "",
    
    // Embryo Quality
    embryos_recovered_count: "1",
    grade: "Calidad I" as EmbryoGrade,
    stage: "Blastocisto" as EmbryoStage,
    embryo_diameter_um: "180",
    
    // Destination
    destination: "transfer" as "transfer" | "cryo",
    recipient_mare_id: "",
    
    // Cryo Details
    tank: "Tanque Principal LN2",
    canister: "Canister 2",
    lot_number: `EMB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    
    notes: "",
    schedule_recipient_diag: true,
    recipient_diag_days: 14,
  });

  const setF = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Selected Objects
  const donorHorse = femaleHorses.find((h) => h.id === form.donor_mare_id);
  const recipientHorse = femaleHorses.find((h) => h.id === form.recipient_mare_id);

  function getSuggestedRecipientDiagDate() {
    const d = new Date(form.flushing_date);
    d.setDate(d.getDate() + Number(form.recipient_diag_days));
    return d.toISOString().split("T")[0];
  }

  async function handleSubmitEmbryo() {
    if (!form.donor_mare_id) {
      toast.error("Selecciona una yegua donadora.");
      return;
    }
    if (!form.stallion_name) {
      toast.error("Selecciona el semental del cruce.");
      return;
    }
    if (form.destination === "transfer" && !form.recipient_mare_id) {
      toast.error("Selecciona la yegua receptora para la transferencia.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isTransfer = form.destination === "transfer";
      const embryoStatus = isTransfer ? "Transferido" : "Congelado";

      // 1. Create Embryo Record
      const createdEmb = await createEmbryo.mutateAsync({
        donor_mare_id: form.donor_mare_id,
        recipient_mare_id: isTransfer ? form.recipient_mare_id : undefined,
        stallion_id: form.stallion_id || undefined,
        status: embryoStatus as any,
        grade: form.grade,
        stage: form.stage,
        flush_date: form.flushing_date,
        transfer_date: isTransfer ? form.flushing_date : undefined,
        notes: [
          `Días post-ovulación: ${form.days_post_ovulation}`,
          form.embryo_diameter_um ? `Diámetro: ${form.embryo_diameter_um} µm` : null,
          isTransfer ? `Receptora: ${recipientHorse?.name || form.recipient_mare_id}` : `Almacenamiento: ${form.tank} / ${form.canister}`,
          form.notes || null,
        ].filter(Boolean).join(" | "),
      });

      // 2. If Cryo, add to Genetic Bank
      if (!isTransfer) {
        await createGeneticItem.mutateAsync({
          material_type: "Embrión",
          lot_number: form.lot_number,
          quantity: Number(form.embryos_recovered_count) || 1,
          storage_tank: form.tank,
          storage_canister: form.canister,
          status: "Disponible",
          notes: `Donadora: ${donorHorse?.name} × Semental: ${form.stallion_name} | Grado: ${form.grade}`,
        });
      }

      // 3. Create Reproductive Event for Flushing
      await createEvent.mutateAsync({
        mare_id: form.donor_mare_id,
        event_type: "Lavado",
        scheduled_date: form.flushing_date,
        completed_date: form.flushing_date,
        status: "Completado",
        vet_name: form.vet_name || undefined,
        result: `Lavado exitoso: ${form.embryos_recovered_count} embrión (${form.grade})`,
        notes: `Cruce: ${donorHorse?.name} × ${form.stallion_name}`,
      });

      // 4. If Transfer, schedule diagnosis for recipient mare
      if (isTransfer && form.recipient_mare_id && form.schedule_recipient_diag) {
        const diagDate = getSuggestedRecipientDiagDate();
        await createEvent.mutateAsync({
          mare_id: form.recipient_mare_id,
          event_type: "Diagnóstico",
          scheduled_date: diagDate,
          status: "Programado",
          vet_name: form.vet_name || undefined,
          notes: `Diagnóstico de gestación en receptora post-transferencia embrionaria (${donorHorse?.name} × ${form.stallion_name})`,
        });
      }

      toast.success(
        isTransfer
          ? `Embrión transferido exitosamente a receptora "${recipientHorse?.name}"`
          : `Embrión preservado en el Banco Genético (Lote: ${form.lot_number})`
      );
      setStep(5); // Move to Executive Summary
    } catch (err: any) {
      console.error("Error al registrar embrión:", err);
      toast.error(err.message || "Error al procesar el registro del embrión.");
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
          <div className="eyebrow text-cyan-600 font-bold">Sección I.5 · Biotecnología Reproductiva</div>
          <div className="text-xs font-semibold text-muted-foreground">Paso {step} de 5</div>
        </div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Dna className="h-6 w-6 text-cyan-600" /> Registrar Lavado y Transferencia de Embrión
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-cyan-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Body */}
      <div className="px-8 py-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
        {/* ── PASO 1: DONADORA Y SEMENTAL ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label-field font-semibold text-sm mb-2 block">
                1. Seleccionar Yegua Donadora *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="search-donor-mare"
                  className="input-field pl-10 text-sm"
                  placeholder="Buscar yegua donadora por nombre, código..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
              {femaleHorses
                .filter(
                  (m) =>
                    m.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
                    (m.code && m.code.toLowerCase().includes(donorSearch.toLowerCase()))
                )
                .map((m) => {
                  const isSel = form.donor_mare_id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, donor_mare_id: m.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-cyan-600 bg-cyan-500/10 ring-2 ring-cyan-600/20"
                          : "border-border hover:border-cyan-600/40 hover:bg-secondary/40"
                      }`}
                    >
                      <img
                        src={m.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                        alt={m.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{m.code || "Sin código"} · {m.breed || "Paso Fino"}</div>
                      </div>
                      {isSel && <CheckCircle2 className="h-5 w-5 text-cyan-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {/* Semental Donador */}
            <div className="pt-3 border-t border-border space-y-3">
              <label className="label-field font-semibold text-sm block">Semental del Cruce *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-36 overflow-y-auto pr-1">
                {maleStallions.map((s) => {
                  const isSel = form.stallion_id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, stallion_id: s.id, stallion_name: s.name }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-cyan-600 bg-cyan-500/10 ring-2 ring-cyan-600/20"
                          : "border-border hover:border-cyan-600/40 hover:bg-secondary/40"
                      }`}
                    >
                      <img
                        src={s.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=200&q=80"}
                        alt={s.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{s.breed || "Paso Fino"}</div>
                      </div>
                      {isSel && <CheckCircle2 className="h-5 w-5 text-cyan-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: LAVADO Y CALIFICACIÓN DEL EMBRIÓN ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                2. Parámetros del Lavado Uterino y Calificación Morfológica
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Registra el número de embriones recuperados y su grado de calidad según estándares IETS.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Fecha del Lavado *</label>
                <input type="date" className="input-field mt-1 text-xs" value={form.flushing_date} onChange={setF("flushing_date")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Días Post-Ovulación</label>
                <input type="number" className="input-field mt-1 text-xs" value={form.days_post_ovulation} onChange={setF("days_post_ovulation")} placeholder="8" />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Veterinario / Embriólogo</label>
                <input className="input-field mt-1 text-xs" value={form.vet_name} onChange={setF("vet_name")} placeholder="Ej. Dr. Médico Veterinario" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Grado de Calidad (IETS)</label>
                <select className="input-field mt-1 text-xs" value={form.grade} onChange={setF("grade")}>
                  <option>Calidad I</option>
                  <option>Calidad II</option>
                  <option>Calidad III</option>
                  <option>Degenerado / No Viable</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Estadio de Desarrollo</label>
                <select className="input-field mt-1 text-xs" value={form.stage} onChange={setF("stage")}>
                  <option>Mórula</option>
                  <option>Blastocisto</option>
                  <option>Blastocisto Temprano</option>
                  <option>Blastocisto Expandido</option>
                  <option>Blastocisto Eclosionado</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Diámetro Embrionario (µm)</label>
                <input type="number" className="input-field mt-1 text-xs" value={form.embryo_diameter_um} onChange={setF("embryo_diameter_um")} placeholder="180" />
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: DESTINO DEL EMBRIÓN ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                3. Estrategia de Destino del Embrión *
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecciona si el embrión será transferido inmediatamente o preservado en nitrógeno líquido.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: "transfer",
                  title: "Transferencia Inmediata a Receptora",
                  desc: "Implante directo en fresco a una yegua receptora sincronizada.",
                  icon: Dna,
                },
                {
                  id: "cryo",
                  title: "Criopreservación en Banco Genético",
                  desc: "Vitrificación y congelación en tanque de nitrógeno líquido (LN2).",
                  icon: ShoppingBag,
                },
              ].map((dest) => {
                const isSel = form.destination === dest.id;
                const IconD = dest.icon;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, destination: dest.id as any }))}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSel ? "border-cyan-600 bg-cyan-500/10 ring-2 ring-cyan-600/30" : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <IconD className={`h-5 w-5 mb-2 ${isSel ? "text-cyan-600" : "text-muted-foreground"}`} />
                    <h4 className="font-bold text-sm mb-1">{dest.title}</h4>
                    <p className="text-xs text-muted-foreground leading-snug">{dest.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* If Transfer: Recipient Selector */}
            {form.destination === "transfer" && (
              <div className="lux-card p-4 bg-card border border-border rounded-2xl space-y-3 mt-3">
                <label className="label-field font-semibold text-xs block">Seleccionar Yegua Receptora *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {femaleHorses
                    .filter((h) => h.id !== form.donor_mare_id)
                    .map((m) => {
                      const isSel = form.recipient_mare_id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, recipient_mare_id: m.id }))}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSel ? "border-cyan-600 bg-cyan-500/10 font-bold" : "border-border hover:bg-secondary"
                          }`}
                        >
                          <span className="truncate flex-1">{m.name}</span>
                          {isSel && <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* If Cryo: Tank Details */}
            {form.destination === "cryo" && (
              <div className="lux-card p-4 bg-card border border-border rounded-2xl space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-field text-xs">Tanque LN2</label>
                    <input className="input-field mt-1 text-xs" value={form.tank} onChange={setF("tank")} placeholder="Tanque Principal LN2" />
                  </div>
                  <div>
                    <label className="label-field text-xs">Canister / Canastilla</label>
                    <input className="input-field mt-1 text-xs" value={form.canister} onChange={setF("canister")} placeholder="Canister 2" />
                  </div>
                  <div>
                    <label className="label-field text-xs">Código de Lote</label>
                    <input className="input-field mt-1 text-xs" value={form.lot_number} onChange={setF("lot_number")} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 4: SEGUIMIENTO AUTOMÁTICO EN CALENDARIO ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                4. Programación de Seguimiento
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                GaitFlow agendará el control correspondiente en el Calendario del criadero.
              </p>
            </div>

            <div className="lux-card p-4 border border-cyan-500/20 bg-card rounded-2xl space-y-3">
              {form.destination === "transfer" ? (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.schedule_recipient_diag}
                    onChange={(e) => setForm((f) => ({ ...f, schedule_recipient_diag: e.target.checked }))}
                    className="rounded text-cyan-600 mt-1"
                  />
                  <div>
                    <div className="text-xs font-bold">☑ Programar Diagnóstico de Gestación en Receptora (+14 Días)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Fecha sugerida: <strong>{getSuggestedRecipientDiagDate()}</strong>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="text-xs text-muted-foreground">
                  El embrión quedará catalogado y disponible para transferencia futura en tu <strong>Banco Genético</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 5: RESUMEN EJECUTIVO ── */}
        {step === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-cyan-500/10 text-cyan-600 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-display font-bold text-2xl">¡Procedimiento Embrionario Registrado!</h3>

            <div className="lux-card p-5 bg-card border-border rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Donadora:</span>
                <span className="font-bold">{donorHorse?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Semental:</span>
                <span className="font-bold">{form.stallion_name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Calidad / Estadio:</span>
                <span className="font-bold">{form.grade} · {form.stage}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Destino:</span>
                <span className="font-bold text-cyan-700">
                  {form.destination === "transfer" ? `Transferido a ${recipientHorse?.name}` : `Congelado en LN2 (${form.lot_number})`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateView) onNavigateView("embriones");
                }}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
              >
                <FileText className="h-3.5 w-3.5 inline mr-1" /> Ver Centro de Embriones
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
                    donor_mare_id: "",
                    stallion_id: "",
                    stallion_name: "",
                    flushing_date: new Date().toISOString().split("T")[0],
                    days_post_ovulation: "8",
                    vet_name: "",
                    embryos_recovered_count: "1",
                    grade: "Calidad I",
                    stage: "Blastocisto",
                    embryo_diameter_um: "180",
                    destination: "transfer",
                    recipient_mare_id: "",
                    tank: "Tanque Principal LN2",
                    canister: "Canister 2",
                    lot_number: `EMB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    notes: "",
                    schedule_recipient_diag: true,
                    recipient_diag_days: 14,
                  });
                }}
                className="px-4 py-2 rounded-full bg-cyan-600 text-white text-xs font-bold"
              >
                Registrar Otro Embrión
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
              disabled={step === 1 ? !form.donor_mare_id || !form.stallion_name : false}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-cyan-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !form.donor_mare_id || !form.stallion_name}
              onClick={handleSubmitEmbryo}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-cyan-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando Embrión...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Finalizar y Guardar Embrión
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

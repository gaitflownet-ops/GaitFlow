/**
 * QuickReproductiveActionModal.tsx — Enterprise Universal Quick Action Wizard for Breeding & Reproduction
 * Supports: Monta Natural, Palpación/Ecografía, Diagnóstico de Gestación, Lavado de Embrión
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import {
  useCreateReproductiveEvent,
  useCreateEmbryo,
  useCreateBreedingCycle,
  useUpdateMareStatus,
  useGeneticsInventory,
  type EmbryoGrade,
  type EmbryoStage,
} from "@/lib/hooks/useBreeding";
import { Stethoscope, Activity, HeartPulse, Dna, Check, Loader2, Crown, ShoppingBag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  actionType: "monta" | "inseminacion" | "palpacion" | "diagnostico" | "parto" | "embrion" | null;
}

export function QuickReproductiveActionModal({ open, onClose, actionType }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: genetics = [] } = useGeneticsInventory();
  const createEvent = useCreateReproductiveEvent();
  const createEmbryo = useCreateEmbryo();
  const createCycle = useCreateBreedingCycle();
  const updateMareStatus = useUpdateMareStatus();

  // Strict female mare filter
  const isFemale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "yegua" || sex === "mare" || sex === "hembra" || sex === "female" || sex === "f";
  };
  const mares = horses.filter(isFemale);

  // Male stallions filter
  const isMale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "stallion" || sex === "semental" || sex === "macho" || sex === "padrillo" || sex === "male" || sex === "m" || sex === "potro";
  };
  const internalStallions = horses.filter(isMale);

  const [stallionSourceMode, setStallionSourceMode] = useState<"internal" | "inventory" | "external">("internal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    mare_id: "",
    stallion_id: "",
    stallion_name: "",
    stallion_registry: "",
    genetic_material_id: "",
    recipient_mare_id: "",
    date: new Date().toISOString().split("T")[0],
    vet_name: "",
    findings: "",
    diagnosis_outcome: "Confirmed" as "Confirmed" | "Open",
    grade: "Calidad I" as EmbryoGrade,
    stage: "Blastocisto" as EmbryoStage,
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!actionType) return null;

  const titles: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
    monta: { title: "Registrar Monta Natural", desc: "Registro directo de cubrición entre semental y yegua", icon: HeartPulse },
    palpacion: { title: "Registrar Palpación / Ecografía", desc: "Chequeo ginecológico y folicular por veterinario", icon: Stethoscope },
    diagnostico: { title: "Registrar Diagnóstico de Gestación", desc: "Confirmación ecográfica de gestación (14, 30 o 60 días)", icon: Activity },
    embrion: { title: "Registrar Lavado / Embrión", desc: "Registro de embrión obtenido por lavado uterino", icon: Dna },
  };

  const current = titles[actionType] || titles.palpacion;
  const Icon = current.icon;

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
    const donorName = item.donor?.name || "Semental de Banco";
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
    if (!form.date) {
      toast.error("Selecciona la fecha del evento.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionType === "embrion") {
        const stallionName = form.stallion_name || (internalStallions[0]?.name || "Semental no especificado");

        await createEmbryo.mutateAsync({
          donor_mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          stallion_name: stallionName,
          recipient_mare_id: form.recipient_mare_id || undefined,
          flush_date: form.date,
          grade: form.grade,
          stage: form.stage,
          status: form.recipient_mare_id ? "Transferido" : "Congelado",
          vet_name: form.vet_name || undefined,
          notes: form.findings || undefined,
        });

        await createEvent.mutateAsync({
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: "Lavado",
          scheduled_date: form.date,
          completed_date: form.date,
          status: "Completado",
          vet_name: form.vet_name || undefined,
          result: `Lavado exitoso. Embrión ${form.grade} (${form.stage})`,
          notes: form.findings || undefined,
        });

        toast.success("Embrión y evento de lavado registrados con éxito");
      } else if (actionType === "monta") {
        const stallionName = form.stallion_name || (internalStallions[0]?.name || "Semental Criadero");

        // Calculate expected foaling
        const foalingDate = new Date(form.date);
        foalingDate.setDate(foalingDate.getDate() + 340);

        await createCycle.mutateAsync({
          mare_id: form.mare_id,
          method: "Monta Natural",
          stallion_id: form.stallion_id || undefined,
          stallion_name: stallionName,
          stallion_registry: form.stallion_registry || undefined,
          genetic_material_id: form.genetic_material_id || undefined,
          insemination_date: form.date,
          expected_foaling_date: foalingDate.toISOString().split("T")[0],
          vet_name: form.vet_name || undefined,
          notes: form.findings || undefined,
          pregnancy_status: "Pending",
        });

        await createEvent.mutateAsync({
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: "Monta",
          scheduled_date: form.date,
          completed_date: form.date,
          status: "Completado",
          vet_name: form.vet_name || undefined,
          result: `Monta Natural registrada con ${stallionName}`,
          notes: form.findings || undefined,
        });

        await updateMareStatus.mutateAsync({
          id: form.mare_id,
          reproductive_status: "Servidas",
        });

        toast.success("Monta Natural registrada exitosamente");
      } else {
        const eventTypeMap: Record<string, any> = {
          palpacion: "Palpación",
          diagnostico: "Diagnóstico",
        };

        const eType = eventTypeMap[actionType] || "Palpación";

        await createEvent.mutateAsync({
          mare_id: form.mare_id,
          stallion_id: form.stallion_id || undefined,
          event_type: eType,
          scheduled_date: form.date,
          completed_date: form.date,
          status: "Completado",
          vet_name: form.vet_name || undefined,
          result: actionType === "diagnostico"
            ? (form.diagnosis_outcome === "Confirmed" ? "PREÑEZ CONFIRMADA (+)" : "VACÍA / ABIERTA (-)")
            : (form.findings || "Palpación realizada sin novedades"),
          notes: form.findings || undefined,
        });

        if (actionType === "diagnostico") {
          const newStatus = form.diagnosis_outcome === "Confirmed" ? "Preñadas" : "Vacías";
          await updateMareStatus.mutateAsync({
            id: form.mare_id,
            reproductive_status: newStatus,
          });
        }

        toast.success(`Evento de ${eType} registrado con éxito`);
      }

      onClose();
    } catch (err: any) {
      console.error("Error al registrar acción reproductiva:", err);
      toast.error(err.message || "Error al procesar el registro.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-4 border-b border-border bg-card">
        <div className="eyebrow mb-1">Acción Rápida Reproductiva</div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" /> {current.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{current.desc}</p>
      </div>

      <div className="px-7 py-6 space-y-4 min-h-[340px]">
        {/* Mare Selection */}
        <div>
          <label className="label-field font-semibold">Yegua Reproductora *</label>
          <select id="quick-mare-select" className="input-field mt-1.5" value={form.mare_id} onChange={set("mare_id")}>
            <option value="">Seleccionar yegua...</option>
            {mares.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.code ? `(${m.code})` : ""} {m.breed ? `· ${m.breed}` : ""}
              </option>
            ))}
          </select>
          {mares.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">⚠️ No se encontraron yeguas hembras en la base de datos.</p>
          )}
        </div>

        {/* Stallion / Genetics Selection for Monta or Embrión */}
        {(actionType === "monta" || actionType === "embrion") && (
          <div>
            <label className="label-field font-semibold mb-2 block">Origen del Semental / Salto</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setStallionSourceMode("internal")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  stallionSourceMode === "internal"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <Crown className="h-4 w-4" />
                <span className="text-[11px]">Semental Criadero</span>
              </button>

              <button
                type="button"
                onClick={() => setStallionSourceMode("inventory")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  stallionSourceMode === "inventory"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="text-[11px]">Salto Comprado</span>
              </button>

              <button
                type="button"
                onClick={() => setStallionSourceMode("external")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  stallionSourceMode === "external"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px]">Semental Externo</span>
              </button>
            </div>

            {stallionSourceMode === "internal" && (
              <select
                id="quick-stallion-select"
                className="input-field"
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
            )}

            {stallionSourceMode === "inventory" && (
              <select
                id="quick-inventory-select"
                className="input-field"
                value={form.genetic_material_id}
                onChange={(e) => handleSelectInventoryItem(e.target.value)}
              >
                <option value="">Seleccionar salto del Banco Genético...</option>
                {genetics.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.donor?.name || "Semental Banco"} · {g.material_type} · Cant: {g.quantity}
                  </option>
                ))}
              </select>
            )}

            {stallionSourceMode === "external" && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  id="quick-external-name"
                  className="input-field"
                  value={form.stallion_name}
                  onChange={set("stallion_name")}
                  placeholder="Nombre semental externo..."
                />
                <input
                  id="quick-external-registry"
                  className="input-field"
                  value={form.stallion_registry}
                  onChange={set("stallion_registry")}
                  placeholder="Registro / Criadero..."
                />
              </div>
            )}
          </div>
        )}

        {/* Embrión specific fields */}
        {actionType === "embrion" && (
          <>
            <div>
              <label className="label-field font-semibold">Yegua Receptora (Opcional)</label>
              <select id="quick-recipient-select" className="input-field mt-1.5" value={form.recipient_mare_id} onChange={set("recipient_mare_id")}>
                <option value="">Sin asignar (Permanecerá Congelado)</option>
                {mares.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (Receptora)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Calidad del Embrión</label>
                <select id="quick-grade" className="input-field mt-1" value={form.grade} onChange={set("grade")}>
                  <option>Calidad I</option>
                  <option>Calidad II</option>
                  <option>Calidad III</option>
                </select>
              </div>
              <div>
                <label className="label-field">Etapa de Desarrollo</label>
                <select id="quick-stage" className="input-field mt-1" value={form.stage} onChange={set("stage")}>
                  <option>Blastocisto</option>
                  <option>Blastocisto Expandido</option>
                  <option>Mórula</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Diagnóstico specific outcome selector */}
        {actionType === "diagnostico" && (
          <div>
            <label className="label-field font-semibold mb-1.5 block">Resultado del Diagnóstico *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, diagnosis_outcome: "Confirmed" }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.diagnosis_outcome === "Confirmed"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                Preñez Confirmada (+)
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, diagnosis_outcome: "Open" }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.diagnosis_outcome === "Open"
                    ? "border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-xs"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                Vacía / Abierta (-)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field font-semibold">Fecha *</label>
            <input id="quick-date" type="date" className="input-field mt-1.5" value={form.date} onChange={set("date")} />
          </div>
          <div>
            <label className="label-field font-semibold">Veterinario Responsable</label>
            <input id="quick-vet" className="input-field mt-1.5" value={form.vet_name} onChange={set("vet_name")} placeholder="Dr. Juan Manuel Sierra" />
          </div>
        </div>

        <div>
          <label className="label-field font-semibold">Hallazgos / Resultados / Observaciones</label>
          <textarea
            id="quick-findings"
            className="input-field resize-none h-20 mt-1.5"
            value={form.findings}
            onChange={set("findings")}
            placeholder="Resultado del examen, tamaño folicular, tono uterino, vesícula embrionaria..."
          />
        </div>
      </div>

      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5 bg-card">
        <button
          id="quick-cancel-btn"
          disabled={isSubmitting}
          onClick={onClose}
          className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
        <button
          id="quick-submit-btn"
          disabled={!form.mare_id || !form.date || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Registrar Evento
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

import { useState } from "react";
import { Modal } from "./Modal";
import { useUpdateBreedingCycle, useUpdateMareStatus, type BreedingCycle } from "@/lib/hooks/useBreeding";
import { useCreateHorse } from "@/lib/hooks/useHorses";
import { useApp } from "@/lib/store";
import { Baby, Check, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  cycle: BreedingCycle | null;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FoalingModal({ open, onClose, cycle }: Props) {
  const { state } = useApp();
  const updateCycle = useUpdateBreedingCycle();
  const updateMareStatus = useUpdateMareStatus();
  const createHorse = useCreateHorse();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    actual_foaling_date: new Date().toISOString().split("T")[0],
    foal_name: "",
    foal_sex: "Potro (M)",
    foal_color: "",
    foal_barn_name: "",
    outcome_notes: "",
    foal_weight_kg: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = !!form.actual_foaling_date && !!form.foal_name;

  async function handleSubmit() {
    if (!cycle || !canSubmit) {
      toast.error("Ingresa el nombre oficial del potro y la fecha de nacimiento.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create foal horse profile
      const slug = `${toSlug(form.foal_name)}-${Date.now().toString(36)}`;
      const foalData = await createHorse.mutateAsync({
        name: form.foal_name,
        barn_name: form.foal_barn_name || form.foal_name,
        slug,
        sex: form.foal_sex.includes("(M)") ? "Macho" : "Hembra",
        color: form.foal_color || undefined,
        breed: cycle.mare?.breed ?? undefined,
        status: "Potro en Desarrollo",
        organization_id: (state.user as any)?.organization_id,
        owner_id: state.user?.id,
        bloodline: cycle.stallion_name ?? undefined,
      } as any);

      // 2. Mark breeding cycle as foaled
      await updateCycle.mutateAsync({
        id: cycle.id,
        updates: {
          pregnancy_status: "Confirmed",
          actual_foaling_date: form.actual_foaling_date,
          foal_id: foalData?.id,
          notes: form.outcome_notes
            ? `${cycle.notes ? cycle.notes + "\n" : ""}PARTO: ${form.outcome_notes}`
            : cycle.notes,
        },
      });

      // 3. Move Mare to Lactancia
      await updateMareStatus.mutateAsync({
        id: cycle.mare_id,
        reproductive_status: "Lactancia",
      });

      toast.success("Parto registrado y perfil del potro creado con éxito");
      onClose();
    } catch (err: any) {
      console.error("Error al registrar parto:", err);
      toast.error(err.message || "Error al registrar el nacimiento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!cycle) return null;

  const gestationDays = Math.floor(
    (Date.now() - new Date(cycle.insemination_date).getTime()) / 86400000
  );

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-4 border-b border-border">
        <div className="eyebrow mb-1">Sección I.1 · Registro de Parto</div>
        <h2 className="font-display text-2xl flex items-center gap-2">
          <Baby className="h-6 w-6 text-rose-400" />
          Registrar Nacimiento
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Yegua: <strong>{cycle.mare?.name ?? `ID ${cycle.mare_id.slice(0, 8)}`}</strong>
          {" · "}Padre: <strong>{cycle.stallion_name}</strong>
          {" · "}Gestación: <strong>{gestationDays} días</strong>
        </p>
      </div>

      <div className="px-7 py-6 space-y-5">
        {/* Info banner */}
        <div className="lux-card p-4 bg-rose-50 border-rose-200 flex items-start gap-3">
          <Heart className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <div className="text-xs text-rose-700">
            Al guardar, se creará automáticamente el <strong>perfil del potro</strong> en el módulo de
            Ejemplares (C.1) con el pedigree heredado del padre <em>{cycle.stallion_name}</em>.
          </div>
        </div>

        <div>
          <label className="label-field">Fecha de Nacimiento *</label>
          <input id="foaling-date" type="date" className="input-field" value={form.actual_foaling_date} onChange={set("actual_foaling_date")} />
        </div>

        {/* Foal details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Nombre del Potro *</label>
            <input id="foal-name" className="input-field" value={form.foal_name} onChange={set("foal_name")} placeholder="Nombre oficial de registro" />
          </div>
          <div>
            <label className="label-field">Nombre de Cuadra</label>
            <input id="foal-barn-name" className="input-field" value={form.foal_barn_name} onChange={set("foal_barn_name")} placeholder="Apodo / nombre de cuadra" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Sexo</label>
            <select id="foal-sex" className="input-field" value={form.foal_sex} onChange={set("foal_sex")}>
              <option>Potro (M)</option>
              <option>Potranca (F)</option>
            </select>
          </div>
          <div>
            <label className="label-field">Color / Capa</label>
            <input id="foal-color" className="input-field" value={form.foal_color} onChange={set("foal_color")} placeholder="Ej. Alazán tostado" />
          </div>
        </div>

        <div>
          <label className="label-field">Observaciones del Parto</label>
          <textarea
            id="foaling-notes"
            className="input-field resize-none h-20"
            value={form.outcome_notes}
            onChange={set("outcome_notes")}
            placeholder="Condiciones del nacimiento, asistencia veterinaria, estado de la madre y potro..."
          />
        </div>
      </div>

      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5">
        <button id="cancel-foaling-btn" onClick={onClose} className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors">
          Cancelar
        </button>
        <button
          id="submit-foaling-btn"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Registrar Parto y Crear Perfil
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

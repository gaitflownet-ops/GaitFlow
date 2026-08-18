/**
 * QuickAddStallionModal.tsx — Quick Add Modal for creating an Internal Stallion
 * Auto-creates entry in `horses` (sex='Semental') and `stallion_profiles`
 * Returns newly created stallion to parent wizard for immediate auto-selection.
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useQuickCreateStallion } from "@/lib/hooks/useBreeding";
import { Crown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (stallion: { id: string; name: string; breed?: string; code?: string }) => void;
}

export function QuickAddStallionModal({ open, onClose, onSuccess }: Props) {
  const createStallion = useQuickCreateStallion();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    breed: "Paso Fino",
    stud_fee_usd: "",
    bloodline: "",
    image_url: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Ingresa el nombre del semental.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createStallion.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        breed: form.breed,
        stud_fee_usd: form.stud_fee_usd ? Number(form.stud_fee_usd) : undefined,
        bloodline: form.bloodline.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
      });

      toast.success(`Semental "${created.name}" registrado con éxito`);
      onSuccess({
        id: created.id,
        name: created.name,
        breed: created.breed,
        code: created.code,
      });
      onClose();
      setForm({ name: "", code: "", breed: "Paso Fino", stud_fee_usd: "", bloodline: "", image_url: "" });
    } catch (err: any) {
      console.error("Error al crear semental rápido:", err);
      toast.error(err.message || "Error al crear el semental.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card">
        <div className="eyebrow mb-1 text-xs text-primary font-bold">Quick Add · Criadero Propio</div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" /> Registrar Nuevo Semental
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Crea el perfil del reproductor propio. Al guardar, quedará inmediatamente auto-seleccionado en tu servicio.
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="label-field font-semibold text-xs">Nombre del Semental *</label>
          <input
            id="quick-st-name"
            className="input-field mt-1"
            value={form.name}
            onChange={set("name")}
            placeholder="Ej. Nombre del Semental"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs font-semibold">Código / Microchip</label>
            <input
              id="quick-st-code"
              className="input-field mt-1"
              value={form.code}
              onChange={set("code")}
              placeholder="Ej. REG-123456"
            />
          </div>
          <div>
            <label className="label-field text-xs font-semibold">Raza</label>
            <select id="quick-st-breed" className="input-field mt-1" value={form.breed} onChange={set("breed")}>
              <option>Paso Fino</option>
              <option>Trocha Colombiana</option>
              <option>Trote y Galope</option>
              <option>Trocha y Galope</option>
              <option>CCC (Caballo Criollo Colombiano)</option>
              <option>Otra Raza</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs">Valor del Salto (USD)</label>
            <input
              id="quick-st-fee"
              type="number"
              className="input-field mt-1"
              value={form.stud_fee_usd}
              onChange={set("stud_fee_usd")}
              placeholder="Ej. 2500"
            />
          </div>
          <div>
            <label className="label-field text-xs">Genealogía / Padre × Madre</label>
            <input
              id="quick-st-bloodline"
              className="input-field mt-1"
              value={form.bloodline}
              onChange={set("bloodline")}
              placeholder="Ej. Padre × Madre"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 border-t border-border flex items-center justify-between bg-card">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!form.name.trim() || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Registrar y Seleccionar
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

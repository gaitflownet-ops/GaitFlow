/**
 * QuickAddExternalStallionModal.tsx — Quick Add Modal for External Stallions
 * Allows registering metadata for stallions owned by third parties (Criadero externo)
 * Does NOT pollute the farm's internal `horses` inventory.
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";

export interface ExternalStallionData {
  name: string;
  registry?: string;
  owner_criadero?: string;
  country?: string;
  sire_name?: string;
  dam_name?: string;
  contact?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: ExternalStallionData) => void;
}

export function QuickAddExternalStallionModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<ExternalStallionData>({
    name: "",
    registry: "",
    owner_criadero: "",
    country: "Colombia",
    sire_name: "",
    dam_name: "",
    contact: "",
    notes: "",
  });

  const set = (k: keyof ExternalStallionData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Ingresa el nombre del semental externo.");
      return;
    }

    toast.success(`Semental externo "${form.name}" registrado`);
    onSuccess({
      ...form,
      name: form.name.trim(),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card">
        <div className="eyebrow mb-1 text-xs text-indigo-600 font-bold">Quick Add · Reproductor Tercero</div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-500" /> Registrar Semental Externo
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Registra un semental ajeno al criadero para trazabilidad del servicio sin alterar tu inventario de ejemplares propios.
        </p>
      </div>

      <div className="px-6 py-5 space-y-3.5">
        <div>
          <label className="label-field font-semibold text-xs">Nombre del Semental Externo *</label>
          <input
            id="ext-st-name"
            className="input-field mt-1"
            value={form.name}
            onChange={set("name")}
            placeholder="Ej. Promesa del Sol FC"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs font-semibold">N° Registro / Asociación</label>
            <input
              id="ext-st-registry"
              className="input-field mt-1"
              value={form.registry}
              onChange={set("registry")}
              placeholder="Ej. FEDEQUINAS 7842"
            />
          </div>
          <div>
            <label className="label-field text-xs font-semibold">Criadero Propietario</label>
            <input
              id="ext-st-owner"
              className="input-field mt-1"
              value={form.owner_criadero}
              onChange={set("owner_criadero")}
              placeholder="Ej. Criadero La Marqueza"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs">Padre del Semental (Sire)</label>
            <input
              id="ext-st-sire"
              className="input-field mt-1"
              value={form.sire_name}
              onChange={set("sire_name")}
              placeholder="Nombre del padre..."
            />
          </div>
          <div>
            <label className="label-field text-xs">Madre del Semental (Dam)</label>
            <input
              id="ext-st-dam"
              className="input-field mt-1"
              value={form.dam_name}
              onChange={set("dam_name")}
              placeholder="Nombre de la madre..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs">País de Origen</label>
            <input
              id="ext-st-country"
              className="input-field mt-1"
              value={form.country}
              onChange={set("country")}
              placeholder="Colombia, USA, etc."
            />
          </div>
          <div>
            <label className="label-field text-xs">Contacto / Teléfono Propietario</label>
            <input
              id="ext-st-contact"
              className="input-field mt-1"
              value={form.contact}
              onChange={set("contact")}
              placeholder="+57 300 000 0000"
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
          disabled={!form.name.trim()}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
        >
          <Check className="h-3.5 w-3.5" /> Registrar y Seleccionar
        </button>
      </div>
    </Modal>
  );
}

/**
 * AddGeneticMaterialModal.tsx — Registro de material genético para el Inventario I.2
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useCreateGeneticsItem, type GeneticMaterialType, type GeneticMaterialStatus } from "@/lib/hooks/useBreeding";
import { Dna, FlaskConical, Snowflake, Droplets, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPES: { value: GeneticMaterialType; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { value: "Embryo",        label: "Embrión",           icon: Dna,         desc: "Embrión producido o adquirido", color: "text-rose-500" },
  { value: "Frozen Straw",  label: "Pajilla Congelada",  icon: Snowflake,   desc: "Semen congelado · -196°C (LN₂)", color: "text-blue-500" },
  { value: "Chilled Straw", label: "Pajilla Refrigerada",icon: Droplets,    desc: "Semen refrigerado · 4-8°C · 24-48h", color: "text-cyan-500" },
  { value: "Live Cover Record", label: "Registro de Monta",icon: FlaskConical, desc: "Registro histórico de monta natural", color: "text-amber-500" },
];

const STORAGE_TEMPS = ["-196°C (LN₂ - Nitrógeno Líquido)", "4-8°C (Refrigerado)", "Temperatura ambiente", "N/A"];

export function AddGeneticMaterialModal({ open, onClose }: Props) {
  const createItem = useCreateGeneticsItem();
  const [form, setForm] = useState({
    material_type: "" as GeneticMaterialType | "",
    unique_code: "",
    donor_name: "",
    donor_registry: "",
    dam_name: "",
    production_date: "",
    acquisition_date: new Date().toISOString().split("T")[0],
    supplier_name: "",
    cost_usd: "",
    storage_temp: "",
    storage_location: "",
    laboratory_name: "",
    responsible_vet: "",
    quantity: "1",
    expiration_date: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = !!form.material_type && !!form.donor_name && parseInt(form.quantity) > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    await createItem.mutateAsync({
      material_type: form.material_type as GeneticMaterialType,
      unique_code: form.unique_code || undefined,
      donor_name: form.donor_name,
      donor_registry: form.donor_registry || undefined,
      dam_name: form.dam_name || undefined,
      production_date: form.production_date || undefined,
      acquisition_date: form.acquisition_date || undefined,
      supplier_name: form.supplier_name || undefined,
      cost_usd: form.cost_usd ? parseFloat(form.cost_usd) : undefined,
      storage_temp: form.storage_temp || undefined,
      storage_location: form.storage_location || undefined,
      laboratory_name: form.laboratory_name || undefined,
      responsible_vet: form.responsible_vet || undefined,
      quantity: parseInt(form.quantity) || 1,
      expiration_date: form.expiration_date || undefined,
      notes: form.notes || undefined,
      status: "Available",
      listed_for_sale: false,
    });
    onClose();
    setForm({ material_type: "", unique_code: "", donor_name: "", donor_registry: "", dam_name: "", production_date: "", acquisition_date: new Date().toISOString().split("T")[0], supplier_name: "", cost_usd: "", storage_temp: "", storage_location: "", laboratory_name: "", responsible_vet: "", quantity: "1", expiration_date: "", notes: "" });
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-4 border-b border-border">
        <div className="eyebrow mb-1">Sección I.2</div>
        <h2 className="font-display text-2xl">Agregar Material Genético</h2>
        <p className="text-sm text-muted-foreground mt-1">Registro de inventario con trazabilidad completa</p>
      </div>

      <div className="px-7 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* Material type selector */}
        <div>
          <label className="label-field">Tipo de Material *</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {TYPES.map(({ value, label, icon: Icon, desc, color }) => (
              <button
                key={value}
                type="button"
                id={`mat-type-${value.replace(/\s+/g,"-").toLowerCase()}`}
                onClick={() => setForm((f) => ({ ...f, material_type: value }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.material_type === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${form.material_type === value ? "text-primary" : color}`} />
                <div className="text-xs font-semibold">{label}</div>
                <div className="text-[10px] text-muted-foreground leading-snug">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Donor info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Nombre del Donante *</label>
            <input id="donor-name" className="input-field" value={form.donor_name} onChange={set("donor_name")} placeholder="Ej. Royal Monarch IV" />
          </div>
          <div>
            <label className="label-field">Registro Donante (AQHA/USEF)</label>
            <input id="donor-registry" className="input-field" value={form.donor_registry} onChange={set("donor_registry")} placeholder="Opcional" />
          </div>
        </div>

        {(form.material_type === "Embryo") && (
          <div>
            <label className="label-field">Nombre de la Yegua Donadora</label>
            <input id="dam-name" className="input-field" value={form.dam_name} onChange={set("dam_name")} placeholder="Para embriones: yegua donadora" />
          </div>
        )}

        {/* Identification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Código de Laboratorio</label>
            <input id="unique-code" className="input-field" value={form.unique_code} onChange={set("unique_code")} placeholder="Código interno del lab" />
          </div>
          <div>
            <label className="label-field">Cantidad *</label>
            <input id="quantity" type="number" min="1" className="input-field" value={form.quantity} onChange={set("quantity")} />
          </div>
        </div>

        {/* Origin & dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Fecha de Producción</label>
            <input id="production-date" type="date" className="input-field" value={form.production_date} onChange={set("production_date")} />
          </div>
          <div>
            <label className="label-field">Fecha de Adquisición</label>
            <input id="acquisition-date" type="date" className="input-field" value={form.acquisition_date} onChange={set("acquisition_date")} />
          </div>
        </div>

        {/* Storage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Temperatura de Almacenamiento</label>
            <select id="storage-temp" className="input-field" value={form.storage_temp} onChange={set("storage_temp")}>
              <option value="">Seleccionar...</option>
              {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Fecha de Expiración</label>
            <input id="expiration-date" type="date" className="input-field" value={form.expiration_date} onChange={set("expiration_date")} />
          </div>
        </div>

        <div>
          <label className="label-field">Ubicación de Almacenamiento</label>
          <input id="storage-location" className="input-field" value={form.storage_location} onChange={set("storage_location")} placeholder="Ej. Tanque A · Canasta 3 · Pajilla #14" />
        </div>

        {/* Supplier & cost */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Proveedor / Criadero</label>
            <input id="supplier-name" className="input-field" value={form.supplier_name} onChange={set("supplier_name")} placeholder="Nombre del proveedor" />
          </div>
          <div>
            <label className="label-field">Costo (USD)</label>
            <input id="cost-usd" type="number" step="0.01" min="0" className="input-field" value={form.cost_usd} onChange={set("cost_usd")} placeholder="0.00" />
          </div>
        </div>

        {/* Lab & vet */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Laboratorio</label>
            <input id="lab-name" className="input-field" value={form.laboratory_name} onChange={set("laboratory_name")} placeholder="Nombre del laboratorio" />
          </div>
          <div>
            <label className="label-field">Veterinario Responsable</label>
            <input id="resp-vet" className="input-field" value={form.responsible_vet} onChange={set("responsible_vet")} placeholder="Dr. ..." />
          </div>
        </div>

        <div>
          <label className="label-field">Notas Adicionales</label>
          <textarea id="genetic-notes" className="input-field resize-none h-20" value={form.notes} onChange={set("notes")} placeholder="Rasgos esperados, historial de uso, condiciones especiales..." />
        </div>
      </div>

      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5">
        <button
          id="cancel-genetic-btn"
          onClick={onClose}
          className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
        <button
          id="submit-genetic-btn"
          disabled={!canSubmit || createItem.isPending}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {createItem.isPending ? "Guardando…" : <><Check className="h-4 w-4" /> Registrar Material</>}
        </button>
      </div>
    </Modal>
  );
}

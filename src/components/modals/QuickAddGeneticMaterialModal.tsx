/**
 * QuickAddGeneticMaterialModal.tsx — Quick Add Modal for Genetic Material / Purchased Straws
 * Creates entry in `genetic_bank` table (Semen, Pajilla Congelada, Salto Comprado)
 * Returns newly created lot to parent wizard for immediate auto-selection.
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useCreateGeneticItem, type GeneticMaterialType } from "@/lib/hooks/useBreeding";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (item: { id: string; donor_name: string; lot_number?: string; quantity: number }) => void;
}

export function QuickAddGeneticMaterialModal({ open, onClose, onSuccess }: Props) {
  const createGeneticItem = useCreateGeneticItem();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    material_type: "Semen" as GeneticMaterialType,
    donor_name: "",
    lot_number: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    quantity: "5",
    storage_tank: "Tanque Principal LN2",
    storage_canister: "Canister 1",
    cost_usd: "",
    acquisition_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.donor_name.trim()) {
      toast.error("Ingresa el nombre del semental donador.");
      return;
    }
    const qty = Number(form.quantity);
    if (!qty || qty <= 0) {
      toast.error("Ingresa una cantidad de dosis válida mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createGeneticItem.mutateAsync({
        material_type: form.material_type,
        lot_number: form.lot_number.trim() || undefined,
        quantity: qty,
        storage_tank: form.storage_tank.trim() || undefined,
        storage_canister: form.storage_canister.trim() || undefined,
        status: "Disponible",
        acquisition_date: form.acquisition_date || undefined,
        cost_usd: form.cost_usd ? Number(form.cost_usd) : undefined,
        notes: form.notes
          ? `Donador: ${form.donor_name.trim()} | ${form.notes}`
          : `Donador: ${form.donor_name.trim()}`,
      });

      toast.success(`Material genético de "${form.donor_name.trim()}" registrado (${qty} dosis)`);
      onSuccess({
        id: created.id,
        donor_name: form.donor_name.trim(),
        lot_number: created.lot_number,
        quantity: created.quantity,
      });
      onClose();
    } catch (err: any) {
      console.error("Error al crear material genético:", err);
      toast.error(err.message || "Error al registrar el lote genético.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card">
        <div className="eyebrow mb-1 text-xs text-blue-600 font-bold">Quick Add · Banco Genético</div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-500" /> Registrar Material Genético
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa un lote de saltos o pajillas compradas a tu inventario para consumo automático en inseminaciones.
        </p>
      </div>

      <div className="px-6 py-5 space-y-3.5">
        <div>
          <label className="label-field font-semibold text-xs">Semental Donador *</label>
          <input
            id="quick-gen-donor"
            className="input-field mt-1"
            value={form.donor_name}
            onChange={set("donor_name")}
            placeholder="Ej. Carbonero V de la Roca"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs font-semibold">Tipo de Material</label>
            <select id="quick-gen-type" className="input-field mt-1" value={form.material_type} onChange={set("material_type")}>
              <option value="Semen">Pajilla / Semen Congelado</option>
              <option value="Semen">Semen Refrigerado</option>
              <option value="Embrión">Embrión Preservado</option>
              <option value="Ovocito">Ovocito</option>
            </select>
          </div>
          <div>
            <label className="label-field text-xs font-semibold">Cantidad de Dosis *</label>
            <input
              id="quick-gen-qty"
              type="number"
              min="1"
              className="input-field mt-1"
              value={form.quantity}
              onChange={set("quantity")}
              placeholder="Ej. 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs font-semibold">Número de Lote / Código</label>
            <input
              id="quick-gen-lot"
              className="input-field mt-1"
              value={form.lot_number}
              onChange={set("lot_number")}
            />
          </div>
          <div>
            <label className="label-field text-xs font-semibold">Costo Total Adquisición (USD)</label>
            <input
              id="quick-gen-cost"
              type="number"
              className="input-field mt-1"
              value={form.cost_usd}
              onChange={set("cost_usd")}
              placeholder="Ej. 1500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field text-xs">Tanque de Nitrógeno (LN2)</label>
            <input
              id="quick-gen-tank"
              className="input-field mt-1"
              value={form.storage_tank}
              onChange={set("storage_tank")}
              placeholder="Ej. Tanque 1 - Banco Criadero"
            />
          </div>
          <div>
            <label className="label-field text-xs">Canister / Canastilla</label>
            <input
              id="quick-gen-canister"
              className="input-field mt-1"
              value={form.storage_canister}
              onChange={set("storage_canister")}
              placeholder="Ej. Canister 3"
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
          disabled={!form.donor_name.trim() || isSubmitting}
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

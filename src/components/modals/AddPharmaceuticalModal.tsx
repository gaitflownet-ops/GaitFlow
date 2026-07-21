import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import {
  useCreatePharmaceutical,
  useUpdatePharmaceutical,
  type Pharmaceutical,
} from "@/lib/hooks/usePharmaceuticals";
import { Check, Camera, RefreshCw } from "lucide-react";
import { AnimatedLoaderText } from "../ui/AnimatedLoaderText";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Pharmaceutical | null;
};

type Category =
  | "vaccine"
  | "dewormer"
  | "antibiotic"
  | "anti-inflammatory"
  | "supplement"
  | "topical"
  | "other";

const categories: { value: Category; label: string }[] = [
  { value: "vaccine", label: "Vacuna" },
  { value: "dewormer", label: "Desparasitante" },
  { value: "antibiotic", label: "Antibiótico" },
  { value: "anti-inflammatory", label: "Antiinflamatorio" },
  { value: "supplement", label: "Suplemento" },
  { value: "topical", label: "Tópico" },
  { value: "other", label: "Otro" },
];

type Unit = "ml" | "mg" | "tablets" | "doses" | "tubes";

const units: { value: Unit; label: string }[] = [
  { value: "ml", label: "ml" },
  { value: "mg", label: "mg" },
  { value: "tablets", label: "Tabletas" },
  { value: "doses", label: "Dosis" },
  { value: "tubes", label: "Tubos o Jeringas" },
];

export function AddPharmaceuticalModal({ open, onOpenChange, editItem }: Props) {
  const createPharma = useCreatePharmaceutical();
  const updatePharma = useUpdatePharmaceutical();
  const isEditMode = !!editItem;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [manufacturer, setManufacturer] = useState("");
  const [unit, setUnit] = useState<Unit>("doses");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [minStockAlert, setMinStockAlert] = useState<number | "">(5);
  const [costPerUnit, setCostPerUnit] = useState<number | "">("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (editItem) {
      setName(editItem.name ?? "");
      setCategory((editItem.category as Category) ?? "other");
      setManufacturer(editItem.manufacturer ?? "");
      setUnit((editItem.unit as Unit) ?? "doses");
      setStockQuantity(editItem.stock_quantity ?? "");
      setMinStockAlert(editItem.min_stock_alert ?? 5);
      setCostPerUnit(editItem.cost_per_unit ?? "");
      setExpiryDate(editItem.expiry_date ?? "");
      setNotes(editItem.notes ?? "");
    } else {
      resetForm();
    }
    setDone(false);
  }, [editItem, open]);

  const resetForm = () => {
    setName("");
    setCategory("other");
    setManufacturer("");
    setUnit("doses");
    setStockQuantity("");
    setMinStockAlert(5);
    setCostPerUnit("");
    setExpiryDate("");
    setNotes("");
    setDone(false);
  };

  const handleClose = () => {
    if (!isEditMode) resetForm();
    setDone(false);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category,
      manufacturer: manufacturer || null,
      unit,
      stock_quantity: stockQuantity !== "" ? Number(stockQuantity) : 0,
      min_stock_alert: minStockAlert !== "" ? Number(minStockAlert) : 5,
      cost_per_unit: costPerUnit !== "" ? Number(costPerUnit) : 0,
      expiry_date: expiryDate || null,
      notes: notes || null,
    };

    if (isEditMode && editItem) {
      await updatePharma.mutateAsync({ id: editItem.id, ...payload });
    } else {
      await createPharma.mutateAsync(payload);
    }

    setDone(true);
    setTimeout(() => handleClose(), 1400);
  };

  const isPending = createPharma.isPending || updatePharma.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Editar medicamento" : "Agregar medicamento al inventario"}
    >
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">
            {isEditMode ? "Producto actualizado" : "Producto agregado"}
          </p>
          <p className="text-muted-foreground text-sm text-center">
            {isEditMode
              ? "El inventario del criadero ha sido actualizado."
              : "Nuevo medicamento agregado exitosamente a la bodega."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="eyebrow block mb-1.5">Nombre del Producto</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ivermectina 1%"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Fabricante / Marca</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Stock Inicial</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value ? Number(e.target.value) : "")}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Alerta Mínimo</label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value ? Number(e.target.value) : "")}
                placeholder="5"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Costo por unidad (COP)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value ? Number(e.target.value) : "")}
                placeholder="$ 0"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Fecha de expiración</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Notas adicionales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones, lote, proveedor, etc."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-full px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-70"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="pharma-submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {isPending ? (
                <AnimatedLoaderText />
              ) : isEditMode ? (
                "Guardar cambios"
              ) : (
                "Agregar producto"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

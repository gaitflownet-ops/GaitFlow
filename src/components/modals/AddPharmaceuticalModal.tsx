import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import {
  useCreatePharmaceutical,
  useUpdatePharmaceutical,
  type Pharmaceutical,
} from "@/lib/hooks/usePharmaceuticals";
import { Check, Loader2 } from "lucide-react";

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
  { value: "vaccine", label: "Vaccine" },
  { value: "dewormer", label: "Dewormer" },
  { value: "antibiotic", label: "Antibiotic" },
  { value: "anti-inflammatory", label: "Anti-inflammatory" },
  { value: "supplement", label: "Supplement" },
  { value: "topical", label: "Topical" },
  { value: "other", label: "Other" },
];

type Unit = "ml" | "mg" | "tablets" | "doses" | "tubes";

const units: { value: Unit; label: string }[] = [
  { value: "ml", label: "ml" },
  { value: "mg", label: "mg" },
  { value: "tablets", label: "Tablets" },
  { value: "doses", label: "Doses" },
  { value: "tubes", label: "Tubes" },
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
      title={isEditMode ? "Edit pharmaceutical" : "Add pharmaceutical"}
    >
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">
            {isEditMode ? "Product updated" : "Product added"}
          </p>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? "Pharmaceutical inventory has been updated."
              : "New product added to inventory."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="eyebrow block mb-1.5">Product name</label>
            <input
              className="lux-input"
              placeholder="E.g. West Nile Vaccine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              id="pharma-name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="eyebrow block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    category === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="eyebrow block mb-1.5">Manufacturer</label>
            <input
              className="lux-input"
              placeholder="E.g. Zoetis, Merck"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              id="pharma-manufacturer"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="eyebrow block mb-2">Unit</label>
            <div className="flex flex-wrap gap-2">
              {units.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnit(value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    unit === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock + Min Stock Alert */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Stock quantity</label>
              <input
                type="number"
                className="lux-input"
                placeholder="0"
                min={0}
                value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
                id="pharma-stock"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Min stock alert</label>
              <input
                type="number"
                className="lux-input"
                placeholder="5"
                min={0}
                value={minStockAlert}
                onChange={(e) =>
                  setMinStockAlert(e.target.value === "" ? "" : Number(e.target.value))
                }
                id="pharma-min-stock"
              />
            </div>
          </div>

          {/* Cost per Unit */}
          <div>
            <label className="eyebrow block mb-1.5">Cost per unit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                type="number"
                className="lux-input pl-7"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={costPerUnit}
                onChange={(e) =>
                  setCostPerUnit(e.target.value === "" ? "" : Number(e.target.value))
                }
                id="pharma-cost"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="eyebrow block mb-1.5">Expiry date</label>
            <input
              type="date"
              className="lux-input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              id="pharma-expiry"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              className="lux-input resize-none"
              rows={3}
              placeholder="Storage instructions, usage notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="pharma-notes"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="pharma-submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "Update product"
              ) : (
                "Add product"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

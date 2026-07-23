import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import { useCreateHealthRecord, calculateNextDue } from "@/lib/hooks/useHealth";
import { usePharmaceuticals } from "@/lib/hooks/usePharmaceuticals";
import { useContacts, useCreateActivityLog } from "@/lib/hooks/useCRM";
import { Check, Loader2, User } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHorseId?: string;
};

type RecordType =
  | "vaccination"
  | "deworming"
  | "vet_visit"
  | "farrier"
  | "dental"
  | "hoof_care"
  | "treatment"
  | "coggins"
  | "xray"
  | "other";

const types: { value: RecordType; label: string }[] = [
  { value: "vaccination", label: "Vaccination" },
  { value: "deworming", label: "Deworming" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "farrier", label: "Farrier" },
  { value: "dental", label: "Dental" },
  { value: "hoof_care", label: "Hoof Care" },
  { value: "treatment", label: "Treatment" },
  { value: "coggins", label: "Coggins" },
  { value: "xray", label: "X-Ray" },
  { value: "other", label: "Other" },
];

type Recurrence = "none" | "weekly" | "monthly" | "quarterly" | "biannual" | "annual";

const recurrenceOptions: { value: Recurrence; label: string }[] = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Biannual" },
  { value: "annual", label: "Annual" },
];

type Status = "completed" | "pending" | "requires_followup";

const statusOptions: { value: Status; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "requires_followup", label: "Requires Follow-up" },
];

const frequencyOptions = [
  { value: "once", label: "Once" },
  { value: "2x daily", label: "2× daily" },
  { value: "3x daily", label: "3× daily" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function AddHealthRecordModal({ open, onOpenChange, defaultHorseId }: Props) {
  const { data: horses = [] } = useHorses();
  const { data: pharmaceuticals = [] } = usePharmaceuticals();
  const { data: contacts = [] } = useContacts();
  const createRecord = useCreateHealthRecord();
  const createActivityLog = useCreateActivityLog();

  const [type, setType] = useState<RecordType>("vet_visit");
  const [horseId, setHorseId] = useState(defaultHorseId ?? "");
  const [title, setTitle] = useState("");
  const [professional, setProfessional] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [productUsed, setProductUsed] = useState("");
  const [productQuantity, setProductQuantity] = useState<number | "">("");
  const [cost, setCost] = useState<number | "">("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [status, setStatus] = useState<Status>("completed");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const selectedProduct = pharmaceuticals.find((p) => p.name === productUsed);
  const nextDue = recurrence !== "none" ? calculateNextDue(date, recurrence) : null;

  const reset = () => {
    setType("vet_visit");
    setHorseId(defaultHorseId ?? "");
    setTitle("");
    setProfessional("");
    setDate(new Date().toISOString().slice(0, 10));
    setDiagnosis("");
    setPrescription("");
    setDose("");
    setFrequency("");
    setProductUsed("");
    setProductQuantity("");
    setCost("");
    setRecurrence("none");
    setStatus("completed");
    setNotes("");
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetHorseId = horseId || horses[0]?.id;
    if (!targetHorseId || !title) return;

    const horse = horses.find((h) => h.id === targetHorseId);

    try {
      await createRecord.mutateAsync({
        horse_id: targetHorseId,
        horse_name: horse?.name ?? "Unknown",
        type,
        title,
        notes: notes || "",
        professional: professional || "",
        date,
        status,
        diagnosis: diagnosis || null,
        prescription: prescription || null,
        dose: dose || null,
        frequency: frequency || null,
        product_used: productUsed || null,
        product_quantity: productQuantity !== "" ? Number(productQuantity) : null,
        cost: cost !== "" ? Number(cost) : null,
        recurrence,
        next_due: nextDue,
        category: type,
      });

      // Also create an activity log in CRM if a CRM professional was selected
      const selectedContact = contacts.find(c => c.id === professional);
      if (selectedContact) {
        await createActivityLog.mutateAsync({
          organization_id: horse?.organization_id || state.user?.organization_id || "00000000-0000-0000-0000-000000000000",
          user_id: null, // we would ideally use auth.uid() if we had user in state here, but backend triggers might handle it
          date: new Date().toISOString(),
          module_source: "health",
          action_type: "Registro sanitario",
          action_details: `Se registró: ${title}`,
          horse_id: targetHorseId,
          contact_id: selectedContact.id,
          reference_id: null
        });
      }

      setDone(true);
      setTimeout(() => handleClose(), 1400);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not save the health record.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add health record" size="lg">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Record saved</p>
          <p className="text-muted-foreground text-sm">Health record added to the horse profile.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Record Type */}
          <div>
            <label className="eyebrow block mb-2">Record type</label>
            <div className="flex flex-wrap gap-2">
              {types.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  id={`health-type-${value}`}
                  onClick={() => setType(value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    type === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Horse */}
          <div>
            <label className="eyebrow block mb-1.5">Horse</label>
            <select
              className="lux-select"
              value={horseId}
              onChange={(e) => setHorseId(e.target.value)}
            >
              <option value="">Select a horse…</option>
              {horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="eyebrow block mb-1.5">Record title</label>
            <input
              className="lux-input"
              placeholder="E.g. Spring vaccinations · West Nile & EEE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              id="health-title"
            />
          </div>

          {/* Professional */}
          <div>
            <label className="eyebrow block mb-1.5 flex items-center gap-1.5"><User className="h-3 w-3"/> Veterinarian / Professional (CRM)</label>
            <select
              className="lux-select"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              id="health-professional"
            >
              <option value="">Select a professional from CRM…</option>
              {contacts.filter(c => c.type === 'vet' || c.type === 'farrier').map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="eyebrow block mb-1.5">Date</label>
            <input
              type="date"
              className="lux-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              id="health-date"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="eyebrow block mb-1.5">Diagnosis</label>
            <textarea
              className="lux-input resize-none"
              rows={2}
              placeholder="Diagnosis details…"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              id="health-diagnosis"
            />
          </div>

          {/* Prescription */}
          <div>
            <label className="eyebrow block mb-1.5">Prescription</label>
            <textarea
              className="lux-input resize-none"
              rows={2}
              placeholder="Prescribed medications and instructions…"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              id="health-prescription"
            />
          </div>

          {/* Dose + Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Dose</label>
              <input
                className="lux-input"
                placeholder="E.g. 10ml, 500mg"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                id="health-dose"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Frequency</label>
              <select
                className="lux-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                id="health-frequency"
              >
                <option value="">Select frequency…</option>
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pharmaceutical Product */}
          <div>
            <label className="eyebrow block mb-1.5">Pharmaceutical product</label>
            <select
              className="lux-select"
              value={productUsed}
              onChange={(e) => {
                setProductUsed(e.target.value);
                if (!e.target.value) setProductQuantity("");
              }}
              id="health-product"
            >
              <option value="">None — no product used</option>
              {pharmaceuticals.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} — {p.stock_quantity ?? 0} {p.unit} in stock
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Used — only when product selected */}
          {productUsed && (
            <div>
              <label className="eyebrow block mb-1.5">
                Quantity used{selectedProduct ? ` (${selectedProduct.unit})` : ""}
              </label>
              <input
                type="number"
                className="lux-input"
                placeholder="0"
                min={0}
                value={productQuantity}
                onChange={(e) =>
                  setProductQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
                id="health-product-qty"
              />
            </div>
          )}

          {/* Cost */}
          <div>
            <label className="eyebrow block mb-1.5">Cost</label>
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
                value={cost}
                onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                id="health-cost"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="eyebrow block mb-2">Recurrence</label>
            <div className="flex flex-wrap gap-2">
              {recurrenceOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecurrence(value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    recurrence === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {nextDue && (
              <p className="text-xs text-muted-foreground mt-2">
                Next due: <span className="text-foreground font-medium">{nextDue}</span>
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="eyebrow block mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    status === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              className="lux-input resize-none"
              rows={3}
              placeholder="Findings, treatments, follow-up instructions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="health-notes"
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
              id="health-submit"
              disabled={createRecord.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {createRecord.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save record"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

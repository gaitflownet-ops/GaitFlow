import { useState } from "react";
import { Modal } from "./Modal";
import { useApp } from "@/lib/store";
import { useHorses } from "@/lib/hooks/useHorses";
import { useCreateHealthRecord } from "@/lib/hooks/useHealth";
import { Check, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHorseId?: string;
};

type RecordType = "vaccination" | "vet" | "farrier" | "dental" | "coggins" | "xray";

const types: { value: RecordType; label: string }[] = [
  { value: "vaccination", label: "Vaccination" },
  { value: "vet", label: "Vet Visit" },
  { value: "farrier", label: "Farrier" },
  { value: "dental", label: "Dental" },
  { value: "coggins", label: "Coggins" },
  { value: "xray", label: "X-Ray" },
];

export function AddHealthRecordModal({ open, onOpenChange, defaultHorseId }: Props) {
  const { state } = useApp();
  const { data: horses = [] } = useHorses();
  const createRecord = useCreateHealthRecord();

  const [type, setType] = useState<RecordType>("vet");
  const [horseId, setHorseId] = useState(defaultHorseId ?? "");
  const [title, setTitle] = useState("");
  const [professional, setProfessional] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [done, setDone] = useState(false);

  const reset = () => {
    setType("vet");
    setHorseId(defaultHorseId ?? "");
    setTitle("");
    setProfessional("");
    setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
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

    await createRecord.mutateAsync({
      horse_id: targetHorseId,
      horse_name: horse?.name ?? "Unknown",
      type,
      title,
      notes,
      professional,
      date,
      status: "completed",
    });

    setDone(true);
    setTimeout(() => handleClose(), 1400);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add health record">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Record saved</p>
          <p className="text-muted-foreground text-sm">Health record added to the horse profile.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Type */}
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
            <label className="eyebrow block mb-1.5">Veterinarian / Professional</label>
            <input
              className="lux-input"
              placeholder="E.g. Dr. Anika Patel"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              id="health-professional"
            />
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

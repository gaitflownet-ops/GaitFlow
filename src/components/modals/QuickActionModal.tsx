import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import { useCreateUpdate } from "@/lib/hooks/useUpdates";
import { useApp } from "@/lib/store";
import {
  Camera,
  Video,
  Trophy,
  HeartPulse,
  PenLine,
  Wrench,
  BellPlus,
  Check,
  Loader2,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ActionType =
  | "photo"
  | "video"
  | "competition"
  | "health"
  | "training"
  | "service"
  | "reminder";

const actionConfig: {
  key: ActionType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}[] = [
  {
    key: "photo",
    label: "Upload Photo",
    icon: Camera,
    description: "Add a photo to horse profile",
    color: "text-bronze",
  },
  {
    key: "video",
    label: "Upload Video",
    icon: Video,
    description: "Share a training or competition video",
    color: "text-leather",
  },
  {
    key: "competition",
    label: "Add Competition",
    icon: Trophy,
    description: "Log a result or placing",
    color: "text-[var(--gold)]",
  },
  {
    key: "health",
    label: "Add Health Record",
    icon: HeartPulse,
    description: "Vaccination, vet visit, farrier",
    color: "text-destructive",
  },
  {
    key: "training",
    label: "Add Training Note",
    icon: PenLine,
    description: "Log a session or observation",
    color: "text-primary",
  },
  {
    key: "service",
    label: "Add Service",
    icon: Wrench,
    description: "Farrier, dentist, grooming",
    color: "text-[var(--leather)]",
  },
  {
    key: "reminder",
    label: "Add Reminder",
    icon: BellPlus,
    description: "Schedule a future task",
    color: "text-[var(--bronze)]",
  },
];

export function QuickActionModal({ open, onClose }: Props) {
  const { state } = useApp();
  const { data: horses = [] } = useHorses();
  const createUpdate = useCreateUpdate();

  const [step, setStep] = useState<"select" | "form">("select");
  const [selected, setSelected] = useState<ActionType | null>(null);
  const [horseId, setHorseId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setStep("select");
    setSelected(null);
    setHorseId("");
    setTitle("");
    setBody("");
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelect = (key: ActionType) => {
    setSelected(key);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetHorseId = horseId || horses[0]?.id;
    if (!targetHorseId || !title) return;

    const typeMap: Record<ActionType, string> = {
      photo: "media",
      video: "media",
      competition: "competition",
      health: "health",
      training: "training",
      service: "farrier",
      reminder: "note",
    };

    await createUpdate.mutateAsync({
      horse_id: targetHorseId,
      type: typeMap[selected!],
      title,
      body,
      by: state.user?.name ?? "Marisol Vega",
      at: new Date().toISOString(),
    });

    setDone(true);
    setTimeout(() => {
      handleClose();
    }, 1400);
  };

  const cfg = selected ? actionConfig.find((a) => a.key === selected) : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === "select" ? "Quick action" : (cfg?.label ?? "New entry")}
    >
      {done ? (
        <div className="p-10 flex flex-col items-center justify-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl text-center">Added successfully</p>
          <p className="text-muted-foreground text-sm text-center">
            Your update is now visible on the timeline.
          </p>
        </div>
      ) : step === "select" ? (
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actionConfig.map(({ key, label, icon: Icon, description, color }) => (
              <button
                key={key}
                id={`quick-action-${key}`}
                onClick={() => handleSelect(key)}
                className="lux-card p-4 text-left flex items-start gap-3 hover:-translate-y-0.5"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary ${color}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-[14px] font-medium">{label}</span>
                  <span className="block text-[12px] text-muted-foreground mt-0.5">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
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
          <div>
            <label className="eyebrow block mb-1.5">Title</label>
            <input
              className="lux-input"
              placeholder={cfg?.description ?? "Enter a title…"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              id="quick-action-title"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              className="lux-input resize-none"
              rows={3}
              placeholder="Add any relevant details…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              id="quick-action-notes"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              id="quick-action-submit"
              disabled={createUpdate.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {createUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

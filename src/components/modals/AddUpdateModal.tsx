import { useState } from "react";
import { Modal } from "./Modal";
import { horses } from "@/lib/data";
import { useApp } from "@/lib/store";
import { Trophy, HeartPulse, PenLine, Wrench, Video, Camera, TrendingUp, Check } from "lucide-react";

type UpdateType = "competition" | "training" | "health" | "note" | "farrier" | "media";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultHorseId?: string;
  defaultType?: UpdateType;
};

const typeOptions: { value: UpdateType; label: string; icon: React.ElementType }[] = [
  { value: "competition", label: "Competition", icon: Trophy },
  { value: "training", label: "Training", icon: TrendingUp },
  { value: "health", label: "Health", icon: HeartPulse },
  { value: "note", label: "Note", icon: PenLine },
  { value: "farrier", label: "Service", icon: Wrench },
  { value: "media", label: "Media", icon: Video },
];

export function AddUpdateModal({ open, onClose, defaultHorseId, defaultType }: Props) {
  const { dispatch } = useApp();
  const [type, setType] = useState<UpdateType>(defaultType ?? "training");
  const [horseId, setHorseId] = useState(defaultHorseId ?? horses[0].id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setType(defaultType ?? "training");
    setHorseId(defaultHorseId ?? horses[0].id);
    setTitle("");
    setBody("");
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    dispatch({
      type: "ADD_UPDATE",
      update: {
        id: `u${Date.now()}`,
        horseId,
        type,
        title,
        body,
        at: "Just now",
        by: "Marisol Vega",
        likes: 0,
        comments: 0,
      },
    });
    setDone(true);
    setTimeout(() => handleClose(), 1400);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add update">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Update posted</p>
          <p className="text-muted-foreground text-sm">Visible on the timeline now.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Type selector */}
          <div>
            <label className="eyebrow block mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  id={`update-type-${value}`}
                  onClick={() => setType(value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    type === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
              {horses.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="eyebrow block mb-1.5">Title</label>
            <input
              className="lux-input"
              placeholder="E.g. Worked 5f in 1:01 · Clean round at 1.40m"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              id="update-title"
            />
          </div>

          {/* Body */}
          <div>
            <label className="eyebrow block mb-1.5">Details</label>
            <textarea
              className="lux-input resize-none"
              rows={4}
              placeholder="Add relevant notes, observations or results…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              id="update-body"
            />
          </div>

          {/* Media placeholder */}
          <div>
            <label className="eyebrow block mb-1.5">Media (optional)</label>
            <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Drop photo or video here</span>
            </div>
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
              id="update-submit"
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95"
            >
              Post update
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

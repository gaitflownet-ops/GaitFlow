import { Modal } from "./Modal";
import type { Competition } from "@/lib/data";
import { horseById } from "@/lib/data";
import { Trophy, MapPin, Calendar, User, DollarSign, Users, Share2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  competition: Competition | null;
};

export function CompetitionDetailModal({ open, onClose, competition: c }: Props) {
  if (!c) return null;
  const horse = horseById(c.horseId);

  const isWin = c.placement === "1st" || c.placement === "Champion";

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Header hero */}
      <div
        className={`relative overflow-hidden rounded-t-[calc(var(--radius-3xl)-1px)] p-8 ${
          isWin
            ? "bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)]"
            : "bg-gradient-to-br from-secondary to-muted"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow !text-primary-foreground/60">{c.date} · {c.location}</div>
            <h2 className={`font-display text-3xl mt-2 leading-tight ${isWin ? "text-primary-foreground" : "text-foreground"}`}>
              {c.event}
            </h2>
            <p className={`mt-1 text-sm ${isWin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {c.category}
            </p>
          </div>
          <div
            className={`grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl ${
              isWin
                ? "bg-[var(--gradient-gold)] text-charcoal"
                : "bg-card/20 text-foreground"
            }`}
            style={{ background: isWin ? "var(--gradient-gold)" : undefined }}
          >
            {c.placement.slice(0, 3)}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { k: "Placement", v: c.placement },
            { k: "Prize", v: c.prize },
            { k: "Category", v: c.category.split(" ")[0] },
          ].map((s) => (
            <div key={s.k} className={`rounded-xl p-3 ${isWin ? "bg-white/10" : "bg-card/60"}`}>
              <div className={`text-[10px] tracking-widest uppercase ${isWin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {s.k}
              </div>
              <div className={`font-display text-xl mt-0.5 ${isWin ? "text-primary-foreground" : "text-foreground"}`}>
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-7 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: User, k: "Horse", v: horse?.name ?? c.horseId },
            { icon: User, k: "Rider", v: c.rider },
            { icon: MapPin, k: "Location", v: c.location },
            { icon: Calendar, k: "Date", v: c.date },
            { icon: DollarSign, k: "Prize money", v: c.prize },
            { icon: Trophy, k: "Discipline", v: c.category },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="eyebrow">{k}</div>
                <div className="text-[14px] font-medium mt-0.5">{v}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {c.notes && (
          <div className="lux-card p-5">
            <div className="eyebrow mb-2">Competition notes</div>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{c.notes}</p>
          </div>
        )}

        {/* Judges */}
        {c.judges && c.judges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="eyebrow">Judges</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.judges.map((j) => (
                <span key={j} className="rounded-full bg-secondary px-3 py-1 text-[12px]">
                  {j}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 hairline">
          <button
            id="competition-share-btn"
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
            Share result
          </button>
          <button
            id="competition-close-btn"
            onClick={onClose}
            className="ml-auto rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

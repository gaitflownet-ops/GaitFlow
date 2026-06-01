import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";

type MediaItem = {
  src: string;
  caption?: string;
  type?: "image" | "video";
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: MediaItem[];
  index: number;
  onIndexChange: (i: number) => void;
};

export function LightboxModal({ open, onClose, items, index, onIndexChange }: Props) {
  const item = items[index];

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onIndexChange(Math.min(items.length - 1, index + 1));
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, index, items.length, onClose, onIndexChange]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[oklch(0.1_0.01_60/0.97)] animate-fade-up"
      style={{ animationDuration: "180ms" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <span className="text-[13px] text-white/50">
          {index + 1} / {items.length}
        </span>
        <button
          id="lightbox-close-btn"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-16 relative min-h-0">
        {/* Prev */}
        {index > 0 && (
          <button
            id="lightbox-prev"
            onClick={() => onIndexChange(index - 1)}
            className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="relative max-h-full max-w-full">
          <img
            src={item.src}
            alt={item.caption ?? ""}
            className="max-h-[72dvh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          {item.type === "video" && (
            <button
              id="lightbox-play"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 shadow-xl">
                <Play className="h-8 w-8 text-[oklch(0.18_0.018_60)] ml-1" />
              </span>
            </button>
          )}
        </div>

        {/* Next */}
        {index < items.length - 1 && (
          <button
            id="lightbox-next"
            onClick={() => onIndexChange(index + 1)}
            className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Caption */}
      {item.caption && (
        <div className="shrink-0 px-6 py-5 text-center">
          <p className="text-[14px] text-white/70">{item.caption}</p>
        </div>
      )}

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="shrink-0 flex gap-2 justify-center px-6 pb-6">
          {items.map((it, i) => (
            <button
              key={i}
              id={`lightbox-thumb-${i}`}
              onClick={() => onIndexChange(i)}
              className={`h-12 w-12 overflow-hidden rounded-lg transition-all ${
                i === index
                  ? "ring-2 ring-[var(--gold)] opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              <img src={it.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

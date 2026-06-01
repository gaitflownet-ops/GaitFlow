import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "default" | "lg" | "xl";
};

export function Modal({ open, onClose, title, children, size = "default" }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "xl"
      ? "modal-content modal-content-xl"
      : size === "lg"
        ? "modal-content modal-content-lg"
        : "modal-content";

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-panel" ref={panelRef}>
        <div className={sizeClass} onClick={(e) => e.stopPropagation()}>
          {title && (
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border">
              <h2 className="font-display text-2xl">{title}</h2>
              <button
                onClick={onClose}
                id="modal-close-btn"
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

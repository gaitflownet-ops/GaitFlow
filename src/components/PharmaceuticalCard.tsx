import { Package, Edit2, Trash2, Plus, AlertTriangle } from "lucide-react";
import type { Pharmaceutical } from "@/lib/hooks/usePharmaceuticals";

type Props = {
  item: Pharmaceutical;
  onEdit?: (item: Pharmaceutical) => void;
  onDelete?: (id: string) => void;
  onRestock?: (item: Pharmaceutical) => void;
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  vaccine: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  dewormer: { bg: "bg-teal-500/15", text: "text-teal-400" },
  antibiotic: { bg: "bg-sky-500/15", text: "text-sky-400" },
  "anti-inflammatory": { bg: "bg-amber-500/15", text: "text-amber-400" },
  supplement: { bg: "bg-purple-500/15", text: "text-purple-400" },
  topical: { bg: "bg-pink-500/15", text: "text-pink-400" },
  other: { bg: "bg-slate-500/15", text: "text-slate-400" },
};

export function PharmaceuticalCard({ item, onEdit, onDelete, onRestock }: Props) {
  const stock = item.stock_quantity ?? 0;
  const minAlert = item.min_stock_alert ?? 5;
  const isLowStock = stock <= minAlert;
  const stockPercent = minAlert > 0 ? Math.min(100, (stock / (minAlert * 4)) * 100) : 100;

  const colors = categoryColors[item.category ?? "other"] || categoryColors.other;

  // Expiry check
  const daysToExpiry = item.expiry_date
    ? Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30;
  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;

  return (
    <div className="lux-card p-4 group relative hover:ring-1 hover:ring-primary/20 transition-all">
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onRestock && (
          <button
            onClick={() => onRestock(item)}
            className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            title="Restock"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors.bg} shrink-0`}>
          <Package className={`h-[18px] w-[18px] ${colors.text}`} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-[15px] leading-tight truncate">{item.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${colors.bg} ${colors.text}`}
            >
              {item.category}
            </span>
            {item.manufacturer && (
              <span className="text-[11px] text-muted-foreground truncate">
                {item.manufacturer}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stock bar */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">
            Stock: <span className="font-semibold text-foreground">{stock}</span> {item.unit}
          </span>
          {isLowStock && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Low Stock
            </span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stockPercent}%`,
              backgroundColor: isLowStock
                ? stock === 0
                  ? "#ef4444"
                  : "#f59e0b"
                : "#22c55e",
            }}
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          ${(item.cost_per_unit ?? 0).toFixed(2)}/{item.unit}
        </span>
        {item.expiry_date && (
          <span
            className={`flex items-center gap-1 ${
              isExpired
                ? "text-red-400 font-semibold"
                : isExpiringSoon
                  ? "text-amber-400 font-medium"
                  : ""
            }`}
          >
            {isExpired ? "Expired" : isExpiringSoon ? "Expires soon" : ""}
            {item.expiry_date && ` ${new Date(item.expiry_date).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`}
          </span>
        )}
      </div>
    </div>
  );
}

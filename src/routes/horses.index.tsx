import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { HorseCard } from "@/components/HorseCard";
import { horses } from "@/lib/data";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AddUpdateModal } from "@/components/modals/AddUpdateModal";

export const Route = createFileRoute("/horses/")({
  head: () => ({
    meta: [
      { title: "The Barn — EquiSales" },
      { name: "description", content: "All horses in your stable, beautifully organised." },
    ],
  }),
  component: Horses,
});

type StatusFilter = "all" | "Competing" | "In Training" | "Resting" | "Breeding";

const statusFilters: StatusFilter[] = ["all", "Competing", "In Training", "Resting", "Breeding"];

function Horses() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = filter === "all" ? horses : horses.filter((h) => h.status === filter);

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">EquiSales</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">The barn</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            {horses.length} horses · all beautifully captured
          </p>
        </div>
        <button
          id="add-horse-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add horse
        </button>
      </div>

      {/* Status filters */}
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f}
            id={`horse-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All horses" : f}
            {f !== "all" && (
              <span className="ml-1.5 opacity-60">
                ({horses.filter((h) => h.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((h) => (
          <HorseCard key={h.id} horse={h} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-20 text-center">
          <p className="font-display text-2xl text-muted-foreground">No horses in this category</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Show all horses
          </button>
        </div>
      )}

      <AddUpdateModal open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

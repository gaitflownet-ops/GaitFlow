import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { useDeleteHorse, useHorses, type Horse } from "@/lib/hooks/useHorses";
import { useState } from "react";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { AddHorseModal } from "@/components/modals/AddHorseModal";

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
  const { data: horses = [], isLoading, isError, error, refetch } = useHorses();
  const deleteHorse = useDeleteHorse();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [mutationError, setMutationError] = useState("");

  const filtered = filter === "all" ? horses : horses.filter((h) => h.status === filter);

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">EquiSales</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">The barn</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            {isLoading ? "..." : horses.length} horses · all beautifully captured
          </p>
        </div>
        <button
          id="add-horse-btn"
          onClick={() => {
            setEditingHorse(null);
            setAddOpen(true);
          }}
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
      {mutationError && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
          <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
          <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
        </div>
      ) : isError ? (
        <div className="mt-8 lux-card p-8 flex items-start gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">Could not load horses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Check your Supabase policies and try again."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((h) => (
            <div key={h.id} className="relative group/card">
              <div className="absolute right-4 top-4 z-20 flex gap-2 opacity-0 transition-opacity group-hover/card:opacity-100">
                <button
                  id={`edit-horse-${h.id}`}
                  onClick={() => {
                    setEditingHorse(h);
                    setAddOpen(true);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                  aria-label={`Edit ${h.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  id={`delete-horse-${h.id}`}
                  onClick={async () => {
                    setMutationError("");
                    const confirmed = window.confirm(`Delete ${h.name}?`);
                    if (!confirmed) return;

                    try {
                      await deleteHorse.mutateAsync(h.id);
                    } catch (err) {
                      setMutationError(
                        err instanceof Error
                          ? err.message
                          : "Could not delete this horse. Check related records.",
                      );
                    }
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-destructive shadow hover:bg-background"
                  aria-label={`Delete ${h.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <HorseCard horse={h} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
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

      <AddHorseModal
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditingHorse(null);
        }}
        horse={editingHorse}
      />

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

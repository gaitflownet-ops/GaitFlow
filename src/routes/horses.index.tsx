import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { useHorses } from "@/lib/hooks/useHorses";
import { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { AddHorseModal } from "@/components/modals/AddHorseModal";
import { useGroups, useSubgroups } from "@/lib/hooks/useGroups";
import { getStatusLabel } from "@/lib/utils";

export const Route = createFileRoute("/horses/")({
  head: () => ({
    meta: [
      { title: "Ejemplares — GaitFlow" },
      { name: "description", content: "Todos los ejemplares de tu criadero, bellamente organizados." },
    ],
  }),
  component: Horses,
});

type StatusFilter = "all" | "En Adiestramiento" | "En Competencia" | "En Descanso" | "En Reproducción";

const statusFilters: StatusFilter[] = ["all", "En Adiestramiento", "En Competencia", "En Descanso", "En Reproducción"];

function Horses() {
  const { data: horses = [], isLoading, isError, error, refetch } = useHorses();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>("all");

  const { data: groups = [] } = useGroups();
  const { data: subgroups = [] } = useSubgroups(selectedGroup === "all" ? "" : selectedGroup);

  const filtered = horses.filter((h) => {
    if (filter !== "all" && getStatusLabel(h.status) !== filter) return false;
    if (selectedGroup !== "all" && h.group_id !== selectedGroup) return false;
    if (selectedSubgroup !== "all" && h.subgroup_id !== selectedSubgroup) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">GaitFlow</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Ejemplares</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            {isLoading ? "..." : horses.length} ejemplares · en tu criadero
          </p>
        </div>
        <button
          id="add-horse-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Registrar Ejemplar
        </button>
      </div>

      {/* Filters bar */}
      <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
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
              {f === "all" ? "Todos los Ejemplares" : f}
              {f !== "all" && (
                <span className="ml-1.5 opacity-60">
                  ({horses.filter((h) => getStatusLabel(h.status) === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Group and Subgroup dropdown filters */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-secondary/30 p-2 lg:p-1.5 rounded-2xl lg:rounded-full border border-border/50">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Grupo:</span>
            <select
              className="lux-select text-xs py-1 px-3.5 rounded-full bg-background border-border/60 hover:border-primary/50 transition-colors focus:ring-1 focus:ring-primary"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedSubgroup("all");
              }}
            >
              <option value="all">Todos los Grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {selectedGroup !== "all" && (
            <div className="flex items-center gap-2 px-2 border-l border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Subgrupo:</span>
              <select
                className="lux-select text-xs py-1 px-3.5 rounded-full bg-background border-border/60 hover:border-primary/50 transition-colors focus:ring-1 focus:ring-primary"
                value={selectedSubgroup}
                onChange={(e) => setSelectedSubgroup(e.target.value)}
              >
                <option value="all">Todos los Subgrupos</option>
                {subgroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
          <div className="h-[320px] bg-secondary rounded-[1.5rem]"></div>
        </div>
      ) : isError ? (
        <div className="mt-8 lux-card p-8 flex items-start gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">No se pudieron cargar los ejemplares</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Verifica tus políticas de Supabase y vuelve a intentar."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((h) => (
            <HorseCard key={h.id} horse={h} />
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="mt-20 text-center">
          <p className="font-display text-2xl text-muted-foreground">No hay ejemplares en esta categoría</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Mostrar todos
          </button>
        </div>
      )}

      <AddHorseModal open={addOpen} onOpenChange={setAddOpen} />

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { competitions, horseById } from "@/lib/data";
import { useState } from "react";
import { Trophy, Plus, ChevronRight } from "lucide-react";
import { CompetitionDetailModal } from "@/components/modals/CompetitionDetailModal";
import type { Competition } from "@/lib/data";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions — EquiSales" },
      { name: "description", content: "A championship-grade record of every result." },
    ],
  }),
  component: Competitions,
});

function Competitions() {
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);

  const wins = competitions.filter(
    (c) => c.placement === "1st" || c.placement === "Champion",
  ).length;
  const earnings = competitions.reduce(
    (sum, c) => sum + parseInt(c.prize.replace(/\D/g, ""), 10),
    0,
  );

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Season 2026</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Competition history</h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
            Every start, every placing, every prize — captured to grow the value of each horse.
          </p>
        </div>
        <button
          id="log-competition-btn"
          className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Log result
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "Starts", v: competitions.length },
          { k: "Wins & Championships", v: wins },
          { k: "Top 3 finishes", v: competitions.length },
          { k: "Total earnings", v: `$${earnings.toLocaleString()}` },
        ].map((s) => (
          <div key={s.k} className="lux-card p-5">
            <div className="eyebrow">{s.k}</div>
            <div className="font-display text-3xl mt-2">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-10 lux-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl">All results</h2>
          <span className="text-[12px] text-muted-foreground">Click any row to expand</span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_1fr_1fr_120px_32px] gap-x-6 px-6 py-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground border-b border-border">
          <span>Result</span>
          <span>Event</span>
          <span className="hidden md:block">Horse · Rider</span>
          <span className="hidden md:block">Category</span>
          <span className="text-right">Prize</span>
          <span className="hidden md:block" />
        </div>
        {competitions.map((c) => {
          const h = horseById(c.horseId);
          const isWin = c.placement === "1st" || c.placement === "Champion";
          return (
            <button
              key={c.id}
              id={`comp-row-${c.id}`}
              onClick={() => setSelectedComp(c)}
              className="w-full text-left grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_1fr_1fr_120px_32px] gap-x-6 items-center px-6 py-5 border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Trophy className={`h-4 w-4 ${isWin ? "text-[var(--gold)]" : "text-muted-foreground"}`} />
                <span className={`font-display text-lg ${isWin ? "gold-text" : ""}`}>{c.placement}</span>
              </div>
              <div className="min-w-0">
                <div className="font-display text-[17px] leading-tight">{c.event}</div>
                <div className="text-[12px] text-muted-foreground">
                  {c.date} · {c.location}
                </div>
              </div>
              <div className="hidden md:block text-[13px]">
                <div className="font-medium">{h?.name}</div>
                <div className="text-muted-foreground text-[12px]">{c.rider}</div>
              </div>
              <div className="hidden md:block text-[13px] text-muted-foreground">{c.category}</div>
              <div className="text-right font-display text-lg">{c.prize}</div>
              <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      <CompetitionDetailModal
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        competition={selectedComp}
      />

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

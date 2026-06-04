import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GestationProbability } from "@/components/hw/HWWidgets";
import { Plus, Calendar, Dna, Baby as BabyIcon } from "lucide-react";

export const Route = createFileRoute("/breeding")({
  head: () => ({
    meta: [
      { title: "Breeding — GateFlow" },
      { name: "description", content: "Mares, stallions, inseminations and foal tracking." },
    ],
  }),
  component: BreedingPage,
});

const mares = [
  { name: "Madeira", stallion: "Vega del Sol", date: "Feb 14", probability: 78, status: "Confirmed in foal" },
  { name: "Lyra", stallion: "Northern Flame", date: "Feb 22", probability: 62, status: "Cycle 2 · monitoring" },
  { name: "Aurelia", stallion: "Royal Cadence", date: "Mar 02", probability: 41, status: "Cycle 1 · early" },
];

const genetics = [
  { code: "VDS-2025-014", donor: "Vega del Sol", type: "Frozen semen", straws: 22, expires: "2032" },
  { code: "NFL-2025-008", donor: "Northern Flame", type: "Fresh — cooled", straws: 6, expires: "2026" },
  { code: "RCD-2024-031", donor: "Royal Cadence", type: "Frozen embryo", straws: 4, expires: "2034" },
];

function BreedingPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section I · Breeding & Gestation</div>
          <h1 className="font-display text-4xl mt-1">Breeding program</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Insemination registry, cycle tracking and genetic inventory with
            Holt-Winters reproductive success forecasting.
          </p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Register insemination
        </button>
      </div>

      {/* HW-2 probabilities per active cycle */}
      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Active cycles — success probability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mares.map((m) => (
            <div key={m.name} className="space-y-3">
              <div className="lux-card p-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                  <BabyIcon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-display text-lg">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    × {m.stallion} · {m.date}
                  </div>
                </div>
              </div>
              <GestationProbability probability={m.probability} />
              <div className="text-[12px] text-muted-foreground px-2">{m.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Genetic inventory I.2 */}
      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Genetic inventory (I.2)</h2>
        <div className="lux-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] tracking-widest uppercase">
              <tr>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Donor</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-right px-5 py-3">Straws / Units</th>
                <th className="text-left px-5 py-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {genetics.map((g) => (
                <tr key={g.code} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-4 font-mono text-[12px]">{g.code}</td>
                  <td className="px-5 py-4 font-medium">{g.donor}</td>
                  <td className="px-5 py-4 text-muted-foreground inline-flex items-center gap-2">
                    <Dna className="h-4 w-4 text-[var(--bronze)]" /> {g.type}
                  </td>
                  <td className="px-5 py-4 text-right font-display text-lg">{g.straws}</td>
                  <td className="px-5 py-4 text-muted-foreground inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {g.expires}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FeedRestockAlert } from "@/components/hw/HWWidgets";
import { Leaf, Plus, Wheat, Droplet } from "lucide-react";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — GaitFlow" },
      { name: "description", content: "Personalized rations, supplements and feed inventory." },
    ],
  }),
  component: NutritionPage,
});

const rations = [
  { horse: "Northern Flame", program: "Performance — 6kg Pavo Sport + 1.2kg alfalfa", feedings: 3 },
  { horse: "Silver Aria", program: "Maintenance — 4kg coastal + balancer", feedings: 2 },
  { horse: "Royal Cadence", program: "Senior — soaked mash 2x, joint supplement", feedings: 3 },
  { horse: "Madeira", program: "Broodmare — alfalfa blend + mineral pack", feedings: 3 },
];

const inventory = [
  { product: "Pavo Sport Performance", days: 6, note: "Avg 12 bags / month" },
  { product: "Coastal Bermuda hay", days: 22, note: "Round bales × 4" },
  { product: "Alfalfa cubes", days: 14, note: "8 bags remaining" },
];

function NutritionPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section E · Nutrition & Wellness</div>
          <h1 className="font-display text-4xl mt-1">Personalized equine nutrition</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Rations, supplements, water tracking and feed inventory — predictive restock powered by
            Holt-Winters.
          </p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New ration plan
        </button>
      </div>

      {/* HW-4 alerts */}
      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Predictive restock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {inventory.map((i) => (
            <FeedRestockAlert
              key={i.product}
              product={i.product}
              daysRemaining={i.days}
              projectedConsumption={i.note}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Active ration plans</h2>
        <div className="lux-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] tracking-widest uppercase">
              <tr>
                <th className="text-left px-5 py-3">Horse</th>
                <th className="text-left px-5 py-3">Program</th>
                <th className="text-left px-5 py-3">Feedings / day</th>
                <th className="text-left px-5 py-3">Water</th>
              </tr>
            </thead>
            <tbody>
              {rations.map((r) => (
                <tr key={r.horse} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{r.horse}</td>
                  <td className="px-5 py-4 text-muted-foreground inline-flex items-center gap-2">
                    <Wheat className="h-4 w-4 text-[var(--bronze)]" /> {r.program}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-emerald-600" /> {r.feedings}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Droplet className="h-3.5 w-3.5 text-sky-500" /> Auto-trough
                    </span>
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

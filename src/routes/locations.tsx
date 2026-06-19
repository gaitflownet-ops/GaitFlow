import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MapPin, Home, Users, Plus } from "lucide-react";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations & Teams — GaitFlow" },
      { name: "description", content: "Stalls, paddocks and team coverage." },
    ],
  }),
  component: LocationsPage,
});

const farms = [
  {
    name: "Live Oak Stables",
    address: "12450 NW 70th Ave, Ocala FL",
    stalls: 32,
    occupied: 28,
    teams: ["Day shift", "Night shift"],
  },
  {
    name: "Magnolia Training Center",
    address: "8801 SW 60th, Ocala FL",
    stalls: 18,
    occupied: 14,
    teams: ["Sport horses"],
  },
  {
    name: "Sienna Broodmare Farm",
    address: "5200 W Hwy 326, Ocala FL",
    stalls: 24,
    occupied: 21,
    teams: ["Foaling crew"],
  },
];

function LocationsPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section F · Locations & Teams</div>
          <h1 className="font-display text-4xl mt-1">Where every horse lives</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Stall-by-stall occupancy across farms, with crew shifts and daily coverage logs.
          </p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {farms.map((f) => {
          const pct = Math.round((f.occupied / f.stalls) * 100);
          return (
            <div key={f.name} className="lux-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Ocala
                  </div>
                  <h3 className="font-display text-xl mt-1">{f.name}</h3>
                  <p className="text-[12px] text-muted-foreground mt-1">{f.address}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                  <Home className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-5">
                <div className="flex items-baseline justify-between text-[12px] text-muted-foreground">
                  <span>Occupancy</span>
                  <span className="font-medium text-foreground">
                    {f.occupied}/{f.stalls} stalls
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--forest)] to-[var(--bronze)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {f.teams.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] bg-secondary px-2.5 py-1 rounded-full"
                  >
                    <Users className="h-3 w-3" /> {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stall grid mock */}
      <section>
        <h2 className="font-display text-2xl mb-4">Live Oak — Stall map</h2>
        <div className="lux-card p-6">
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 32 }).map((_, i) => {
              const occupied = i % 6 !== 0;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border text-[10px] grid place-items-center font-mono ${
                    occupied
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}
                >
                  A{i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { team } from "@/lib/data";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — Paddock" },
      { name: "description", content: "Owners, trainers, vets and farriers in one elegant place." },
    ],
  }),
  component: Team,
});

function Team() {
  return (
    <AppShell>
      <div className="eyebrow">Collaboration</div>
      <h1 className="font-display text-4xl lg:text-5xl mt-2">Your team</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Everyone who cares for the horses — connected to the same calm source of truth.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map((m) => (
          <div key={m.name} className="lux-card p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.36_0.07_50)] text-charcoal font-display text-lg">
                {m.initials}
              </div>
              <div>
                <div className="font-display text-xl leading-tight">{m.name}</div>
                <div className="text-[12px] text-muted-foreground">{m.role}</div>
              </div>
            </div>
            <p className="mt-5 text-[13px] text-muted-foreground leading-relaxed">
              <span className="eyebrow block mb-1">Last activity</span>
              {m.last}
            </p>
            <div className="mt-5 hairline pt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-secondary px-3 py-2 text-[12px] font-medium hover:bg-muted">Message</button>
              <button className="flex-1 rounded-full bg-primary text-primary-foreground px-3 py-2 text-[12px] font-medium">View activity</button>
            </div>
          </div>
        ))}
      </div>

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

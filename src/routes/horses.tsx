import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { horses } from "@/lib/data";

export const Route = createFileRoute("/horses")({
  head: () => ({
    meta: [
      { title: "Your horses — Paddock" },
      { name: "description", content: "Every horse in your barn, beautifully presented." },
    ],
  }),
  component: HorsesList,
});

function HorsesList() {
  return (
    <AppShell>
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">The barn</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Your horses</h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            The center of your operation. Tap any horse to enter their world.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1.5">All · {horses.length}</span>
          <span className="rounded-full px-3 py-1.5">Competing · 1</span>
          <span className="rounded-full px-3 py-1.5">In Training · 1</span>
          <span className="rounded-full px-3 py-1.5">Resting · 1</span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {horses.map((h) => (
          <HorseCard key={h.id} horse={h} />
        ))}
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { Bell, Trophy, Video, HeartPulse, Wrench, BellOff } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — EquiSales" },
      { name: "description", content: "All your EquiSales notifications in one place." },
    ],
  }),
  component: Notifications,
});

type FilterTab = "all" | "wins" | "health" | "media" | "reminders";


const kindIcon = {
  win: Trophy,
  media: Video,
  health: HeartPulse,
  service: Wrench,
  reminder: Bell,
};

const kindColor: Record<string, string> = {
  win: "bg-[var(--gold)]/15 text-[var(--gold)]",
  media: "bg-[var(--bronze)]/15 text-[var(--bronze)]",
  health: "bg-destructive/10 text-destructive",
  service: "bg-[var(--leather)]/15 text-[var(--leather)]",
  reminder: "bg-primary/10 text-primary",
};

const dotColor: Record<string, string> = {
  win: "bg-[var(--gold)]",
  media: "bg-[var(--bronze)]",
  health: "bg-destructive",
  service: "bg-[var(--leather)]",
  reminder: "bg-primary",
};

function Notifications() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = state.notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "wins") return n.kind === "win";
    if (activeFilter === "health") return n.kind === "health";
    if (activeFilter === "media") return n.kind === "media";
    if (activeFilter === "reminders") return n.kind === "reminder" || n.kind === "service";
    return true;
  });

  const unread = state.notifications.filter((n) => !n.read).length;

  const handleClick = (id: string, horseId?: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", id });
    if (horseId) navigate({ to: "/horses/$horseId", params: { horseId } });
  };

  const filterTabs: { value: FilterTab; label: string }[] = [
    { value: "all", label: `All (${state.notifications.length})` },
    { value: "wins", label: "Wins" },
    { value: "health", label: "Health" },
    { value: "media", label: "Media" },
    { value: "reminders", label: "Reminders" },
  ];

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Activity</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Notifications</h1>
        </div>
        {unread > 0 && (
          <button
            id="mark-all-read-page"
            onClick={() => dispatch({ type: "MARK_ALL_READ" })}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read ({unread})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-8 border-b border-border">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {filterTabs.map(({ value, label }) => {
            const active = activeFilter === value;
            return (
              <button
                key={value}
                id={`notif-filter-${value}`}
                onClick={() => setActiveFilter(value)}
                className={`relative px-4 py-3 text-[14px] whitespace-nowrap transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {active && <span className="tab-active-bar" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications list */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
            <BellOff className="h-12 w-12 opacity-30" />
            <p className="font-display text-2xl">No notifications here</p>
          </div>
        ) : (
          <div className="lux-card overflow-hidden divide-y divide-border">
            {filtered.map((n) => {
              const Icon = kindIcon[n.kind] ?? Bell;
              const colorClass = kindColor[n.kind] ?? "bg-primary/10 text-primary";
              const dotClass = dotColor[n.kind] ?? "bg-primary";
              return (
                <button
                  key={n.id}
                  id={`notif-item-${n.id}`}
                  onClick={() => handleClick(n.id, n.horseId)}
                  className={`w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-secondary/40 transition-colors ${!n.read ? "bg-primary/[0.03]" : ""}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] leading-snug ${!n.read ? "font-semibold" : ""}`}>
                      {n.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1.5">{n.at}</p>
                  </div>
                  {!n.read && (
                    <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

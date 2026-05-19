import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Sparkles,
  Trophy,
  HeartPulse,
  Users,
  Bell,
  Search,
  Plus,
  Command,
} from "lucide-react";
import { type ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/horses", label: "Horses", icon: Sparkles },
  { to: "/competitions", label: "Competitions", icon: Trophy },
  { to: "/health", label: "Health & Care", icon: HeartPulse },
  { to: "/team", label: "Team", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
          <div className="px-7 pt-8 pb-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-display text-[15px] font-semibold">
                P
              </div>
              <div className="leading-tight">
                <div className="font-display text-xl tracking-tight">Paddock</div>
                <div className="text-[10px] tracking-[0.22em] uppercase text-sidebar-foreground/60">
                  Ocala · FL
                </div>
              </div>
            </Link>
          </div>

          <nav className="px-4 flex-1 space-y-0.5">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-sidebar-primary" : "opacity-70"}`} />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="m-4 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[13px] font-semibold text-charcoal">
                MV
              </div>
              <div className="leading-tight">
                <div className="text-sm font-medium text-sidebar-accent-foreground">Marisol Vega</div>
                <div className="text-[11px] text-sidebar-foreground/60">Owner · 3 horses</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-6 lg:px-10 h-16">
              <div className="lg:hidden flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground font-display text-[13px]">P</div>
                <span className="font-display text-lg">Paddock</span>
              </div>
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Search horses, people, events…</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                    <Command className="h-3 w-3" /> K
                  </span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95">
                  <Plus className="h-4 w-4" /> Quick action
                </button>
                <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                </button>
              </div>
            </div>
          </header>

          <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1440px] mx-auto">{children}</div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-sidebar text-sidebar-foreground px-2 py-2 shadow-[var(--shadow-lift)]">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`grid place-items-center h-10 w-10 rounded-full ${
                    active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80"
                  }`}
                  aria-label={label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </div>
  );
}

import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  Sparkles,
  Trophy,
  HeartPulse,
  Users,
  Bell,
  Search,
  Plus,
  Settings,
  LogOut,
  ChevronRight,
  ListChecks,
  Leaf,
  MapPin,
  Contact2,
  FolderLock,
  Wallet,
  Baby,
  Store,
} from "lucide-react";
import { type ReactNode, useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { NotificationDropdown } from "./NotificationDropdown";
import { QuickActionModal } from "./modals/QuickActionModal";

type NavItem = { to: string; label: string; icon: typeof LayoutGrid };

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }] },
  {
    label: "Operations",
    items: [
      { to: "/horses", label: "Horses", icon: Sparkles },
      { to: "/health", label: "Health & Care", icon: HeartPulse },
      { to: "/tasks", label: "Tasks", icon: ListChecks },
      { to: "/nutrition", label: "Nutrition", icon: Leaf },
      { to: "/locations", label: "Locations", icon: MapPin },
      { to: "/competitions", label: "Competitions", icon: Trophy },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/crm", label: "CRM", icon: Contact2 },
      { to: "/documents", label: "Documents", icon: FolderLock },
      { to: "/finance", label: "Finance", icon: Wallet },
      { to: "/breeding", label: "Breeding", icon: Baby },
      { to: "/marketplace", label: "Marketplace", icon: Store },
      { to: "/team", label: "Team", icon: Users },
    ],
  },
];

const nav: NavItem[] = navGroups.flatMap((g) => g.items);

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state, dispatch, unreadCount, logout } = useApp();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  // Cmd+K quick action shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({ type: "SET_QUICK_ACTION", open: true });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const user = state.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
          {/* Logo */}
          <div className="px-7 pt-8 pb-10">
            <Link to="/" className="flex items-center gap-2.5" id="sidebar-logo">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-display text-[15px] font-semibold">
                ES
              </div>
              <div className="leading-tight">
                <div className="font-display text-xl tracking-tight">EquiSales</div>
                <div className="text-[10px] tracking-[0.22em] uppercase text-sidebar-foreground/60">
                  Premium Equine Platform
                </div>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="px-4 flex-1 space-y-0.5" aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = (to as string) === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  id={`nav-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${active ? "text-sidebar-primary" : "opacity-70"}`}
                  />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}

            {/* Settings */}
            <Link
              to="/settings"
              id="nav-settings"
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors ${
                path === "/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Settings
                className={`h-[18px] w-[18px] ${path === "/settings" ? "text-sidebar-primary" : "opacity-70"}`}
              />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>

          {/* User card */}
          <div className="m-4 relative" ref={userMenuRef}>
            <button
              id="sidebar-user-menu"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4 text-left hover:bg-sidebar-accent/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[13px] font-semibold text-charcoal shrink-0">
                  {user?.initials ?? "MV"}
                </div>
                <div className="leading-tight flex-1 min-w-0">
                  <div className="text-sm font-medium text-sidebar-accent-foreground truncate">
                    {user?.name ?? "Marisol Vega"}
                  </div>
                  <div className="text-[11px] text-sidebar-foreground/60">
                    {user?.role ?? "Owner"} · {user?.stable_name ?? "Live Oak Stables"}
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-sidebar-foreground/40 transition-transform ${userMenuOpen ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-2xl border border-sidebar-border bg-[oklch(0.26_0.04_155)] shadow-[var(--shadow-modal)] overflow-hidden animate-slide-in-down">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  id="user-menu-settings"
                  className="flex items-center gap-3 px-4 py-3 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <Settings className="h-4 w-4" /> Account settings
                </Link>
                <button
                  onClick={handleLogout}
                  id="user-menu-logout"
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors border-t border-sidebar-border/60"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-6 lg:px-10 h-16">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground font-display text-[11px]">
                  ES
                </div>
                <span className="font-display text-lg">EquiSales</span>
              </div>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <button
                  id="header-search"
                  onClick={() => dispatch({ type: "SET_QUICK_ACTION", open: true })}
                  className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Search horses, people, events…</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 bg-secondary rounded px-1.5 py-0.5">
                    ⌘K
                  </span>
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Quick action */}
                <button
                  id="header-quick-action"
                  onClick={() => dispatch({ type: "SET_QUICK_ACTION", open: true })}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity"
                >
                  <Plus className="h-4 w-4" /> Quick action
                </button>

                {/* Bell */}
                <div className="relative">
                  <button
                    id="header-bell"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setUserMenuOpen(false);
                    }}
                    className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors"
                  >
                    <Bell className="h-[18px] w-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--gold)] pulse-dot" />
                    )}
                  </button>
                  <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1440px] mx-auto">{children}</div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-sidebar text-sidebar-foreground px-2 py-2 shadow-[var(--shadow-lift)]">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = (to as string) === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`grid place-items-center h-10 w-10 rounded-full transition-colors ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  }`}
                  aria-label={label}
                  id={`mobile-nav-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              );
            })}
            {/* Settings in mobile nav */}
            <Link
              to="/settings"
              className={`grid place-items-center h-10 w-10 rounded-full transition-colors ${
                path === "/settings"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              }`}
              aria-label="Settings"
              id="mobile-nav-settings"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          </nav>

          {/* Mobile FAB */}
          <button
            id="mobile-fab"
            onClick={() => dispatch({ type: "SET_QUICK_ACTION", open: true })}
            className="lg:hidden fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] hover:opacity-95 transition-opacity"
          >
            <Plus className="h-6 w-6" />
          </button>
        </main>
      </div>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        open={state.quickActionOpen}
        onClose={() => dispatch({ type: "SET_QUICK_ACTION", open: false })}
      />
    </div>
  );
}

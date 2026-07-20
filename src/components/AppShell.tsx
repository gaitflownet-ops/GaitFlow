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
  MapPin,
  CheckSquare,
  DollarSign,
  Baby,
  Sprout,
  ShoppingBag,
  FolderOpen,
  Contact,
  User,
  Menu,
  X,
} from "lucide-react";
import { type ReactNode, useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "@/lib/store";
import { NotificationDropdown } from "./NotificationDropdown";
import { QuickActionModal } from "./modals/QuickActionModal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useDynamicNotifications } from "@/lib/hooks/useDynamicNotifications";
import { getRoleDefinition } from "@/lib/roles";
import logoUrl from "@/assets/logo.png";

const nav = [
  { to: "/dashboard", label: "Panel Principal", icon: LayoutGrid, module: "dashboard" },
  { to: "/horses", label: "Ejemplares", icon: Sparkles, module: "horses" },
  { to: "/tasks", label: "Labores Diarias", icon: CheckSquare, module: "tasks" },
  { to: "/health", label: "Sanidad", icon: HeartPulse, module: "health" },
  { to: "/nutrition", label: "Alimentación", icon: Sprout, module: "nutrition" },
  { to: "/breeding", label: "Reproducción", icon: Baby, module: "breeding" },
  { to: "/locations", label: "Fincas", icon: MapPin, module: "locations" },
  { to: "/competitions", label: "Ferias / Pistas", icon: Trophy, module: "competitions" },
  { to: "/marketplace", label: "Remates", icon: ShoppingBag, module: "marketplace" },
  { to: "/financials", label: "Centro Financiero", icon: DollarSign, module: "financials" },
  { to: "/crm", label: "CRM", icon: Contact, module: "crm" },
  { to: "/vault", label: "Documentos", icon: FolderOpen, module: "vault" },
  { to: "/team", label: "Equipo", icon: Users, module: "team" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state, dispatch, logout } = useApp();
  const { unreadCount } = useDynamicNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [topbarMenuOpen, setTopbarMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const topbarMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen && !topbarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (topbarMenuRef.current && !topbarMenuRef.current.contains(e.target as Node)) {
        setTopbarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen, topbarMenuOpen]);

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

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const user = state.user;
  const { data: permissions = [] } = usePermissions();
  const roleDef = getRoleDefinition(user?.role || "Propietario");

  // Filtrar navegación por permisos del rol
  const isOwner = user?.role === "Owner" || user?.role === "Propietario";
  const filteredNav = useMemo(() => {
    if (isOwner) return nav;
    return nav.filter(item => {
      const perm = permissions.find(p => p.module === item.module);
      return perm ? perm.can_view : false;
    });
  }, [permissions, isOwner]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
          {/* Logo */}
          <div className="px-7 pt-8 pb-10">
            <Link to={state.isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5" id="sidebar-logo">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-sidebar-primary/20 p-1 shrink-0">
                <img src={logoUrl} alt="GaitFlow Logo" className="h-full w-full object-contain rounded-md" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-xl tracking-tight">GaitFlow</div>
                <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--gold)]">
                  Plataforma Élite CCC
                </div>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="px-4 flex-1 space-y-0.5" aria-label="Navegación principal">
            {filteredNav.map(({ to, label, icon: Icon }) => {
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
              <span className="font-medium">Configuración</span>
            </Link>
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-6 lg:px-10 h-16">
              {/* Mobile logo */}
              <Link to={state.isAuthenticated ? "/dashboard" : "/"} className="lg:hidden flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 p-0.5 shrink-0">
                  <img src={logoUrl} alt="GaitFlow Logo" className="h-full w-full object-contain rounded" />
                </div>
                <span className="font-display text-lg">GaitFlow</span>
              </Link>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <button
                  id="header-search"
                  onClick={() => dispatch({ type: "SET_QUICK_ACTION", open: true })}
                  className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar caballos, personas, eventos…</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 bg-secondary rounded px-1.5 py-0.5">
                    ⌘K
                  </span>
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Mobile Menu Toggle */}
                <button
                  id="header-mobile-menu"
                  onClick={() => {
                    setMobileMenuOpen(!mobileMenuOpen);
                    setNotifOpen(false);
                    setTopbarMenuOpen(false);
                  }}
                  className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors"
                >
                  {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
                </button>

                {/* Quick action */}
                <button
                  id="header-quick-action"
                  onClick={() => dispatch({ type: "SET_QUICK_ACTION", open: true })}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity"
                >
                  <Plus className="h-4 w-4" /> Acción rápida
                </button>

                {/* Bell */}
                <div className="relative">
                  <button
                    id="header-bell"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setTopbarMenuOpen(false);
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

                {/* ── User avatar (topbar) ── */}
                <div className="relative" ref={topbarMenuRef}>
                  <button
                    id="topbar-user-btn"
                    onClick={() => {
                      setTopbarMenuOpen((v) => !v);
                      setNotifOpen(false);
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 rounded-full border border-border bg-card pl-1 pr-3 py-1 hover:bg-secondary transition-colors group"
                    aria-label="User menu"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[oklch(0.18_0.018_60)] font-display text-[13px] font-semibold shrink-0">
                      {user?.initials ?? "GF"}
                    </div>
                    <span className="hidden sm:block text-[13px] font-medium text-foreground max-w-[120px] truncate">
                      {user?.name ?? "Account"}
                    </span>
                    <ChevronRight
                      className={`hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform ${
                        topbarMenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Topbar dropdown */}
                  {topbarMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card shadow-[var(--shadow-modal)] overflow-hidden animate-slide-in-down z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-border/60">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {user?.name ?? "Account"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {user?.role ?? "Propietario"} · {user?.stable_name ?? "GaitFlow"}
                        </p>
                      </div>
                      {/* Links */}
                      <Link
                        to="/profile"
                        onClick={() => setTopbarMenuOpen(false)}
                        id="topbar-profile-link"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Mi Perfil
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setTopbarMenuOpen(false)}
                        id="topbar-settings-link"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Configuración
                      </Link>
                      {/* Divider */}
                      <div className="border-t border-border/60" />
                      <button
                        id="topbar-logout-btn"
                        onClick={() => {
                          setTopbarMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Full Menu Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl animate-in fade-in overflow-y-auto">
              <nav className="flex flex-col p-6 space-y-2">
                {filteredNav.map(({ to, label, icon: Icon }) => {
                  const active = (to as string) === "/" ? path === "/" : path.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground/80 hover:bg-secondary"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-primary" : "opacity-70"}`} />
                      {label}
                    </Link>
                  );
                })}
                <div className="h-px w-full bg-border/60 my-4" />
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] transition-colors ${
                    path === "/settings"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <Settings className={`h-5 w-5 ${path === "/settings" ? "text-primary" : "opacity-70"}`} />
                  Configuración
                </Link>
              </nav>
            </div>
          )}

          <div className="px-6 lg:px-10 py-8 lg:py-10 max-w-[1440px] mx-auto">{children}</div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-sidebar text-sidebar-foreground px-2 py-2 shadow-[var(--shadow-lift)]">
            {nav.slice(0, 5).map(({ to, label, icon: Icon }) => {
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

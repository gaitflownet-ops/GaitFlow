import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Menu, X, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import logoUrl from "@/assets/logo.png";

const NAV_LINKS = [
  { label: "Funciones", href: "/#features" },
  { label: "Planes", href: "/#pricing" },
  { label: "Clientes", href: "/#stories" },
  { label: "Preguntas", href: "/#faq" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground font-sans">
      {/* ── Sticky nav ── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-background/90 border-b border-border/50 shadow-[0_2px_20px_oklch(0.18_0.018_60/0.06)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to={state.isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group" aria-label="GaitFlow home">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold)]/10 p-0.5 shadow-[0_0_0_0_oklch(0.78_0.13_80/0.4)] group-hover:shadow-[0_0_0_4px_oklch(0.78_0.13_80/0.2)] transition-shadow">
              <img src={logoUrl} alt="GF Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <span className="font-display text-2xl tracking-tight text-foreground">
              Gait<span className="text-[var(--gold)]">Flow</span>
            </span>
          </Link>

          {/* Desktop nav — only show section links on home */}
          {isHome && (
            <nav className="hidden md:flex items-center gap-8 text-[12px] font-medium tracking-widest uppercase">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Auth CTAs */}
          <div className="flex items-center gap-3">
            {state.isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <User className="h-4 w-4" /> Panel
              </Link>
            ) : (
              <>
                {/* ── Pill cluster: desktop only ── */}
                <div className="hidden md:flex items-center h-10 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm overflow-hidden shadow-[0_1px_6px_oklch(0.18_0.018_60/0.08)]">
                  {/* Ingresar */}
                  <Link
                    to="/login"
                    id="nav-signin"
                    className="h-full px-5 flex items-center text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all tracking-[0.13em] uppercase whitespace-nowrap"
                  >
                    Ingresar
                  </Link>

                  {/* Divider */}
                  <div className="h-4 w-px bg-border/70 shrink-0" />

                  {/* Solicitar Demo */}
                  <Link
                    to="/demo"
                    id="nav-request-demo"
                    className="h-full px-5 flex items-center text-[11px] font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all tracking-[0.13em] uppercase whitespace-nowrap"
                  >
                    Solicitar Demo
                  </Link>

                  {/* Comenzar — inset featured pill */}
                  <div className="flex items-center px-1.5">
                    <Link
                      to="/register"
                      id="nav-get-started"
                      className="h-[30px] px-5 flex items-center gap-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold tracking-[0.13em] uppercase hover:bg-foreground/85 transition-all whitespace-nowrap"
                    >
                      Comenzar
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Mobile: solo Comenzar */}
                <Link
                  to="/register"
                  className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[11px] font-semibold text-background uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                >
                  Comenzar
                </Link>
              </>
            )}
            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              className="md:hidden grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-6 space-y-4 animate-slide-in-down">
            {isHome &&
              NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest py-2"
                >
                  {link.label}
                </a>
              ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
              {!state.isAuthenticated && (
                <>
                  <Link
                    to="/demo"
                    className="w-full text-center rounded-full border border-[var(--gold)] text-[var(--gold)] px-4 py-3 text-[13px] font-medium uppercase tracking-widest hover:bg-[var(--gold)]/10 transition-colors"
                  >
                    Solicitar Demo
                  </Link>
                  <Link
                    to="/login"
                    className="w-full text-center rounded-full border border-border px-4 py-3 text-[13px] font-medium uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center rounded-full bg-foreground text-background px-4 py-3 text-[13px] font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                  >
                    Comenzar Gratis
                  </Link>
                </>
              )}
              {state.isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="w-full text-center rounded-full bg-foreground text-background px-4 py-3 text-[13px] font-medium uppercase tracking-widest"
                >
                  Ir al Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border/50 bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-5 gap-12 text-[13px]">
          {/* Brand col */}
          <div className="col-span-1 md:col-span-2">
            <Link to={state.isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 mb-5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gold)]/10 p-0.5">
                <img src={logoUrl} alt="GF Logo" className="h-full w-full object-contain rounded-md" />
              </div>
              <span className="font-display text-2xl tracking-tight text-foreground">
                Gait<span className="text-[var(--gold)]">Flow</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              La plataforma integral de operaciones para criaderos de Caballo Criollo Colombiano. Nacida en Colombia, hecha para la industria equina.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-[11px] font-medium text-background uppercase tracking-widest hover:bg-foreground/90 transition-colors"
              >
                Comenzar Gratis
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center rounded-full border border-[var(--gold)] text-[var(--gold)] px-4 py-2 text-[11px] font-medium uppercase tracking-widest hover:bg-[var(--gold)]/10 transition-colors"
              >
                Solicitar Demo
              </Link>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <div className="font-display text-base mb-5 text-foreground">Plataforma</div>
            <ul className="space-y-3 text-muted-foreground">
              {[
                { label: "Gestión de Ejemplares", href: "/#features" },
                { label: "Salud y Bienestar", href: "/#features" },
                { label: "Motor de Labores", href: "/#features" },
                { label: "Mercado", href: "/#features" },
                { label: "Módulo Financiero", href: "/#features" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <div className="font-display text-base mb-5 text-foreground">Empresa</div>
            <ul className="space-y-3 text-muted-foreground">
              {[
                { label: "Planes", href: "/#pricing" },
                { label: "Clientes", href: "/#stories" },
                { label: "Preguntas Frecuentes", href: "/#faq" },
                { label: "Solicitar Demo", href: "/demo" },
                { label: "Contacto", href: "/demo#contact" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceso */}
          <div>
            <div className="font-display text-base mb-5 text-foreground">Acceso</div>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link to="/register" className="hover:text-foreground transition-colors">
                  Crear Cuenta
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  Ingresar
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-foreground transition-colors">
                  Mercado
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} GaitFlow</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Términos
            </a>
            <a href="/demo#contact" className="hover:text-foreground transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

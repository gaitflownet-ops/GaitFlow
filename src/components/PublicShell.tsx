import { Link, useLocation } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useApp } from "@/lib/store";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground font-sans">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-2xl tracking-tight text-foreground flex items-center gap-2 group"
          >
            Equi
            <span className="text-primary group-hover:text-[var(--gold)] transition-colors">
              Sales
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide">
            <Link
              to="/marketplace/sales"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              Horses
            </Link>
            <Link
              to="/marketplace/stallions"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              Stallions
            </Link>
            <Link
              to="/marketplace/genetics"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              Genetics
            </Link>
            <Link
              to="/marketplace"
              className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              Directory
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {state.isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <User className="h-4 w-4" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:block text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors uppercase tracking-widest"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="mt-auto border-t border-border/50 bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-[13px]">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-display text-2xl tracking-tight text-foreground">
              EquiSales
            </Link>
            <p className="mt-4 text-muted-foreground max-w-sm leading-relaxed">
              The digital infrastructure for the modern premium equine industry. Discover, manage,
              and invest in elite equine assets.
            </p>
          </div>
          <div>
            <div className="font-display text-lg mb-4">Ecosystem</div>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link to="/marketplace/sales" className="hover:text-foreground transition-colors">
                  Horse Sales
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace/stallions"
                  className="hover:text-foreground transition-colors"
                >
                  Stallions
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace/genetics"
                  className="hover:text-foreground transition-colors"
                >
                  Genetics
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-foreground transition-colors">
                  Farms & Stables
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-display text-lg mb-4">Platform</div>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Stable Management
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-foreground transition-colors">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} EquiSales Platform</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

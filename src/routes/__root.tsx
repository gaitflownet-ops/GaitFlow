import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppProvider, useApp } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido trasladada.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-95"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Esta página no cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal. Puedes intentar recargar o volver al inicio.
        </p>
        
        {/* Error Detail Display */}
        <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-left overflow-auto max-h-[300px] text-xs font-mono text-destructive-foreground">
          <p className="font-bold text-sm mb-2">{error?.name}: {error?.message}</p>
          <pre className="whitespace-pre-wrap">{error?.stack}</pre>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GaitFlow — Plataforma Integral para Criaderos" },
      {
        name: "description",
        content:
          "El sistema operativo para la industria del Caballo Criollo Colombiano. Gestiona, controla y haz crecer tu criadero.",
      },
      { name: "author", content: "GaitFlow" },
      { property: "og:title", content: "GaitFlow — Plataforma Integral para Criaderos" },
      {
        property: "og:description",
        content: "El sistema operativo para la industria del Caballo Criollo Colombiano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@GaitFlow" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Auth guard — redirects unauthenticated users to /login */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isCallbackPage = location.pathname === "/auth/callback";
  const isPublic =
    location.pathname === "/" ||
    location.pathname.startsWith("/demo") ||
    location.pathname.startsWith("/marketplace") ||
    location.pathname.startsWith("/showcase") ||
    location.pathname.startsWith("/stallions") ||
    location.pathname.startsWith("/farms") ||
    location.pathname.startsWith("/invite") ||
    isAuthPage ||
    isCallbackPage;

  useEffect(() => {
    if (state.authLoading) return;

    if (!state.isAuthenticated && !isPublic) {
      navigate({ to: "/login" });
    }
    if (state.isAuthenticated && isAuthPage) {
      navigate({ to: "/dashboard" });
    }
  }, [state.isAuthenticated, state.authLoading, isPublic, isAuthPage, navigate]);

  if (state.authLoading) {
    return null; // or a full-screen spinner
  }

  if (!state.isAuthenticated && !isPublic) {
    return null;
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthGuard>
          <Outlet />
          <Toaster />
        </AuthGuard>
      </AppProvider>
    </QueryClientProvider>
  );
}

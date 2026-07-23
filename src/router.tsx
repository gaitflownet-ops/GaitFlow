import { QueryClient, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { toast } from "sonner";

export const getRouter = () => {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error: any) => {
        const msg = error?.message || "Ocurrió un error inesperado.";
        if (msg.includes("JWT") || msg.includes("Auth") || msg.includes("Failed to fetch")) {
           toast.error("Sesión expirada o problema de red. Por favor recarga la página (F5).", { duration: 8000 });
        } else {
           toast.error(`Error: ${msg}`);
        }
      }
    }),
    defaultOptions: {
      queries: {
        staleTime: 300_000, // 5 minutes
        retry: 2, 
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: true, // Crucial for re-syncing after inactivity
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

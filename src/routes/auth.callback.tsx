import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirming account — GaitFlow" },
      { name: "description", content: "Confirming your GaitFlow account." },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Confirmando tu cuenta...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finalizeSignup = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("No pudimos validar tu sesión. Inicia sesión y vuelve a intentarlo.");
          return;
        }

        const metadata = user.user_metadata ?? {};
        const profileName =
          typeof metadata.name === "string" && metadata.name.trim()
            ? metadata.name
            : user.email?.split("@")[0] || "New User";
        const safeRole =
          typeof metadata.role === "string" && metadata.role ? metadata.role : "Owner";
        const stableName = typeof metadata.stable_name === "string" ? metadata.stable_name : null;
        const phone = typeof metadata.phone === "string" ? metadata.phone : null;
        const initials =
          profileName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "US";

        const { error: profileError } = await (supabase.from("profiles") as any).upsert(
          {
            id: user.id,
            name: profileName,
            role: safeRole,
            stable_name: stableName,
            phone,
            initials,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          throw profileError;
        }

        if (!isMounted) {
          return;
        }

        setStatus("Cuenta confirmada. Redirigiendo...");
        navigate({ to: "/dashboard" });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "No pudimos completar la confirmación.";
        setError(message);
      }
    };

    void finalizeSignup();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.025_155)] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] rounded-3xl border border-[oklch(0.28_0.04_155)] bg-[oklch(0.18_0.03_155)] p-8 text-center">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[oklch(0.65_0.02_155)]">
          GaitFlow
        </p>
        <h1 className="mt-4 font-display text-3xl">
          {error ? "No pudimos continuar" : "Confirmando tu cuenta"}
        </h1>
        <p className="mt-3 text-[15px] text-[oklch(0.65_0.02_155)]">{error || status}</p>
        {error && (
          <a
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-4 py-3 text-[oklch(0.18_0.018_60)] font-semibold"
          >
            Ir a iniciar sesión
          </a>
        )}
      </div>
    </div>
  );
}

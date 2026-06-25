import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowRight, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useValidateInvitation, useAcceptInvitation } from "@/lib/hooks/useInvitations";
import { getRoleDefinition } from "@/lib/roles";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Únete al equipo — GaitFlow" },
      { name: "description", content: "Acepta tu invitación y únete al equipo en GaitFlow." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams() as { token: string };
  const navigate = useNavigate();
  const { data: invitation, isLoading: validating } = useValidateInvitation(token);
  const acceptInvitation = useAcceptInvitation();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const roleDef = invitation ? getRoleDefinition(invitation.role) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!invitation) return;
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            name: name || invitation.name,
            role: invitation.role,
          },
        },
      });

      if (authError) {
        // Si el usuario ya existe, intentar login
        if (authError.message?.includes("already") || authError.code === "user_already_exists") {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password,
          });
          if (loginError) throw loginError;

          if (loginData.user) {
            // Crear perfil si no existe
            await (supabase.from("profiles") as any).upsert({
              id: loginData.user.id,
              name: name || invitation.name,
              role: invitation.role,
              organization_id: invitation.organization_id,
              initials: (name || invitation.name).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
            }, { onConflict: "id" });

            // Aceptar invitación
            await acceptInvitation.mutateAsync({
              invitationId: invitation.id,
              userId: loginData.user.id,
              orgId: invitation.organization_id,
              role: invitation.role,
            });
          }
        } else {
          throw authError;
        }
      } else if (authData.user) {
        // Crear perfil del nuevo usuario
        await (supabase.from("profiles") as any).upsert({
          id: authData.user.id,
          name: name || invitation.name,
          role: invitation.role,
          organization_id: invitation.organization_id,
          initials: (name || invitation.name).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        }, { onConflict: "id" });

        // Aceptar invitación
        await acceptInvitation.mutateAsync({
          invitationId: invitation.id,
          userId: authData.user.id,
          orgId: invitation.organization_id,
          role: invitation.role,
        });
      }

      setSuccess(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 2000);
    } catch (err: any) {
      setError(err.message || "No pudimos completar el registro. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Estados de Carga ────────────────────────────────────────────────────

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Validando tu invitación...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="lux-card p-10 border border-border">
            <ShieldCheck className="h-16 w-16 mx-auto mb-5 text-red-400/50" />
            <h1 className="font-display text-3xl mb-3 text-foreground">Invitación no válida</h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Este enlace de invitación ha expirado, ya fue utilizado o no existe.
              Contacta al propietario del criadero para recibir un nuevo enlace.
            </p>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="lux-card p-10 border border-border">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="font-display text-3xl mb-3 text-foreground">¡Bienvenido al equipo!</h1>
            <p className="text-muted-foreground text-[15px]">
              Tu cuenta ha sido creada y vinculada exitosamente. Serás redirigido al panel en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario de Registro ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-foreground">GaitFlow</h1>
          </div>
          <p className="text-muted-foreground text-lg">Te han invitado a unirte al equipo</p>
        </div>

        <div className="lux-card border border-border overflow-hidden">
          {/* Banner del Rol */}
          {roleDef && (
            <div className={`px-8 py-5 ${roleDef.color} border-b border-border flex items-center gap-4`}>
              <span className="text-3xl">{roleDef.icon}</span>
              <div>
                <div className="eyebrow text-[11px]">Tu rol asignado</div>
                <div className={`font-display text-xl ${roleDef.textColor}`}>{roleDef.label}</div>
                <p className="text-[12px] text-muted-foreground mt-0.5">{roleDef.description}</p>
              </div>
            </div>
          )}

          {/* Información de la Invitación */}
          <div className="px-8 py-5 bg-secondary/20 border-b border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="eyebrow text-[10px]">Invitado como</span>
                <p className="font-medium text-foreground mt-0.5">{invitation.name}</p>
              </div>
              <div>
                <span className="eyebrow text-[10px]">Email</span>
                <p className="font-medium text-foreground mt-0.5">{invitation.email}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="eyebrow block mb-1.5">Tu nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={invitation.name}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="eyebrow block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="eyebrow block mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 text-red-500 p-3 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando tu cuenta...
                </>
              ) : (
                <>
                  Unirme al Equipo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[12px] text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión aquí
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { FileText, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDocuments } from "@/lib/hooks/useVault";

export function DocumentVaultWidget() {
  const { data: documents = [], isLoading } = useDocuments();

  if (isLoading) {
    return (
      <div className="lux-card p-5 h-[200px] flex items-center justify-center">
        <span className="text-muted-foreground animate-pulse text-sm">Cargando Bóveda...</span>
      </div>
    );
  }

  const total = documents.length;
  
  // Próximos a vencer (menos de 15 días o ya vencidos)
  const expiring = documents.filter(d => {
    if (!d.expiration_date) return false;
    const diff = new Date(d.expiration_date).getTime() - new Date().getTime();
    return diff < 15 * 24 * 60 * 60 * 1000;
  });

  const pendingVerification = documents.filter(d => d.verified === "Pendiente");

  const completionRate = total > 0 ? Math.round(((total - pendingVerification.length) / total) * 100) : 0;

  return (
    <div className="lux-card flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-primary transition-opacity group-hover:opacity-[0.05] pointer-events-none">
        <FileText className="h-32 w-32" />
      </div>
      
      <div className="p-5 border-b border-border/50 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 text-[var(--gold)]">
          <FileText className="h-5 w-5" />
          <h3 className="font-display font-medium text-lg text-foreground">Estado Documental</h3>
        </div>
        <Link to="/vault" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
          Ir a Bóveda →
        </Link>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 relative z-10">
        {/* Metric 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Documentos Validados</p>
              <p className="text-xs text-muted-foreground">{completionRate}% completado</p>
            </div>
          </div>
          <span className="font-display text-2xl">{total - pendingVerification.length}</span>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Pendientes Revisión</p>
              <p className="text-xs text-muted-foreground">Requieren validación</p>
            </div>
          </div>
          <span className="font-display text-2xl text-amber-500">{pendingVerification.length}</span>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Alertas de Vencimiento</p>
              <p className="text-xs text-muted-foreground">Próximos 15 días o vencidos</p>
            </div>
          </div>
          <span className="font-display text-2xl text-destructive">{expiring.length}</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="lux-card flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-primary transition-opacity group-hover:opacity-[0.05] pointer-events-none">
        <FileText className="h-24 w-24" />
      </div>
      
      <div className="p-4 border-b border-border/50 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 text-[var(--gold)]">
          <FileText className="h-4 w-4" />
          <h3 className="font-display font-medium text-[15px] text-foreground">Estado Documental</h3>
        </div>
        <Link to="/vault" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
          Ir a Bóveda →
        </Link>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3 relative z-10">
        {/* Metric 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground leading-none">Documentos Validados</p>
              <p className="text-[11px] text-muted-foreground mt-1">{completionRate}% completado</p>
            </div>
          </div>
          <span className="font-display text-xl">{total - pendingVerification.length}</span>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground leading-none">Pendientes Revisión</p>
              <p className="text-[11px] text-muted-foreground mt-1">Requieren validación</p>
            </div>
          </div>
          <span className="font-display text-xl text-amber-500">{pendingVerification.length}</span>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground leading-none">Alertas de Vencimiento</p>
              <p className="text-[11px] text-muted-foreground mt-1">Próximos 15 días o vencidos</p>
            </div>
          </div>
          <span className="font-display text-xl text-destructive">{expiring.length}</span>
        </div>
      </div>
    </div>
  );
}

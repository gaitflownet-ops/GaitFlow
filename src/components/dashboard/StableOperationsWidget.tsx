import { useTeams, useOrgDailyCoverageLogs } from "@/lib/hooks/useTeams";
import { useHorses } from "@/lib/hooks/useHorses";
import { Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store";

export function StableOperationsWidget() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const { data: teams = [], isLoading: loadingTeams } = useTeams(orgId);
  const { data: horses = [] } = useHorses();
  
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: logs = [], isLoading: loadingLogs } = useOrgDailyCoverageLogs(orgId, todayStr);

  const activeTeams = teams.filter(t => !t.is_temporary || new Date(t.end_date || '2099-01-01') >= new Date());
  
  if (loadingTeams || loadingLogs) {
    return <div className="lux-card p-6 h-64 animate-pulse bg-secondary/50" />;
  }

  const activeStaff = activeTeams.reduce((acc, t) => acc + t.members.filter(m => m.availability_status === 'Available').length, 0);
  const totalStaff = activeTeams.reduce((acc, t) => acc + t.members.length, 0);
  
  const totalHorses = horses.length;
  let feedingCount = 0;
  let cleaningCount = 0;
  
  logs.forEach(log => {
    if (log.feeding_confirmed) feedingCount += (log.horses_checked || 1);
    if (log.activities_completed?.includes("Limpieza de Pesebrera") || log.activities_completed?.includes("Limpieza") || log.activities_completed?.includes("Cleaning")) {
      cleaningCount += (log.horses_checked || 1);
    }
  });

  const feedingProgress = totalHorses > 0 ? Math.min(100, Math.round((feedingCount / totalHorses) * 100)) : 0;
  const cleaningProgress = totalHorses > 0 ? Math.min(100, Math.round((cleaningCount / totalHorses) * 100)) : 0;

  const alerts = logs.filter(l => l.health_alerts || l.incidents);

  return (
    <div className="lux-card p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Operación del Criadero Hoy
        </h3>
      </div>

      <div className="space-y-4">
        {/* Progress Bars */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">Alimentación (Raciones)</span>
            <span className="text-emerald-500">{feedingProgress}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${feedingProgress}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">Limpieza de Pesebreras</span>
            <span className="text-primary">{cleaningProgress}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${cleaningProgress}%` }} />
          </div>
        </div>

        {/* Staff Availability */}
        <div className="bg-secondary/20 p-3 rounded-xl border border-border flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Personal Activo</div>
              <div className="text-[10px] text-muted-foreground">En cuadrillas</div>
            </div>
          </div>
          <div className="font-display text-xl font-bold">
            {activeStaff} <span className="text-sm text-muted-foreground font-sans font-normal">/ {totalStaff}</span>
          </div>
        </div>

        {/* Quick Alerts */}
        <div className="pt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Alertas Recientes de Bitácora</h4>
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay incidentes reportados hoy.</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {alerts.map(a => (
                <div key={a.id} className="flex items-start gap-2 text-xs bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-amber-600/90 leading-tight">
                    <span className="font-semibold">{a.profiles?.name || 'Personal'}:</span> {a.health_alerts || a.incidents}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

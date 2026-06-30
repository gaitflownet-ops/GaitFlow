import { useState } from "react";
import { Check, Loader2, FileText } from "lucide-react";
import { Modal } from "./Modal";
import { useTeams, useCreateCoverageLog } from "@/lib/hooks/useTeams";
import { useApp } from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const COMMON_ACTIVITIES = [
  "Alimentación",
  "Limpieza de Pesebrera",
  "Baño",
  "Entrenamiento",
  "Monta",
  "Tratamiento Médico",
  "Paseo en Potrero",
  "Herrería"
];

export function AddCoverageLogModal({ open, onOpenChange }: Props) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const userId = state.user?.id;

  const { data: teams = [] } = useTeams(orgId);
  const createLog = useCreateCoverageLog();

  const [teamId, setTeamId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [horsesChecked, setHorsesChecked] = useState<number>(0);
  const [feedingConfirmed, setFeedingConfirmed] = useState(false);
  const [waterAvailable, setWaterAvailable] = useState(false);
  
  const [observations, setObservations] = useState("");
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [bodyConditionNotes, setBodyConditionNotes] = useState("");
  const [healthAlerts, setHealthAlerts] = useState("");
  const [incidents, setIncidents] = useState("");

  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const selectedTeam = teams.find(t => t.id === teamId);

  const reset = () => {
    setTeamId("");
    setShiftId("");
    setActivities([]);
    setHorsesChecked(0);
    setFeedingConfirmed(false);
    setWaterAvailable(false);
    setObservations("");
    setBehaviorNotes("");
    setBodyConditionNotes("");
    setHealthAlerts("");
    setIncidents("");
    setDone(false);
    setError("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const toggleActivity = (act: string) => {
    setActivities(prev => prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!orgId || !teamId || !userId) return;

    try {
      await createLog.mutateAsync({
        organization_id: orgId,
        team_id: teamId,
        shift_id: shiftId || undefined,
        activities_completed: activities,
        horses_checked: horsesChecked,
        feeding_confirmed: feedingConfirmed,
        water_available: waterAvailable,
        observations: observations || undefined,
        behavior_notes: behaviorNotes || undefined,
        body_condition_notes: bodyConditionNotes || undefined,
        health_alerts: healthAlerts || undefined,
        incidents: incidents || undefined,
        logged_by: userId,
        date: new Date().toISOString().split("T")[0]
      });
      setDone(true);
      setTimeout(handleClose, 2000);
    } catch (err: any) {
      setError(err.message || "Error al registrar bitácora.");
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Registrar Bitácora Diaria">
      {done ? (
        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">¡Bitácora Registrada!</h3>
          <p className="text-muted-foreground">La operación ha quedado en el historial.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cuadrilla / Equipo *</label>
                <select
                  required
                  value={teamId}
                  onChange={e => {
                    setTeamId(e.target.value);
                    setShiftId("");
                  }}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Selecciona un equipo</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Jornada / Turno</label>
                <select
                  value={shiftId}
                  onChange={e => setShiftId(e.target.value)}
                  disabled={!selectedTeam || selectedTeam.shifts.length === 0}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                  <option value="">Sin turno específico</option>
                  {selectedTeam?.shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>
                  ))}
                </select>
              </div>

              <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Checklist Operativo
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feed"
                      checked={feedingConfirmed}
                      onChange={e => setFeedingConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <label htmlFor="feed" className="text-sm font-medium text-foreground cursor-pointer">
                      Alimentación Confirmada
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="water"
                      checked={waterAvailable}
                      onChange={e => setWaterAvailable(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <label htmlFor="water" className="text-sm font-medium text-foreground cursor-pointer">
                      Agua Limpia y Disponible
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Total Ejemplares Revisados</label>
                    <input
                      type="number"
                      min="0"
                      value={horsesChecked}
                      onChange={e => setHorsesChecked(parseInt(e.target.value) || 0)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Actividades Completadas</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ACTIVITIES.map(act => {
                    const active = activities.includes(act);
                    return (
                      <button
                        type="button"
                        key={act}
                        onClick={() => toggleActivity(act)}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          active 
                            ? 'bg-primary/20 text-primary border-primary/30' 
                            : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
                        }`}
                      >
                        {act}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Observaciones Generales</label>
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas de Comportamiento</label>
                <textarea
                  value={behaviorNotes}
                  onChange={e => setBehaviorNotes(e.target.value)}
                  rows={1}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Condición Corporal (Novedades)</label>
                <textarea
                  value={bodyConditionNotes}
                  onChange={e => setBodyConditionNotes(e.target.value)}
                  rows={1}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <label className="block text-sm font-medium text-amber-500 mb-1">Alertas de Salud (Si aplica)</label>
                <textarea
                  value={healthAlerts}
                  onChange={e => setHealthAlerts(e.target.value)}
                  placeholder="Cólicos, cojeras, heridas..."
                  rows={2}
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-red-500 mb-1">Incidentes Críticos</label>
                <textarea
                  value={incidents}
                  onChange={e => setIncidents(e.target.value)}
                  placeholder="Fugas, daños estructurales..."
                  rows={1}
                  className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createLog.isPending || !teamId}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createLog.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Bitácora"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

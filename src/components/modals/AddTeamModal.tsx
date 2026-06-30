import { useState, useEffect } from "react";
import { Check, Loader2, Plus, X, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import { useOrganizationMembers } from "@/lib/hooks/useOrganization";
import { useCreateTeam, useUpdateTeam, type FullTeam } from "@/lib/hooks/useTeams";
import { useApp } from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: FullTeam | null;
};

export function AddTeamModal({ open, onOpenChange, team }: Props) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const { data: horses = [] } = useHorses(orgId);
  const { data: members = [] } = useOrganizationMembers(orgId);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const [name, setName] = useState(team?.name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [isTemporary, setIsTemporary] = useState(team?.is_temporary || false);
  const [startDate, setStartDate] = useState(team?.start_date || "");
  const [endDate, setEndDate] = useState(team?.end_date || "");
  const [destination, setDestination] = useState(team?.destination || "");
  const [eventNotes, setEventNotes] = useState(team?.event_notes || "");
  
  const initialLeaderId = team?.members?.find(m => m.role === "Líder" || m.role === "Leader")?.profile_id || "";
  const [leaderId, setLeaderId] = useState(initialLeaderId);
  
  const initialMembers = team?.members?.filter(m => m.profile_id !== initialLeaderId).map(m => m.profile_id) || [];
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialMembers);
  
  const initialHorses = team?.horses?.map(h => h.horse_id) || [];
  const [selectedHorses, setSelectedHorses] = useState<string[]>(initialHorses);
  
  const initialShifts = team?.shifts?.map(s => ({ name: s.name, start_time: s.start_time, end_time: s.end_time })) || [];
  const [shifts, setShifts] = useState<{name: string, start_time: string, end_time: string}[]>(initialShifts);

  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Re-initialize when team prop changes
  useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name || "");
        setDescription(team.description || "");
        setIsTemporary(team.is_temporary || false);
        setStartDate(team.start_date || "");
        setEndDate(team.end_date || "");
        setDestination(team.destination || "");
        setEventNotes(team.event_notes || "");
        
        const leader = team.members?.find(m => m.role === "Líder" || m.role === "Leader")?.profile_id || "";
        setLeaderId(leader);
        setSelectedMembers(team.members?.filter(m => m.profile_id !== leader).map(m => m.profile_id) || []);
        setSelectedHorses(team.horses?.map(h => h.horse_id) || []);
        setShifts(team.shifts?.map(s => ({ name: s.name, start_time: s.start_time, end_time: s.end_time })) || []);
      } else {
        setName("");
        setDescription("");
        setIsTemporary(false);
        setStartDate("");
        setEndDate("");
        setDestination("");
        setEventNotes("");
        setLeaderId("");
        setSelectedMembers([]);
        setSelectedHorses([]);
        setShifts([]);
      }
      setDone(false);
      setError("");
    }
  }, [open, team]);

  const reset = () => {
    if (!team) {
      setName("");
      setDescription("");
      setIsTemporary(false);
      setStartDate("");
      setEndDate("");
      setDestination("");
      setEventNotes("");
      setLeaderId("");
      setSelectedMembers([]);
      setSelectedHorses([]);
      setShifts([]);
    }
    setDone(false);
    setError("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!orgId) return;

    try {
      if (team) {
        await updateTeam.mutateAsync({
          id: team.id,
          organization_id: orgId,
          name,
          description,
          is_temporary: isTemporary,
          start_date: isTemporary && startDate ? startDate : undefined,
          end_date: isTemporary && endDate ? endDate : undefined,
          destination: isTemporary ? destination : undefined,
          event_notes: isTemporary ? eventNotes : undefined,
          leader_id: leaderId || undefined,
          member_ids: selectedMembers,
          horse_ids: selectedHorses,
          shifts,
          team_type: isTemporary ? "Temporary" : "Permanent"
        });
      } else {
        await createTeam.mutateAsync({
          organization_id: orgId,
          name,
          description,
          is_temporary: isTemporary,
          start_date: isTemporary && startDate ? startDate : undefined,
          end_date: isTemporary && endDate ? endDate : undefined,
          destination: isTemporary ? destination : undefined,
          event_notes: isTemporary ? eventNotes : undefined,
          leader_id: leaderId || undefined,
          member_ids: selectedMembers,
          horse_ids: selectedHorses,
          shifts,
          team_type: isTemporary ? "Temporary" : "Permanent"
        });
      }
      setDone(true);
      setTimeout(handleClose, 2000);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuadrilla.");
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const toggleHorse = (id: string) => {
    setSelectedHorses(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  const addShift = () => {
    setShifts([...shifts, { name: "Mañana", start_time: "06:00", end_time: "14:00" }]);
  };

  const updateShift = (index: number, field: string, value: string) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={team ? "Editar Cuadrilla" : "Nueva Cuadrilla"} size="lg">
      {done ? (
        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">{team ? "¡Cuadrilla Actualizada!" : "¡Cuadrilla Creada!"}</h3>
          <p className="text-muted-foreground">{team ? "Los cambios se guardaron correctamente." : "El equipo se ha configurado correctamente."}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombre de la Cuadrilla *</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Equipo de Entrenamiento, Personal Feria Nacional"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Propósito de este equipo..."
                rows={2}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isTemp"
                checked={isTemporary}
                onChange={e => setIsTemporary(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label htmlFor="isTemp" className="text-sm font-medium text-foreground cursor-pointer">
                Equipo Temporal (Eventos, Ferias, Transportes)
              </label>
            </div>

            {isTemporary && (
              <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-xl border border-border">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Destino / Ubicación</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Ej. Coliseo de Ferias"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Líder del Equipo (Opcional)</label>
              <select
                value={leaderId}
                onChange={e => setLeaderId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecciona un líder</option>
                {members.map(m => (
                  <option key={m.id} value={m.user_id}>{m.profiles?.name || 'Desconocido'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Miembros del Equipo</label>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-secondary/30 p-2 rounded-xl border border-border">
                {members.map(m => {
                  if (m.user_id === leaderId) return null; // Leader is already a member implicitly
                  return (
                    <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m.user_id)}
                        onChange={() => toggleMember(m.user_id)}
                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                      />
                      <span className="text-sm font-medium">{m.profiles?.name || 'Desconocido'}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.role}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Ejemplares Asignados (Responsabilidad)</label>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-secondary/30 p-2 rounded-xl border border-border">
                {horses.map(h => (
                  <label key={h.id} className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedHorses.includes(h.id)}
                      onChange={() => toggleHorse(h.id)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <span className="text-sm font-medium">{h.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">Jornadas / Turnos de Trabajo</label>
                <button
                  type="button"
                  onClick={addShift}
                  className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Agregar Turno
                </button>
              </div>
              
              {shifts.length === 0 ? (
                <div className="text-xs text-muted-foreground italic bg-secondary/30 p-4 rounded-xl border border-border text-center">
                  Este equipo no tiene turnos específicos.
                </div>
              ) : (
                <div className="space-y-2">
                  {shifts.map((shift, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-xl border border-border">
                      <input
                        type="text"
                        value={shift.name}
                        onChange={e => updateShift(index, 'name', e.target.value)}
                        placeholder="Nombre (ej. Mañana)"
                        className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                      />
                      <input
                        type="time"
                        value={shift.start_time}
                        onChange={e => updateShift(index, 'start_time', e.target.value)}
                        className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      />
                      <span className="text-muted-foreground text-xs">a</span>
                      <input
                        type="time"
                        value={shift.end_time}
                        onChange={e => updateShift(index, 'end_time', e.target.value)}
                        className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeShift(index)}
                        className="text-muted-foreground hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTeam.isPending || updateTeam.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {(createTeam.isPending || updateTeam.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {team ? "Guardar Cambios" : "Crear Cuadrilla"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

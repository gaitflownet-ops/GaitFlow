import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar as CalendarIcon, Clock, Activity, AlignLeft, User, ListTodo } from "lucide-react";
import { useState } from "react";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { useApp } from "@/lib/store";
import { useHorses } from "@/lib/hooks/useHorses";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useTeams } from "@/lib/hooks/useTeams";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CCC_TEMPLATES = [
  { id: "t1", title: "Limpieza de Pesebrera", desc: "Aseo general, cambio de aserrín y desinfección." },
  { id: "t2", title: "Alimentación", desc: "Suministro de ración de concentrado y forraje." },
  { id: "t3", title: "Entrenamiento", desc: "Trabajo en torno o sesión de monta." },
  { id: "t4", title: "Herraje", desc: "Revisión de aplomos y cambio de herraduras." },
  { id: "t5", title: "Preparación Exposición", desc: "Baño, peluquería y alistamiento para competencia." },
  { id: "t6", title: "Actividad Reproductiva", desc: "Control folicular, salto o recolección de semen." },
];

export function AddTaskModal({ open, onOpenChange }: AddTaskModalProps) {
  const { state } = useApp();
  const { data: horses = [] } = useHorses();
  const { data: profiles = [] } = useProfiles();
  const { data: teams = [] } = useTeams(state.user?.organization_id);
  const { mutateAsync: createTask, isPending } = useCreateTask();

  const [horseId, setHorseId] = useState("");

  // Smart fallback: Extract valid UUIDs from the selected horse, or fallback to the first horse that has them (e.g. Mito de La Marqueza)
  const selectedHorse = horses.find(h => h.id === horseId);
  const fallbackHorse = horses.find(h => h.farm_id && h.organization_id);
  
  const targetFarmId = selectedHorse?.farm_id || fallbackHorse?.farm_id;
  // Always fallback to the user's active organization ID to prevent null constraint errors when there are no horses.
  const targetOrgId = selectedHorse?.organization_id || fallbackHorse?.organization_id || state.user?.organization_id;

  // Clean up and deduplicate profiles for the team dropdown
  const uniqueProfiles = (profiles as any[]).filter((p: any, index: number, self: any[]) => 
    p.name && !p.name.includes('Codex') && !p.name.includes('Roadmap') &&
    index === self.findIndex((t: any) => t.id === p.id || t.name === p.name)
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [teamId, setTeamId] = useState("");

  const applyTemplate = (template: { title: string; desc: string }) => {
    setTitle(template.title);
    setDescription(template.desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await createTask({
        farm_id: targetFarmId || undefined,
        title,
        description,
        priority,
        status: "Pendiente",
        due_date: dueDate ? new Date(`${dueDate}T12:00:00Z`).toISOString() : new Date().toISOString(),
        horse_id: horseId || null,
        assignee_id: assigneeId || null,
        team_id: teamId || null,
        organization_id: (targetOrgId || "00000000-0000-0000-0000-000000000000") as string,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Media");
    setDueDate("");
    setHorseId("");
    setAssigneeId("");
    setTeamId("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetForm();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10 shrink-0">
            <div>
              <Dialog.Title className="font-display text-xl text-foreground">Nueva Tarea Operativa</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-1">
                Motor Operativo D.1 · Asigna trabajos al equipo.
              </Dialog.Description>
            </div>
            <Dialog.Close className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Quick Templates */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Plantillas Rápidas (CCC)</label>
              <div className="flex flex-wrap gap-2">
                {CCC_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-[12px] px-3 py-1.5 rounded-full border border-border bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-colors text-foreground"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" /> Título de la Tarea <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Revisión veterinaria..."
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" /> Descripción / Notas
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instrucciones para el colaborador..."
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Fecha a realizar
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-muted-foreground" /> Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">🐴</span> Ejemplar (Opcional)
                  </label>
                  <select
                    value={horseId}
                    onChange={(e) => setHorseId(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="">Seleccione ejemplar</option>
                    {horses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" /> Asignar a
                  </label>
                  <select
                    value={teamId ? `team:${teamId}` : assigneeId ? `user:${assigneeId}` : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("team:")) {
                        setTeamId(val.split(":")[1]);
                        setAssigneeId("");
                      } else if (val.startsWith("user:")) {
                        setAssigneeId(val.split(":")[1]);
                        setTeamId("");
                      } else {
                        setTeamId("");
                        setAssigneeId("");
                      }
                    }}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="">Cualquier miembro / Sin asignar</option>
                    
                    <optgroup label="Cuadrillas">
                      {teams.map(t => (
                        <option key={`team-${t.id}`} value={`team:${t.id}`}>
                          👥 {t.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Personas">
                      {uniqueProfiles.map((p: any) => (
                        <option key={`user-${p.id}`} value={`user:${p.id}`}>
                          👤 {p.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

            </form>
          </div>

          <div className="p-6 border-t border-border bg-secondary/10 shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-secondary text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="add-task-form"
              disabled={isPending || !title}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Asignando..." : "Crear Tarea"}
            </button>
          </div>
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { useState } from "react";
import { Modal } from "./Modal";
import { useTasks } from "@/lib/hooks/useTasks";
import { useTeams } from "@/lib/hooks/useTeams";
import { Loader2, Users, CheckSquare, Clock } from "lucide-react";
import { useApp } from "@/lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string;
};

export function WorkerProfileModal({ open, onClose, userId, userName }: Props) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const { data: teams = [], isLoading: loadingTeams } = useTeams(orgId);
  // Get teams where user is a member
  const userTeams = teams.filter(t => t.members?.some(m => m.profile_id === userId));
  
  // We can filter tasks by assignee_id locally since useTasks fetches all org tasks
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(undefined, orgId);
  const userTasks = tasks.filter(t => t.assignee_id === userId);

  const isLoading = loadingTeams || loadingTasks;

  return (
    <Modal open={open} onClose={onClose} title={`Perfil Operativo: ${userName}`}>
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-6">
          
          <div className="flex flex-col gap-6">
            <div className="lux-card border border-border p-5">
              <div className="flex items-center gap-2 text-foreground font-medium mb-4 pb-3 border-b border-border/50">
                <Users className="h-4 w-4 text-primary" />
                Cuadrillas Asignadas ({userTeams.length})
              </div>
              <div className="space-y-3">
                {userTeams.length > 0 ? (
                  userTeams.map(team => {
                    const role = team.members?.find(m => m.profile_id === userId)?.role || "Miembro";
                    return (
                      <div key={team.id} className="text-sm bg-secondary/10 p-3 rounded-xl border border-border/50 flex justify-between items-center">
                        <span className="font-medium text-foreground">{team.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-md">{role}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-secondary/20 p-4 rounded-xl text-center border border-border border-dashed">No está asignado a ninguna cuadrilla actualmente.</p>
                )}
              </div>
            </div>

            <div className="lux-card border border-border p-5">
              <div className="flex items-center gap-2 text-foreground font-medium mb-4 pb-3 border-b border-border/50">
                <CheckSquare className="h-4 w-4 text-primary" />
                Tareas Pendientes ({userTasks.filter(t => t.status !== 'Completed').length})
              </div>
              <div className="space-y-3">
                {userTasks.filter(t => t.status !== 'Completed').length > 0 ? (
                  userTasks.filter(t => t.status !== 'Completed').map(task => (
                    <div key={task.id} className="text-sm bg-secondary/10 p-3 rounded-xl border border-border/50">
                      <div className="font-medium text-foreground mb-1">{task.title}</div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}</span>
                        <span className={`px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-muted-foreground'}`}>
                          {task.priority || 'Normal'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-secondary/20 p-4 rounded-xl text-center border border-border border-dashed">No tiene tareas pendientes en este momento.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

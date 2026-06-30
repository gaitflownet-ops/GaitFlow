import { useState } from "react";
import { Modal } from "./Modal";
import { useTasks } from "@/lib/hooks/useTasks";
import { useTeams } from "@/lib/hooks/useTeams";
import { Loader2, Users, CheckSquare, Clock } from "lucide-react";
import { useApp } from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
};

export function WorkerProfileModal({ open, onOpenChange, userId, userName }: Props) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const { data: teams = [], isLoading: loadingTeams } = useTeams(orgId);
  // Get teams where user is a member
  const userTeams = teams.filter(t => t.members?.some(m => m.profile_id === userId));
  
  // We can filter tasks by assignee_id locally since useTasks fetches all org tasks
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(orgId);
  const userTasks = tasks.filter(t => t.assignee_id === userId);

  const isLoading = loadingTeams || loadingTasks;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Perfil Operativo: ${userName}`}>
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="lux-card border border-border p-4 bg-secondary/20">
              <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                <Users className="h-4 w-4 text-[var(--gold)]" />
                Cuadrillas ({userTeams.length})
              </div>
              <div className="space-y-2">
                {userTeams.length > 0 ? (
                  userTeams.map(team => {
                    const role = team.members?.find(m => m.profile_id === userId)?.role || "Miembro";
                    return (
                      <div key={team.id} className="text-sm bg-background p-2 rounded-lg border border-border/50 flex justify-between items-center">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-[10px] uppercase bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{role}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic">No está asignado a ninguna cuadrilla.</p>
                )}
              </div>
            </div>

            <div className="lux-card border border-border p-4 bg-secondary/20">
              <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                <CheckSquare className="h-4 w-4 text-[var(--gold)]" />
                Tareas Pendientes ({userTasks.filter(t => t.status !== 'Completed').length})
              </div>
              <div className="space-y-2">
                {userTasks.filter(t => t.status !== 'Completed').length > 0 ? (
                  userTasks.filter(t => t.status !== 'Completed').map(task => (
                    <div key={task.id} className="text-sm bg-background p-2 rounded-lg border border-border/50">
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{task.category}</span>
                        <span className={task.priority === 'High' ? 'text-red-500' : ''}>{task.priority}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No tiene tareas pendientes.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-border">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

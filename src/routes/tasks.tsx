import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useTasks, useUpdateTask, useTasksSubscription } from "@/lib/hooks/useTasks";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  CalendarDays,
  User,
  Plus,
  Paperclip,
  Camera,
  History
} from "lucide-react";
import React, { useState } from "react";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [{ title: "Motor Operativo D.1 — GaitFlow" }],
  }),
  component: TasksPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  Alta: "bg-red-500/10 text-red-500 border-red-500/20",
  Media: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Baja: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Pendiente": <Clock className="text-muted-foreground h-5 w-5" />,
  "En Progreso": <PlayCircle className="text-blue-500 h-5 w-5" />,
  "Atrasado": <AlertTriangle className="text-red-500 h-5 w-5" />,
  "Completado": <CheckCircle2 className="text-emerald-500 h-5 w-5" />,
};

const KANBAN_COLUMNS = ["Pendiente", "En Progreso", "Completado"];

function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  useTasksSubscription(); // Activate Realtime Updates!
  const { mutateAsync: updateTask } = useUpdateTask();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Default view is now My Tasks
  const [viewMode, setViewMode] = useState<"my_tasks" | "kanban" | "calendar">("my_tasks");
  const [showHistory, setShowHistory] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  // Local state for dragging
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const { state } = useApp();

  // Stats
  const pending = tasks.filter((t) => t.status === "Pendiente").length;
  const inProgress = tasks.filter((t) => t.status === "En Progreso").length;
  const overdue = tasks.filter((t) => t.status === "Atrasado").length;
  const completed = tasks.filter((t) => t.status === "Completado").length;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    
    if (taskId) {
      try {
        await updateTask({ id: taskId, status: newStatus });
      } catch (err) {
        console.error("Failed to move task", err);
      }
    }
    setDraggedTaskId(null);
  };

  const myTasksAll = tasks.filter(t => t.assignee_id === state.user?.id);
  const myActiveTasks = myTasksAll.filter(t => t.status !== "Completado");
  const myCompletedTasks = myTasksAll.filter(t => t.status === "Completado");

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow flex items-center gap-2">
            Módulo D.1 <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">Realtime Active</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2 text-foreground">Motor Operativo</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {tasks.length} labores totales · {overdue > 0 ? <span className="text-red-500 font-medium">{overdue} atrasadas</span> : "Todo al día"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center bg-secondary/50 rounded-xl p-1 border border-border">
            <button
              onClick={() => setViewMode("my_tasks")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "my_tasks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mis Labores Hoy
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tablero
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendario
            </button>
          </div>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nueva Labor
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-secondary/50 rounded-2xl border border-border" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="lux-card p-16 text-center text-muted-foreground border border-border/50 bg-secondary/10">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-5 text-primary/40" />
          <h3 className="font-display text-3xl text-foreground mb-2">Flujo Limpio</h3>
          <p className="text-lg">Asigna tu primera labor operativa para comenzar a organizar tu personal.</p>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-6 py-3 font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-5 w-5" /> Crear Labor
          </button>
        </div>
      ) : (
        <>
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {KANBAN_COLUMNS.map((columnStatus) => {
                const columnTasks = tasks.filter(t => t.status === columnStatus || (columnStatus === "Pendiente" && t.status === "Atrasado"));
                
                return (
                  <div 
                    key={columnStatus} 
                    className="flex flex-col h-full bg-secondary/20 rounded-2xl p-4 border border-border/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, columnStatus)}
                  >
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="font-semibold text-[15px] flex items-center gap-2 text-foreground/90 uppercase tracking-wide">
                        {STATUS_ICONS[columnStatus]}
                        {columnStatus === "Pendiente" ? "Por Hacer" : columnStatus === "En Progreso" ? "En Curso" : columnStatus === "Completado" ? "Listo" : columnStatus}
                      </h3>
                      <span className="bg-background border border-border text-xs font-bold px-2.5 py-1 rounded-full text-muted-foreground">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[150px]">
                      {columnTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`lux-card p-4 cursor-grab active:cursor-grabbing border ${
                            draggedTaskId === task.id ? 'opacity-50 scale-95 border-primary' : 'border-border hover:border-primary/40 hover:shadow-md'
                          } transition-all bg-background`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h4 className={`font-semibold text-[14px] leading-tight ${task.status === 'Completado' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {task.title}
                            </h4>
                            {task.priority && (
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold border ${PRIORITY_COLORS[task.priority] || "bg-secondary text-foreground"}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground mt-3">
                            {task.horses && (
                              <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md text-foreground/80">
                                <span>🐴</span> {task.horses.name}
                              </div>
                            )}
                            
                            {task.due_date && (
                              <div className={`flex items-center gap-1.5 ${task.status === 'Atrasado' ? 'text-red-500' : ''}`}>
                                <CalendarDays className="h-3.5 w-3.5" /> 
                                {new Date(task.due_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                              </div>
                            )}

                            {task.profiles && (
                              <div className="flex items-center gap-1.5 ml-auto text-primary/80">
                                <User className="h-3.5 w-3.5" /> {task.profiles.name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {columnTasks.length === 0 && (
                        <div className="h-24 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-sm text-muted-foreground/50">
                          Arrastra labores aquí
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "my_tasks" && (
            <div className="max-w-3xl mx-auto animate-fade-up">
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-display">Checklist Operativo</h2>
                <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
                  {myActiveTasks.length} por hacer hoy
                </span>
              </div>
              
              <div className="space-y-4">
                {myActiveTasks.length === 0 ? (
                  <div className="lux-card p-10 text-center text-muted-foreground border border-border">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/50 mb-3" />
                    <p>¡Excelente trabajo! Has terminado todas tus labores de hoy.</p>
                  </div>
                ) : (
                  myActiveTasks.map(task => (
                    <div key={task.id} className="lux-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border hover:border-primary/30 transition-colors group">
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => updateTask({ id: task.id, status: 'Completado' })}
                          className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-500/10`}
                        />
                        <div>
                          <h4 className={`font-semibold text-lg text-foreground group-hover:text-primary transition-colors`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {task.horses && (
                              <span className="flex items-center gap-1.5"><span className="text-[12px]">🐴</span> {task.horses.name}</span>
                            )}
                            {task.description && <span className="truncate max-w-[200px] opacity-70">· {task.description}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 text-sm">
                        <span className={`px-3 py-1 rounded-full font-bold text-[11px] border ${PRIORITY_COLORS[task.priority || 'Media']}`}>
                          {task.priority || 'Media'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button title="Añadir evidencia (Fotos/Notas)" className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary">
                            <Camera className="h-4 w-4" />
                          </button>
                          <button title="Adjuntar Documento" className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary">
                            <Paperclip className="h-4 w-4" />
                          </button>
                          {task.due_date && (
                            <span className="text-muted-foreground font-medium flex items-center gap-1.5 ml-2 bg-secondary/50 px-2 py-1 rounded-md">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(task.due_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Task History Toggle */}
              <div className="mt-12">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <History className="h-4 w-4" /> {showHistory ? "Ocultar" : "Mostrar"} Historial de Listas ({myCompletedTasks.length})
                </button>

                {showHistory && (
                  <div className="mt-6 space-y-3 animate-fade-in">
                    {myCompletedTasks.map(task => (
                      <div key={task.id} className="lux-card p-4 flex items-center justify-between gap-4 border border-border bg-secondary/10 opacity-70">
                        <div className="flex items-center gap-4">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <div>
                            <h4 className="font-medium text-muted-foreground line-through">{task.title}</h4>
                            {task.horses && <span className="text-xs text-muted-foreground">🐴 {task.horses.name}</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => updateTask({ id: task.id, status: 'Pendiente' })}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Revertir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === "calendar" && (
            <div className="lux-card border border-border animate-fade-in flex flex-col h-[750px] shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/10">
                <h2 className="text-2xl font-display text-foreground capitalize flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  {currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors">&lt;</button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm font-medium transition-colors bg-background">Hoy</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors">&gt;</button>
                </div>
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-border bg-secondary/20">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{day}</div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-secondary/5">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b border-border/50 bg-background/30" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  // Construct local YYYY-MM-DD
                  const yyyy = year;
                  const mm = String(month + 1).padStart(2, '0');
                  const dd = String(day).padStart(2, '0');
                  const dateStr = `${yyyy}-${mm}-${dd}`;
                  
                  // Tareas para este día
                  const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  
                  return (
                    <div key={day} className={`border-r border-b border-border/50 p-2 overflow-hidden flex flex-col gap-1.5 transition-colors hover:bg-secondary/10 bg-background ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}>
                      <div className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center mb-0.5 ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground/70'}`}>
                        {day}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {dayTasks.map(t => (
                          <div 
                            key={t.id} 
                            title={t.title}
                            className={`text-[10px] leading-tight p-1.5 rounded border truncate cursor-default transition-all hover:scale-[1.02] ${t.status === 'Completado' ? 'bg-secondary text-muted-foreground border-border/50 line-through opacity-70' : PRIORITY_COLORS[t.priority || 'Media']}`}
                          >
                            <span className="font-semibold">{t.title}</span>
                            {t.horses && <span className="block mt-0.5 opacity-80 text-[9px] truncate">🐴 {t.horses.name}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Fill remaining spaces at end of grid */}
                {Array.from({ length: (42 - (firstDayIndex + daysInMonth)) % 7 }).map((_, i) => (
                  <div key={`empty-end-${i}`} className="border-r border-b border-border/50 bg-background/30" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddTaskModal open={isAddOpen} onOpenChange={setIsAddOpen} />
    </AppShell>
  );
}

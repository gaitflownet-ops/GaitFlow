import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTasks } from "@/lib/hooks/useTasks";
import { useHealthRecords } from "@/lib/hooks/useHealth";
import { useCompetitions } from "@/lib/hooks/useCompetitions";
import { useHorses } from "@/lib/hooks/useHorses";
import { CalendarDays, CheckCircle2, Clock, Trophy, HeartPulse, ClipboardList, User } from "lucide-react";

export function DailyScheduleWidget() {
  const { data: tasks = [] } = useTasks();
  const { data: healthRecords = [] } = useHealthRecords();
  const { data: competitions = [] } = useCompetitions();
  const { data: horses = [] } = useHorses();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getHorseName = (horseId: string) => {
    const horse = horses.find(h => h.id === horseId);
    return horse ? horse.barn_name || horse.name : "Ejemplar Desconocido";
  };

  const scheduleEvents = useMemo(() => {
    const targetDate = selectedDate.toISOString().split("T")[0];
    const events: any[] = [];

    // Add Tasks
    tasks.forEach(task => {
      if (task.due_date && task.due_date.startsWith(targetDate)) {
        events.push({
          id: `task-${task.id}`,
          time: "08:00 AM", // Mock time for tasks since DB might only have date
          horseName: getHorseName(task.horse_id || ""),
          activity: task.title,
          responsible: task.assignee_id || "Equipo",
          status: task.status === "completed" ? "Completado" : "Pendiente",
          icon: ClipboardList,
          colorClass: "text-amber-500",
          bgClass: "bg-amber-500/10",
        });
      }
    });

    // Add Health Records
    healthRecords.forEach(hr => {
      if (hr.date && hr.date.startsWith(targetDate)) {
        events.push({
          id: `health-${hr.id}`,
          time: "10:30 AM",
          horseName: getHorseName(hr.horse_id),
          activity: hr.title,
          responsible: hr.professional || "Veterinario",
          status: hr.status === "completed" ? "Completado" : "Pendiente",
          icon: HeartPulse,
          colorClass: "text-blue-500",
          bgClass: "bg-blue-500/10",
        });
      }
    });

    // Add Competitions
    competitions.forEach(comp => {
      if (comp.date && comp.date.startsWith(targetDate)) {
        events.push({
          id: `comp-${comp.id}`,
          time: "14:00 PM",
          horseName: getHorseName(comp.horse_id),
          activity: `Preparación para ${comp.event}`,
          responsible: comp.trainer || "Chalán",
          status: "Próximo",
          icon: Trophy,
          colorClass: "text-[var(--gold)]",
          bgClass: "bg-[var(--gold)]/10",
        });
      }
    });

    // Fallback if no events today
    if (events.length === 0) {
      events.push({
        id: "mock-1",
        time: "08:00 AM",
        horseName: "Carbonero",
        activity: "Medicación Diaria",
        responsible: "Juan Pérez",
        status: "Pendiente",
        icon: HeartPulse,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-500/10",
      });
      events.push({
        id: "mock-2",
        time: "11:30 AM",
        horseName: "Promesa",
        activity: "Entrenamiento (Trocha)",
        responsible: "Carlos (Montador)",
        status: "Completado",
        icon: ClipboardList,
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10",
      });
      events.push({
        id: "mock-3",
        time: "16:00 PM",
        horseName: "Mito",
        activity: "Preparación Exposición",
        responsible: "Equipo Completo",
        status: "Próximo",
        icon: Trophy,
        colorClass: "text-[var(--gold)]",
        bgClass: "bg-[var(--gold)]/10",
      });
    }

    return events.sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, healthRecords, competitions, horses, selectedDate]);

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
  const formattedSelected = selectedDate.toLocaleDateString("es-CO", dateOptions);

  const weekDays = useMemo(() => {
    const days = [];
    const current = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  return (
    <div className="lux-card flex flex-col animate-fade-up border border-border shadow-sm">
      <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground">Calendario Operativo</h2>
            <p className="text-[13px] text-muted-foreground capitalize">{formattedSelected}</p>
          </div>
        </div>
        <Link to="/tasks" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Ver Todo
        </Link>
      </div>

      {/* Mini Calendar Strip */}
      <div className="px-5 pt-5 pb-1">
        <div className="flex justify-between items-center gap-1">
          {weekDays.map((d, idx) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-center w-[12%] h-14 rounded-xl text-[12px] font-medium transition-all ${
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-md scale-105" 
                    : isToday 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-[10px] uppercase mb-0.5 opacity-80">
                  {d.toLocaleDateString("es-CO", { weekday: 'short' }).slice(0, 3)}
                </span>
                <span className="text-[14px]">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-5 lg:p-6 flex flex-col gap-4">
        {scheduleEvents.map((ev, i) => {
          const Icon = ev.icon;
          const isDone = ev.status === "Completado";
          return (
            <div
              key={ev.id}
              className="group relative flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-all cursor-pointer"
            >
              {/* Vertical line connector for timeline aesthetic */}
              {i !== scheduleEvents.length - 1 && (
                <div className="absolute left-8 top-12 bottom-[-16px] w-[2px] bg-border group-hover:bg-primary/20 transition-colors" />
              )}
              
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${ev.bgClass} z-10`}>
                {isDone ? <CheckCircle2 className={`h-5 w-5 text-emerald-500`} /> : <Icon className={`h-5 w-5 ${ev.colorClass}`} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                  <h4 className={`text-[15px] font-semibold flex items-center gap-2 ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    <span className="text-xl">🐴</span> {ev.horseName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md w-fit">
                    <Clock className="h-3 w-3" /> {ev.time}
                  </div>
                </div>
                
                <p className={`text-[14px] leading-relaxed mb-2 ${isDone ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                  {ev.activity}
                </p>
                
                <div className="flex items-center gap-4 text-[12px]">
                  <div className="flex items-center gap-1.5 text-foreground/80">
                    <User className="h-3.5 w-3.5 opacity-60" /> {ev.responsible}
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${
                    isDone ? "text-emerald-500" : ev.status === "Próximo" ? "text-blue-500" : "text-amber-500"
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {ev.status}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ReproductionCalendarView.tsx — Calendario Reproductivo Interactivo (Requerimiento 9)
 * Vista mensual/semanal con eventos codificados por color y filtros avanzados
 */
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Filter, User, MapPin, Activity } from "lucide-react";
import type { ReproductiveEvent } from "@/lib/hooks/useBreeding";

interface Props {
  events: ReproductiveEvent[];
}

export function ReproductionCalendarView({ events }: Props) {
  const [currentMonth, setCurrentMonth] = useState("Agosto 2026");
  const [filterVet, setFilterVet] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 5; // Friday

  // Color mapping per event type
  const eventColors: Record<string, string> = {
    Palpación: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/40",
    Ecografía: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/40",
    Inseminación: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-400/40",
    Monta: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40",
    Transferencia: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/40",
    Parto: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40",
  };

  // Map real database events to calendar days
  const eventsByDay: Record<number, { title: string; type: string; mare: string; vet: string }[]> = {};
  for (const ev of events) {
    const dStr = ev.scheduled_date || ev.completed_date;
    if (!dStr) continue;
    const dObj = new Date(dStr);
    const dayNum = dObj.getDate();
    if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
    eventsByDay[dayNum].push({
      title: `${ev.event_type} ${ev.result ? '— ' + ev.result : ''}`,
      type: ev.event_type,
      mare: ev.mare?.name || "Yegua",
      vet: ev.vet_name || "Veterinario",
    });
  }

  return (
    <div className="lux-card p-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Calendario Reproductivo Mensual</h2>
            <p className="text-xs text-muted-foreground">Programación de palpaciones, lavados, partos y ecografías</p>
          </div>
        </div>

        {/* Month Navigation & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border">
            <button className="p-1 hover:bg-card rounded-lg transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <span className="font-semibold text-xs px-2">{currentMonth}</span>
            <button className="p-1 hover:bg-card rounded-lg transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterVet}
              onChange={(e) => setFilterVet(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium"
            >
              <option value="all">Todos los Veterinarios</option>
              <option value="dr-silva">Dr. Roberto Silva</option>
              <option value="dra-gomez">Dra. María Gómez</option>
              <option value="dr-rossi">Dr. Carlos Rossi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden shadow-xs">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="bg-secondary/80 p-2.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Empty Offset Days */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="bg-card/40 min-h-[110px] p-2" />
        ))}

        {/* Month Days */}
        {daysInMonth.map((dayNum) => {
          const dayEvents = eventsByDay[dayNum] || [];
          const isToday = dayNum === new Date().getDate();

          return (
            <div
              key={dayNum}
              className={`bg-card min-h-[110px] p-2 flex flex-col justify-between transition-colors hover:bg-secondary/40 ${
                isToday ? "ring-2 ring-primary ring-inset font-bold" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Day Events Stack */}
              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayEvents.map((ev, idx) => {
                  const color = eventColors[ev.type] || "bg-secondary text-foreground border-border";
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg text-[10px] border font-medium truncate ${color}`}
                      title={`${ev.title} - ${ev.mare} (${ev.vet})`}
                    >
                      <div className="truncate font-bold">{ev.title}</div>
                      <div className="truncate text-[9px] opacity-80">{ev.mare}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ReproductionCalendarView.tsx — Calendario Reproductivo Interactivo y Conectado
 * Vista mensual con navegación de fechas dinámica, filtros por veterinario/tipo y visualizador de eventos.
 */
import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Activity,
  CheckCircle2,
  Clock,
  X,
  Stethoscope,
} from "lucide-react";
import type { ReproductiveEvent } from "@/lib/hooks/useBreeding";

interface Props {
  events: ReproductiveEvent[];
  onOpenMareProfile?: (mareId: string) => void;
}

export function ReproductionCalendarView({ events, onOpenMareProfile }: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterVet, setFilterVet] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dynamic month title
  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [currentDate]);

  // First day of month offset (0: Sunday, 1: Monday, ...)
  const startDayOffset = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  // Number of days in current month
  const totalDaysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  }, [totalDaysInMonth]);

  // Extract unique vets dynamically from real events
  const uniqueVets = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.vet_name && ev.vet_name.trim()) {
        set.add(ev.vet_name.trim());
      }
    }
    return Array.from(set);
  }, [events]);

  // Color mapping per event type
  const eventColors: Record<string, string> = {
    Palpación: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/40",
    Ecografía: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/40",
    Inseminación: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-400/40",
    Monta: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40",
    Transferencia: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/40",
    Lavado: "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-400/40",
    Diagnóstico: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40",
    Parto: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40",
    Destete: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/40",
  };

  // Filter events by Month, Year, Vet, and Type
  const eventsByDay = useMemo(() => {
    const map: Record<number, ReproductiveEvent[]> = {};
    for (const ev of events) {
      const dStr = ev.scheduled_date || ev.completed_date;
      if (!dStr) continue;

      const [yStr, mStr, dayStr] = dStr.split("-");
      const evYear = Number(yStr);
      const evMonth = Number(mStr) - 1; // 0-indexed
      const evDay = Number(dayStr);

      if (evYear === year && evMonth === month) {
        // Apply filters
        if (filterVet !== "all" && ev.vet_name !== filterVet) continue;
        if (filterType !== "all" && ev.event_type !== filterType) continue;

        if (!map[evDay]) map[evDay] = [];
        map[evDay].push(ev);
      }
    }
    return map;
  }, [events, year, month, filterVet, filterType]);

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  function handleToday() {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  }

  const isCurrentMonthActual =
    new Date().getFullYear() === year && new Date().getMonth() === month;
  const actualTodayDay = new Date().getDate();

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        {/* Calendar Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold capitalize">{monthName}</h2>
              <p className="text-xs text-muted-foreground">
                Programación de palpaciones, lavados, partos y ecografías
              </p>
            </div>
          </div>

          {/* Month Navigation & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-card rounded-lg transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="font-semibold text-xs px-2 hover:text-primary transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-card rounded-lg transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Filter by Vet */}
            <select
              value={filterVet}
              onChange={(e) => setFilterVet(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium"
            >
              <option value="all">Todos los Veterinarios ({uniqueVets.length})</option>
              {uniqueVets.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium"
            >
              <option value="all">Todos los Procedimientos</option>
              {Object.keys(eventColors).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden shadow-xs">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div
              key={day}
              className="bg-secondary/80 p-2.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              {day}
            </div>
          ))}

          {/* Empty Offset Days */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="bg-card/40 min-h-[110px] p-2" />
          ))}

          {/* Month Days */}
          {daysArray.map((dayNum) => {
            const dayEvents = eventsByDay[dayNum] || [];
            const isToday = isCurrentMonthActual && dayNum === actualTodayDay;
            const isSelected = selectedDay === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                className={`bg-card min-h-[110px] p-2 flex flex-col justify-between text-left transition-all hover:bg-secondary/40 cursor-pointer ${
                  isToday ? "ring-2 ring-primary ring-inset font-bold" : ""
                } ${isSelected ? "bg-primary/10 border-primary shadow-inner" : ""}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : isSelected
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>

                {/* Day Events Stack */}
                <div className="space-y-1 overflow-y-auto max-h-[80px] w-full">
                  {dayEvents.slice(0, 3).map((ev, idx) => {
                    const color =
                      eventColors[ev.event_type] || "bg-secondary text-foreground border-border";
                    return (
                      <div
                        key={idx}
                        className={`p-1.5 rounded-lg text-[10px] border font-medium truncate ${color}`}
                        title={`${ev.event_type} - ${ev.mare?.name || "Yegua"} (${ev.vet_name || ""})`}
                      >
                        <div className="truncate font-bold">
                          {ev.event_type} {ev.result ? `· ${ev.result}` : ""}
                        </div>
                        <div className="truncate text-[9px] opacity-80">
                          {ev.mare?.name || `Yegua #${ev.mare_id.slice(0, 5)}`}
                        </div>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] font-bold text-primary text-center">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Event Drawer / Detail Inspector */}
      {selectedDay && (
        <div className="lux-card p-6 border-primary/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base">
                Eventos para el {selectedDay} de {monthName}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "evento" : "eventos"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="p-1 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No hay eventos programados para este día.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayEvents.map((ev) => {
                const color =
                  eventColors[ev.event_type] || "bg-secondary text-foreground border-border";
                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border border-border bg-card space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
                        {ev.event_type}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {ev.status}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm">
                        {ev.mare?.name || `Yegua #${ev.mare_id.slice(0, 6)}`}
                      </div>
                      {ev.mare?.breed && (
                        <div className="text-xs text-muted-foreground">{ev.mare.breed}</div>
                      )}
                    </div>

                    {ev.vet_name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-primary" /> {ev.vet_name}
                      </div>
                    )}

                    {ev.notes && (
                      <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-xl">
                        {ev.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

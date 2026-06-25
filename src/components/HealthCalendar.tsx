import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HealthRecord } from "@/lib/hooks/useHealth";
import { eventTypeColors, eventTypeLabels } from "@/lib/hooks/useHealth";

type Props = {
  events: HealthRecord[];
  onDayClick?: (date: string, dayEvents: HealthRecord[]) => void;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return dateStr;
}

export function HealthCalendar({ events, onDayClick }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday=0, Sunday=6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: { day: number; dateStr: string; inMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push({
        day: d,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        inMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        inMonth: true,
      });
    }

    // Next month padding (fill to 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      cells.push({
        day: d,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        inMonth: false,
      });
    }

    return cells;
  }, [currentMonth, currentYear]);

  // Map events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, HealthRecord[]> = {};
    events.forEach((e) => {
      const d = e.date ? normalizeDateStr(e.date) : "";
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    });
    return map;
  }, [events]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  return (
    <div className="lux-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <button
          onClick={prevMonth}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-display text-xl">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDay;
          const uniqueTypes = [...new Set(dayEvents.map((e) => e.type))];

          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedDay(cell.dateStr);
                onDayClick?.(cell.dateStr, dayEvents);
              }}
              className={`
                relative h-[72px] p-1.5 border-b border-r border-border/50 text-left transition-all
                ${!cell.inMonth ? "opacity-30" : ""}
                ${isSelected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-secondary/40"}
                ${isToday ? "bg-primary/5" : ""}
              `}
            >
              <span
                className={`
                  text-[12px] font-medium inline-flex items-center justify-center
                  ${isToday ? "h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px]" : ""}
                `}
              >
                {cell.day}
              </span>

              {/* Event dots */}
              {uniqueTypes.length > 0 && (
                <div className="flex gap-[3px] mt-0.5 flex-wrap">
                  {uniqueTypes.slice(0, 4).map((type, i) => (
                    <span
                      key={i}
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: eventTypeColors[type] || eventTypeColors.other }}
                      title={eventTypeLabels[type] || type}
                    />
                  ))}
                  {uniqueTypes.length > 4 && (
                    <span className="text-[8px] text-muted-foreground">+{uniqueTypes.length - 4}</span>
                  )}
                </div>
              )}

              {/* Event count badge */}
              {dayEvents.length > 0 && (
                <span className="absolute top-1 right-1.5 text-[9px] font-bold text-muted-foreground">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events panel */}
      {selectedDay && (
        <div className="border-t border-border p-4 bg-secondary/20 max-h-[240px] overflow-y-auto">
          <h4 className="text-[13px] font-semibold text-muted-foreground mb-3">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-CO", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-[12px] text-muted-foreground italic">No events scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: eventTypeColors[e.type] || eventTypeColors.other }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {e.horse_name} · {e.professional || "—"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                    style={{
                      backgroundColor: `${eventTypeColors[e.type] || eventTypeColors.other}20`,
                      color: eventTypeColors[e.type] || eventTypeColors.other,
                    }}
                  >
                    {eventTypeLabels[e.type] || e.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-border p-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(eventTypeLabels).filter(([k]) => !["vet_visit", "other"].includes(k)).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: eventTypeColors[key] }}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

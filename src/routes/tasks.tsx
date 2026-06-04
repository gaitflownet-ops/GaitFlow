import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Plus, GripVertical, Clock, User2, Filter } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — GateFlow" },
      { name: "description", content: "Daily task engine for your stable team." },
    ],
  }),
  component: TasksPage,
});

type Status = "Backlog" | "Today" | "In Progress" | "Done";
type Task = {
  id: string;
  title: string;
  horse?: string;
  assignee: string;
  due: string;
  priority: "high" | "med" | "low";
  status: Status;
};

const seed: Task[] = [
  { id: "t1", title: "Morning feeding — Block A", horse: "Northern Flame", assignee: "Carlos R.", due: "07:00", priority: "high", status: "Today" },
  { id: "t2", title: "Lunge 25 min", horse: "Silver Aria", assignee: "Mia O.", due: "09:30", priority: "med", status: "Today" },
  { id: "t3", title: "Farrier — front shoes", horse: "Royal Cadence", assignee: "Tom H.", due: "11:00", priority: "high", status: "In Progress" },
  { id: "t4", title: "Vet recheck", horse: "Madeira", assignee: "Dr. Patel", due: "Tomorrow", priority: "med", status: "Backlog" },
  { id: "t5", title: "Wash & braid", horse: "Northern Flame", assignee: "Sofia K.", due: "Fri", priority: "low", status: "Backlog" },
  { id: "t6", title: "Update Coggins paperwork", assignee: "Marisol V.", due: "Done", priority: "med", status: "Done" },
  { id: "t7", title: "Hand-walk 20 min", horse: "Lyra", assignee: "Carlos R.", due: "16:00", priority: "low", status: "In Progress" },
];

const columns: Status[] = ["Backlog", "Today", "In Progress", "Done"];

function TasksPage() {
  const [tasks, setTasks] = useState(seed);
  const [dragging, setDragging] = useState<string | null>(null);

  const onDrop = (status: Status) => {
    if (!dragging) return;
    setTasks((prev) => prev.map((t) => (t.id === dragging ? { ...t, status } : t)));
    setDragging(null);
  };

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section D · Task Engine</div>
          <h1 className="font-display text-4xl mt-1">Today at the barn</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Drag tasks across columns to update status. Repeating templates feed the
            collaborator and admin views automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> New task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col)}
              className="rounded-3xl bg-secondary/40 border border-border p-4 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-display text-lg">{col}</h3>
                <span className="text-[11px] text-muted-foreground bg-background rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragging(t.id)}
                    className="lux-card p-4 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium leading-snug">{t.title}</div>
                        {t.horse && (
                          <div className="mt-1 text-[11px] tracking-widest uppercase text-primary">
                            {t.horse}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User2 className="h-3 w-3" /> {t.assignee}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {t.due}
                          </span>
                        </div>
                        <span
                          className={`mt-2 inline-block h-1 w-10 rounded-full ${
                            t.priority === "high"
                              ? "bg-destructive"
                              : t.priority === "med"
                                ? "bg-[var(--gold)]"
                                : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

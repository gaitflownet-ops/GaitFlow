import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useHorses } from "@/lib/hooks/useHorses";
import { useTasks } from "@/lib/hooks/useTasks";
import { forecastHealthRiskIndex } from "@/lib/holtWinters";
import {
  CheckCircle2, Clock, AlertTriangle, Sprout, DollarSign,
  Baby, ShoppingBag, MapPin, Brain, TrendingUp, ArrowUpRight
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [{ title: "Flow Engine — GateFlow" }],
  }),
  component: TasksPage,
});

// HW: Mock seasonal incidents data for health risk
const healthIncidents = [5, 6, 2, 1, 0, 1, 2, 4, 3, 2, 6, 8, 4, 5];

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-500/10 text-red-500 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Low: "bg-green-500/10 text-green-500 border-green-500/20",
};

const STATUS_ICONS = {
  Completed: <CheckCircle2 className="text-green-500 h-5 w-5" />,
  "In Progress": <Clock className="text-blue-400 h-5 w-5" />,
  Overdue: <AlertTriangle className="text-red-400 h-5 w-5" />,
  Pending: <Clock className="text-muted-foreground h-5 w-5" />,
};

function TasksPage() {
  const { state } = useApp();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: horses = [] } = useHorses();

  const pending = tasks.filter((t) => t.status === "Pending").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const overdue = tasks.filter((t) => t.status === "Overdue").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;

  const hwRisk = forecastHealthRiskIndex(healthIncidents);

  // Bar chart data: task distribution
  const barData = [
    { name: "Pending", value: pending, fill: "#94a3b8" },
    { name: "In Progress", value: inProgress, fill: "#60a5fa" },
    { name: "Overdue", value: overdue, fill: "#f87171" },
    { name: "Completed", value: completed, fill: "#34d399" },
  ];

  const allStatuses = ["Pending", "In Progress", "Overdue", "Completed"] as const;

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Flow Engine</h1>
          <p className="text-muted-foreground mt-2">
            {tasks.length} tasks · {overdue > 0 ? `${overdue} overdue` : "All on track"}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
          + New Task
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending", value: pending, color: "text-muted-foreground" },
          { label: "In Progress", value: inProgress, color: "text-blue-400" },
          { label: "Overdue", value: overdue, color: "text-red-400" },
          { label: "Completed", value: completed, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="lux-card p-4 text-center">
            <div className={`font-display text-4xl ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Bar chart */}
        <div className="lg:col-span-2 lux-card p-6">
          <h3 className="font-display text-xl mb-4">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* HW health risk */}
        <div className="lux-card p-6 bg-gradient-to-br from-background to-secondary/30">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl">HW Health Risk</h3>
          </div>
          <div className="text-center py-4">
            <div className={`font-display text-5xl ${hwRisk > 6 ? "text-red-400" : hwRisk > 4 ? "text-amber-400" : "text-green-400"}`}>
              {hwRisk.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">/ 10 risk index</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${hwRisk > 6 ? "bg-red-400" : hwRisk > 4 ? "bg-amber-400" : "bg-green-400"}`}
              style={{ width: `${hwRisk * 10}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {hwRisk > 5 ? "⚠️ Schedule preventive vet checks" : "✅ Herd health stable"}
          </p>
          <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-4">
            Powered by Triple Exponential Smoothing (Holt-Winters) on 14-month incident history.
          </div>
        </div>
      </div>

      {/* Task list grouped by status */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-secondary rounded-2xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="lux-card p-12 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="font-display text-2xl">No tasks yet</h3>
          <p className="mt-2">Create your first task to start managing daily operations.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {allStatuses.map((status) => {
            const grouped = tasks.filter((t) => t.status === status);
            if (grouped.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="font-display text-xl mb-4 flex items-center gap-2">
                  {STATUS_ICONS[status]}
                  {status}
                  <span className="text-base text-muted-foreground font-sans ml-1">({grouped.length})</span>
                </h3>
                <div className="space-y-3">
                  {grouped.map((task) => (
                    <div key={task.id} className="lux-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group">
                      <div className="shrink-0">{STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? null}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground flex gap-3 mt-0.5">
                          {(task as any).horses && <span>Horse: {(task as any).horses.name}</span>}
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {task.priority && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${PRIORITY_COLORS[task.priority] ?? "bg-secondary text-foreground"}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

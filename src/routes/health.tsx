import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useMemo } from "react";
import {
  useHealthRecords,
  useUpcomingHealthEvents,
  useDeleteHealthRecord,
  eventTypeColors,
  eventTypeLabels,
} from "@/lib/hooks/useHealth";
import type { HealthRecord } from "@/lib/hooks/useHealth";
import { useHorses } from "@/lib/hooks/useHorses";
import { useTasks } from "@/lib/hooks/useTasks";
import {
  usePharmaceuticals,
  useLowStockAlerts,
  useDeletePharmaceutical,
} from "@/lib/hooks/usePharmaceuticals";
import type { Pharmaceutical } from "@/lib/hooks/usePharmaceuticals";
import { HealthCalendar } from "@/components/HealthCalendar";
import { PharmaceuticalCard } from "@/components/PharmaceuticalCard";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import { EditHealthRecordModal } from "@/components/modals/EditHealthRecordModal";
import { AddPharmaceuticalModal } from "@/components/modals/AddPharmaceuticalModal";
import {
  HeartPulse,
  AlertCircle,
  Syringe,
  Wrench,
  Stethoscope,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Package,
  Shield,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
  Pill,
  Bug,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Sanidad — GaitFlow" },
      {
        name: "description",
        content: "Calendario médico interactivo, registros veterinarios y farmacia para tus ejemplares.",
      },
    ],
  }),
  component: Health,
});

// ── Icon map ──
const typeIcon: Record<string, React.ElementType> = {
  vaccination: Syringe,
  deworming: Bug,
  vet: Stethoscope,
  vet_visit: Stethoscope,
  farrier: Wrench,
  dental: Stethoscope,
  hoof_care: Wrench,
  treatment: Pill,
  coggins: HeartPulse,
  xray: HeartPulse,
  other: HeartPulse,
};

const statusStyles: Record<string, string> = {
  clear: "text-emerald-400 bg-emerald-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  requires_followup: "text-red-400 bg-red-400/10",
  pending: "text-amber-400 bg-amber-400/10",
};

const filterTypes = [
  "Todos",
  "Vacunación",
  "Visitas Vet",
  "Herrería",
  "Odontología",
  "Desparasitación",
  "Tratamientos",
  "Cascos",
] as const;

const filterMap: Record<string, string | null> = {
  Todos: null,
  Vacunación: "vaccination",
  "Visitas Vet": "vet",
  Herrería: "farrier",
  Odontología: "dental",
  Desparasitación: "deworming",
  Tratamientos: "treatment",
  Cascos: "hoof_care",
};

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

function Health() {
  // ── State ──
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);
  const [pharmaModalOpen, setPharmaModalOpen] = useState(false);
  const [editPharma, setEditPharma] = useState<Pharmaceutical | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Todos");
  const [horseFilter, setHorseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"calendar" | "timeline" | "inventory">("timeline");

  // ── Queries ──
  const { data: healthRecords = [], isLoading, isError, error, refetch } = useHealthRecords();
  const { data: upcomingEvents = [] } = useUpcomingHealthEvents();
  const { data: horses = [] } = useHorses();
  const { data: pharmaceuticals = [] } = usePharmaceuticals();
  const { data: lowStockItems = [] } = useLowStockAlerts();
  const { data: tasks = [] } = useTasks();
  const deleteRecord = useDeleteHealthRecord();
  const deletePharma = useDeletePharmaceutical();

  // ── Computed ──
  const calendarEvents = useMemo(() => {
    const records = healthRecords.map((r) => ({
      ...r,
      date: r.date ? normalizeDateStr(r.date) : "",
    }));

    const taskEvents = tasks
      .filter((t) => t.due_date && t.status !== "completed")
      .map((t) => ({
        id: t.id,
        date: t.due_date ? t.due_date.slice(0, 10) : "",
        type: "task",
        title: `Task: ${t.title}`,
        horse_name: t.horses?.name || "Todos los Ejemplares",
        professional: t.profiles?.name || "Sin asignar",
        notes: t.description || t.notes || "",
        status: t.status || "pending",
        created_at: new Date().toISOString(),
      })) as unknown as HealthRecord[];

    return [...records, ...taskEvents];
  }, [healthRecords, tasks]);
  const typeFilter = filterMap[activeFilter];
  const filteredRecords = healthRecords.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (horseFilter && r.horse_id !== horseFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.horse_name.toLowerCase().includes(q) ||
        r.professional?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const vaccineCount = healthRecords.filter(
    (r) => r.type === "vaccination" && (r.status === "completed" || r.status === "clear")
  ).length;

  const overdueEvents = upcomingEvents.filter((e) => {
    if (!e.next_due) return false;
    return e.next_due < new Date().toISOString().slice(0, 10);
  });

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro de sanidad?")) return;
    try {
      await deleteRecord.mutateAsync(id);
      toast.success("Registro eliminado");
    } catch {
      toast.error("No se pudo eliminar el registro");
    }
  };

  const handleDeletePharma = async (id: string) => {
    if (!confirm("¿Eliminar este producto de farmacia?")) return;
    try {
      await deletePharma.mutateAsync(id);
      toast.success("Producto eliminado");
    } catch {
      toast.error("No se pudo eliminar el producto");
    }
  };

  const handleRestockPharma = (item: Pharmaceutical) => {
    setEditPharma(item);
    setPharmaModalOpen(true);
  };

  return (
    <AppShell>
      {/* ══════════════════ HEADER ══════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" />
            Bienestar Equino
          </div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Sanidad
            </span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
            Calendario médico interactivo, registros veterinarios, cronogramas de desparasitación y farmacia, todo en un solo lugar.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setPharmaModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-foreground px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Package className="h-4 w-4" /> Agregar medicamento
          </button>
          <button
            id="add-health-record-btn"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Agregar registro
          </button>
        </div>
      </div>

      {/* ══════════════════ STATS ROW ══════════════════ */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            k: "Total de registros",
            v: healthRecords.length.toString(),
            i: HeartPulse,
            color: "text-primary",
          },
          {
            k: "Vacunaciones hechas",
            v: vaccineCount.toString(),
            i: Shield,
            color: "text-emerald-400",
          },
          {
            k: "Próximos · 30d",
            v: upcomingEvents.length.toString(),
            i: Clock,
            color: "text-amber-400",
          },
          {
            k: "Alertas poco stock",
            v: lowStockItems.length.toString(),
            i: AlertTriangle,
            color: lowStockItems.length > 0 ? "text-red-400" : "text-muted-foreground",
          },
        ].map(({ k, v, i: I, color }) => (
          <div key={k} className="lux-card p-5 flex items-start justify-between group hover:ring-1 hover:ring-primary/20 transition-all">
            <div>
              <div className="eyebrow">{k}</div>
              <div className="font-display text-3xl mt-2">{v}</div>
            </div>
            <span className={`grid h-10 w-10 place-items-center rounded-full bg-secondary ${color}`}>
              <I className="h-[18px] w-[18px]" />
            </span>
          </div>
        ))}
      </div>

      {/* ══════════════════ ALERTS BANNER ══════════════════ */}
      {(overdueEvents.length > 0 || lowStockItems.length > 0) && (
        <div className="mt-6 space-y-3">
          {overdueEvents.length > 0 && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10 text-red-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-red-400">
                  {overdueEvents.length} evento{overdueEvents.length > 1 ? "s" : ""} de sanidad atrasado{overdueEvents.length > 1 ? "s" : ""}
                </p>
                {overdueEvents.slice(0, 3).map((r) => (
                  <p key={r.id} className="text-[13px] text-muted-foreground mt-1">
                    {r.horse_name} — {r.title} (vencido {r.next_due})
                  </p>
                ))}
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="ml-auto shrink-0 rounded-full bg-red-500 text-white px-4 py-2 text-[13px] font-medium hover:opacity-95"
              >
                Programar ahora
              </button>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/10 text-amber-400 shrink-0">
                <Package className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-amber-400">
                  Poco stock: {lowStockItems.map((i) => i.name).join(", ")}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveSection("inventory");
                }}
                className="ml-auto shrink-0 rounded-full bg-amber-500 text-white px-4 py-2 text-[13px] font-medium hover:opacity-95"
              >
                Ver inventario
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ SECTION TABS ══════════════════ */}
      <div className="mt-10 flex gap-1 bg-secondary/50 p-1 rounded-2xl w-fit">
        {(
          [
            { key: "calendar", label: "Calendario", icon: Calendar },
            { key: "timeline", label: "Línea de Tiempo", icon: HeartPulse },
            { key: "inventory", label: "Farmacia", icon: Package },
          ] as const
        ).map(({ key, label, icon: I }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
              activeSection === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <I className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ CALENDAR SECTION ══════════════════ */}
      {activeSection === "calendar" && (
        <div className="mt-6">
          <HealthCalendar events={calendarEvents} />
        </div>
      )}

      {/* ══════════════════ EVENT TIMELINE SECTION ══════════════════ */}
      {activeSection === "timeline" && (
        <div className="mt-6">
          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Type filter chips */}
            <div className="flex flex-wrap gap-2 flex-1">
              {filterTypes.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    activeFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Horse filter + search */}
            <div className="flex gap-2 shrink-0">
              <select
                className="lux-select text-[13px] min-w-[140px]"
                value={horseFilter}
                onChange={(e) => setHorseFilter(e.target.value)}
              >
                <option value="">Todos los ejemplares</option>
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="lux-input pl-9 text-[13px] w-[180px]"
                  placeholder="Buscar registros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Records list */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="lux-card p-8 flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-2xl">No se pudo cargar la historia clínica</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Revisa tu conexión."}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="lux-card p-12 text-center">
              <h3 className="font-display text-2xl">
                {healthRecords.length === 0 ? "Sin registros de sanidad aún" : "No hay coincidencias"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {healthRecords.length === 0
                  ? "Agrega la primera vacunación, visita al veterinario o herrería para iniciar la historia clínica."
                  : "Intenta ajustar los filtros o tu búsqueda."}
              </p>
              {healthRecords.length === 0 && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Agregar registro
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((r) => {
                const Icon = typeIcon[r.type] ?? HeartPulse;
                const statusClass = statusStyles[r.status ?? "pending"] || statusStyles.pending;
                const isExpanded = expanded === r.id;
                const dotColor = eventTypeColors[r.type] || eventTypeColors.other;

                return (
                  <div key={r.id} className="lux-card overflow-hidden group">
                    <button
                      id={`health-record-${r.id}`}
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      className="w-full text-left p-5 flex gap-4 hover:bg-secondary/20 transition-colors"
                    >
                      <span
                        className="grid h-11 w-11 place-items-center rounded-full shrink-0"
                        style={{ backgroundColor: `${dotColor}15` }}
                      >
                        <Icon className="h-[18px] w-[18px]" style={{ color: dotColor }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="font-display text-lg">{r.title}</h4>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {r.date}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                          <span className="font-medium text-foreground">{r.horse_name}</span>
                          {r.professional && (
                            <span className="text-muted-foreground">{r.professional}</span>
                          )}
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                            style={{
                              backgroundColor: `${dotColor}20`,
                              color: dotColor,
                            }}
                          >
                            {eventTypeLabels[r.type] || r.type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}
                          >
                            {r.status === "clear" || r.status === "completed"
                              ? "Completado"
                              : r.status === "requires_followup"
                                ? "Requiere seguimiento"
                                : "Por Hacer"}
                          </span>
                          {r.cost != null && r.cost > 0 && (
                            <span className="text-muted-foreground">${r.cost}</span>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditRecord(r);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecord(r.id);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                      )}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-border bg-secondary/10">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {r.diagnosis && (
                            <div>
                              <span className="eyebrow text-[10px]">Diagnóstico</span>
                              <p className="text-[14px] mt-1">{r.diagnosis}</p>
                            </div>
                          )}
                          {r.prescription && (
                            <div>
                              <span className="eyebrow text-[10px]">Prescripción</span>
                              <p className="text-[14px] mt-1">{r.prescription}</p>
                            </div>
                          )}
                          {r.dose && (
                            <div>
                              <span className="eyebrow text-[10px]">Dosis y Frecuencia</span>
                              <p className="text-[14px] mt-1">
                                {r.dose}
                                {r.frequency ? ` — ${r.frequency}` : ""}
                              </p>
                            </div>
                          )}
                          {r.product_used && (
                            <div>
                              <span className="eyebrow text-[10px]">Producto usado</span>
                              <p className="text-[14px] mt-1">
                                {r.product_used}
                                {r.product_quantity ? ` (${r.product_quantity} unidades)` : ""}
                              </p>
                            </div>
                          )}
                        </div>
                        {r.notes && (
                          <p className="text-[14px] text-muted-foreground leading-relaxed mt-4">
                            {r.notes}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3">
                          {r.next_due && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[12px]">
                              <Calendar className="h-3.5 w-3.5" />
                              Próximo: {r.next_due}
                            </div>
                          )}
                          {r.recurrence && r.recurrence !== "none" && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 text-teal-400 px-3 py-1 text-[12px]">
                              <Clock className="h-3.5 w-3.5" />
                              Recurrencia: {r.recurrence}
                            </div>
                          )}
                        </div>
                        {/* Attachments */}
                        {r.attachments && Array.isArray(r.attachments) && (r.attachments as any[]).length > 0 && (
                          <div className="mt-4">
                            <span className="eyebrow text-[10px]">Adjuntos</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(r.attachments as any[]).map((att: any, i: number) => (
                                <a
                                  key={i}
                                  href={att.url || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors"
                                >
                                  📎 {att.name || `File ${i + 1}`}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ PHARMACY INVENTORY SECTION ══════════════════ */}
      {activeSection === "inventory" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl">Inventario de Farmacia</h2>
              <p className="text-muted-foreground text-[13px] mt-1">
                Lleva el control de medicinas, vacunas y suministros. Se descuentan al usarse en sanidad.
              </p>
            </div>
            <button
              onClick={() => {
                setEditPharma(null);
                setPharmaModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Agregar producto
            </button>
          </div>

          {pharmaceuticals.length === 0 ? (
            <div className="lux-card p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-display text-2xl">No hay medicinas en inventario</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Agrega tu primera vacuna, desparasitante o medicina para iniciar a controlar el stock.
              </p>
              <button
                onClick={() => setPharmaModalOpen(true)}
                className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Agregar producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmaceuticals.map((item) => (
                <PharmaceuticalCard
                  key={item.id}
                  item={item}
                  onEdit={(p) => {
                    setEditPharma(p);
                    setPharmaModalOpen(true);
                  }}
                  onDelete={handleDeletePharma}
                  onRestock={handleRestockPharma}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ UPCOMING ALERTS SECTION ══════════════════ */}
      {upcomingEvents.length > 0 && activeSection === "timeline" && (
        <div className="mt-12">
          <h2 className="font-display text-2xl mb-5 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Próximos &amp; Atrasados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingEvents.slice(0, 9).map((e) => {
              const isOverdue =
                e.next_due != null && e.next_due < new Date().toISOString().slice(0, 10);
              const daysAway = e.next_due
                ? Math.ceil(
                    (new Date(e.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                : null;
              const isUrgent = daysAway !== null && daysAway <= 7 && daysAway > 0;
              const dotColor = eventTypeColors[e.type] || eventTypeColors.other;

              return (
                <div
                  key={e.id}
                  className={`lux-card p-4 border-l-[3px] ${
                    isOverdue
                      ? "border-l-red-500"
                      : isUrgent
                        ? "border-l-amber-500"
                        : "border-l-emerald-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {eventTypeLabels[e.type] || e.type}
                    </span>
                  </div>
                  <h4 className="font-display text-[15px]">{e.title}</h4>
                  <p className="text-[12px] text-muted-foreground mt-1">{e.horse_name}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold ${
                        isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {isOverdue
                        ? `Atrasado por ${Math.abs(daysAway!)} días`
                        : daysAway === 0
                          ? "Para hoy"
                          : `En ${daysAway} días`}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{e.next_due}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ MODALS ══════════════════ */}
      <AddHealthRecordModal open={addOpen} onOpenChange={setAddOpen} />
      <EditHealthRecordModal
        open={editRecord !== null}
        onOpenChange={(open) => {
          if (!open) setEditRecord(null);
        }}
        record={editRecord}
      />
      <AddPharmaceuticalModal
        open={pharmaModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPharmaModalOpen(false);
            setEditPharma(null);
          } else {
            setPharmaModalOpen(true);
          }
        }}
        editItem={editPharma}
      />

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

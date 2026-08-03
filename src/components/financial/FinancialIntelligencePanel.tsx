import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Award,
  DollarSign,
  Plus,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  useARAgingReport,
  useAPAgingReport,
  useHorsePnLReport,
  useBudgetVsActualReport,
  useCreateBudget,
} from "@/lib/hooks/useFinancialCenter";
import { useHorses } from "@/lib/hooks/useHorses";
import { formatCOPCompact } from "@/lib/financial/types";
import { toast } from "sonner";

const CATEGORIES_LIST = [
  "Alimentación y Forraje",
  "Veterinaria y Medicamentos",
  "Herrería",
  "Mantenimiento de Instalaciones",
  "Personal y Nómina",
  "Competencias y Transporte",
  "General",
];

export function FinancialIntelligencePanel() {
  const [activeSubTab, setActiveSubTab] = useState<"pnl" | "aging" | "budgets">("pnl");

  // Hooks
  const { data: horsePnL = [], isLoading: loadingPnL } = useHorsePnLReport();
  const { data: arAging = [], isLoading: loadingAR } = useARAgingReport();
  const { data: apAging = [], isLoading: loadingAP } = useAPAgingReport();
  const { data: budgetReport = [], isLoading: loadingBudget } = useBudgetVsActualReport();
  const createBudgetMutation = useCreateBudget();

  // Form para crear presupuesto
  const [newCat, setNewCat] = useState("Alimentación y Forraje");
  const [newBudget, setNewBudget] = useState("");
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget || Number(newBudget) <= 0) return toast.error("Ingresa un monto válido");
    try {
      await createBudgetMutation.mutateAsync({
        category: newCat,
        monthly_budget: Number(newBudget),
      });
      toast.success("Presupuesto guardado correctamente");
      setShowBudgetModal(false);
      setNewBudget("");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el presupuesto");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Sub-tabs Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-display font-semibold">Inteligencia Financiera Avanzada</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rentabilidad por ejemplar, antigüedad de cartera y control presupuestal ERP
          </p>
        </div>

        <div className="flex gap-2 bg-secondary/30 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("pnl")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "pnl"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award size={14} /> P&L por Caballo
          </button>
          <button
            onClick={() => setActiveSubTab("aging")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "aging"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={14} /> Antigüedad (Aging)
          </button>
          <button
            onClick={() => setActiveSubTab("budgets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "budgets"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 size={14} /> Presupuestos
          </button>
        </div>
      </div>

      {/* ── TAB 1: P&L POR CABALLO ── */}
      {activeSubTab === "pnl" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Award className="text-primary" size={18} />
              Estado de Resultados por Ejemplar (Ingresos − Gastos = Utilidad Neta)
            </h3>

            {loadingPnL ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Cargando rentabilidad por ejemplar...</div>
            ) : horsePnL.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No hay ingresos ni gastos asociados a caballos específicos aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase">
                      <th className="py-3 px-4">Ejemplar</th>
                      <th className="py-3 px-4 text-right">Ingresos</th>
                      <th className="py-3 px-4 text-right">Gastos</th>
                      <th className="py-3 px-4 text-right">Utilidad Neta</th>
                      <th className="py-3 px-4 text-right">Margen (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {horsePnL.map((row) => {
                      const isPositive = row.net_profit >= 0;
                      return (
                        <tr key={row.horse_id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">{row.horse_name}</td>
                          <td className="py-3 px-4 text-right font-medium text-emerald-600">
                            {formatCOPCompact(row.total_income)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-red-600">
                            {formatCOPCompact(row.total_expense)}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {formatCOPCompact(row.net_profit)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPositive
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                                  : "bg-red-500/10 text-red-600 border border-red-500/30"
                              }`}
                            >
                              {row.profit_margin_pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ANTIGÜEDAD DE SALDOS (A/R y A/P AGING) ── */}
      {activeSubTab === "aging" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cuentas por Cobrar (A/R) */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} /> Cuentas por Cobrar (Cartera Clientes)
            </h3>

            {loadingAR ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Cargando A/R Aging...</div>
            ) : arAging.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No hay facturas pendientes de cobro.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border font-bold text-muted-foreground uppercase">
                      <th className="py-2 px-3">Cliente</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-right">0-30</th>
                      <th className="py-2 px-3 text-right">31-60</th>
                      <th className="py-2 px-3 text-right">90+</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {arAging.map((ar) => (
                      <tr key={ar.contact_id} className="hover:bg-secondary/20">
                        <td className="py-2.5 px-3 font-semibold">{ar.contact_name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground">
                          {formatCOPCompact(ar.total_due)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCOPCompact(ar.current_0_30)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-600">{formatCOPCompact(ar.days_31_60)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">{formatCOPCompact(ar.days_90_plus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cuentas por Pagar (A/P) */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-red-600 dark:text-red-400">
              <TrendingDown size={18} /> Cuentas por Pagar (Deudas Proveedores)
            </h3>

            {loadingAP ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Cargando A/P Aging...</div>
            ) : apAging.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No hay cuentas por pagar pendientes.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border font-bold text-muted-foreground uppercase">
                      <th className="py-2 px-3">Proveedor / Cuenta</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-right">0-30</th>
                      <th className="py-2 px-3 text-right">31-60</th>
                      <th className="py-2 px-3 text-right">90+</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {apAging.map((ap) => (
                      <tr key={ap.contact_id || ap.contact_name} className="hover:bg-secondary/20">
                        <td className="py-2.5 px-3 font-semibold">{ap.contact_name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground">
                          {formatCOPCompact(ap.total_owed)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCOPCompact(ap.current_0_30)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-600">{formatCOPCompact(ap.days_31_60)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">{formatCOPCompact(ap.days_90_plus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: PRESUPUESTOS VS. REAL (BUDGET vs ACTUAL) ── */}
      {activeSubTab === "budgets" && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <BarChart3 className="text-primary" size={18} /> Control Presupuestal de Gastos (Budget vs. Actual)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoreo de ejecución anual y mensual con alertas automáticas de desviación
              </p>
            </div>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <Plus size={14} /> Definir Presupuesto
            </button>
          </div>

          {loadingBudget ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Cargando ejecución presupuestal...</div>
          ) : budgetReport.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No se han definido presupuestos para el año en curso. Haz clic en <strong>[+ Definir Presupuesto]</strong>.
            </div>
          ) : (
            <div className="space-y-4">
              {budgetReport.map((b) => {
                const pct = Math.min(b.execution_pct, 100);
                const isAlert = b.status_alert === "OVER_BUDGET";
                const isWarn = b.status_alert === "WARNING";
                const colorClass = isAlert
                  ? "bg-red-500"
                  : isWarn
                  ? "bg-amber-500"
                  : "bg-emerald-500";

                return (
                  <div key={b.category} className="p-4 rounded-xl border border-border bg-secondary/10 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {b.category}
                        {isAlert && (
                          <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold uppercase">
                            Excedido
                          </span>
                        )}
                        {isWarn && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold uppercase">
                            Alerta (80%+)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-muted-foreground">
                          Gasto anual acumulado: <strong className="text-foreground">{formatCOPCompact(b.actual_spent)}</strong> de {formatCOPCompact(b.annual_budget)} ({b.execution_pct}% anual)
                        </div>
                        <div className="text-[11px] text-primary font-semibold mt-0.5">
                          Gasto este mes: {formatCOPCompact(b.monthly_spent || 0)} de {formatCOPCompact(b.monthly_budget)} mensual
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Presupuesto Mensual: <strong className="text-foreground">{formatCOPCompact(b.monthly_budget)}</strong> / mes</span>
                      <span>Presupuesto Anual (12m): <strong className="text-foreground">{formatCOPCompact(b.annual_budget)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Definir Presupuesto */}
          {showBudgetModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h3 className="font-semibold text-lg">Definir Presupuesto de Gasto</h3>
                <form onSubmit={handleSaveBudget} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                      Categoría
                    </label>
                    <select
                      className="form-input text-sm w-full"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                    >
                      {CATEGORIES_LIST.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                      Presupuesto Mensual (COP)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 500000"
                      className="form-input text-sm w-full"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                      * El sistema proyectará automáticamente el presupuesto anual ({newBudget ? formatCOPCompact(Number(newBudget) * 12) : '$0'} en 12 meses) para auditar el gasto anual y el del mes actual.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBudgetModal(false)}
                      className="btn-ghost text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createBudgetMutation.isPending}
                      className="btn-primary text-xs"
                    >
                      Guardar Presupuesto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

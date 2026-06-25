import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { forecastFinancials } from "@/lib/holtWinters";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Brain, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useExpenses, useCreateExpense, usePayments, useCreatePayment, useFinanceAggregates, useCreateInvoice } from "@/lib/hooks/useFinance";
import { useHorses } from "@/lib/hooks/useHorses";
import { Modal } from "@/components/modals/Modal";

export const Route = createFileRoute("/financials")({
  head: () => ({
    meta: [{ title: "Finanzas — GaitFlow" }],
  }),
  component: FinancialsPage,
});

interface Invoice {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string | null;
}

function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

function FinancialsPage() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: aggregates, isLoading: aggregatesLoading } = useFinanceAggregates();
  const { data: horses = [] } = useHorses();
  const createInvoice = useCreateInvoice();
  const createExpense = useCreateExpense();
  const createPayment = useCreatePayment();

  const [tab, setTab] = useState<"Income" | "Expense" | "Reporting">("Income");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"invoice" | "expense" | "payment">("invoice");

  // Form states
  const [invType, setInvType] = useState("Income");
  const [invCategory, setInvCategory] = useState("Pensión / Alojamiento");
  const [invAmount, setInvAmount] = useState("");
  const [invNotes, setInvNotes] = useState("");
  const [invDueDate, setInvDueDate] = useState(new Date().toISOString().slice(0, 10));

  const [expCategory, setExpCategory] = useState("Veterinaria y Sanidad");
  const [expAmount, setExpAmount] = useState("");
  const [expHorseId, setExpHorseId] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Historical revenue (mock — adjusted to COP values)
  const historicalRevenue = [
    80000000, 85000000, 95000000, 105000000, 90000000, 75000000, 70000000, 72000000, 78000000, 88000000, 92000000, 98000000, 82000000,
    86000000, 96000000,
  ];
  const nextRevenues = forecastFinancials(historicalRevenue, 3);
  const nextMonth = nextRevenues[0];

  // Build chart data (past 12 months + 3 projected)
  const now = new Date();
  const chartData = Array.from({ length: 15 }, (_, i) => {
    const isProjected = i >= 12;
    const monthIdx = (now.getMonth() - 11 + i + 12) % 12;
    return {
      month: MONTHS[monthIdx],
      actual: !isProjected ? historicalRevenue[i] : undefined,
      forecast: isProjected ? nextRevenues[i - 12] : undefined,
    };
  });

  const income = invoices.filter((inv) => inv.type === "Income");
  const expensesList = invoices.filter((inv) => inv.type === "Expense");
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expensesList.reduce((s, e) => s + e.amount, 0) + (aggregates?.totalCost || 0);
  const net = totalIncome - totalExpense;

  const filteredInvoices = invoices.filter((inv) => inv.type === tab);

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === "invoice") {
      await createInvoice.mutateAsync({
        farm_id: "live-oak-stables", // Placeholder
        type: invType,
        category: invCategory,
        amount: Number(invAmount) || 0,
        notes: invNotes || null,
        due_date: invDueDate || null,
        status: invType === "Income" ? "Paid" : "Unpaid",
        currency: "COP",
      });
      setInvAmount("");
      setInvNotes("");
    } else if (modalType === "expense") {
      await createExpense.mutateAsync({
        category: expCategory,
        amount: Number(expAmount) || 0,
        date: expDate,
        horse_id: expHorseId || null,
      });
      setExpAmount("");
      setExpHorseId("");
    } else if (modalType === "payment") {
      await createPayment.mutateAsync({
        invoice_id: payInvoiceId,
        amount: Number(payAmount) || 0,
        method: payMethod,
        date: payDate,
      });
      setPayAmount("");
      setPayInvoiceId("");
    }

    setModalOpen(false);
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-4">
        <div>
          <div className="eyebrow">Operativo</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Núcleo Financiero</h1>
          <p className="text-muted-foreground mt-2">
            Facturas, gastos y pronóstico de ingresos Holt-Winters en COP
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              setModalType("invoice");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nueva Factura
          </button>
          <button
            onClick={() => {
              setModalType("expense");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-foreground px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <Plus className="h-4 w-4" /> Registrar Gasto
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Ingresos Totales",
            value: formatCOP(totalIncome),
            Icon: TrendingUp,
            color: "text-green-500",
          },
          {
            label: "Gastos Totales",
            value: formatCOP(totalExpense),
            Icon: TrendingDown,
            color: "text-red-400",
          },
          {
            label: "Posición Neta",
            value: formatCOP(net),
            Icon: DollarSign,
            color: net >= 0 ? "text-emerald-400" : "text-red-400",
          },
          {
            label: "Pronóstico Próx. Mes",
            value: formatCOP(Math.round(nextMonth ?? 0)),
            Icon: Brain,
            color: "text-primary",
          },
        ].map((s) => (
          <div key={s.label} className="lux-card p-5 overflow-hidden">
            <s.Icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <div className="font-display text-xl sm:text-2xl truncate" title={s.value}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart with HW Projection */}
      <div className="lux-card p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-xl">Tendencia y Pronóstico de Ingresos (COP)</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-8 h-0.5 bg-primary rounded" /> Real
            <span className="inline-block w-8 h-0.5 bg-primary/40 rounded border-dashed border border-primary/40" />{" "}
            Pronóstico HW
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="finGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} width={45} />
            <Tooltip formatter={(v: number) => formatCOP(v)} />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              fill="url(#finGradient)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--primary))"
              fill="none"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* HW Insight */}
      <div className="lux-card p-5 mb-8 flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <Brain className="h-8 w-8 text-primary shrink-0" />
        <div>
          <div className="text-sm font-medium">Pronóstico Financiero Holt-Winters</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Ingresos proyectados para los próximos 3 meses:{" "}
            {nextRevenues.slice(0, 3).map((v, i) => (
              <strong key={i} className="text-foreground mx-1">
                {formatCOP(Math.round(v))}
              </strong>
            ))}
            . Factor de estacionalidad por temporada de ferias detectado: pico del <strong>+18%</strong> en T1.
          </div>
        </div>
      </div>

      {/* Invoice List & Tabs */}
      <div className="flex gap-3 mb-6">
        {(["Income", "Expense", "Reporting"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
          >
            {t === "Income" ? "Ingresos" : t === "Expense" ? "Gastos" : "Reportes"}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {invoicesLoading || aggregatesLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-secondary rounded-2xl" />
          <div className="h-16 bg-secondary rounded-2xl" />
        </div>
      ) : tab === "Reporting" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
          {/* Monthly & Yearly Breakdown */}
          <div className="lux-card p-6">
            <h3 className="font-display text-xl mb-4">Costos Mensuales y Anuales</h3>
            <div className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Desglose de Costos Mensuales</div>
              {Object.entries(aggregates?.monthlyCosts || {}).map(([month, val]) => (
                <div key={month} className="flex justify-between text-xs py-1">
                  <span>{month}</span>
                  <span className="font-semibold">{formatCOP(val as number)}</span>
                </div>
              ))}
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 pt-4">Desglose de Costos Anuales</div>
              {Object.entries(aggregates?.yearlyCosts || {}).map(([year, val]) => (
                <div key={year} className="flex justify-between text-xs py-1">
                  <span>{year}</span>
                  <span className="font-semibold">{formatCOP(val as number)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost per Horse & Category */}
          <div className="lux-card p-6 space-y-6">
            <div>
              <h3 className="font-display text-xl mb-4">Costo por Ejemplar</h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {(aggregates?.costPerHorse || []).map((ch: any) => (
                  <div key={ch.horseName} className="flex justify-between text-xs py-1 bg-secondary/30 px-3 rounded-lg border border-border/40">
                    <span className="font-medium">{ch.horseName}</span>
                    <span className="font-bold text-red-400">{formatCOP(ch.amount)}</span>
                  </div>
                ))}
                {(aggregates?.costPerHorse || []).length === 0 && (
                  <div className="text-xs text-muted-foreground">No hay gastos por ejemplar registrados.</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl mb-4">Análisis por Categoría</h3>
              <div className="space-y-2">
                {Object.entries(aggregates?.categoryAnalysis || {}).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between text-xs py-1 border-b border-border/40">
                    <span className="capitalize">{cat}</span>
                    <span className="font-semibold">{formatCOP(val as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="lux-card p-10 text-center text-muted-foreground">
          <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No hay registros de {tab === "Income" ? "ingresos" : tab === "Expense" ? "gastos" : "reportes"} aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="lux-card p-4 flex items-center gap-4">
              <div
                className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center ${inv.type === "Income" ? "bg-green-500/10 text-green-500" : "bg-red-400/10 text-red-400"}`}
              >
                {inv.type === "Income" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{inv.category}</div>
                <div className="text-sm text-muted-foreground truncate">{inv.notes || "Sin notas"}</div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`font-bold ${inv.type === "Income" ? "text-green-500" : "text-red-400"}`}
                >
                  {inv.type === "Income" ? "+" : "-"}{formatCOP(inv.amount)}
                </div>
                <div
                  className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${inv.status === "Paid" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}
                >
                  {inv.status === "Paid" ? "Pagado" : "Pendiente"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Financial Dialog */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalType === "invoice" ? "Registrar Nueva Factura" : modalType === "expense" ? "Registrar Nuevo Gasto" : "Registrar Pago"}>
        <form onSubmit={handleModalSubmit} className="space-y-4 p-4">
          {modalType === "invoice" && (
            <>
              <div>
                <label className="eyebrow block mb-1">Tipo</label>
                <select className="lux-select" value={invType} onChange={(e) => setInvType(e.target.value)}>
                  <option value="Income">Ingreso</option>
                  <option value="Expense">Gasto (Facturación)</option>
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1">Categoría</label>
                <select className="lux-select" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                  {invType === "Income" ? (
                    <>
                      <option value="Boarding">Pensión / Alojamiento</option>
                      <option value="Training">Monta / Entrenamiento</option>
                      <option value="Sales">Comisión de Venta</option>
                      <option value="Breeding">Reproducción</option>
                    </>
                  ) : (
                    <>
                      <option value="Feed & Bedding">Alimento y Viruta</option>
                      <option value="Vet & Medical">Veterinaria y Sanidad</option>
                      <option value="Farrier Services">Herrería</option>
                      <option value="Facility Rent">Arriendo de Finca</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1">Monto (COP)</label>
                <input type="number" className="lux-input" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required placeholder="1500000" />
              </div>
              <div>
                <label className="eyebrow block mb-1">Notas</label>
                <input className="lux-input" value={invNotes} onChange={(e) => setInvNotes(e.target.value)} placeholder="Detalles de la factura..." />
              </div>
              <div>
                <label className="eyebrow block mb-1">Fecha de Vencimiento</label>
                <input type="date" className="lux-input" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} />
              </div>
            </>
          )}

          {modalType === "expense" && (
            <>
              <div>
                <label className="eyebrow block mb-1">Categoría</label>
                <select className="lux-select" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                  <option value="Vet & Medical">Veterinaria y Sanidad</option>
                  <option value="Feed & Supplements">Alimento y Suplementos</option>
                  <option value="Farrier Services">Herrería</option>
                  <option value="Equipment & Gear">Aperos y Equipos</option>
                  <option value="Transportation">Transporte</option>
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1">Monto (COP)</label>
                <input type="number" className="lux-input" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required placeholder="300000" />
              </div>
              <div>
                <label className="eyebrow block mb-1">Ejemplar Vinculado</label>
                <select className="lux-select" value={expHorseId} onChange={(e) => setExpHorseId(e.target.value)}>
                  <option value="">Sin ejemplar vinculado (Gasto General)</option>
                  {horses.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1">Fecha de Gasto</label>
                <input type="date" className="lux-input" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity"
          >
            Guardar Registro
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}

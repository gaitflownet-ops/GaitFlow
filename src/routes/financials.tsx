import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  AlertTriangle,
  BarChart3,
  Plus,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import { KPICard } from "@/components/financial/KPICard";
import { BalanceChart } from "@/components/financial/BalanceChart";
import { CategoryBreakdown } from "@/components/financial/CategoryBreakdown";
import { TransactionList } from "@/components/financial/TransactionList";
import { TransactionModal } from "@/components/financial/TransactionModal";
import {
  useFinancialKPIs,
  useFinancialChart,
  useFinancialTransactions,
  useFinancialCategories,
  useFinancialCategoryBreakdown,
  type TransactionFilters,
} from "@/lib/hooks/useFinancialCenter";
import type { TransactionType } from "@/lib/financial/types";

export const Route = createFileRoute("/financials")({
  head: () => ({
    meta: [
      { title: "Centro Financiero — GaitFlow" },
      { name: "description", content: "Centro económico del criadero: ingresos, gastos, KPIs y movimientos financieros." },
    ],
  }),
  component: FinancialCenterPage,
});

// ─── Filtros activos ──────────────────────────────────────────────────────────

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function buildDateRange(period: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  if (period === "this_month") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      dateTo:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  }
  if (period === "last_month") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0],
      dateTo:   new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0],
    };
  }
  if (period === "this_year") {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
      dateTo:   new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0],
    };
  }
  return {};
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function FinancialCenterPage() {
  // UI state
  const [modalOpen,    setModalOpen]    = useState(false);
  const [defaultType,  setDefaultType]  = useState<TransactionType>("expense");
  const [breakdownTab, setBreakdownTab] = useState<"expense" | "income">("expense");

  // Filters
  const [typeFilter,     setTypeFilter]     = useState<TransactionType | "">("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodFilter,   setPeriodFilter]   = useState("this_month");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  const dateRange = useMemo(() => buildDateRange(periodFilter), [periodFilter]);

  const filters: TransactionFilters = {
    ...(typeFilter     ? { type: typeFilter }          : {}),
    ...(statusFilter   ? { status: statusFilter as any } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
    ...(dateRange.dateFrom ? { dateFrom: dateRange.dateFrom } : {}),
    ...(dateRange.dateTo   ? { dateTo: dateRange.dateTo }     : {}),
    ...(searchQuery    ? { search: searchQuery }        : {}),
  };

  // Data
  const { data: kpis,         isLoading: kpisLoading }   = useFinancialKPIs();
  const { data: chartData,    isLoading: chartLoading }  = useFinancialChart(6);
  const { data: categories,   isLoading: catsLoading }   = useFinancialCategories();
  const { data: transactions, isLoading: txLoading }     = useFinancialTransactions(filters);
  const { data: breakdown,    isLoading: breakdownLoad } = useFinancialCategoryBreakdown(breakdownTab);

  const openModal = (type: TransactionType) => {
    setDefaultType(type);
    setModalOpen(true);
  };

  const activeFilterCount = [typeFilter, statusFilter, categoryFilter].filter(Boolean).length;

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow">ERP Financiero · GaitFlow</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Centro Financiero</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            El corazón económico del criadero. Todos los movimientos financieros, en un solo lugar.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => openModal("income")}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <TrendingUp className="h-4 w-4" /> Ingreso
          </button>
          <button
            onClick={() => openModal("expense")}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm"
          >
            <TrendingDown className="h-4 w-4" /> Gasto
          </button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KPICard
          label="Ingresos del mes"
          value={kpis?.incomeMonth ?? 0}
          previousValue={kpis?.incomeLastMonth}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Gastos del mes"
          value={kpis?.expenseMonth ?? 0}
          previousValue={kpis?.expenseLastMonth}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          invertTrend
          isLoading={kpisLoading}
        />
        <KPICard
          label="Balance neto"
          value={kpis?.balance ?? 0}
          icon={Scale}
          iconColor={kpis && kpis.balance >= 0 ? "text-blue-600" : "text-red-500"}
          iconBg={kpis && kpis.balance >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}
          isLoading={kpisLoading}
        />
        <KPICard
          label="Por cobrar"
          value={kpis?.pending ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Vencidos"
          value={kpis?.overdue ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          invertTrend
          isLoading={kpisLoading}
        />
        <KPICard
          label="Movimientos totales"
          value={kpis?.totalTransactions ?? 0}
          icon={BarChart3}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          isLoading={kpisLoading}
          compact
        />
      </div>

      {/* ── Chart + Breakdown ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <BalanceChart data={chartData ?? []} isLoading={chartLoading} />
        </div>

        <div className="flex flex-col">
          {/* Breakdown toggle */}
          <div className="flex rounded-xl bg-secondary p-1 mb-3">
            {(["expense", "income"] as const).map(t => (
              <button
                key={t}
                onClick={() => setBreakdownTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  breakdownTab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t === "expense" ? "Gastos" : "Ingresos"}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <CategoryBreakdown
              data={breakdown ?? []}
              type={breakdownTab}
              isLoading={breakdownLoad}
            />
          </div>
        </div>
      </div>

      {/* ── Transaction List ───────────────────────────────────────────────── */}
      <div>
        {/* List header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="font-display text-2xl">Movimientos</h2>

          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm rounded-full border border-border bg-card focus:outline-none focus:border-primary/50 w-44 transition-colors"
              />
            </div>

            {/* Period */}
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="text-sm rounded-full border border-border bg-card px-3 py-2 focus:outline-none focus:border-primary/50"
            >
              <option value="this_month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="this_year">Este año</option>
              <option value="">Todo el tiempo</option>
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-2 transition-colors ${
                activeFilterCount > 0
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] h-4 w-4 rounded-full grid place-items-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border border-border bg-card animate-fade-up">
            {/* Type */}
            <div className="flex gap-1.5">
              {["", "income", "expense"].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as TransactionType | "")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    typeFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "" ? "Todos" : t === "income" ? "✅ Ingresos" : "💸 Gastos"}
                </button>
              ))}
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs rounded-full border border-border bg-secondary px-3 py-1.5 focus:outline-none focus:border-primary/50"
            >
              <option value="">Todos los estados</option>
              <option value="completed">Completado</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelado</option>
              <option value="reconciled">Conciliado</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs rounded-full border border-border bg-secondary px-3 py-1.5 focus:outline-none focus:border-primary/50"
            >
              <option value="">Todas las categorías</option>
              {(categories ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setCategoryFilter("");
                }}
                className="text-xs text-destructive hover:underline px-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <TransactionList transactions={transactions ?? []} isLoading={txLoading} />
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories ?? []}
        defaultType={defaultType}
      />
    </AppShell>
  );
}

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
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  Zap,
  Settings,
} from "lucide-react";
import { KPICard } from "@/components/financial/KPICard";
import { BalanceChart } from "@/components/financial/BalanceChart";
import { CategoryBreakdown } from "@/components/financial/CategoryBreakdown";
import { TransactionList } from "@/components/financial/TransactionList";
import { TransactionModal } from "@/components/financial/TransactionModal";
import { AccountsPanel } from "@/components/financial/AccountsPanel";
import { RulesPanel } from "@/components/financial/RulesPanel";
import { CostCentersPanel } from "@/components/financial/CostCentersPanel";
import { FinancialSettingsPanel } from "@/components/financial/FinancialSettingsPanel";
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "accounts" | "movements" | "cost-centers" | "automations" | "settings";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard",    label: "Dashboard",        icon: LayoutDashboard },
  { id: "accounts",     label: "Cuentas",          icon: Wallet },
  { id: "movements",    label: "Movimientos",      icon: ArrowLeftRight },
  { id: "cost-centers", label: "Centros de Costo", icon: Target },
  { id: "automations",  label: "Automatizaciones", icon: Zap },
  { id: "settings",     label: "Configuración",    icon: Settings },
];

// ─── Fecha helpers ────────────────────────────────────────────────────────────

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

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ onOpenModal }: { onOpenModal: (type: TransactionType) => void }) {
  const [breakdownTab, setBreakdownTab] = useState<"expense" | "income">("expense");

  const { data: kpis,     isLoading: kpisLoading }    = useFinancialKPIs();
  const { data: chartData, isLoading: chartLoading }  = useFinancialChart(6);
  const { data: breakdown, isLoading: breakdownLoad } = useFinancialCategoryBreakdown(breakdownTab);

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          label="Ingresos del Mes"
          value={kpis?.incomeMonth ?? 0}
          previousValue={kpis?.incomeLastMonth}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Gastos del Mes"
          value={kpis?.expenseMonth ?? 0}
          previousValue={kpis?.expenseLastMonth}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          isLoading={kpisLoading}
          invertTrend
        />
        <KPICard
          label="Balance Neto"
          value={(kpis?.incomeMonth ?? 0) - (kpis?.expenseMonth ?? 0)}
          icon={Scale}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Pendientes"
          value={kpis?.pending ?? 0}
          icon={Clock}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Vencidos"
          value={kpis?.overdue ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          isLoading={kpisLoading}
        />
        <KPICard
          label="Total Movimientos"
          value={kpis?.totalTransactions ?? 0}
          icon={BarChart3}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
          isLoading={kpisLoading}
        />
      </div>

      {/* Gráfico + Distribución */}
      <div className="chart-grid">
        <BalanceChart data={chartData ?? []} isLoading={chartLoading} />
        <CategoryBreakdown
          data={breakdown ?? []}
          isLoading={breakdownLoad}
          type={breakdownTab}
          onTypeChange={setBreakdownTab}
        />
      </div>
    </>
  );
}

// ─── Movements Tab ────────────────────────────────────────────────────────────

function MovementsTab({ onOpenModal }: { onOpenModal: (type: TransactionType) => void }) {
  const [typeFilter,     setTypeFilter]     = useState<TransactionType | "">("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodFilter,   setPeriodFilter]   = useState("this_month");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  const dateRange = useMemo(() => buildDateRange(periodFilter), [periodFilter]);
  const { data: categories } = useFinancialCategories();

  const filters: TransactionFilters = {
    ...(typeFilter     ? { type: typeFilter }          : {}),
    ...(statusFilter   ? { status: statusFilter as any } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
    ...(dateRange.dateFrom ? { dateFrom: dateRange.dateFrom } : {}),
    ...(dateRange.dateTo   ? { dateTo: dateRange.dateTo }     : {}),
    ...(searchQuery    ? { search: searchQuery }        : {}),
  };

  const { data: transactions, isLoading: txLoading } = useFinancialTransactions(filters);
  const activeFilterCount = [typeFilter, statusFilter, categoryFilter].filter(Boolean).length;

  return (
    <div className="movements-tab">
      {/* Toolbar */}
      <div className="tx-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Buscar transacciones..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="period-select">
          <option value="this_month">Este mes</option>
          <option value="last_month">Mes anterior</option>
          <option value="this_year">Este año</option>
          <option value="">Todos</option>
        </select>
        <button
          className={`btn-icon ${filtersOpen ? "active" : ""}`}
          onClick={() => setFiltersOpen(p => !p)}
        >
          <Filter size={16} />
          {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        </button>
        <button className="btn-primary" onClick={() => onOpenModal("income")}>
          <TrendingUp size={16} /> Ingreso
        </button>
        <button className="btn-danger-ghost" onClick={() => onOpenModal("expense")}>
          <TrendingDown size={16} /> Gasto
        </button>
      </div>

      {/* Filtros expandidos */}
      {filtersOpen && (
        <div className="filters-panel">
          <div className="filter-row">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="">Todos los tipos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
              <option value="transfer">Transferencias</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="completed">Completado</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelado</option>
              <option value="reconciled">Conciliado</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">Todas las categorías</option>
              {(categories ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <button
              className="btn-secondary"
              onClick={() => { setTypeFilter(""); setStatusFilter(""); setCategoryFilter(""); setPeriodFilter("this_month"); }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      <TransactionList transactions={transactions ?? []} isLoading={txLoading} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function FinancialCenterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("expense");

  const openModal = (type: TransactionType) => {
    setDefaultType(type);
    setModalOpen(true);
  };

  return (
    <AppShell>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="eyebrow">ERP Financiero · GaitFlow</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Centro Financiero</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            El corazón económico del criadero. Todos los movimientos financieros, en un solo lugar.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-primary" onClick={() => openModal("income")}>
            <Plus size={16} /> Ingreso
          </button>
          <button className="btn-secondary" onClick={() => openModal("expense")}>
            <Plus size={16} /> Gasto
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="financial-tabs" role="tablist">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`financial-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────────── */}
      <div className="financial-tab-content">
        {activeTab === "dashboard"    && <DashboardTab onOpenModal={openModal} />}
        {activeTab === "accounts"     && <AccountsPanel />}
        {activeTab === "movements"    && <MovementsTab onOpenModal={openModal} />}
        {activeTab === "cost-centers" && <CostCentersPanel />}
        {activeTab === "automations"  && <RulesPanel />}
        {activeTab === "settings"     && <FinancialSettingsPanel />}
      </div>

      {/* ── Modal de transacción ──────────────────────────────────────────────── */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={defaultType}
        categories={[]} // Las carga internamente o se las pasamos vacías temporalmente para types
      />
    </AppShell>
  );
}

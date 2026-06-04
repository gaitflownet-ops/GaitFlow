import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { forecastFinancials } from "@/lib/holtWinters";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Brain, Plus, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/financials")({
  head: () => ({
    meta: [{ title: "Financial Core — GateFlow" }],
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
      const { data, error } = await (supabase.from("invoices") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function FinancialsPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [tab, setTab] = useState<"Income" | "Expense">("Income");

  // Historical revenue (mock — in production this comes from invoices grouped by month)
  const historicalRevenue = [80000, 85000, 95000, 105000, 90000, 75000, 70000, 72000, 78000, 88000, 92000, 98000, 82000, 86000, 96000];
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
  const expenses = invoices.filter((inv) => inv.type === "Expense");
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpense;

  const filteredInvoices = invoices.filter((inv) => inv.type === tab);

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Financial Core</h1>
          <p className="text-muted-foreground mt-2">Invoices, expenses &amp; Holt-Winters revenue forecast</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Income", value: `$${totalIncome.toLocaleString()}`, Icon: TrendingUp, color: "text-green-500" },
          { label: "Total Expenses", value: `$${totalExpense.toLocaleString()}`, Icon: TrendingDown, color: "text-red-400" },
          { label: "Net Position", value: `$${net.toLocaleString()}`, Icon: DollarSign, color: net >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "HW Next Month", value: `$${Math.round(nextMonth ?? 0).toLocaleString()}`, Icon: Brain, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="lux-card p-5">
            <s.Icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <div className="font-display text-2xl">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart with HW Projection */}
      <div className="lux-card p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-xl">Revenue Trend &amp; Forecast</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-8 h-0.5 bg-primary rounded" /> Actual
            <span className="inline-block w-8 h-0.5 bg-primary/40 rounded border-dashed border border-primary/40" /> HW Forecast
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
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v?.toLocaleString()}`} />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#finGradient)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="none" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* HW Insight */}
      <div className="lux-card p-5 mb-8 flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <Brain className="h-8 w-8 text-primary shrink-0" />
        <div>
          <div className="text-sm font-medium">Holt-Winters Financial Forecast</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Projected revenue for next 3 months:{" "}
            {nextRevenues.slice(0, 3).map((v, i) => (
              <strong key={i} className="text-foreground mx-1">${Math.round(v).toLocaleString()}</strong>
            ))}
            . Show season seasonality factor detected: <strong>+18%</strong> peak in Q1.
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex gap-3 mb-6">
        {(["Income", "Expense"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-secondary rounded-2xl" />
          <div className="h-16 bg-secondary rounded-2xl" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="lux-card p-10 text-center text-muted-foreground">
          <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No {tab.toLowerCase()} records yet. Create your first invoice above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="lux-card p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${inv.type === "Income" ? "bg-green-500/10 text-green-500" : "bg-red-400/10 text-red-400"}`}>
                {inv.type === "Income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{inv.category}</div>
                <div className="text-sm text-muted-foreground">{inv.notes || "No notes"}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${inv.type === "Income" ? "text-green-500" : "text-red-400"}`}>
                  {inv.type === "Income" ? "+" : "-"}${inv.amount.toLocaleString()}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full mt-1 ${inv.status === "Paid" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                  {inv.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

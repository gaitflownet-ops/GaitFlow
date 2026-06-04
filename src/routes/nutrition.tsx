import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { forecastFeedDemand, forecastHealthRiskIndex } from "@/lib/holtWinters";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Brain, Sprout, Plus, AlertTriangle, Package } from "lucide-react";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [{ title: "Nutrition & Wellness — GateFlow" }],
  }),
  component: NutritionPage,
});

interface NutritionPlan {
  id: string;
  horse_id: string;
  plan_name: string;
  ingredients: unknown;
  notes: string | null;
}

function useNutritionPlans() {
  return useQuery<NutritionPlan[]>({
    queryKey: ["nutrition_plans"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("nutrition_plans") as any)
        .select("*, horses:horse_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Mock 15 months of consumption data (lbs/month)
const historicalFeed = [2100, 2200, 2400, 2500, 2300, 2000, 1900, 1950, 2050, 2200, 2300, 2400, 2150, 2250, 2450];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan+1", "Feb+1", "Mar+1"];

function NutritionPage() {
  const { data: plans = [], isLoading } = useNutritionPlans();

  const feedForecast = forecastFeedDemand(historicalFeed, 3);
  const healthRisk = forecastHealthRiskIndex([5, 6, 2, 1, 0, 1, 2, 4, 3, 2, 6, 8, 4, 5]);

  const chartData = historicalFeed.map((v, i) => ({
    month: MONTHS[i],
    actual: v,
  })).concat(
    feedForecast.map((v, i) => ({
      month: `F+${i + 1}`,
      forecast: Math.round(v),
    })) as any
  );

  const riskGaugeData = [{ name: "Risk", value: Math.round(healthRisk * 10), fill: healthRisk > 6 ? "#f87171" : healthRisk > 4 ? "#fbbf24" : "#34d399" }];

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Health & Care</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Nutrition &amp; Wellness</h1>
          <p className="text-muted-foreground mt-2">
            {plans.length} active nutrition plans · HW feed demand engine active
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
          <Plus className="h-4 w-4" /> New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Plans", value: plans.length, Icon: Sprout, color: "text-emerald-400" },
          { label: "HW Feed Demand (next mo.)", value: `${Math.round(feedForecast[0] ?? 0).toLocaleString()} lbs`, Icon: Package, color: "text-blue-400" },
          { label: "Health Risk Index", value: `${healthRisk.toFixed(1)}/10`, Icon: AlertTriangle, color: healthRisk > 5 ? "text-amber-400" : "text-green-400" },
          { label: "HW Engine", value: "Active", Icon: Brain, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="lux-card p-5">
            <s.Icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <div className="font-display text-2xl">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed demand chart */}
        <div className="lg:col-span-2 lux-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-blue-400" />
            <h3 className="font-display text-xl">Feed Demand Forecast</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} dot={false} opacity={0.6} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
            <Brain className="h-3.5 w-3.5 inline mr-1 text-primary" />
            HW projects feed demand of{" "}
            <strong className="text-foreground">{Math.round(feedForecast[0] ?? 0).toLocaleString()} lbs</strong> next month,{" "}
            driven by seasonal conditioning peak and show preparation cycle.
          </div>
        </div>

        {/* Health Risk Gauge */}
        <div className="lux-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className={`h-5 w-5 ${healthRisk > 5 ? "text-amber-400" : "text-green-400"}`} />
            <h3 className="font-display text-xl">Health Risk</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={riskGaugeData}>
              <RadialBar dataKey="value" maxBarSize={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-8">
            <div className="font-display text-4xl">{healthRisk.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">/ 10 risk index</div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            {healthRisk > 6
              ? "⚠️ Elevated risk. Schedule veterinary inspection."
              : healthRisk > 4
              ? "Moderate risk. Monitor respiratory indicators."
              : "✅ Low risk. Herd health is stable."}
          </div>
        </div>
      </div>

      {/* Plans list */}
      <section className="mt-10">
        <h2 className="font-display text-2xl mb-6">Active Nutrition Plans</h2>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-secondary rounded-2xl" />
            <div className="h-16 bg-secondary rounded-2xl" />
          </div>
        ) : plans.length === 0 ? (
          <div className="lux-card p-10 text-center text-muted-foreground">
            <Sprout className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No nutrition plans yet. Create a plan to start tracking individualized diets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="lux-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-lg">{plan.plan_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{plan.notes || "No notes"}</div>
                  </div>
                  <Sprout className="h-5 w-5 text-emerald-400 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

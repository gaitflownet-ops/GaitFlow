import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { forecastMarketPrice } from "@/lib/holtWinters";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, Dna, ShoppingBag, Plus, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useHorses } from "@/lib/hooks/useHorses";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [{ title: "Marketplace — GateFlow" }],
  }),
  component: MarketplacePage,
});

// Historical sales prices (last 15 months, KWPN sample)
const historicalPrices = [45000, 47000, 52000, 55000, 48000, 42000, 40000, 39000, 41000, 46000, 49000, 51000, 46000, 48000, 53000];
const MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MarketplacePage() {
  const { data: horses = [], isLoading } = useHorses();
  const forSale = horses.filter((h) => h.sale_status === "For Sale");

  const forecast = forecastMarketPrice(historicalPrices, 3);

  const chartData = historicalPrices.map((v, i) => ({ month: MONTH_LABELS[i], actual: v })).concat(
    forecast.map((v, i) => ({ month: `F+${i + 1}`, forecast: Math.round(v) })) as any
  );

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Platform</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            {forSale.length} horses listed · HW price intelligence active
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
          <Plus className="h-4 w-4" /> List Asset
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-3 mb-8 border-b border-border pb-4">
        {[
          { to: "/marketplace/", label: "Horses", Icon: ShoppingBag },
          { to: "/marketplace/genetics", label: "Genetics", Icon: Dna },
          { to: "/marketplace/stallions", label: "Stallions", Icon: TrendingUp },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to as any}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* HW Price Forecast */}
      <div className="lux-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl">HW Price Trend &amp; Forecast</h3>
          </div>
          <div className="text-xs text-muted-foreground hidden md:flex gap-4">
            <span><span className="inline-block w-6 h-0.5 bg-primary rounded align-middle mr-1" />Actual</span>
            <span><span className="inline-block w-6 h-0.5 bg-primary/40 border-dashed border-t border-primary/40 align-middle mr-1" />Forecast</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v?.toLocaleString()}`} />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#mktGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="none" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {forecast.slice(0, 3).map((v, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-secondary/50">
              <div className="text-xs text-muted-foreground">Month +{i + 1}</div>
              <div className="font-display text-lg">${Math.round(v).toLocaleString()}</div>
              <div className="text-xs text-primary">
                {v > historicalPrices[historicalPrices.length - 1] ? "↑" : "↓"}
                {Math.abs(((v - historicalPrices[historicalPrices.length - 1]) / historicalPrices[historicalPrices.length - 1]) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* For Sale Listings */}
      <h2 className="font-display text-2xl mb-6">Horses For Sale</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-secondary rounded-[2rem]" />)}
        </div>
      ) : forSale.length === 0 ? (
        <div className="lux-card p-12 text-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="font-display text-2xl">No active listings</h3>
          <p className="mt-2">Add horses to the marketplace by setting their sale status to "For Sale".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forSale.map((horse) => (
            <Link
              key={horse.id}
              to="/showcase/$horseId"
              params={{ horseId: horse.slug || horse.id }}
              className="group lux-card overflow-hidden hover:border-primary/40 transition-colors block"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={horse.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"}
                  alt={horse.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-full">
                  {horse.price ?? "Price on request"}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{horse.discipline}</div>
                <h3 className="font-display text-2xl mt-1">{horse.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">{horse.breed} · {horse.age}yo</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

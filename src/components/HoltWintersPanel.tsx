import { Brain, TrendingUp, AlertTriangle, Activity, DollarSign, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  forecastMarketPrice, 
  calculateGestationProbability, 
  forecastHealthRiskIndex, 
  forecastFeedDemand, 
  forecastFinancials 
} from "@/lib/holtWinters";

export function HoltWintersPanel() {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching historical data from Supabase and running HW predictions
    const runPredictions = async () => {
      try {
        // HW-1: Mock historical prices (Ocala seasonal peaks)
        const priceHistory = [45000, 47000, 52000, 55000, 48000, 42000, 40000, 39000, 41000, 46000, 49000, 51000, 46000, 48000, 53000];
        const nextPrices = forecastMarketPrice(priceHistory, 3);

        // HW-2: Reproductive Probability (Mock cycle data)
        const mareSuccess = [0, 1, 1, 0, 1, 1, 0, 1];
        const gestationProb = calculateGestationProbability(mareSuccess);

        // HW-3: Health Risk (Mock respiratory incidents)
        const incidents = [5, 6, 2, 1, 0, 1, 2, 4, 3, 2, 6, 8, 4, 5];
        const riskIndex = forecastHealthRiskIndex(incidents);

        // HW-4: Feed Demand
        const feedHistory = [2100, 2200, 2400, 2500, 2300, 2000, 1900, 1950, 2050, 2200, 2300, 2400, 2150, 2250, 2450];
        const feedDemand = forecastFeedDemand(feedHistory, 1);

        // HW-5: Financial Forecast (Revenue)
        const revenueHistory = [80000, 85000, 95000, 105000, 90000, 75000, 70000, 72000, 78000, 88000, 92000, 98000, 82000, 86000, 96000];
        const nextRevenue = forecastFinancials(revenueHistory, 1);

        setForecasts({
          price: nextPrices[0] || 54000,
          gestation: gestationProb,
          risk: riskIndex,
          feed: feedDemand[0] || 2550,
          revenue: nextRevenue[0] || 108000
        });
      } catch (e) {
        console.error("HW Error", e);
      } finally {
        setLoading(false);
      }
    };
    
    runPredictions();
  }, []);

  if (loading) {
    return <div className="lux-card p-6 h-64 animate-pulse" />;
  }

  return (
    <div className="lux-card p-6 bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-10 translate-x-10" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Brain className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xl">Holt-Winters Engine</h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Predictive Layer Active</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-sm font-medium">Market Price Trend</div>
              <div className="text-xs text-muted-foreground">Next 30 days</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">${Math.round(forecasts?.price || 0).toLocaleString()}</div>
            <div className="text-[10px] text-green-500">+4.2% projected</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-4 w-4 ${forecasts?.risk > 5 ? 'text-amber-500' : 'text-green-500'}`} />
            <div>
              <div className="text-sm font-medium">Herd Health Risk</div>
              <div className="text-xs text-muted-foreground">Respiratory seasonality</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{forecasts?.risk?.toFixed(1) || '3.2'}/10</div>
            <div className="text-[10px] text-muted-foreground">Action advised</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">Reproduction Prob.</div>
              <div className="text-xs text-muted-foreground">Optimal window: Feb 18-24</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{Math.round(forecasts?.gestation || 0)}%</div>
            <div className="text-[10px] text-muted-foreground">Success score</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <div>
              <div className="text-sm font-medium">Financial Projection</div>
              <div className="text-xs text-muted-foreground">Next month revenue</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">${Math.round(forecasts?.revenue || 0).toLocaleString()}</div>
            <div className="text-[10px] text-emerald-500">+12% vs budget</div>
          </div>
        </div>
      </div>
    </div>
  );
}

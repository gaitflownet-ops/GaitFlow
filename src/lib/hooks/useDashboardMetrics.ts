import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

type CompetitionMetric = Pick<
  Database["public"]["Tables"]["competitions"]["Row"],
  "placement" | "prize"
>;

const moneyToNumber = (value: string | null) => {
  if (!value) return 0;
  const amount = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isNaN(amount) ? 0 : amount;
};

const isWinningPlacement = (placement: string | null) => {
  if (!placement) return false;
  const normalized = placement.toLowerCase();
  return (
    normalized === "1st" || 
    normalized.includes("champion") || 
    normalized.includes("winner") || 
    normalized.includes("campe") || 
    normalized.includes("azul") || 
    normalized.includes("1") || 
    normalized.includes("primer")
  );
};

const isTopThreePlacement = (placement: string | null) => {
  if (!placement) return false;
  const normalized = placement.toLowerCase();
  return (
    ["1st", "2nd", "3rd", "1", "2", "3", "primer", "segundo", "tercer", "azul", "roja", "amarilla"].some((rank) => normalized.includes(rank)) || 
    isWinningPlacement(placement)
  );
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const [horsesResult, competitionsResult, updatesResult, healthResult] = await Promise.all([
        supabase.from("horses").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("placement, prize"),
        supabase
          .from("updates")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString()),
        supabase
          .from("health_records")
          .select("id", { count: "exact", head: true })
          .eq("status", "requires_followup"),
      ]);

      const firstError =
        horsesResult.error || competitionsResult.error || updatesResult.error || healthResult.error;
      if (firstError) throw firstError;

      const competitions = (competitionsResult.data ?? []) as CompetitionMetric[];
      const starts = competitions.length;
      const wins = competitions.filter((competition) =>
        isWinningPlacement(competition.placement),
      ).length;
      const topThree = competitions.filter((competition) =>
        isTopThreePlacement(competition.placement),
      ).length;
      const earnings = competitions.reduce(
        (sum, competition) => sum + moneyToNumber(competition.prize),
        0,
      );

      return {
        horseCount: horsesResult.count ?? 0,
        starts,
        wins,
        topThree,
        winRate: starts > 0 ? Math.round((wins / starts) * 100) : 0,
        weeklyUpdates: updatesResult.count ?? 0,
        healthAlerts: healthResult.count ?? 0,
        seasonEarnings: earnings,
      };
    },
  });
}

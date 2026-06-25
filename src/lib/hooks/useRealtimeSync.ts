import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

const tables = [
  "horses",
  "competitions",
  "health_records",
  "updates",
  "notifications",
  "profiles",
  "locations",
  "stall_units",
  "ccc_location_movements",
  "ccc_quarantine_records",
  "ccc_transports",
  "ccc_competition_locations",
] as const;

const queryKeysByTable: Record<(typeof tables)[number], string[][]> = {
  horses: [["horses"], ["horse"], ["dashboard-metrics"]],
  competitions: [["competitions"], ["dashboard-metrics"]],
  health_records: [["health_records"], ["dashboard-metrics"]],
  updates: [["updates"], ["dashboard-metrics"]],
  notifications: [["notifications"]],
  profiles: [["profiles"]],
  locations: [["locations"], ["dashboard-metrics"]],
  stall_units: [["stall-units"], ["dashboard-metrics"]],
  ccc_location_movements: [["location-history"], ["dashboard-metrics"]],
  ccc_quarantine_records: [["quarantine-history"], ["dashboard-metrics"]],
  ccc_transports: [["transport-history"], ["dashboard-metrics"]],
  ccc_competition_locations: [["competition-locations"], ["dashboard-metrics"]],
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("gaitflow-realtime-sync");

    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const queryKey of queryKeysByTable[table]) {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

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
] as const;

const queryKeysByTable: Record<(typeof tables)[number], string[][]> = {
  horses: [["horses"], ["dashboard-metrics"]],
  competitions: [["competitions"], ["dashboard-metrics"]],
  health_records: [["health_records"], ["dashboard-metrics"]],
  updates: [["updates"], ["dashboard-metrics"]],
  notifications: [["notifications"]],
  profiles: [["profiles"]],
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

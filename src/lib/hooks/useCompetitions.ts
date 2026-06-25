import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Competition = Database["public"]["Tables"]["competitions"]["Row"];
export type HorseResult = Database["public"]["Tables"]["horse_results"]["Row"];

export function useCompetitions(horseId?: string) {
  return useQuery<any[]>({
    queryKey: ["competitions", horseId],
    queryFn: async () => {
      // If horseId is specified, we fetch the results from horse_results joined with competitions
      if (horseId) {
        const { data, error } = await supabase
          .from("horse_results")
          .select(`
            *,
            competitions:competition_id (
              event,
              date,
              location,
              category,
              notes
            )
          `)
          .eq("horse_id", horseId);

        if (error) throw error;
        
        // Map to format aligned with the UI
        return (data as any[]).map((r) => ({
          id: r.id,
          horse_id: r.horse_id,
          competition_id: r.competition_id,
          event: r.competitions?.event || "Competition",
          date: r.competitions?.date || "",
          location: r.competitions?.location || "",
          category: r.competitions?.category || "",
          placement: r.position || "Competed",
          rider: r.rider || "",
          prize: r.awards || "",
          notes: r.competitions?.notes || "",
        }));
      }

      // Default: fetch all competitions
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Competition[];
    },
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newComp: any) => {
      // 1. Insert into competitions table
      const { data: comp, error: compError } = await (supabase.from("competitions") as any)
        .insert({
          event: newComp.event,
          date: newComp.date,
          location: newComp.location,
          category: newComp.category,
          prize: newComp.prize,
          notes: newComp.notes,
          horse_id: newComp.horse_id, // Backward compatibility
          placement: newComp.placement, // Backward compatibility
          rider: newComp.rider, // Backward compatibility
        })
        .select()
        .single();

      if (compError) throw compError;

      // 2. Insert into horse_results table
      const { error: resultError } = await (supabase.from("horse_results") as any)
        .insert({
          horse_id: newComp.horse_id,
          competition_id: comp.id,
          position: newComp.placement || "Competed",
          rider: newComp.rider,
          trainer: newComp.trainer || null,
          awards: newComp.prize || null,
          score: newComp.score || null,
          media: newComp.media || null,
        });

      if (resultError) {
        console.error("Failed to insert horse_results:", resultError);
      }

      return comp;
    },
    onSuccess: async (_, variables) => {
      if (variables.horse_id) {
        const achievement = `${variables.placement || "Competed"} — ${variables.event}`;
        try {
          await (supabase.from("horses") as any)
            .update({ latest_achievement: achievement })
            .eq("id", variables.horse_id);
        } catch (err) {
          console.error("Failed to auto-update horse latest achievement from competition:", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["competitions", variables.horse_id] });
        queryClient.invalidateQueries({ queryKey: ["horse", variables.horse_id] });
      }
    },
  });
}

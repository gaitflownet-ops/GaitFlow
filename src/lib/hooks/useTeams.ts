import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"] & {
  profiles: { name: string; initials: string; phone: string | null; } | null;
};
export type TeamHorseAssignment = Database["public"]["Tables"]["team_horse_assignments"]["Row"] & {
  horses: { id: string; name: string; image_url: string | null; status: string | null; } | null;
};
export type WorkShift = Database["public"]["Tables"]["ccc_work_shifts"]["Row"];
export type CoverageLog = Database["public"]["Tables"]["ccc_daily_coverage_logs"]["Row"] & {
  profiles: { name: string; initials: string; } | null;
  ccc_work_shifts: { name: string; start_time: string; end_time: string; } | null;
  teams?: { name: string; } | null;
};

export type FullTeam = Team & {
  members: TeamMember[];
  horses: TeamHorseAssignment[];
  shifts: WorkShift[];
};

export function useTeams(orgId?: string | null) {
  return useQuery<FullTeam[]>({
    queryKey: ["teams", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data: teams, error } = await supabase
        .from("teams")
        .select(`
          *,
          team_members (
            id,
            profile_id,
            role,
            profiles:profile_id ( name, phone, initials )
          ),
          team_horse_assignments (
            id,
            horse_id,
            horses:horse_id ( id, name, image_url, status )
          ),
          ccc_work_shifts (
            id,
            name,
            start_time,
            end_time,
            status
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (teams as any[]).map(t => ({
        ...t,
        members: t.team_members || [],
        horses: t.team_horse_assignments || [],
        shifts: t.ccc_work_shifts || [],
      }));
    },
    enabled: !!orgId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organization_id,
      name,
      description,
      team_type,
      is_temporary,
      start_date,
      end_date,
      destination,
      event_notes,
      leader_id,
      member_ids,
      horse_ids,
      shifts
    }: {
      organization_id: string;
      name: string;
      description?: string;
      team_type?: string;
      is_temporary?: boolean;
      start_date?: string;
      end_date?: string;
      destination?: string;
      event_notes?: string;
      leader_id?: string;
      member_ids: string[];
      horse_ids: string[];
      shifts: { name: string; start_time: string; end_time: string }[];
    }) => {
      // 1. Create team
      const { data: team, error: teamError } = await (supabase.from("teams") as any)
        .insert({
          organization_id,
          name,
          description,
          team_type,
          is_temporary,
          start_date,
          end_date,
          destination,
          event_notes
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Insert members
      const membersToInsert = [];
      if (leader_id) {
        membersToInsert.push({ team_id: team.id, profile_id: leader_id, organization_id, role: "Líder" });
      }
      for (const mId of member_ids) {
        if (mId !== leader_id) {
          membersToInsert.push({ team_id: team.id, profile_id: mId, organization_id, role: "Miembro" });
        }
      }
      if (membersToInsert.length > 0) {
        const { error: membersError } = await (supabase.from("team_members") as any).insert(membersToInsert);
        if (membersError) console.error("Error inserting members", membersError);
      }

      // 3. Insert horses
      if (horse_ids.length > 0) {
        const horsesToInsert = horse_ids.map(hId => ({
          team_id: team.id,
          horse_id: hId,
          organization_id
        }));
        const { error: horsesError } = await (supabase.from("team_horse_assignments") as any).insert(horsesToInsert);
        if (horsesError) console.error("Error inserting horses", horsesError);
      }

      // 4. Insert shifts
      if (shifts && shifts.length > 0) {
        const shiftsToInsert = shifts.map(s => ({
          team_id: team.id,
          name: s.name,
          start_time: s.start_time,
          end_time: s.end_time,
          organization_id
        }));
        const { error: shiftsError } = await (supabase.from("ccc_work_shifts") as any).insert(shiftsToInsert);
        if (shiftsError) console.error("Error inserting shifts", shiftsError);
      }

      return team;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams", variables.organization_id] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await (supabase.from("teams") as any).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams", variables.orgId] });
    },
  });
}

export function useDailyCoverageLogs(teamId?: string) {
  return useQuery<CoverageLog[]>({
    queryKey: ["coverage-logs", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("ccc_daily_coverage_logs")
        .select(`
          *,
          profiles:logged_by ( name, initials ),
          ccc_work_shifts:shift_id ( name, start_time, end_time )
        `)
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as CoverageLog[];
    },
    enabled: !!teamId,
  });
}

export function useOrgDailyCoverageLogs(orgId?: string | null, dateStr?: string) {
  return useQuery<CoverageLog[]>({
    queryKey: ["org-coverage-logs", orgId, dateStr],
    queryFn: async () => {
      if (!orgId || !dateStr) return [];
      const { data, error } = await supabase
        .from("ccc_daily_coverage_logs")
        .select(`
          *,
          profiles:logged_by ( name, initials ),
          ccc_work_shifts:shift_id ( name, start_time, end_time ),
          teams:team_id ( name )
        `)
        .eq("organization_id", orgId)
        .eq("date", dateStr)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as CoverageLog[];
    },
    enabled: !!orgId && !!dateStr,
  });
}

export function useCreateCoverageLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Database["public"]["Tables"]["ccc_daily_coverage_logs"]["Insert"]) => {
      const { data, error } = await (supabase.from("ccc_daily_coverage_logs") as any)
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coverage-logs", variables.team_id] });
    },
  });
}

export function useUpdateMemberAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organization_id,
      user_id,
      availability_status
    }: {
      organization_id: string;
      user_id: string;
      availability_status: string;
    }) => {
      const { data, error } = await (supabase.from("organization_members") as any)
        .update({ availability_status })
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", variables.organization_id] });
    },
  });
}

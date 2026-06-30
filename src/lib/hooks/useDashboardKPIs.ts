import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";

export interface DashboardKPIs {
  inventory: {
    total: number;
    mares: number;
    stallions: number;
    foals: number;
    competition: number;
  };
  tasks: {
    completed: number;
    pending: number;
    overdue: number;
    compliance: number;
  };
  stalls: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  breeding: {
    activeMares: number;
    pregnancies: number;
    expectedFoals: number;
    genetics: number;
  };
  competitions: {
    active: number;
    upcoming: number;
    results: number;
  };
  health: {
    alerts: number;
    medications: number;
    nutrition: number;
    pending: number;
  };
}

export function useDashboardKPIs(orgId?: string | null) {
  const { state } = useApp();
  const activeOrgId = orgId || state.user?.organization_id;

  return useQuery<DashboardKPIs>({
    queryKey: ["dashboard-kpis", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) {
        return {
          inventory: { total: 0, mares: 0, stallions: 0, foals: 0, competition: 0 },
          tasks: { completed: 0, pending: 0, overdue: 0, compliance: 100 },
          stalls: { total: 0, occupied: 0, available: 0, occupancyRate: 0 },
          breeding: { activeMares: 0, pregnancies: 0, expectedFoals: 0, genetics: 0 },
          competitions: { active: 0, upcoming: 0, results: 0 },
          health: { alerts: 0, medications: 0, nutrition: 0, pending: 0 }
        };
      }
      
      // Fetch minimum required columns to be fast
      const [
        { data: horses },
        { data: tasks },
        { data: stalls },
        { data: pregnancies },
        { data: genetics },
        { data: comps },
        { data: health },
        { data: pharmaceuticals }
      ] = await Promise.all([
        supabase.from("horses").select("id, sex, status").eq("organization_id", activeOrgId),
        supabase.from("tasks").select("id, status, due_date").eq("organization_id", activeOrgId),
        supabase.from("stall_units").select("id, availability").eq("organization_id", activeOrgId),
        supabase.from("pregnancies").select("id, status").eq("organization_id", activeOrgId),
        supabase.from("genetics_inventory").select("id, status").eq("organization_id", activeOrgId),
        supabase.from("competitions").select("id, date, status").eq("organization_id", activeOrgId),
        supabase.from("health_records").select("id, status, severity").eq("organization_id", activeOrgId),
        supabase.from("pharmaceuticals").select("id, current_stock, minimum_stock").eq("organization_id", activeOrgId)
      ]);

      const safeHorses = horses || [];
      const safeTasks = tasks || [];
      const safeStalls = stalls || [];
      const safePregnancies = pregnancies || [];
      const safeGenetics = genetics || [];
      const safeComps = comps || [];
      const safeHealth = health || [];
      const safePharma = pharmaceuticals || [];

      // 1. HORSE INVENTORY
      const mares = safeHorses.filter((h: any) => h.sex?.toLowerCase().includes("yegua") || h.sex?.toLowerCase() === "mare").length;
      const stallions = safeHorses.filter((h: any) => h.sex?.toLowerCase().includes("caballo") || h.sex?.toLowerCase().includes("reproductor") || h.sex?.toLowerCase() === "stallion").length;
      const foals = safeHorses.filter((h: any) => h.sex?.toLowerCase().includes("potro") || h.sex?.toLowerCase().includes("potranca") || h.sex?.toLowerCase() === "foal").length;
      const compHorses = safeHorses.filter((h: any) => h.status?.toLowerCase().includes("competi") || h.status?.toLowerCase().includes("entrenamiento")).length;

      // 2. STABLE FLOW SCORE
      const today = new Date().toISOString().split("T")[0];
      let completedTasks = 0;
      let pendingTasks = 0;
      let overdueTasks = 0;
      
      safeTasks.forEach((t: any) => {
        if (t.status === "completed" || t.status === "Completada") completedTasks++;
        else {
          pendingTasks++;
          if (t.due_date && t.due_date < today) overdueTasks++;
        }
      });
      const totalTasks = safeTasks.length;
      const compliance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // 3. STALL CAPACITY
      const totalStalls = safeStalls.length;
      const availableStalls = safeStalls.filter((s: any) => s.availability).length;
      const occupiedStalls = totalStalls - availableStalls;
      const occupancyRate = totalStalls > 0 ? Math.round((occupiedStalls / totalStalls) * 100) : 0;

      // 4. BREEDING PROGRAM
      const activePregnancies = safePregnancies.filter((p: any) => p.status === "active" || p.status === "en curso").length;
      const expectedFoals = activePregnancies; // Simplified 1 foal per pregnancy
      const totalGenetics = safeGenetics.length;

      // 5. COMPETITION ACTIVITY
      const upcomingComps = safeComps.filter((c: any) => c.date && c.date >= today).length;
      const resultComps = safeComps.filter((c: any) => c.status === "completed" || c.status === "Finalizada").length;

      // 6. HEALTH & OPERATIONS
      const healthAlerts = safeHealth.filter((h: any) => h.severity === "high" || h.severity === "critical" || h.status === "Pendiente").length;
      const lowStockPharma = safePharma.filter((p: any) => (p.current_stock ?? 0) <= (p.minimum_stock ?? 5)).length;

      return {
        inventory: {
          total: safeHorses.length,
          mares,
          stallions,
          foals,
          competition: compHorses
        },
        tasks: {
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          compliance
        },
        stalls: {
          total: totalStalls,
          occupied: occupiedStalls,
          available: availableStalls,
          occupancyRate
        },
        breeding: {
          activeMares: mares, // simplified: total mares in stable
          pregnancies: activePregnancies,
          expectedFoals,
          genetics: totalGenetics
        },
        competitions: {
          active: compHorses,
          upcoming: upcomingComps,
          results: resultComps
        },
        health: {
          alerts: healthAlerts,
          medications: lowStockPharma,
          nutrition: 0, // Mock for now if no nutrition alerts table exists
          pending: pendingTasks // Critical pending actions
        }
      };
    },
    // Refresh every 5 minutes automatically, but it's fast
    staleTime: 5 * 60 * 1000,
  });
}

import { supabase } from "./supabase";

export interface NutritionCenterMetrics {
  totalActivePlans: number;
  dailyConsumptionKg: number;
  monthlyCost: number;
}

export const getNutritionCenterMetrics = async (): Promise<NutritionCenterMetrics> => {
  // 1. Get active plans count
  const { count: activePlansCount, error: plansError } = await (supabase as any)
    .from('ccc_nutrition_plans')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active');

  if (plansError) throw plansError;

  // 2. Get all active items to calculate consumption
  // We need to join with plans to ensure they are active
  const { data: activeItems, error: itemsError } = await (supabase as any)
    .from('ccc_nutrition_items')
    .select(`
      quantity,
      conversion_to_kg,
      plan_id!inner(status),
      inventory:feed_inventory(cost_per_kg)
    `)
    .eq('plan_id.status', 'Active');

  if (itemsError) throw itemsError;

  let dailyConsumptionKg = 0;
  let monthlyCost = 0;

  activeItems?.forEach((item: any) => {
    // Some items like "Free Choice" or Supplements might be small, but we sum everything converted to Kg
    const itemDailyKg = Number(item.quantity) * Number(item.conversion_to_kg || 1);
    dailyConsumptionKg += itemDailyKg;

    // Cost: Daily consumption * cost per kg * 30 days
    if (item.inventory && item.inventory.cost_per_kg) {
      monthlyCost += itemDailyKg * Number(item.inventory.cost_per_kg) * 30;
    }
  });

  return {
    totalActivePlans: activePlansCount || 0,
    dailyConsumptionKg,
    monthlyCost,
  };
};

export const getAllNutritionPlansDetailed = async () => {
  const { data, error } = await (supabase as any)
    .from('ccc_nutrition_plans')
    .select(`
      *,
      horse:horses(name, id),
      items:ccc_nutrition_items(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

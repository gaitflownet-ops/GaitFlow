import { supabase } from "./supabase";

export type NutritionPlanStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Historical';
export type NutritionPlanPurpose = 'Maintenance' | 'Training' | 'Competition' | 'Breeding' | 'Pregnancy' | 'Growth' | 'Recovery';
export type ItemCategory = 'Forage' | 'Concentrate' | 'Supplement';
export type ScheduleType = 'Morning' | 'Midday' | 'Afternoon' | 'Night' | 'Free Choice';

export const getNutritionPlans = async (horseId: string) => {
  const { data, error } = await (supabase as any)
    .from('ccc_nutrition_plans')
    .select(`
      *,
      items:ccc_nutrition_items(*),
      creator:profiles!ccc_nutrition_plans_created_by_fkey(name),
      approver:profiles!ccc_nutrition_plans_approved_by_fkey(name)
    `)
    .eq('horse_id', horseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getActiveNutritionPlan = async (horseId: string) => {
  console.log("getActiveNutritionPlan called for horseId:", horseId);
  try {
    const { data, error } = await (supabase as any)
      .from('ccc_nutrition_plans')
      .select(`
        *,
        items:ccc_nutrition_items(*),
        creator:profiles!ccc_nutrition_plans_created_by_fkey(name),
        approver:profiles!ccc_nutrition_plans_approved_by_fkey(name)
      `)
      .eq('horse_id', horseId)
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    console.log("getActiveNutritionPlan database response for horseId:", horseId, { data, error });
    if (error) {
      console.error("getActiveNutritionPlan database error:", error);
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getActiveNutritionPlan exception:", err);
    throw err;
  }
};

export const createNutritionPlan = async (plan: any) => {
  // If the new plan status is 'Active', deactivate previous active plans for this horse
  if (plan.status === 'Active') {
    const { error: updateError } = await (supabase as any)
      .from('ccc_nutrition_plans')
      .update({ status: 'Historical' })
      .eq('horse_id', plan.horse_id)
      .eq('status', 'Active');
    
    if (updateError) {
      console.error("Error deactivating old active plans:", updateError);
    }
  }

  const { data, error } = await (supabase as any)
    .from('ccc_nutrition_plans')
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateNutritionPlanStatus = async (planId: string, status: NutritionPlanStatus, approverId?: string) => {
  const updateData: any = { status };
  if (approverId) updateData.approved_by = approverId;

  if (status === 'Active') {
    // Get horse_id first
    const { data: planData, error: planError } = await (supabase as any)
      .from('ccc_nutrition_plans')
      .select('horse_id')
      .eq('id', planId)
      .single();

    if (!planError && planData) {
      await (supabase as any)
        .from('ccc_nutrition_plans')
        .update({ status: 'Historical' })
        .eq('horse_id', planData.horse_id)
        .eq('status', 'Active');
    }
  }

  const { data, error } = await (supabase as any)
    .from('ccc_nutrition_plans')
    .update(updateData)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addNutritionItems = async (items: any[]) => {
  const { data, error } = await (supabase as any)
    .from('ccc_nutrition_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data;
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveNutritionPlan, getNutritionPlans, createNutritionPlan, updateNutritionPlanStatus, addNutritionItems } from "../api-nutrition";

export function useActiveNutritionPlan(horseId: string) {
  return useQuery({
    queryKey: ["active_nutrition_plan", horseId],
    queryFn: () => getActiveNutritionPlan(horseId),
    enabled: !!horseId,
  });
}

export function useAllNutritionPlans(horseId: string) {
  return useQuery({
    queryKey: ["all_nutrition_plans", horseId],
    queryFn: () => getNutritionPlans(horseId),
    enabled: !!horseId,
  });
}

export function useCreateNutritionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ plan, items }: { plan: any, items: any[] }) => {
      const newPlan = await createNutritionPlan(plan);
      
      if (items && items.length > 0) {
        const itemsWithPlanId = items.map(i => ({ ...i, plan_id: newPlan.id }));
        await addNutritionItems(itemsWithPlanId);
      }
      
      return newPlan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active_nutrition_plan", variables.plan.horse_id] });
      queryClient.invalidateQueries({ queryKey: ["all_nutrition_plans", variables.plan.horse_id] });
    },
  });
}

export function useUpdatePlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, status, approverId, horseId }: { planId: string, status: any, approverId?: string, horseId: string }) => {
      const updated = await updateNutritionPlanStatus(planId, status, approverId);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active_nutrition_plan", variables.horseId] });
      queryClient.invalidateQueries({ queryKey: ["all_nutrition_plans", variables.horseId] });
    },
  });
}

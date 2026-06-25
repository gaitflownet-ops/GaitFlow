import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNutritionCenterMetrics, getAllNutritionPlansDetailed } from "../api-nutrition-center";

export function useNutritionCenterMetrics() {
  return useQuery({
    queryKey: ["nutrition_center_metrics"],
    queryFn: () => getNutritionCenterMetrics(),
  });
}

export function useAllNutritionPlansDetailed() {
  return useQuery({
    queryKey: ["nutrition_plans_detailed"],
    queryFn: () => getAllNutritionPlansDetailed(),
  });
}

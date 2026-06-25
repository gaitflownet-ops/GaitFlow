import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWellnessRecords, getLatestWellnessRecord, createWellnessRecord, getWaterManagementLogs, createWaterManagementLog } from "../api-wellness";

export function useWellnessRecords(horseId: string) {
  return useQuery({
    queryKey: ["wellness_records", horseId],
    queryFn: () => getWellnessRecords(horseId),
    enabled: !!horseId,
  });
}

export function useLatestWellnessRecord(horseId: string) {
  return useQuery({
    queryKey: ["latest_wellness", horseId],
    queryFn: () => getLatestWellnessRecord(horseId),
    enabled: !!horseId,
  });
}

export function useCreateWellnessRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: any) => {
      return await createWellnessRecord(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wellness_records", variables.horse_id] });
      queryClient.invalidateQueries({ queryKey: ["latest_wellness", variables.horse_id] });
    },
  });
}

export function useWaterLogs(locationId?: string, horseId?: string) {
  return useQuery({
    queryKey: ["water_logs", locationId, horseId],
    queryFn: () => getWaterManagementLogs(locationId, horseId),
  });
}

export function useCreateWaterLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: any) => {
      return await createWaterManagementLog(log);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["water_logs"] });
    },
  });
}

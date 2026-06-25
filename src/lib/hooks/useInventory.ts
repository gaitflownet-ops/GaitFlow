import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getFeedInventory, updateFeedStock, createInventoryItem, updateInventoryItem, deleteInventoryItem,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier 
} from "../api-inventory";

export function useFeedInventory() {
  return useQuery({
    queryKey: ["feed_inventory"],
    queryFn: () => getFeedInventory(),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: any) => createInventoryItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_inventory"] }),
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => updateInventoryItem(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_inventory"] }),
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_inventory"] }),
  });
}

// --- SUPPLIERS ---

export function useSuppliers() {
  return useQuery({
    queryKey: ["feed_suppliers"],
    queryFn: () => getSuppliers(),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplier: any) => createSupplier(supplier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => updateSupplier(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed_suppliers"] }),
  });
}

export function useUpdateFeedStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inventoryId, quantity }: { inventoryId: string, quantity: number }) => {
      return await updateFeedStock(inventoryId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed_inventory"] });
    },
  });
}

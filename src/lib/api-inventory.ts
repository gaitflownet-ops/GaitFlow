import { supabase } from "./supabase";

export const getFeedInventory = async () => {
  const { data, error } = await (supabase as any)
    .from('feed_inventory')
    .select(`
      *,
      supplier:feed_suppliers(*)
    `)
    .order('category', { ascending: true });

  if (error) throw error;
  return data;
};

export const updateFeedStock = async (inventoryId: string, quantityToDeduct: number) => {
  // In a real scenario, this would likely be an RPC call to handle concurrency safely
  // For now, we'll fetch and update
  const { data: current, error: fetchError } = await (supabase as any)
    .from('feed_inventory')
    .select('current_stock_kg')
    .eq('id', inventoryId)
    .single();

  if (fetchError) throw fetchError;

  const newStock = Math.max(0, current.current_stock_kg - quantityToDeduct);

  const { data, error } = await (supabase as any)
    .from('feed_inventory')
    .update({ current_stock_kg: newStock })
    .eq('id', inventoryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- INVENTORY CRUD ---

export const createInventoryItem = async (item: any) => {
  const { data, error } = await (supabase as any)
    .from('feed_inventory')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryItem = async (id: string, updates: any) => {
  const { data, error } = await (supabase as any)
    .from('feed_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryItem = async (id: string) => {
  const { error } = await (supabase as any)
    .from('feed_inventory')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- SUPPLIERS CRUD ---

export const getSuppliers = async () => {
  const { data, error } = await (supabase as any)
    .from('feed_suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const createSupplier = async (supplier: any) => {
  const { data, error } = await (supabase as any)
    .from('feed_suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: any) => {
  const { data, error } = await (supabase as any)
    .from('feed_suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string) => {
  const { error } = await (supabase as any)
    .from('feed_suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { supabase } from "./supabase";

export const getWellnessRecords = async (horseId: string) => {
  const { data, error } = await (supabase as any)
    .from('ccc_wellness_records')
    .select(`
      *,
      recorder:profiles!ccc_wellness_records_recorded_by_fkey(name)
    `)
    .eq('horse_id', horseId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getLatestWellnessRecord = async (horseId: string) => {
  const { data, error } = await (supabase as any)
    .from('ccc_wellness_records')
    .select('*')
    .eq('horse_id', horseId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data;
};

export const createWellnessRecord = async (record: any) => {
  const { data, error } = await (supabase as any)
    .from('ccc_wellness_records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getWaterManagementLogs = async (locationId?: string, horseId?: string) => {
  let query = (supabase as any)
    .from('ccc_water_management')
    .select(`
      *,
      checker:profiles!ccc_water_management_checked_by_fkey(name)
    `)
    .order('date', { ascending: false });

  if (locationId) query = query.eq('location_id', locationId);
  if (horseId) query = query.eq('horse_id', horseId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createWaterManagementLog = async (log: any) => {
  const { data, error } = await (supabase as any)
    .from('ccc_water_management')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
};

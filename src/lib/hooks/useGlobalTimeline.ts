import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';

export function useGlobalTimeline() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery({
    queryKey: ['global_timeline', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase.from('global_timeline') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 30000 // Refetch every 30s as a fallback
  });
}

import { supabase } from '../supabase';

type SubscriptionCallback = (payload: any) => void;

class RealtimeService {
  private static instance: RealtimeService;
  private timelineSub: any;
  private financialSub: any;

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public subscribeToTimeline(organizationId: string, onEvent: SubscriptionCallback) {
    if (this.timelineSub) return;

    this.timelineSub = supabase
      .channel('public:global_timeline')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_timeline',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          onEvent(payload.new);
        }
      )
      .subscribe();
  }

  public unsubscribeFromTimeline() {
    if (this.timelineSub) {
      supabase.removeChannel(this.timelineSub);
      this.timelineSub = null;
    }
  }

  public subscribeToFinancials(organizationId: string, onEvent: SubscriptionCallback) {
    if (this.financialSub) return;

    this.financialSub = supabase
      .channel('public:financial_transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_transactions',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          onEvent(payload);
        }
      )
      .subscribe();
  }

  public unsubscribeFromFinancials() {
    if (this.financialSub) {
      supabase.removeChannel(this.financialSub);
      this.financialSub = null;
    }
  }
}

export const realtimeService = RealtimeService.getInstance();

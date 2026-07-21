import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { realtimeService } from '@/lib/services/RealtimeService';
import { Activity, DollarSign, HeartPulse, FileText, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  module: string;
  icon?: string;
  is_automated: boolean;
  created_at: string;
}

const getIconForModule = (module: string) => {
  switch (module) {
    case 'financial': return <DollarSign size={14} className="text-emerald-500" />;
    case 'health': return <HeartPulse size={14} className="text-rose-500" />;
    case 'marketplace': return <CheckCircle2 size={14} className="text-sky-500" />;
    default: return <Activity size={14} className="text-indigo-500" />;
  }
};

export const GlobalTimeline = () => {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar eventos iniciales
  useEffect(() => {
    const fetchEvents = async () => {
      if (!orgId) return;
      const { data } = await supabase
        .from('global_timeline')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [orgId]);

  // Suscribirse a nuevos eventos en tiempo real
  useEffect(() => {
    if (!orgId) return;

    realtimeService.subscribeToTimeline(orgId, (newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    });

    return () => {
      realtimeService.unsubscribeFromTimeline();
    };
  }, [orgId]);

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Clock size={16} className="animate-spin"/> Cargando línea de tiempo...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2 border-dashed border-2 rounded-lg">
        <Activity size={32} className="text-slate-300" />
        <p>No hay actividad reciente en la organización.</p>
        <p className="text-xs">Los eventos automatizados aparecerán aquí mágicamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative border-l-2 border-indigo-200/50 ml-4 space-y-6 pb-4">
        {events.map((event, i) => (
          <div key={event.id} className="relative pl-8 group animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            {/* Ícono de la línea con glow */}
            <div className={`absolute -left-[14px] top-1 h-7 w-7 rounded-full border-[3px] border-background flex items-center justify-center transition-transform group-hover:scale-110 ${event.is_automated ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' : 'bg-secondary text-muted-foreground'}`}>
              {getIconForModule(event.module)}
            </div>
            
            {/* Contenido de la tarjeta Premium */}
            <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${event.is_automated ? 'bg-indigo-500/5 border-indigo-500/20 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/40 group-hover:-translate-y-0.5' : 'bg-card hover:bg-secondary/20 border-border shadow-sm group-hover:border-border/80 group-hover:-translate-y-0.5'}`}>
              <div className="flex justify-between items-start mb-1.5 gap-3">
                <h4 className="font-display font-semibold text-[15px] text-foreground leading-tight">
                  {event.title}
                </h4>
                <time className="text-[11px] text-muted-foreground font-mono shrink-0 bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                  {format(new Date(event.created_at), 'hh:mm a', { locale: es })}
                </time>
              </div>
              
              {event.description && (
                <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              {event.is_automated && (
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2.5 py-1.5 rounded-md w-fit border border-indigo-500/20">
                  <Activity size={12} className="animate-pulse" />
                  GaitFlow Automation
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

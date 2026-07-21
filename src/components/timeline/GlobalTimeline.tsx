import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
    case 'financial': return <DollarSign size={16} className="text-green-600" />;
    case 'health': return <HeartPulse size={16} className="text-red-500" />;
    case 'marketplace': return <CheckCircle2 size={16} className="text-blue-500" />;
    default: return <Activity size={16} className="text-slate-500" />;
  }
};

export const GlobalTimeline = () => {
  const { orgId } = useAuth();
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
      <div className="relative border-l-2 border-slate-200 ml-3 md:ml-4 space-y-6 pb-4">
        {events.map((event) => (
          <div key={event.id} className="relative pl-6 sm:pl-8 group">
            {/* Ícono de la línea (círculo) */}
            <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center ${event.is_automated ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100'}`}>
              {getIconForModule(event.module)}
            </div>
            
            {/* Contenido de la tarjeta */}
            <div className={`p-3 md:p-4 rounded-lg border shadow-sm transition-all duration-200 ${event.is_automated ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300' : 'bg-white hover:border-slate-300'}`}>
              <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-semibold text-sm text-slate-900 leading-tight">
                  {event.title}
                </h4>
                <time className="text-[10px] sm:text-xs text-slate-500 font-mono shrink-0">
                  {format(new Date(event.created_at), 'hh:mm a', { locale: es })}
                </time>
              </div>
              
              {event.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {event.description}
                </p>
              )}

              {event.is_automated && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded w-fit">
                  <Activity size={10} />
                  Automation Engine
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

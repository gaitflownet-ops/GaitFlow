/**
 * HorseReproductionProfileView.tsx — Ficha Completa del Ejemplar Reproductivo (Requerimientos 10 & 11)
 * Vista dedicada de página entera con 10 pestañas especializadas e historial cronológico visual
 */
import { useState } from "react";
import {
  ArrowLeft,
  Info,
  HeartPulse,
  Dna,
  FolderOpen,
  FlaskConical,
  Activity,
  Syringe,
  Image,
  Clock,
  FileText,
  Baby,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { Mare, StallionProfile } from "@/lib/hooks/useBreeding";

interface Props {
  horseData: Mare | StallionProfile;
  type: "mare" | "stallion";
  onBack: () => void;
}

type TabType =
  | "general"
  | "historial"
  | "genealogia"
  | "documentos"
  | "laboratorios"
  | "ecografias"
  | "vacunas"
  | "galeria"
  | "timeline"
  | "observaciones";

export function HorseReproductionProfileView({ horseData, type, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("general");

  const h = (horseData as any).horse || {
    name: type === "mare" ? "Esperanza del Sol" : "Carbonero V",
    code: type === "mare" ? "YEG-014" : "SEM-002",
    breed: "Paso Fino",
    age: 7,
    image_url: type === "mare" ? "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=800&q=80",
    bloodline: "Dulce Sueño × La Maravilla",
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "Información General", icon: Info },
    { id: "historial", label: "Historial Reproductivo", icon: HeartPulse },
    { id: "genealogia", label: "Genealogía", icon: Dna },
    { id: "documentos", label: "Documentos", icon: FolderOpen },
    { id: "laboratorios", label: "Laboratorios", icon: FlaskConical },
    { id: "ecografias", label: "Ecografías", icon: Activity },
    { id: "vacunas", label: "Vacunas / Salud", icon: Syringe },
    { id: "galeria", label: "Galería", icon: Image },
    { id: "timeline", label: "Timeline Cronológico", icon: Clock },
    { id: "observaciones", label: "Observaciones", icon: FileText },
  ];

  // Connected Chronology steps (Req 11)
  const chronologicalHistory = [
    { stage: "Nacimiento", date: "2019-04-12", desc: "Nacimiento en Criadero El Dorado. Registro A-1029.", icon: Baby, color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
    { stage: "Primer Servicio", date: "2022-05-18", desc: "Inseminación con semen fresco de Dulce Sueño.", icon: Syringe, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
    { stage: "Diagnóstico Positivo", date: "2022-06-02", desc: "Confirmación ecográfica de vesícula embrionaria a D15.", icon: Activity, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
    { stage: "Lavado Embrión", date: "2023-08-10", desc: "Lavado uterino exitoso. Obtención de Blastocisto Grado I.", icon: Dna, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" },
    { stage: "Transferencia a Receptora", date: "2023-08-12", desc: "Transferencia limpia a Receptora R-44.", icon: Activity, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" },
    { stage: "Parto Exitoso", date: "2024-07-04", desc: "Nacimiento de potranca sana 'Maravilla del Sol'.", icon: Baby, color: "text-pink-500 bg-pink-500/10 border-pink-500/30" },
    { stage: "Destete", date: "2025-01-10", desc: "Destete completado sin contratiempos.", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-xs font-semibold hover:bg-secondary transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al Centro de Reproducción
      </button>

      {/* Hero Profile Card Header */}
      <div className="lux-card overflow-hidden relative">
        <div className="h-64 w-full bg-black relative">
          <img
            src={h.image_url}
            alt={h.name}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground mb-2 inline-block">
                Ficha Técnica {type === "mare" ? "Yegua Reproductora" : "Semental Reproductor"}
              </span>
              <h1 className="font-display text-4xl lg:text-5xl font-bold">{h.name}</h1>
              <p className="text-sm text-white/80 font-light mt-1">
                {h.breed} · {h.age} Años · Pedigree: {h.bloodline}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
                <span className="block text-[10px] text-white/70 uppercase font-bold">Estado Reproductivo</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  {(horseData as any).reproductive_status || (horseData as any).status || "Activo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border hover:bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="lux-card p-6 min-h-[400px]">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold pb-2 border-b border-border">Datos del Ejemplar</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground block">Nombre Oficial:</span> <strong>{h.name}</strong></div>
                <div><span className="text-muted-foreground block">Código Interno:</span> <strong>{h.code || "REG-991"}</strong></div>
                <div><span className="text-muted-foreground block">Raza:</span> <strong>{h.breed}</strong></div>
                <div><span className="text-muted-foreground block">Edad:</span> <strong>{h.age} Años</strong></div>
                <div><span className="text-muted-foreground block">Microchip:</span> <strong>9851410029381</strong></div>
                <div><span className="text-muted-foreground block">Registro Fedequinas/USEF:</span> <strong>#28194-CC</strong></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold pb-2 border-b border-border">Resumen Genético</h3>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
                <div><span className="text-muted-foreground">Padre (Sire):</span> <strong>Dulce Sueño de Lusitania</strong></div>
                <div><span className="text-muted-foreground">Madre (Dam):</span> <strong>La Maravilla de las Mercedes</strong></div>
                <div><span className="text-muted-foreground">Abuelo Paterno:</span> <strong>Capuchino</strong></div>
                <div><span className="text-muted-foreground">Abuela Materna:</span> <strong>La Castañuela</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Requirements 11: Connected Visual Chronological Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-border">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Historial Cronológico de Vida Reproductiva
              </h3>
              <p className="text-xs text-muted-foreground">Línea de tiempo continua de nacimiento a partos y destetes</p>
            </div>

            <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-1 before:bg-primary/20">
              {chronologicalHistory.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="relative group">
                    <div className={`absolute -left-8 top-1 h-7 w-7 rounded-full border flex items-center justify-center bg-card ${item.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm">{item.stage}</span>
                        <span className="text-xs text-muted-foreground font-mono">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab !== "general" && activeTab !== "timeline" && (
          <div className="py-16 text-center text-muted-foreground">
            <Info className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h4 className="font-display text-lg font-bold text-foreground capitalize">Pestaña {activeTab}</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Registro detallado de {activeTab} para el ejemplar <strong>{h.name}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

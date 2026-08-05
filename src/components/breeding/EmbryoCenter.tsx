/**
 * EmbryoCenter.tsx — Centro de Embriones (Requerimiento 8)
 * Gestión completa de embriones lavados, congelados, transferidos e implantados
 */
import { useState } from "react";
import { Dna, Plus, Share2, Baby, Calendar, CheckCircle2, AlertOctagon, Filter } from "lucide-react";
import type { Embryo, EmbryoStatus } from "@/lib/hooks/useBreeding";

interface Props {
  embryos: Embryo[];
  onCreateEmbryo: () => void;
}

const EMBRYO_STATUS_COLORS: Record<EmbryoStatus, { color: string; badge: string }> = {
  Congelado: { color: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", badge: "🧊 Congelado (LN₂)" },
  Transferido: { color: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", badge: "🔄 Transferido" },
  Implantado: { color: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", badge: "🤰 Implantado" },
  Nacido: { color: "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", badge: "🌟 Nacido" },
  Pérdida: { color: "border-red-300 bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300", badge: "❌ Pérdida" },
};

export function EmbryoCenter({ embryos, onCreateEmbryo }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const displayEmbryos: Embryo[] = embryos.length > 0 ? embryos : [
    {
      id: "emb1",
      organization_id: "org1",
      donor_mare_id: "m1",
      stallion_id: "s1",
      recipient_mare_id: "rec1",
      flush_date: "2026-07-20",
      transfer_date: "2026-07-22",
      grade: "Calidad I",
      stage: "Blastocisto Expandido",
      status: "Implantado",
      vet_name: "Dr. Roberto Silva",
      donor_mare: { name: "Esperanza de la Cima", breed: "CCC" },
      stallion: { name: "Carbonero V", breed: "CCC" },
      recipient_mare: { name: "Receptora R-102", breed: "Mestizo" },
      created_at: "",
      updated_at: "",
    },
    {
      id: "emb2",
      organization_id: "org1",
      donor_mare_id: "m2",
      stallion_id: "s2",
      flush_date: "2026-07-28",
      grade: "Calidad I",
      stage: "Blastocisto",
      status: "Congelado",
      vet_name: "Dra. María Gómez",
      donor_mare: { name: "Luna Llena", breed: "Paso Fino" },
      stallion: { name: "Dulce Sueño", breed: "Paso Fino" },
      created_at: "",
      updated_at: "",
    },
    {
      id: "emb3",
      organization_id: "org1",
      donor_mare_id: "m3",
      stallion_id: "s1",
      recipient_mare_id: "rec2",
      flush_date: "2026-06-15",
      transfer_date: "2026-06-17",
      grade: "Calidad II",
      stage: "Mórula",
      status: "Nacido",
      vet_name: "Dr. Carlos Rossi",
      donor_mare: { name: "Princesa Real", breed: "CCC" },
      stallion: { name: "Carbonero V", breed: "CCC" },
      recipient_mare: { name: "Receptora R-88", breed: "Mestizo" },
      created_at: "",
      updated_at: "",
    },
  ];

  const filtered = filterStatus === "all"
    ? displayEmbryos
    : displayEmbryos.filter((e) => e.status === filterStatus);

  return (
    <div className="lux-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Dna className="h-5 w-5 text-cyan-500" /> Centro de Embriones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro, lavado, calidad, transferencias e implantación embrionaria
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateEmbryo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Registrar Embrión / Lavado
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
            filterStatus === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
          }`}
        >
          Todos ({displayEmbryos.length})
        </button>
        {["Congelado", "Transferido", "Implantado", "Nacido", "Pérdida"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
              filterStatus === st ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary text-muted-foreground"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Embryo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emb) => {
          const cfg = EMBRYO_STATUS_COLORS[emb.status] || EMBRYO_STATUS_COLORS.Congelado;

          return (
            <div key={emb.id} className="lux-card p-5 border-border hover:border-cyan-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Dna className="h-4 w-4" /> EMB-{emb.id.slice(0, 5).toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                    {cfg.badge}
                  </span>
                </div>

                {/* Donadora / Padre / Receptora */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Yegua Donadora</span>
                    <span className="font-bold text-foreground text-sm">{emb.donor_mare?.name || "Donadora N/E"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <span className="block text-[10px] text-muted-foreground">Semental</span>
                      <span className="font-semibold text-foreground truncate block">{emb.stallion?.name || "Semental N/E"}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <span className="block text-[10px] text-muted-foreground">Receptora</span>
                      <span className="font-semibold text-foreground truncate block">{emb.recipient_mare?.name || "Sin asignar"}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                  <div>
                    <span>Calidad: </span>
                    <strong className="text-foreground">{emb.grade}</strong>
                  </div>
                  <div>
                    <span>Etapa: </span>
                    <strong className="text-foreground">{emb.stage}</strong>
                  </div>
                  <div>
                    <span>Fecha Lavado: </span>
                    <strong className="text-foreground">{new Date(emb.flush_date).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span>Fecha Transfer.: </span>
                    <strong className="text-foreground">{emb.transfer_date ? new Date(emb.transfer_date).toLocaleDateString() : "N/R"}</strong>
                  </div>
                </div>
              </div>

              {/* Status Chronology Bar */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Lavado</span>
                  <span>Transferencia</span>
                  <span>Parto</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden flex">
                  <div className="h-full bg-cyan-500 w-1/3" />
                  <div className={`h-full ${emb.status !== "Congelado" ? "bg-indigo-500" : "bg-secondary"} w-1/3`} />
                  <div className={`h-full ${emb.status === "Nacido" ? "bg-rose-500" : "bg-secondary"} w-1/3`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

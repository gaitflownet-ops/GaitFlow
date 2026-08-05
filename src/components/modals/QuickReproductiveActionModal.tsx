/**
 * QuickReproductiveActionModal.tsx — Wizard universal para Palpación, Diagnóstico, Monta y Embrión
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import { useCreateReproductiveEvent, useCreateEmbryo } from "@/lib/hooks/useBreeding";
import { Stethoscope, Activity, HeartPulse, Dna, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  actionType: "monta" | "inseminacion" | "palpacion" | "diagnostico" | "parto" | "embrion" | null;
}

export function QuickReproductiveActionModal({ open, onClose, actionType }: Props) {
  const { data: horses = [] } = useHorses();
  const createEvent = useCreateReproductiveEvent();
  const createEmbryo = useCreateEmbryo();

  const mares = horses.filter((h) => h.sex === "Yegua" || h.sex === "Female" || h.sex === "Mare" || true);
  const stallions = horses.filter((h) => h.sex === "Stallion" || h.sex === "Semental" || h.sex === "Macho" || true);

  const [form, setForm] = useState({
    mare_id: "",
    stallion_id: "",
    recipient_mare_id: "",
    date: new Date().toISOString().split("T")[0],
    vet_name: "",
    findings: "",
    grade: "Calidad I" as const,
    stage: "Blastocisto" as const,
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!actionType) return null;

  const titles: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
    monta: { title: "Registrar Monta Natural", desc: "Registro directo de cubrición entre semental y yegua", icon: HeartPulse },
    palpacion: { title: "Registrar Palpación / Ecografía", desc: "Chequeo ginecológico y foliculario por veterinario", icon: Stethoscope },
    diagnostico: { title: "Registrar Diagnóstico de Gestación", desc: "Confirmación ecográfica de gestación (14, 30 o 60 días)", icon: Activity },
    embrion: { title: "Registrar Lavado / Embrión", desc: "Registro de embrión obtenido por lavado uterino", icon: Dna },
  };

  const current = titles[actionType] || titles.palpacion;
  const Icon = current.icon;

  async function handleSubmit() {
    if (!form.mare_id || !form.date) return;

    if (actionType === "embrion") {
      await createEmbryo.mutateAsync({
        donor_mare_id: form.mare_id,
        stallion_id: form.stallion_id || (stallions[0]?.id || form.mare_id),
        recipient_mare_id: form.recipient_mare_id || undefined,
        flush_date: form.date,
        grade: form.grade,
        stage: form.stage,
        status: "Congelado",
        vet_name: form.vet_name,
        notes: form.findings,
      });
    } else {
      const eventTypeMap: Record<string, any> = {
        monta: "Monta",
        palpacion: "Palpación",
        diagnostico: "Diagnóstico",
      };

      await createEvent.mutateAsync({
        mare_id: form.mare_id,
        stallion_id: form.stallion_id || undefined,
        event_type: eventTypeMap[actionType] || "Palpación",
        scheduled_date: form.date,
        completed_date: form.date,
        status: "Completado",
        vet_name: form.vet_name,
        result: form.findings,
        notes: form.findings,
      });
    }

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-7 pt-7 pb-4 border-b border-border">
        <div className="eyebrow mb-1">Acción Rápida Reproductiva</div>
        <h2 className="font-display text-2xl flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" /> {current.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{current.desc}</p>
      </div>

      <div className="px-7 py-6 space-y-4">
        <div>
          <label className="label-field">Yegua *</label>
          <select id="quick-mare-select" className="input-field" value={form.mare_id} onChange={set("mare_id")}>
            <option value="">Seleccionar yegua...</option>
            {mares.map((m) => (
              <option key={m.id} value={m.id}>{m.name} {m.breed ? `· ${m.breed}` : ""}</option>
            ))}
          </select>
        </div>

        {(actionType === "monta" || actionType === "embrion") && (
          <div>
            <label className="label-field">Semental Reproductor</label>
            <select id="quick-stallion-select" className="input-field" value={form.stallion_id} onChange={set("stallion_id")}>
              <option value="">Seleccionar semental...</option>
              {stallions.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.breed ? `· ${s.breed}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        {actionType === "embrion" && (
          <div>
            <label className="label-field">Yegua Receptora (Opcional)</label>
            <select id="quick-recipient-select" className="input-field" value={form.recipient_mare_id} onChange={set("recipient_mare_id")}>
              <option value="">Sin asignar (Permanecerá Congelado)</option>
              {mares.map((m) => (
                <option key={m.id} value={m.id}>{m.name} (Receptora)</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Fecha *</label>
            <input id="quick-date" type="date" className="input-field" value={form.date} onChange={set("date")} />
          </div>
          <div>
            <label className="label-field">Veterinario Responsable</label>
            <input id="quick-vet" className="input-field" value={form.vet_name} onChange={set("vet_name")} placeholder="Dr. ..." />
          </div>
        </div>

        <div>
          <label className="label-field">Hallazgos / Resultados / Observaciones</label>
          <textarea
            id="quick-findings"
            className="input-field resize-none h-20"
            value={form.findings}
            onChange={set("findings")}
            placeholder="Resultado del examen, tamaño folicular, vesícula embrionaria..."
          />
        </div>
      </div>

      <div className="px-7 pb-7 flex items-center justify-between border-t border-border pt-5">
        <button id="quick-cancel-btn" onClick={onClose} className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors">
          Cancelar
        </button>
        <button
          id="quick-submit-btn"
          disabled={!form.mare_id || !form.date}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Registrar Evento
        </button>
      </div>
    </Modal>
  );
}

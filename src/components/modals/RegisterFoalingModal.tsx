/**
 * RegisterFoalingModal.tsx — Enterprise Specialized Foaling & Automatic Foal Creation Wizard
 *
 * 5-Step Enterprise Flow:
 * 1. Pregnant Mare Selection + Gestation Days Context Card & Sire Pedigree
 * 2. Parturition & Obstetric Details (Type of birth, Placenta expulsion, Colostrum Brix %)
 * 3. Foal Registration & Database Creation (Official name, Sex, Color, Weight, Health)
 * 4. Automatic Synchronization (New Horse creation, Cycle completion, Mare to 'Lactancia', Neonatal check)
 * 5. Executive Confirmation Summary & Continuous Actions
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { useHorses, useCreateHorse } from "@/lib/hooks/useHorses";
import {
  useMares,
  useBreedingCycles,
  useUpdateBreedingCycle,
  useCreateReproductiveEvent,
  useUpdateMareStatus,
} from "@/lib/hooks/useBreeding";
import { useApp } from "@/lib/store";

import {
  Baby,
  Search,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  Clock,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedMareId?: string;
  onNavigateView?: (view: string) => void;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RegisterFoalingModal({ open, onClose, preselectedMareId, onNavigateView }: Props) {
  const { state } = useApp();
  const { data: horses = [] } = useHorses();
  const { data: maresList = [] } = useMares();
  const { data: cyclesList = [] } = useBreedingCycles();

  const createHorse = useCreateHorse();
  const updateCycle = useUpdateBreedingCycle();
  const createEvent = useCreateReproductiveEvent();
  const updateMareStatus = useUpdateMareStatus();

  // Wizard state (Steps 1 to 5)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Female Mares only
  const isFemale = (h: any) => {
    if (!h) return false;
    const sex = String(h.sex || "").trim().toLowerCase();
    return sex === "yegua" || sex === "mare" || sex === "hembra" || sex === "female" || sex === "f";
  };
  const femaleHorses = horses.filter(isFemale);

  const [mareSearch, setMareSearch] = useState("");

  // Form State
  const [form, setForm] = useState({
    mare_id: preselectedMareId || "",
    actual_foaling_date: new Date().toISOString().split("T")[0],
    foaling_time: "04:15",
    birth_type: "Parto Eutócico Normal (Sin Asistencia)" as "Parto Eutócico Normal (Sin Asistencia)" | "Parto Asistido Leve" | "Parto Distócico (Complicado)",
    placenta_expulsion: "Expulsión Completa (< 2 Horas)" as "Expulsión Completa (< 2 Horas)" | "Retención Parcial" | "Retención Completa (> 3 Horas)",
    colostrum_brix_pct: "24",
    attendant_name: "",
    
    // Foal Info
    foal_name: "",
    foal_barn_name: "",
    foal_sex: "Potro (Macho)" as "Potro (Macho)" | "Potranca (Hembra)",
    foal_color: "Castaño",
    foal_weight_kg: "45",
    foal_microchip: "",
    foal_health_status: "Excelente / Vigoroso" as "Excelente / Vigoroso" | "Estable en Observación" | "Cuidados Intensivos",
    notes: "",

    // Schedule neonatal check
    schedule_neonatal_check: true,
  });

  const setF = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Selected Mare & Active Breeding Cycle
  const selectedMareHorse = femaleHorses.find((h) => h.id === form.mare_id);
  const selectedMareRecord = maresList.find((m) => m.horse_id === form.mare_id || m.id === form.mare_id);
  const pregnantCycle = cyclesList.find(
    (c) => c.mare_id === form.mare_id && (c.pregnancy_status === "Confirmed" || c.pregnancy_status === "Pending")
  ) || cyclesList.find((c) => c.mare_id === form.mare_id);

  // Calculate gestation days
  function getGestationDays() {
    if (!pregnantCycle?.insemination_date) return 340;
    const diff = Math.floor((Date.now() - new Date(pregnantCycle.insemination_date).getTime()) / 86400000);
    return diff > 0 ? diff : 340;
  }

  async function handleSubmitFoaling() {
    if (!form.mare_id) {
      toast.error("Selecciona una yegua parturienta.");
      return;
    }
    if (!form.foal_name.trim()) {
      toast.error("Ingresa el nombre del potro / potranca.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sireName = pregnantCycle?.stallion_name || "Semental";
      const damName = selectedMareHorse?.name || "Yegua Madre";

      // 1. Create New Foal in `horses` inventory
      const slug = `${toSlug(form.foal_name.trim())}-${Date.now().toString(36)}`;
      const createdFoal = await createHorse.mutateAsync({
        name: form.foal_name.trim(),
        barn_name: form.foal_barn_name.trim() || form.foal_name.trim(),
        slug,
        sex: form.foal_sex.includes("Macho") ? "Macho" : "Hembra",
        color: form.foal_color || undefined,
        breed: selectedMareHorse?.breed || "Paso Fino",
        status: "Potro en Desarrollo",
        birth_date: form.actual_foaling_date,
        organization_id: (state.user as any)?.organization_id,
        owner_id: state.user?.id,
        bloodline: `${sireName} × ${damName}`,
        microchip: form.foal_microchip.trim() || undefined,
      } as any);

      // 2. Update Breeding Cycle to 'Completed' / 'Foaled'
      if (pregnantCycle) {
        await updateCycle.mutateAsync({
          id: pregnantCycle.id,
          updates: {
            actual_foaling_date: form.actual_foaling_date,
            foal_id: createdFoal?.id,
            pregnancy_status: "Confirmed",
            notes: [
              pregnantCycle.notes || null,
              `PARTO: ${form.birth_type}`,
              `Placenta: ${form.placenta_expulsion}`,
              `Calostro: ${form.colostrum_brix_pct}% Brix`,
              `Cría: ${form.foal_name.trim()} (${form.foal_sex})`,
              form.notes || null,
            ].filter(Boolean).join(" | "),
          },
        });
      }

      // 3. Create Reproductive Event for Parturition
      await createEvent.mutateAsync({
        cycle_id: pregnantCycle?.id,
        mare_id: form.mare_id,
        event_type: "Parto",
        scheduled_date: form.actual_foaling_date,
        completed_date: form.actual_foaling_date,
        status: "Completado",
        vet_name: form.attendant_name || undefined,
        result: `Nacimiento exitoso: ${form.foal_name.trim()} (${form.foal_sex})`,
        notes: `Calostro: ${form.colostrum_brix_pct}% Brix | Peso: ${form.foal_weight_kg}kg | ${form.placenta_expulsion}`,
      });

      // 4. Schedule Neonatal Check in Calendar (+24h)
      if (form.schedule_neonatal_check) {
        const dNext = new Date(form.actual_foaling_date);
        dNext.setDate(dNext.getDate() + 1);
        await createEvent.mutateAsync({
          cycle_id: pregnantCycle?.id,
          mare_id: form.mare_id,
          event_type: "Palpación",
          scheduled_date: dNext.toISOString().split("T")[0],
          status: "Programado",
          vet_name: form.attendant_name || undefined,
          notes: `Control neonatal y revisión de transferencia pasiva de inmunidad (Calostro) para ${form.foal_name.trim()}`,
        });
      }

      // 5. Move Mare to 'Lactancia'
      await updateMareStatus.mutateAsync({
        id: form.mare_id,
        reproductive_status: "Lactancia",
      });

      toast.success(`Parto registrado y perfil de "${form.foal_name.trim()}" creado en el inventario`);
      setStep(5); // Move to Executive Summary
    } catch (err: any) {
      console.error("Error al registrar parto:", err);
      toast.error(err.message || "Error al procesar el parto y alta de la cría.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <div className="eyebrow text-rose-600 font-bold">Sección I.4 · Parto y Neonatología</div>
          <div className="text-xs font-semibold text-muted-foreground">Paso {step} de 5</div>
        </div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Baby className="h-6 w-6 text-rose-600" /> Registrar Parto y Alta de la Cría
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-rose-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Body */}
      <div className="px-8 py-6 min-h-[420px] max-h-[70vh] overflow-y-auto">
        {/* ── PASO 1: SELECCIÓN DE YEGUA GESTANTE ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label-field font-semibold text-sm mb-2 block">
                1. Seleccionar Yegua Gestante *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="search-mare-foal"
                  className="input-field pl-10 text-sm"
                  placeholder="Buscar yegua gestante por nombre, código..."
                  value={mareSearch}
                  onChange={(e) => setMareSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {femaleHorses
                .filter(
                  (m) =>
                    m.name.toLowerCase().includes(mareSearch.toLowerCase()) ||
                    (m.code && m.code.toLowerCase().includes(mareSearch.toLowerCase()))
                )
                .map((m) => {
                  const isSel = form.mare_id === m.id;
                  const cycle = cyclesList.find((c) => c.mare_id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mare_id: m.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "border-rose-600 bg-rose-500/10 ring-2 ring-rose-600/20"
                          : "border-border hover:border-rose-600/40 hover:bg-secondary/40"
                      }`}
                    >
                      <img
                        src={m.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                        alt={m.name}
                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {cycle?.stallion_name ? `Padre: ${cycle.stallion_name}` : "Preñez en curso"}
                        </div>
                      </div>
                      {isSel && <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {selectedMareHorse && (
              <div className="lux-card p-4 bg-card border border-rose-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedMareHorse.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                    alt={selectedMareHorse.name}
                    className="h-14 w-14 rounded-xl object-cover border border-border"
                  />
                  <div>
                    <h3 className="font-display font-bold text-base">{selectedMareHorse.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMareHorse.code || "Sin código"} · {selectedMareHorse.breed || "Paso Fino"} · {selectedMareHorse.age || 6} años
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700">
                        Gestación: ~{getGestationDays()} días
                      </span>
                      {pregnantCycle?.stallion_name && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Semental: {pregnantCycle.stallion_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: DETALLES DEL PARTO Y OBSTETRICIA ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                2. Parámetros del Parto y Evaluación Obstétrica
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Registra la fecha, hora y condiciones del alumbramiento.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Fecha del Parto *</label>
                <input type="date" className="input-field mt-1 text-xs" value={form.actual_foaling_date} onChange={setF("actual_foaling_date")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Hora de Expulsión</label>
                <input type="time" className="input-field mt-1 text-xs" value={form.foaling_time} onChange={setF("foaling_time")} />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Veterinario / Asistente</label>
                <input className="input-field mt-1 text-xs" value={form.attendant_name} onChange={setF("attendant_name")} placeholder="Ej. Dr. Médico Veterinario" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Tipo de Parto</label>
                <select className="input-field mt-1 text-xs" value={form.birth_type} onChange={setF("birth_type")}>
                  <option>Parto Eutócico Normal (Sin Asistencia)</option>
                  <option>Parto Asistido Leve</option>
                  <option>Parto Distócico (Complicado)</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Expulsión Placentaria</label>
                <select className="input-field mt-1 text-xs" value={form.placenta_expulsion} onChange={setF("placenta_expulsion")}>
                  <option>Expulsión Completa ({'<'} 2 Horas)</option>
                  <option>Retención Parcial</option>
                  <option>Retención Completa ({'>'} 3 Horas)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Calidad del Calostro (% Brix)</label>
                <input
                  type="number"
                  className="input-field mt-1 text-xs"
                  value={form.colostrum_brix_pct}
                  onChange={setF("colostrum_brix_pct")}
                  placeholder="Ej. 24"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{'>'} 22% indica excelente calidad inmunológica.</p>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Vigor del Neonato</label>
                <select className="input-field mt-1 text-xs" value={form.foal_health_status} onChange={setF("foal_health_status")}>
                  <option>Excelente / Vigoroso (De pie {'<'} 1h)</option>
                  <option>Estable en Observación</option>
                  <option>Cuidados Intensivos</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: FICHA DE LA CRÍA (ALTA EN INVENTARIO) ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                3. Identificación y Alta de la Cría en Inventario *
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                GaitFlow registrará automáticamente a este potro en tu inventario general de caballos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Nombre Oficial de la Cría *</label>
                <input
                  className="input-field mt-1 text-xs"
                  value={form.foal_name}
                  onChange={setF("foal_name")}
                  placeholder="Ej. Nombre del Potro / Potranca"
                />
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Apodo / Nombre de Pesebrera</label>
                <input
                  className="input-field mt-1 text-xs"
                  value={form.foal_barn_name}
                  onChange={setF("foal_barn_name")}
                  placeholder="Ej. Apodo de establo"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-field text-xs font-semibold">Sexo de la Cría</label>
                <select className="input-field mt-1 text-xs" value={form.foal_sex} onChange={setF("foal_sex")}>
                  <option>Potro (Macho)</option>
                  <option>Potranca (Hembra)</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Capa / Color</label>
                <select className="input-field mt-1 text-xs" value={form.foal_color} onChange={setF("foal_color")}>
                  <option>Castaño</option>
                  <option>Zaino</option>
                  <option>Alazán</option>
                  <option>Moro / Tordillo</option>
                  <option>Negro</option>
                  <option>Bayo</option>
                  <option>Otro Color</option>
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-semibold">Peso al Nacer (kg)</label>
                <input
                  type="number"
                  className="input-field mt-1 text-xs"
                  value={form.foal_weight_kg}
                  onChange={setF("foal_weight_kg")}
                  placeholder="Ej. 45"
                />
              </div>
            </div>

            <div>
              <label className="label-field text-xs font-semibold">Microchip / Tatuaje (Opcional)</label>
              <input
                className="input-field mt-1 text-xs"
                value={form.foal_microchip}
                onChange={setF("foal_microchip")}
                placeholder="Ej. 985141002345678"
              />
            </div>

            <div>
              <label className="label-field text-xs font-semibold">Observaciones Obstétricas / Neonatales</label>
              <textarea
                className="input-field mt-1 text-xs resize-none h-16"
                value={form.notes}
                onChange={setF("notes")}
                placeholder="Ej. Reflejo de succión en 30 min, meconio expulsado, desinfección de ombligo..."
              />
            </div>
          </div>
        )}

        {/* ── PASO 4: SEGUIMIENTO AUTOMÁTICO ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label-field font-semibold text-sm mb-1 block">
                4. Protocolo Neonatal y Transición de la Madre
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                GaitFlow actualizará a la madre al estado de Lactancia y agendará el control neonatal.
              </p>
            </div>

            <div className="lux-card p-4 border border-rose-500/20 bg-card rounded-2xl space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 text-rose-800 text-xs">
                <Heart className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold">Alta Inmediata en el Criadero</div>
                  <div className="text-[11px]">La cría quedará registrada en el inventario general con su genealogía ({pregnantCycle?.stallion_name || "Semental"} × {selectedMareHorse?.name || "Yegua"}).</div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.schedule_neonatal_check}
                  onChange={(e) => setForm((f) => ({ ...f, schedule_neonatal_check: e.target.checked }))}
                  className="rounded text-rose-600 mt-1"
                />
                <div>
                  <div className="text-xs font-bold">☑ Programar Control Neonatal (+24 Horas)</div>
                  <div className="text-[11px] text-muted-foreground">
                    Revisión de IgG en suero, desinfección umbilical y estado de lactancia materna.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── PASO 5: RESUMEN EJECUTIVO ── */}
        {step === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-display font-bold text-2xl">¡Nacimiento Registrado y Cría Creada!</h3>

            <div className="lux-card p-5 bg-card border-border rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Nombre de la Cría:</span>
                <span className="font-bold text-rose-700">{form.foal_name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Sexo / Capa:</span>
                <span className="font-bold">{form.foal_sex} · {form.foal_color}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Madre:</span>
                <span className="font-bold">{selectedMareHorse?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Padre / Semental:</span>
                <span className="font-bold">{pregnantCycle?.stallion_name || "Semental"}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Calostro:</span>
                <span className="font-bold">{form.colostrum_brix_pct}% Brix</span>
              </div>
              <div className="flex justify-between pt-1 text-rose-600 font-semibold">
                <span>Estado de la Madre:</span>
                <span>Lactancia</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateView) onNavigateView("yeguas");
                }}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
              >
                <FileText className="h-3.5 w-3.5 inline mr-1" /> Ver Ficha de Yegua
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateView) onNavigateView("calendario");
                }}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1" /> Ver Calendario
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setForm({
                    mare_id: "",
                    actual_foaling_date: new Date().toISOString().split("T")[0],
                    foaling_time: "04:15",
                    birth_type: "Parto Eutócico Normal (Sin Asistencia)",
                    placenta_expulsion: "Expulsión Completa (< 2 Horas)",
                    colostrum_brix_pct: "24",
                    attendant_name: "",
                    foal_name: "",
                    foal_barn_name: "",
                    foal_sex: "Potro (Macho)",
                    foal_color: "Castaño",
                    foal_weight_kg: "45",
                    foal_microchip: "",
                    foal_health_status: "Excelente / Vigoroso",
                    notes: "",
                    schedule_neonatal_check: true,
                  });
                }}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold"
              >
                Registrar Otro Parto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {step < 5 && (
        <div className="px-8 pb-7 pt-4 border-t border-border flex items-center justify-between bg-card">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancelar" : "Atrás"}
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 ? !form.mare_id : step === 3 ? !form.foal_name.trim() : false}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !form.mare_id || !form.foal_name.trim()}
              onClick={handleSubmitFoaling}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando Nacimiento...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Finalizar y Crear Potro
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

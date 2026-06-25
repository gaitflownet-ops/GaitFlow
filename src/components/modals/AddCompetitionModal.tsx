import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { useHorses } from "@/lib/hooks/useHorses";
import { useCreateCompetition } from "@/lib/hooks/useCompetitions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHorseId?: string;
};

export function AddCompetitionModal({ open, onOpenChange, defaultHorseId }: Props) {
  const { data: horses = [] } = useHorses();
  const createCompetition = useCreateCompetition();
  const [horseId, setHorseId] = useState(defaultHorseId ?? "");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [placement, setPlacement] = useState("");
  const [rider, setRider] = useState("");
  const [prize, setPrize] = useState("");
  const [notes, setNotes] = useState("");
  const [gaitType, setGaitType] = useState("");
  const [competitionGrade, setCompetitionGrade] = useState("Grado B");
  const [juez, setJuez] = useState("");
  const [pista, setPista] = useState("Dura");
  const [numeroParticipantes, setNumeroParticipantes] = useState("");

  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setHorseId(defaultHorseId ?? "");
    setEvent("");
    setDate(new Date().toISOString().slice(0, 10));
    setLocation("");
    setCategory("");
    setPlacement("");
    setRider("");
    setPrize("");
    setNotes("");
    setGaitType("");
    setCompetitionGrade("Grado B");
    setJuez("");
    setPista("Dura");
    setNumeroParticipantes("");
    setDone(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError("");

    const targetHorseId = horseId || horses[0]?.id;
    if (!targetHorseId) {
      setError("Seleccione un ejemplar antes de registrar la competencia.");
      return;
    }

    try {
      await createCompetition.mutateAsync({
        horse_id: targetHorseId,
        event,
        date,
        location: location || null,
        category: category || null,
        placement: placement || null,
        rider: rider || null,
        prize: prize || null,
        notes: notes || null,
        gait_type: gaitType || null,
        competition_grade: competitionGrade || null,
        juez: juez || null,
        pista: pista || null,
        numero_participantes: numeroParticipantes ? Number(numeroParticipantes) : null,
      });
      setDone(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la competencia.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Registrar Competencia / Feria" size="lg">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Result logged</p>
          <p className="text-sm text-muted-foreground">
            Dashboard metrics will update automatically.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div>
            <label className="eyebrow block mb-1.5">Horse</label>
            <select
              id="competition-horse"
              className="lux-select"
              value={horseId}
              onChange={(event) => setHorseId(event.target.value)}
            >
              <option value="">Select a horse...</option>
              {horses.map((horse) => (
                <option key={horse.id} value={horse.id}>
                  {horse.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Evento (Feria)</label>
              <input className="lux-input" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Ej. Expo Nacional" required />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Fecha</label>
              <input className="lux-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Grado de Competencia</label>
              <select className="lux-select" value={competitionGrade} onChange={(e) => setCompetitionGrade(e.target.value)}>
                <option value="Grado A">Grado A</option>
                <option value="Grado B">Grado B</option>
                <option value="Festival">Festival</option>
                <option value="Mundial">Mundial</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Modalidad</label>
              <select className="lux-select" value={gaitType} onChange={(e) => setGaitType(e.target.value)}>
                <option value="Paso Fino">Paso Fino</option>
                <option value="Trocha">Trocha</option>
                <option value="Trocha y Galope">Trocha y Galope</option>
                <option value="Trote y Galope">Trote y Galope</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Cinta / Puesto</label>
              <input className="lux-input" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Ej. Cinta Azul (1ro), Gran Campeón" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Puntos Fedequinas / Premio</label>
              <input className="lux-input" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Ej. 100 Pts" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Categoría de Edad</label>
              <input className="lux-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej. 36-48 Meses" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Montador / Chalán</label>
              <input className="lux-input" value={rider} onChange={(e) => setRider(e.target.value)} placeholder="Nombre del chalán" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="eyebrow block mb-1.5">Juez / Jueces</label>
              <input className="lux-input" value={juez} onChange={(e) => setJuez(e.target.value)} placeholder="Nombres" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Tipo de Pista</label>
              <select className="lux-select" value={pista} onChange={(e) => setPista(e.target.value)}>
                <option value="Dura">Dura</option>
                <option value="Blanda">Blanda</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Lugar / Ciudad</label>
              <input className="lux-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ciudad, Departamento" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Número de Participantes</label>
              <input type="number" className="lux-input" value={numeroParticipantes} onChange={(e) => setNumeroParticipantes(e.target.value)} placeholder="Cantidad" />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Notas de la Presentación</label>
            <textarea className="lux-input resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Puntaje, faltas, observaciones del juez..." />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              id="competition-submit"
              type="submit"
              disabled={createCompetition.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {createCompetition.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log result"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

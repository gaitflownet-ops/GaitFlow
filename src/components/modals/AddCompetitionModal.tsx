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
      setError("Create or select a horse before logging a result.");
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
      });
      setDone(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log this result.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Log competition result" size="lg">
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
              <label className="eyebrow block mb-1.5">Event</label>
              <input
                id="competition-event"
                className="lux-input"
                value={event}
                onChange={(inputEvent) => setEvent(inputEvent.target.value)}
                placeholder="Winter Equestrian Festival"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Date</label>
              <input
                id="competition-date"
                className="lux-input"
                type="date"
                value={date}
                onChange={(inputEvent) => setDate(inputEvent.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Placement</label>
              <input
                id="competition-placement"
                className="lux-input"
                value={placement}
                onChange={(inputEvent) => setPlacement(inputEvent.target.value)}
                placeholder="1st, 2nd, Champion"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Prize</label>
              <input
                id="competition-prize"
                className="lux-input"
                value={prize}
                onChange={(inputEvent) => setPrize(inputEvent.target.value)}
                placeholder="$5,000"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Category</label>
              <input
                id="competition-category"
                className="lux-input"
                value={category}
                onChange={(inputEvent) => setCategory(inputEvent.target.value)}
                placeholder="1.40m Amateur"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Rider</label>
              <input
                id="competition-rider"
                className="lux-input"
                value={rider}
                onChange={(inputEvent) => setRider(inputEvent.target.value)}
                placeholder="Rider name"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Location</label>
            <input
              id="competition-location"
              className="lux-input"
              value={location}
              onChange={(inputEvent) => setLocation(inputEvent.target.value)}
              placeholder="Wellington, FL"
            />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              id="competition-notes"
              className="lux-input resize-none"
              rows={3}
              value={notes}
              onChange={(inputEvent) => setNotes(inputEvent.target.value)}
              placeholder="Round notes, judges, conditions..."
            />
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

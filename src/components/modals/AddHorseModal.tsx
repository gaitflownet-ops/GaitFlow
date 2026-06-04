import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "@/lib/store";
import { useCreateHorse, useUpdateHorse, type Horse } from "@/lib/hooks/useHorses";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horse?: Horse | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function AddHorseModal({ open, onOpenChange, horse }: Props) {
  const { state } = useApp();
  const createHorse = useCreateHorse();
  const updateHorse = useUpdateHorse();
  const isEditing = !!horse;
  const [name, setName] = useState("");
  const [barnName, setBarnName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Mare");
  const [discipline, setDiscipline] = useState("");
  const [trainer, setTrainer] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("In Training");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const generatedSlug = useMemo(() => {
    const base = slugify(name || barnName || "horse");
    return `${base}-${Date.now().toString(36)}`;
  }, [barnName, name]);

  useEffect(() => {
    if (!open || !horse) return;

    setName(horse.name);
    setBarnName(horse.barn_name);
    setBreed(horse.breed ?? "");
    setAge(horse.age?.toString() ?? "");
    setSex(horse.sex ?? "Mare");
    setDiscipline(horse.discipline ?? "");
    setTrainer(horse.trainer ?? "");
    setLocation(horse.location ?? "");
    setImageUrl(horse.image_url ?? "");
    setStatus(horse.status ?? "In Training");
    setDone(false);
    setError("");
  }, [horse, open]);

  const reset = () => {
    setName("");
    setBarnName("");
    setBreed("");
    setAge("");
    setSex("Mare");
    setDiscipline("");
    setTrainer("");
    setLocation("");
    setImageUrl("");
    setStatus("In Training");
    setDone(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!state.user?.id) {
      setError("You need to be signed in before adding a horse.");
      return;
    }

    try {
      const payload = {
        name,
        barn_name: barnName || name,
        breed: breed || null,
        age: age ? Number(age) : null,
        sex: sex || null,
        discipline: discipline || null,
        trainer: trainer || null,
        location: location || null,
        image_url: imageUrl || null,
        status,
      };

      if (horse) {
        await updateHorse.mutateAsync({
          id: horse.id,
          updates: payload,
        });
      } else {
        await createHorse.mutateAsync({
          ...payload,
          slug: generatedSlug,
          owner_id: state.user.id,
          latest_achievement: "Horse profile created.",
          is_public: true,
          wins: 0,
          sale_status: "Not for Sale",
        });
      }

      setDone(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the horse.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit horse" : "Add horse"}
      size="lg"
    >
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">{isEditing ? "Horse updated" : "Horse added"}</p>
          <p className="text-sm text-muted-foreground">The barn and dashboard are updating now.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Registered name</label>
              <input
                id="horse-name"
                className="lux-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ember Rose"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Barn name</label>
              <input
                id="horse-barn-name"
                className="lux-input"
                value={barnName}
                onChange={(event) => setBarnName(event.target.value)}
                placeholder="Ember"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Breed</label>
              <input
                id="horse-breed"
                className="lux-input"
                value={breed}
                onChange={(event) => setBreed(event.target.value)}
                placeholder="Warmblood"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Age</label>
              <input
                id="horse-age"
                className="lux-input"
                type="number"
                min="0"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="7"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Sex</label>
              <select
                id="horse-sex"
                className="lux-select"
                value={sex}
                onChange={(event) => setSex(event.target.value)}
              >
                {["Mare", "Gelding", "Stallion", "Colt", "Filly"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Status</label>
              <select
                id="horse-status"
                className="lux-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {["In Training", "Competing", "Resting", "Breeding"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1.5">Discipline</label>
              <input
                id="horse-discipline"
                className="lux-input"
                value={discipline}
                onChange={(event) => setDiscipline(event.target.value)}
                placeholder="Show Jumping"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Trainer</label>
              <input
                id="horse-trainer"
                className="lux-input"
                value={trainer}
                onChange={(event) => setTrainer(event.target.value)}
                placeholder="Team trainer"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Location</label>
            <input
              id="horse-location"
              className="lux-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Wellington · FL"
            />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Image URL</label>
            <input
              id="horse-image-url"
              className="lux-input"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
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
              type="submit"
              id="horse-submit"
              disabled={createHorse.isPending || updateHorse.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {createHorse.isPending || updateHorse.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Save horse"
              ) : (
                "Create horse"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

import { useMemo, useState } from "react";
import { Check, Loader2, Camera } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "@/lib/store";
import { useCreateHorse, useHorses } from "@/lib/hooks/useHorses";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function compressAndBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function AddHorseModal({ open, onOpenChange }: Props) {
  const { state } = useApp();
  const createHorse = useCreateHorse();
  const { data: horses = [] } = useHorses();

  // Stallions and Mares for Pedigree Selection
  const stallions = useMemo(() => horses.filter((h) => h.sex === "Stallion"), [horses]);
  const mares = useMemo(() => horses.filter((h) => h.sex === "Mare"), [horses]);

  // States
  const [name, setName] = useState("");
  const [barnName, setBarnName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Mare");
  const [color, setColor] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [trainer, setTrainer] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("In Training");

  // New Detailed Fields
  const [height, setHeight] = useState("");
  const [microchip, setMicrochip] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [usefId, setUsefId] = useState("");
  const [feiId, setFeiId] = useState("");
  const [aqhaId, setAqhaId] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  // Pedigree Parent Selection
  const [sireOption, setSireOption] = useState<"none" | "existing" | "manual">("none");
  const [selectedSireId, setSelectedSireId] = useState("");
  const [manualSireName, setManualSireName] = useState("");

  const [damOption, setDamOption] = useState<"none" | "existing" | "manual">("none");
  const [selectedDamId, setSelectedDamId] = useState("");
  const [manualDamName, setManualDamName] = useState("");

  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const generatedSlug = useMemo(() => {
    const base = slugify(name || barnName || "horse");
    return `${base}-${Date.now().toString(36)}`;
  }, [barnName, name]);

  const reset = () => {
    setName("");
    setBarnName("");
    setBreed("");
    setAge("");
    setSex("Mare");
    setColor("");
    setDiscipline("");
    setTrainer("");
    setLocation("");
    setImageUrl("");
    setStatus("In Training");
    setHeight("");
    setMicrochip("");
    setPassportNumber("");
    setUsefId("");
    setFeiId("");
    setAqhaId("");
    setRegistryNumber("");
    setAcquisitionDate("");
    setEstimatedValue("");
    setSireOption("none");
    setSelectedSireId("");
    setManualSireName("");
    setDamOption("none");
    setSelectedDamId("");
    setManualDamName("");
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

    const sireId = sireOption === "existing" ? selectedSireId : null;
    const sireName = sireOption === "manual" ? manualSireName : (sireOption === "existing" ? (horses.find((h) => h.id === selectedSireId)?.name || "") : "");

    const damId = damOption === "existing" ? selectedDamId : null;
    const damName = damOption === "manual" ? manualDamName : (damOption === "existing" ? (horses.find((h) => h.id === selectedDamId)?.name || "") : "");

    // Create a default single ownership entry
    const defaultOwnership = [
      {
        owner: state.user.name,
        start_date: acquisitionDate || new Date().toISOString().split("T")[0],
        end_date: null,
      }
    ];

    try {
      await createHorse.mutateAsync({
        name,
        barn_name: barnName || name,
        slug: generatedSlug,
        breed: breed || null,
        age: age ? Number(age) : null,
        sex: sex || null,
        color: color || null,
        discipline: discipline || null,
        trainer: trainer || null,
        location: location || null,
        image_url: imageUrl || null,
        status,
        owner_id: state.user.id,
        latest_achievement: "Horse profile created.",
        is_public: true,
        wins: 0,
        sale_status: "Not for Sale",
        height: height || null,
        microchip: microchip || null,
        passport_number: passportNumber || null,
        usef_id: usefId || null,
        fei_id: feiId || null,
        aqha_id: aqhaId || null,
        registry_number: registryNumber || null,
        acquisition_date: acquisitionDate || null,
        estimated_value: estimatedValue || null,
        sire_id: sireId,
        dam_id: damId,
        sire_name: sireName || null,
        dam_name: damName || null,
        ownership_history: defaultOwnership as any,
      });

      setDone(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the horse.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add horse" size="lg">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Horse added</p>
          <p className="text-sm text-muted-foreground">The barn and dashboard are updating now.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Basic Information */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 border-b border-border pb-1">1. Basic Information</h4>
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
                <label className="eyebrow block mb-1.5">Color</label>
                <input
                  id="horse-color"
                  className="lux-input"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="Chestnut"
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
            </div>
          </div>

          {/* Section 2: Identification & Registries */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 border-b border-border pb-1">2. Identification & Registries</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="eyebrow block mb-1.5">Height (Hands)</label>
                <input
                  id="horse-height"
                  className="lux-input"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  placeholder="16.2"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Microchip number</label>
                <input
                  id="horse-microchip"
                  className="lux-input"
                  value={microchip}
                  onChange={(event) => setMicrochip(event.target.value)}
                  placeholder="985121002345678"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Passport number</label>
                <input
                  id="horse-passport"
                  className="lux-input"
                  value={passportNumber}
                  onChange={(event) => setPassportNumber(event.target.value)}
                  placeholder="US1234567"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Registry number</label>
                <input
                  id="horse-registry-num"
                  className="lux-input"
                  value={registryNumber}
                  onChange={(event) => setRegistryNumber(event.target.value)}
                  placeholder="REG-89230"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">USEF ID</label>
                <input
                  id="horse-usef"
                  className="lux-input"
                  value={usefId}
                  onChange={(event) => setUsefId(event.target.value)}
                  placeholder="USEF-54321"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">FEI ID</label>
                <input
                  id="horse-fei"
                  className="lux-input"
                  value={feiId}
                  onChange={(event) => setFeiId(event.target.value)}
                  placeholder="104XX88"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">AQHA ID</label>
                <input
                  id="horse-aqha"
                  className="lux-input"
                  value={aqhaId}
                  onChange={(event) => setAqhaId(event.target.value)}
                  placeholder="AQHA-98765"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Acquisition & Value */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 border-b border-border pb-1">3. Acquisition & Value</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="eyebrow block mb-1.5">Acquisition / Birth Date</label>
                <input
                  id="horse-acquisition-date"
                  className="lux-input"
                  type="date"
                  value={acquisitionDate}
                  onChange={(event) => setAcquisitionDate(event.target.value)}
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Estimated Value (USD)</label>
                <input
                  id="horse-value"
                  className="lux-input"
                  value={estimatedValue}
                  onChange={(event) => setEstimatedValue(event.target.value)}
                  placeholder="$150,000"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Pedigree (Genealogy) */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 border-b border-border pb-1">4. Pedigree (Genealogy)</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Sire Selection */}
              <div className="space-y-3">
                <div>
                  <label className="eyebrow block mb-1.5">Sire (Father)</label>
                  <select
                    className="lux-select"
                    value={sireOption}
                    onChange={(e) => setSireOption(e.target.value as any)}
                  >
                    <option value="none">No sire logged</option>
                    {stallions.length > 0 && <option value="existing">Select from active stallions</option>}
                    <option value="manual">Enter name manually</option>
                  </select>
                </div>

                {sireOption === "existing" && (
                  <div>
                    <label className="eyebrow block mb-1.5">Select stallion</label>
                    <select
                      className="lux-select"
                      value={selectedSireId}
                      onChange={(e) => setSelectedSireId(e.target.value)}
                      required
                    >
                      <option value="">Choose...</option>
                      {stallions.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.breed})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sireOption === "manual" && (
                  <div>
                    <label className="eyebrow block mb-1.5">Stallion Name</label>
                    <input
                      className="lux-input"
                      placeholder="e.g. Tapit"
                      value={manualSireName}
                      onChange={(e) => setManualSireName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Dam Selection */}
              <div className="space-y-3">
                <div>
                  <label className="eyebrow block mb-1.5">Dam (Mother)</label>
                  <select
                    className="lux-select"
                    value={damOption}
                    onChange={(e) => setDamOption(e.target.value as any)}
                  >
                    <option value="none">No dam logged</option>
                    {mares.length > 0 && <option value="existing">Select from active mares</option>}
                    <option value="manual">Enter name manually</option>
                  </select>
                </div>

                {damOption === "existing" && (
                  <div>
                    <label className="eyebrow block mb-1.5">Select mare</label>
                    <select
                      className="lux-select"
                      value={selectedDamId}
                      onChange={(e) => setSelectedDamId(e.target.value)}
                      required
                    >
                      <option value="">Choose...</option>
                      {mares.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.breed})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {damOption === "manual" && (
                  <div>
                    <label className="eyebrow block mb-1.5">Mare Name</label>
                    <input
                      className="lux-input"
                      placeholder="e.g. Storm Cat Mare"
                      value={manualDamName}
                      onChange={(e) => setManualDamName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Cover Image */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 border-b border-border pb-1">5. Multimedia</h4>
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-1.5">Cover Image</label>
                
                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border aspect-[16/9] group">
                    <img
                      src={imageUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="rounded-full bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:bg-destructive/90 transition-colors"
                      >
                        Remove Cover Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById("file-upload-add-horse")?.click()}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-8 px-4 cursor-pointer hover:border-primary/50 hover:bg-secondary/10 transition-all text-center"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to upload photo or drag & drop</p>
                      <p className="text-[11px] text-muted-foreground mt-1">JPEG, PNG or WEBP up to 10MB</p>
                    </div>
                    <input
                      id="file-upload-add-horse"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressAndBase64(file);
                            setImageUrl(compressed);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="eyebrow block mb-1.5">Or paste Cover Image URL</label>
                <input
                  id="horse-image-url"
                  className="lux-input"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
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
              disabled={createHorse.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {createHorse.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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

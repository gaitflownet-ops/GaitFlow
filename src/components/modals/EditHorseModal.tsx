import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Camera } from "lucide-react";
import { Modal } from "./Modal";
import { useUpdateHorse, useHorses, type Horse } from "@/lib/hooks/useHorses";
import { useGroups, useSubgroups, useCreateGroup, useCreateSubgroup } from "@/lib/hooks/useGroups";
import { toast } from "sonner";
import { getStatusLabel } from "@/lib/utils";

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horse: Horse;
};

export function EditHorseModal({ open, onOpenChange, horse }: Props) {
  const updateHorse = useUpdateHorse();
  const { data: horses = [] } = useHorses();

  // Stallions and Mares for Pedigree Selection
  const stallions = useMemo(() => horses.filter((h) => h.sex === "Reproductor" && h.id !== horse.id), [horses, horse.id]);
  const mares = useMemo(() => horses.filter((h) => h.sex === "Yegua" && h.id !== horse.id), [horses, horse.id]);

  // States
  const [name, setName] = useState("");
  const [barnName, setBarnName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Yegua");
  const [color, setColor] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [trainer, setTrainer] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("En Adiestramiento");

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

  const [registeredName, setRegisteredName] = useState("");
  const [gaitType, setGaitType] = useState("Paso Fino Colombiano");
  const [movementCategory, setMovementCategory] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("Proceso");
  const [morphologyNotes, setMorphologyNotes] = useState("");
  const [criadero, setCriadero] = useState("");
  const [breederName, setBreederName] = useState("");
  const [registrationCategory, setRegistrationCategory] = useState("Reporte de Monta");
  const [fedequinasId, setFedequinasId] = useState("");
  const [association, setAssociation] = useState("");
  const [brio, setBrio] = useState("5");
  const [nobleza, setNobleza] = useState("5");
  const [performanceNotes, setPerformanceNotes] = useState("");


  // Pedigree Parent Selection
  const [sireOption, setSireOption] = useState<"none" | "existing" | "manual">("none");
  const [selectedSireId, setSelectedSireId] = useState("");
  const [manualSireName, setManualSireName] = useState("");

  const [damOption, setDamOption] = useState<"none" | "existing" | "manual">("none");
  const [selectedDamId, setSelectedDamId] = useState("");
  const [manualDamName, setManualDamName] = useState("");

  // Group & Subgroup selectors
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedSubgroupId, setSelectedSubgroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newSubgroupName, setNewSubgroupName] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSubgroup, setShowAddSubgroup] = useState(false);

  const { data: groups = [] } = useGroups();
  const { data: subgroups = [] } = useSubgroups(selectedGroupId);

  const createGroup = useCreateGroup();
  const createSubgroup = useCreateSubgroup();

  const handleCreateGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const g = await createGroup.mutateAsync({
        name: newGroupName,
      } as any);
      setSelectedGroupId(g.id);
      setNewGroupName("");
      setShowAddGroup(false);
      toast.success("Group created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    }
  };

  const handleCreateSubgroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newSubgroupName.trim() || !selectedGroupId) return;
    try {
      const sg = await createSubgroup.mutateAsync({
        name: newSubgroupName,
        group_id: selectedGroupId,
      } as any);
      setSelectedSubgroupId(sg.id);
      setNewSubgroupName("");
      setShowAddSubgroup(false);
      toast.success("Subgroup created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create subgroup");
    }
  };

  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Initialize fields with horse values
  useEffect(() => {
    if (horse && open) {
      setName(horse.name || "");
      setBarnName(horse.barn_name || "");
      setBreed(horse.breed || "");
      setAge(horse.age ? String(horse.age) : "");
      setSex(horse.sex || "Yegua");
      setColor(horse.color || "");
      setDiscipline(horse.discipline || "");
      setTrainer(horse.trainer || "");
      setLocation(horse.location || "");
      setStatus(getStatusLabel(horse.status) || "En Adiestramiento");
      setHeight(horse.height || "");
      setMicrochip(horse.microchip || "");
      setPassportNumber(horse.passport_number || "");
      setUsefId(horse.usef_id || "");
      setFeiId(horse.fei_id || "");
      setAqhaId(horse.aqha_id || "");
      setImageUrl(horse.image_url || "");
      setRegistryNumber(horse.registry_number || "");
      setAcquisitionDate(horse.acquisition_date || "");
      setEstimatedValue(horse.estimated_value || "");

      // CCC specific fields
      setRegisteredName(horse.registered_name || "");
      setGaitType(horse.gait_type || "Paso Fino Colombiano");
      setMovementCategory(horse.movement_category || "");
      setTrainingLevel(horse.training_level || "Proceso");
      setMorphologyNotes(horse.morphology_notes || "");
      setCriadero(horse.criadero || "");
      setBreederName(horse.breeder_name || "");
      setRegistrationCategory(horse.registration_category || "Reporte de Monta");
      setFedequinasId(horse.fedequinas_id || "");
      setAssociation(horse.association || "");
      setBrio(horse.brio ? String(horse.brio) : "5");
      setNobleza(horse.nobleza ? String(horse.nobleza) : "5");
      setPerformanceNotes(horse.performance_notes || "");

      // Sire
      if (horse.sire_id) {
        setSireOption("existing");
        setSelectedSireId(horse.sire_id);
        setManualSireName("");
      } else if (horse.sire_name) {
        setSireOption("manual");
        setManualSireName(horse.sire_name);
        setSelectedSireId("");
      } else {
        setSireOption("none");
        setSelectedSireId("");
        setManualSireName("");
      }

      // Dam
      if (horse.dam_id) {
        setDamOption("existing");
        setSelectedDamId(horse.dam_id);
        setManualDamName("");
      } else if (horse.dam_name) {
        setDamOption("manual");
        setManualDamName(horse.dam_name);
        setSelectedDamId("");
      } else {
        setDamOption("none");
        setSelectedDamId("");
        setManualDamName("");
      }

      setSelectedGroupId(horse.group_id || "");
      setSelectedSubgroupId(horse.subgroup_id || "");
      setNewGroupName("");
      setNewSubgroupName("");
      setShowAddGroup(false);
      setShowAddSubgroup(false);

      setDone(false);
      setError("");
    }
  }, [horse, open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const sireId = sireOption === "existing" ? selectedSireId : null;
    const sireName = sireOption === "manual" ? manualSireName : (sireOption === "existing" ? (horses.find((h) => h.id === selectedSireId)?.name || "") : "");

    const damId = damOption === "existing" ? selectedDamId : null;
    const damName = damOption === "manual" ? manualDamName : (damOption === "existing" ? (horses.find((h) => h.id === selectedDamId)?.name || "") : "");

    try {
      await updateHorse.mutateAsync({
        id: horse.id,
        updates: {
          name,
          barn_name: barnName || name,
          breed: breed || null,
          age: age ? Number(age) : null,
          sex: sex || null,
          color: color || null,
          discipline: discipline || null,
          trainer: trainer || null,
          location: location || null,
          image_url: imageUrl || null,
          status,
          height: height || null,
          microchip: microchip || null,
          passport_number: passportNumber || null,
          usef_id: usefId || null,
          fei_id: feiId || null,
          aqha_id: aqhaId || null,
          registry_number: registryNumber || null,
          acquisition_date: acquisitionDate || null,
          estimated_value: estimatedValue || null,

        registered_name: registeredName || null,
        gait_type: gaitType || null,
        movement_category: movementCategory || null,
        training_level: trainingLevel || null,
        morphology_notes: morphologyNotes || null,
        criadero: criadero || null,
        breeder_name: breederName || null,
        registration_category: registrationCategory || null,
        fedequinas_id: fedequinasId || null,
        association: association || null,
        brio: brio ? Number(brio) : null,
        nobleza: nobleza ? Number(nobleza) : null,
        performance_notes: performanceNotes || null,

          sire_id: sireId,
          dam_id: damId,
          sire_name: sireName || null,
          dam_name: damName || null,
          group_id: selectedGroupId || null,
          subgroup_id: selectedSubgroupId || null,
        },
      });

      setDone(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err: any) {
      setError(err?.message || (typeof err === "string" ? err : "Could not update the horse."));
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Edit horse profile" size="lg">
      {done ? (
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </span>
          <p className="font-display text-2xl">Profile updated</p>
          <p className="text-sm text-muted-foreground">The stable data is updating now.</p>
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
                  className="lux-input"
                  value={barnName}
                  onChange={(event) => setBarnName(event.target.value)}
                  placeholder="Ember"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Breed</label>
                <input
                  className="lux-input"
                  value={breed}
                  onChange={(event) => setBreed(event.target.value)}
                  placeholder="Warmblood"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Color</label>
                <input
                  className="lux-input"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="Chestnut"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Age</label>
                <input
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
                  className="lux-select"
                  value={sex}
                  onChange={(event) => setSex(event.target.value)}
                >
                  {["Yegua", "Caballo Capón", "Reproductor", "Potro", "Potranca"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Status</label>
                <select
                  className="lux-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {["En Adiestramiento", "En Competencia", "En Descanso", "En Reproducción"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Discipline</label>
                <input
                  className="lux-input"
                  value={discipline}
                  onChange={(event) => setDiscipline(event.target.value)}
                  placeholder="Show Jumping"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Trainer</label>
                <input
                  className="lux-input"
                  value={trainer}
                  onChange={(event) => setTrainer(event.target.value)}
                  placeholder="Team trainer"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Location</label>
                <input
                  className="lux-input"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Wellington · FL"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5 flex justify-between items-center">
                  <span>Group (Cohort)</span>
                  <button
                    type="button"
                    onClick={() => setShowAddGroup(!showAddGroup)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {showAddGroup ? "Cancelar" : "+ Add new"}
                  </button>
                </label>
                {showAddGroup ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="lux-input flex-1"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. Broodmares"
                    />
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="rounded-full bg-primary text-primary-foreground px-4 text-xs font-semibold hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    className="lux-select"
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setSelectedSubgroupId("");
                    }}
                  >
                    <option value="">No Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="eyebrow block mb-1.5 flex justify-between items-center">
                  <span>Subgroup</span>
                  {selectedGroupId && (
                    <button
                      type="button"
                      onClick={() => setShowAddSubgroup(!showAddSubgroup)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {showAddSubgroup ? "Cancelar" : "+ Add new"}
                    </button>
                  )}
                </label>
                {showAddSubgroup ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="lux-input flex-1"
                      value={newSubgroupName}
                      onChange={(e) => setNewSubgroupName(e.target.value)}
                      placeholder="e.g. Gestating"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubgroup}
                      className="rounded-full bg-primary text-primary-foreground px-4 text-xs font-semibold hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    className="lux-select"
                    value={selectedSubgroupId}
                    onChange={(e) => setSelectedSubgroupId(e.target.value)}
                    disabled={!selectedGroupId}
                  >
                    <option value="">
                      {!selectedGroupId ? "Select a Group first" : "No Subgroup"}
                    </option>
                    {subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                )}
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
                  className="lux-input"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  placeholder="16.2"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Microchip number</label>
                <input
                  className="lux-input"
                  value={microchip}
                  onChange={(event) => setMicrochip(event.target.value)}
                  placeholder="985121002345678"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Passport number</label>
                <input
                  className="lux-input"
                  value={passportNumber}
                  onChange={(event) => setPassportNumber(event.target.value)}
                  placeholder="US1234567"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Registry number</label>
                <input
                  className="lux-input"
                  value={registryNumber}
                  onChange={(event) => setRegistryNumber(event.target.value)}
                  placeholder="REG-89230"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">USEF ID</label>
                <input
                  className="lux-input"
                  value={usefId}
                  onChange={(event) => setUsefId(event.target.value)}
                  placeholder="USEF-54321"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">FEI ID</label>
                <input
                  className="lux-input"
                  value={feiId}
                  onChange={(event) => setFeiId(event.target.value)}
                  placeholder="104XX88"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">AQHA ID</label>
                <input
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
                  className="lux-input"
                  type="date"
                  value={acquisitionDate}
                  onChange={(event) => setAcquisitionDate(event.target.value)}
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Estimated Value (USD)</label>
                <input
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
                    onClick={() => document.getElementById("file-upload-edit-horse")?.click()}
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
                      id="file-upload-edit-horse"
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
                  id="horse-image-url-edit"
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
              disabled={updateHorse.isPending}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-70 inline-flex items-center justify-center gap-2"
            >
              {updateHorse.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

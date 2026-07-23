import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useState, useEffect, useMemo } from "react";
import { useHorse, useHorses, useDeleteHorse, useUpdateHorse } from "@/lib/hooks/useHorses";
import { useUpdates } from "@/lib/hooks/useUpdates";
import { useCompetitions } from "@/lib/hooks/useCompetitions";
import { useHealthRecords } from "@/lib/hooks/useHealth";
import { useDocuments } from "@/lib/hooks/useVault";
import { UploadDocumentModal } from "@/components/modals/UploadDocumentModal";
import { DocumentDetailsModal } from "@/components/modals/DocumentDetailsModal";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/hooks/useTasks";
import { useLocations, useLocationHistory, useAssignHorseToStall } from "@/lib/hooks/useLocations";
import {
  MapPin,
  User,
  Award,
  Trophy,
  HeartPulse,
  Video,
  Play,
  Share2,
  Heart,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Camera,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Download,
  Dna,
  Coins,
  ShieldCheck,
  Wheat,
  Droplet,
  Save,
  CheckCircle2,
  FolderOpen,
  Upload,
  FileText,
} from "lucide-react";
import { AddUpdateModal } from "@/components/modals/AddUpdateModal";
import { LightboxModal } from "@/components/modals/LightboxModal";
import { CompetitionDetailModal } from "@/components/modals/CompetitionDetailModal";
import { EditHorseModal } from "@/components/modals/EditHorseModal";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import { PedigreeTree } from "@/components/PedigreeTree";
import { NutritionTab } from "@/components/horses/nutrition/NutritionTab";
import { toast } from "sonner";
import { getStatusLabel } from "@/lib/utils";
import type { Competition } from "@/lib/hooks/useCompetitions";

export const Route = createFileRoute("/horses_/$horseId")({
  head: () => ({
    meta: [{ title: "Horse Profile — GaitFlow" }, { name: "description", content: "Detailed horse profile" }],
  }),
  component: HorseProfile,
  notFoundComponent: () => (
    <AppShell>
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">Ejemplar no encontrado</h1>
        <Link to="/horses" className="mt-4 inline-block text-primary hover:underline">
          Volver a Ejemplares
        </Link>
      </div>
    </AppShell>
  ),
});

const formatPoints = (earnings: string | null) => {
  if (!earnings) return "0 Pts";
  const clean = earnings.replace(/[$\s]/g, "");
  const num = parseInt(clean.replace(/,/g, ""), 10);
  if (isNaN(num)) return earnings;
  return num.toLocaleString("es-CO") + " Pts";
};

const tabs = ["Perfil", "Sanidad", "Alimentación", "Labores", "Documentos", "Galería"] as const;
type Tab = (typeof tabs)[number];

// Location Options from spatial module (Section F.1)
const locationOptions = [
  "Live Oak Stables · Barn A · Stall 1",
  "Live Oak Stables · Barn A · Stall 2",
  "Live Oak Stables · Barn B · Stall 4",
  "Live Oak Stables · Paddock 3",
  "Magnolia Training Center · Stall A10",
  "Sienna Broodmare Farm · Stall B3",
  "External · Ocala Equine Hospital",
];

function HorseProfile() {
  const { horseId } = Route.useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  
  // Tab State
  const [tab, setTab] = useState<Tab>("Perfil");
  
  // Modals & Popups
  const [editOpen, setEditOpen] = useState(false);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  
  // Location dropdown toggle
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Likes & Favorites
  const [likedUpdates, setLikedUpdates] = useState<Set<string>>(new Set());
  const [favorited, setFavorited] = useState(false);

  // Queries & Mutations
  const { data: horse, isLoading, refetch: refetchHorse } = useHorse(horseId);
  const { data: allHorses = [] } = useHorses();
  const { data: horseUpdates = [] } = useUpdates(horse?.id);
  const { data: horseComps = [] } = useCompetitions(horse?.id);
  const { data: healthRecords = [] } = useHealthRecords(horse?.id);
  const { data: dbDocuments = [] } = useDocuments({ owner_type: "horse", owner_id: horse?.id });
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [selectedVaultDoc, setSelectedVaultDoc] = useState<any>(null);
  
  const { data: locations = [] } = useLocations();
  const { data: moveHistory = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useLocationHistory(horse?.id);

  const currentLocation = useMemo(() => {
    const activeMove = moveHistory.find((m) => !m.end_date);
    if (activeMove) {
      let locText = activeMove.new_location?.name || "Ubicación";
      if (activeMove.stall_unit?.stall_number) {
        locText += ` · Pesebrera ${activeMove.stall_unit.stall_number}`;
      }
      return locText;
    }
    if (horse?.location && horse.location !== "Sin asignar" && horse.location !== "Sin Pesebrera Asignada") {
      return horse.location;
    }
    return horse?.location || "Sin asignar";
  }, [horse?.location, moveHistory]);

  const assignHorse = useAssignHorseToStall();
  
  const deleteHorse = useDeleteHorse();
  const updateHorse = useUpdateHorse();

  // DB-backed Hooks for Tasks & Nutrition
  const { data: allTasks = [] } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Removed old useNutritionPlan hooks

  // Mappers and Filters
  const horseTasks = useMemo(() => {
    return allTasks.filter((t) => t.horse_id === horse?.id);
  }, [allTasks, horse?.id]);

  const docFiles = useMemo(() => {
    return dbDocuments.filter((doc) => !doc.type.startsWith("media_"));
  }, [dbDocuments]);

  const galleryItems = useMemo(() => {
    return dbDocuments
      .filter((doc) => doc.type.startsWith("media_"))
      .map((doc) => {
        let category: "Photos" | "Videos" | "Medical" = "Photos";
        if (doc.type === "media_video") category = "Videos";
        else if (doc.type === "media_medical") category = "Medical";

        return {
          id: doc.id,
          src: doc.file_url,
          caption: doc.name,
          type: doc.type === "media_video" ? ("video" as const) : ("image" as const),
          category,
        };
      });
  }, [dbDocuments]);

  // ─── LOCAL STATE FOR INTERACTIVE TABS ─────────────────────────────────────
  
  // Nutrition state handled by NutritionTab

  // Tasks (Kanban UI dragging & creation state)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("08:00");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Sarah J.");

  // Document Upload State
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<"Passport" | "Contract" | "Health Certificate" | "Coggins" | "Pedigree" | "Other">("Passport");
  const [docUrl, setDocUrl] = useState("");
  const [docSize, setDocSize] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  // Gallery Upload State
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaCategory, setMediaCategory] = useState<"Photos" | "Videos" | "Medical">("Photos");
  const [selectedMediaName, setSelectedMediaName] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Nutrition save functions moved to NutritionTab

  // Kanban task drag-and-drop mechanics (Database-driven)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = draggingTaskId || e.dataTransfer.getData("text/plain");
    if (!taskId || !horse) return;

    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        completed_at: newStatus === "Completado" ? new Date().toISOString() : null,
      });
      setDraggingTaskId(null);
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (err) {
      toast.error("Error al actualizar tarea");
    }
  };

  // Add new task (Database-driven)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horse || !newTaskTitle.trim()) return;

    const today = new Date();
    const [hours, minutes] = newTaskTime.split(":");
    today.setHours(Number(hours), Number(minutes), 0, 0);

    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        status: "Pendiente",
        due_date: today.toISOString(),
        notes: newTaskAssignee,
        horse_id: horse.id,
        farm_id: horse.farm_id || undefined,
        organization_id: horse.organization_id || state.user?.organization_id || undefined,
      });
      await createActivityLog.mutateAsync({
        organization_id: horse.organization_id || state.user?.organization_id || "00000000-0000-0000-0000-000000000000",
        user_id: null,
      });
      setNewTaskTitle("");
      toast.success("Task assigned successfully");
    } catch (err) {
      toast.error("Failed to assign task");
    }
  };

  // Document file selection dropzone helper
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setDocName(file.name.replace(/\.[^/.]+$/, ""));
    setDocSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const nameLower = file.name.toLowerCase();
    if (nameLower.includes("passport")) setDocCategory("Passport");
    else if (nameLower.includes("coggins")) setDocCategory("Coggins");
    else if (nameLower.includes("contract") || nameLower.includes("agreement")) setDocCategory("Contract");
    else if (nameLower.includes("health") || nameLower.includes("cert")) setDocCategory("Health Certificate");
    else if (nameLower.includes("pedigree")) setDocCategory("Pedigree");
    else setDocCategory("Other");

    setDocUrl(URL.createObjectURL(file));
  };



  // Handle Delete Horse
  const handleDeleteHorse = async () => {
    if (!horse) return;
    if (confirm(`CRITICAL WARNING: Are you sure you want to delete ${horse.name}? This will permanently remove all medical records, pedigree nodes, and document uploads.`)) {
      try {
        await deleteHorse.mutateAsync(horse.id);
        toast.success("Horse deleted successfully");
        navigate({ to: "/horses" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not delete horse");
      }
    }
  };

  // Handle Location Update
  const handleUpdateLocation = async (locationId: string) => {
    if (!horse) return;
    const selectedLoc = locations.find((l) => l.id === locationId);
    if (!selectedLoc) return;

    try {
      await assignHorse.mutateAsync({
        stallId: null,
        locationId: selectedLoc.id,
        horseId: horse.id,
        locationName: selectedLoc.name,
        stallNumber: null,
        reason: "Traslado desde perfil del ejemplar",
      });
      setIsChangingLocation(false);
      toast.success(`Ejemplar trasladado a ${selectedLoc.name}`);
      refetchHorse();
      refetchHistory();
    } catch (err) {
      toast.error("No se pudo registrar el traslado de ubicación");
    }
  };

  const otherHorses = allHorses.filter((h) => h.id !== horse?.id).slice(0, 4);

  // Gallery categorization (Media tab)
  const [galleryFilter, setGalleryFilter] = useState<"All" | "Photos" | "Videos" | "Medical">("All");
  const filteredMedia = galleryFilter === "All" ? galleryItems : galleryItems.filter((m) => m.category === galleryFilter);

  const handleLike = (id: string) => {
    setLikedUpdates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!horse) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <h1 className="font-display text-3xl">Ejemplar no encontrado</h1>
          <Link to="/horses" className="mt-4 inline-block text-primary hover:underline">
            Volver a Ejemplares
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/horses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        id="back-to-barn"
      >
        <ArrowLeft className="h-4 w-4" /> The barn
      </Link>

      {/* HERO SECTION */}
      <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-border">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <img
            src={horse.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"}
            alt={horse.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.018_60/0.95)] via-[oklch(0.18_0.018_60/0.4)] to-transparent" />

          {/* Top action buttons */}
          <div className="absolute top-5 right-5 flex gap-2">
            <button
              id="horse-favorite-btn"
              onClick={() => {
                setFavorited((v) => !v);
                toast.success(favorited ? "Removed from favorites" : "Added to favorites");
              }}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur transition-colors ${favorited ? "bg-destructive/90 text-white" : "bg-background/90 text-foreground hover:bg-background"}`}
              title="Add to favorites"
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
            </button>
            <button
              id="horse-share-btn"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Profile URL copied to clipboard");
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur text-foreground hover:bg-background"
              title="Share profile"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              id="edit-horse-btn"
              onClick={() => setEditOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur text-foreground hover:bg-background hover:text-primary transition-all active:scale-95 cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              id="delete-horse-btn"
              onClick={handleDeleteHorse}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur text-destructive hover:bg-destructive/10 transition-all active:scale-95 cursor-pointer"
              title="Delete Exemplar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-primary-foreground">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-[var(--gold)] text-charcoal px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                {getStatusLabel(horse.status)}
              </span>
              <span className="rounded-full bg-background/15 border border-primary-foreground/20 px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase font-medium">
                {horse.discipline}
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">{horse.name}</h1>
            <p className="mt-3 text-primary-foreground/85 text-[15px] max-w-2xl">
              <span className="gold-text font-medium">{horse.latest_achievement}</span>
              {horse.bloodline && ` · ${horse.bloodline}`}
            </p>

            <div className="mt-7 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 max-w-3xl">
              {[
                { k: "Breed", v: horse.breed || "—" },
                { k: "Age", v: horse.age ? `${horse.age} yrs` : "—" },
                { k: "Sex", v: horse.sex || "—" },
                { k: "Color", v: horse.color || "—" },
                { k: "Called", v: horse.barn_name ? `"${horse.barn_name}"` : "—" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/55">
                    {s.k}
                  </div>
                  <div className="font-display text-xl mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* META STRIP (CRITICAL METADATA & QUICK ACTIONS) */}
      <div className="mt-6 lux-card p-5 flex flex-wrap gap-x-8 gap-y-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[13px] font-semibold text-charcoal">
            {state.user?.initials ?? "O"}
          </div>
          <div>
            <div className="eyebrow">Owner</div>
            <div className="text-[14px] font-medium">{state.user?.name ?? "Owner"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <User className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Trainer</div>
            <div className="text-[14px] font-medium">{horse.trainer || "Henrik Larsen"}</div>
          </div>
        </div>
        
        {/* Spatial control: Location selector */}
        <div className="flex items-center gap-3 relative">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <MapPin className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Location</div>
            {isChangingLocation ? (
              <select
                className="text-[13px] bg-secondary border border-border rounded-lg px-2 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                value=""
                onChange={(e) => handleUpdateLocation(e.target.value)}
                onBlur={() => setIsChangingLocation(false)}
                autoFocus
              >
                <option value="" disabled>Seleccionar...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setIsChangingLocation(true)}
                className="text-[14px] font-medium hover:text-primary transition-colors text-left flex items-center gap-1 group"
              >
                <span>{currentLocation}</span>
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-75 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <Award className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Trayectoria</div>
            <div className="text-[14px] font-medium">
              {horse.wins ?? 0} campeonatos/cintas · {formatPoints(horse.earnings)}
            </div>
          </div>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="mt-10 border-b border-border">
        <div className="flex gap-1 overflow-x-auto -mb-px scrollbar-none">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                id={`tab-${t.toLowerCase()}`}
                onClick={() => setTab(t)}
                className={`relative px-5 py-3 text-[14px] font-medium whitespace-nowrap transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {active && <span className="tab-active-bar" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT GRID */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          
          {/* ───────────────── TABS: PROFILE ───────────────── */}
          {tab === "Perfil" && (
            <div className="space-y-8">
              {/* Detailed Attributes Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Características Criollas */}
                <div className="lux-card p-6 space-y-4">
                  <h3 className="font-display text-lg border-b border-border/60 pb-2 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" /> Identificación y Registro CCC
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <div className="eyebrow">Nombre Registrado</div>
                      <div className="font-medium mt-0.5">{horse.registered_name || horse.name || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Registro Fedequinas</div>
                      <div className="font-medium mt-0.5 text-[13px]">{horse.fedequinas_id || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Asociación</div>
                      <div className="font-medium mt-0.5">{horse.association || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Modalidad</div>
                      <div className="font-medium mt-0.5">{horse.gait_type || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Categoría de Registro</div>
                      <div className="font-medium mt-0.5">{horse.registration_category || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Nivel de Adiestramiento</div>
                      <div className="font-medium mt-0.5">{horse.training_level || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Criadero</div>
                      <div className="font-medium mt-0.5">{horse.criadero || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Microchip</div>
                      <div className="font-medium mt-0.5">{horse.microchip || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Temperamento y Valor */}
                <div className="lux-card p-6 space-y-4">
                  <h3 className="font-display text-lg border-b border-border/60 pb-2 flex items-center gap-2">
                    <Coins className="h-4.5 w-4.5 text-primary" /> Temperamento y Valor
                  </h3>
                  <div className="grid grid-cols-1 gap-5 text-sm">
                    {/* Gauges */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="eyebrow">Brío</span>
                          <span className="font-medium text-xs">{horse.brio || 5}/10</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(horse.brio || 5) * 10}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="eyebrow">Nobleza</span>
                          <span className="font-medium text-xs">{horse.nobleza || 5}/10</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(horse.nobleza || 5) * 10}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="eyebrow">Fecha de Adquisición</div>
                        <div className="font-medium mt-0.5">
                          {horse.acquisition_date ? new Date(horse.acquisition_date).toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="eyebrow">Valor Estimado</div>
                        <div className="font-medium mt-0.5 text-emerald-500 font-semibold">{horse.estimated_value ? `$${horse.estimated_value} COP` : "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pedigree & Genealogy Visual Tree */}
              <div className="lux-card p-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-6">
                  <h3 className="font-display text-xl flex items-center gap-2">
                    <Dna className="h-5 w-5 text-primary" /> Genealogy & Pedigree
                  </h3>
                  <div className="text-[11px] text-muted-foreground tracking-widest uppercase">
                    3 Generation Lineage
                  </div>
                </div>
                <PedigreeTree horse={horse} allHorses={allHorses} onEditClick={() => setEditOpen(true)} />
              </div>

              {/* Sport records and Competition placements */}
              <div className="lux-card p-6">
                <h3 className="font-display text-xl border-b border-border/60 pb-3 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Competition Placements
                </h3>
                {horseComps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center italic">No competition placements recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {horseComps.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-secondary/20 rounded-2xl p-4 border border-border/40">
                        <div className="flex items-center gap-3">
                          <span className="grid place-items-center h-10 w-10 rounded-xl bg-[var(--gold)] text-charcoal font-display font-semibold">
                            {c.placement}
                          </span>
                          <div>
                            <div className="font-medium text-sm">{c.event}</div>
                            <div className="text-[11px] text-muted-foreground">{c.location} · {c.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-500">{c.prize || "—"}</div>
                          <div className="text-[10px] text-muted-foreground">{c.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ubicación e Historial de Traslados */}
              <div className="lux-card p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="font-display text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Ubicación y Logística
                  </h3>
                  <div className="text-[11px] text-muted-foreground tracking-widest uppercase">
                    Estado en Tiempo Real
                  </div>
                </div>

                {/* Ubicación actual info card */}
                <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Ubicación Física Actual</span>
                    <div className="font-display text-lg font-bold mt-1 text-foreground">
                      {currentLocation}
                    </div>
                    {(() => {
                      const matchedLoc = locations.find(l => currentLocation.startsWith(l.name));
                      if (matchedLoc) {
                        return (
                          <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                            <p>Tipo: <span className="capitalize">{matchedLoc.type === "Paddock" ? "Potrero" : matchedLoc.type === "Clinic" ? "Clínica Veterinaria" : matchedLoc.type}</span></p>
                            {matchedLoc.type === "Paddock" && (
                              <p className="text-emerald-500 font-semibold">Pasto: {matchedLoc.grass_type || "Kikuyo"} · Ha: {matchedLoc.area_hectares || 0}</p>
                            )}
                            {(matchedLoc.daily_boarding_cost || 0) > 0 && (
                              <p className="text-[var(--gold)] font-semibold">Costo Diario: ${(matchedLoc.daily_boarding_cost || 0).toLocaleString("es-CO")} COP</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => setIsChangingLocation(true)}
                      className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors animate-pulse"
                    >
                      Trasladar Ejemplar
                    </button>
                  </div>
                </div>

                {/* Timeline de Traslados */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historial de Traslados</h4>
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : moveHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No se registran movimientos para este ejemplar.</p>
                  ) : (
                    <div className="relative border-l border-border/60 pl-4 space-y-4 py-2 ml-2">
                      {moveHistory.map((m) => (
                        <div key={m.id} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
                          <div className="text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {m.new_location?.name || "Ubicación"}
                              </span>
                              {m.stall_unit?.stall_number && (
                                <span className="bg-secondary/40 text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">
                                  Pesebrera {m.stall_unit.stall_number}
                                </span>
                              )}
                              <span className="text-muted-foreground text-[10px]">
                                {new Date(m.start_date).toLocaleDateString()}
                              </span>
                              {!m.end_date ? (
                                <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded-full text-[9px] font-semibold">
                                  Actual
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">
                                  al {new Date(m.end_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              Motivo: {m.reason || "Sin especificar"} · Responsable: {m.responsible?.name || "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── TABS: HEALTH ───────────────── */}
          {tab === "Sanidad" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Health & Care History</h3>
                  <p className="text-xs text-muted-foreground">Vaccinations, dental, hoof care, deworming, and vet checkups.</p>
                </div>
                <button
                  id="tab-log-health-btn"
                  onClick={() => setAddHealthOpen(true)}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Log health event
                </button>
              </div>

              {/* Summary cards */}
              {healthRecords.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const lastVaccine = healthRecords.find((r) => r.type === "vaccination");
                    const lastFarrier = healthRecords.find((r) => r.type === "farrier");
                    const lastDeworming = healthRecords.find((r) => r.type === "deworming");
                    const lastVet = healthRecords.find((r) => r.type === "vet" || r.type === "vet_visit");
                    return [
                      { label: "Last Vaccine", date: lastVaccine?.date, color: "#22c55e" },
                      { label: "Last Farrier", date: lastFarrier?.date, color: "#f97316" },
                      { label: "Last Deworming", date: lastDeworming?.date, color: "#14b8a6" },
                      { label: "Last Vet Visit", date: lastVet?.date, color: "#3b82f6" },
                    ].map((s) => (
                      <div key={s.label} className="lux-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="eyebrow text-[10px]">{s.label}</span>
                        </div>
                        <p className="font-display text-lg">
                          {s.date || <span className="text-muted-foreground text-sm">No records</span>}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {healthRecords.length === 0 ? (
                <div className="lux-card p-10 text-center text-muted-foreground italic">
                  No health records logged yet. Use the button above to log vet visits, deworming, or shoeing.
                </div>
              ) : (
                <div className="grid gap-3">
                  {healthRecords.map((r) => {
                    const typeColors: Record<string, string> = {
                      vaccination: "#22c55e", deworming: "#14b8a6", vet: "#3b82f6", vet_visit: "#3b82f6",
                      farrier: "#f97316", dental: "#a855f7", hoof_care: "#f59e0b", treatment: "#ef4444",
                      coggins: "#ec4899", xray: "#6366f1", other: "#64748b",
                    };
                    const dotColor = typeColors[r.type] || "#64748b";
                    return (
                      <div key={r.id} className="lux-card p-5 flex gap-4 hover:border-primary/20 transition-colors">
                        <span
                          className="grid h-11 w-11 place-items-center rounded-2xl shrink-0 border border-border/40"
                          style={{ backgroundColor: `${dotColor}15` }}
                        >
                          <HeartPulse className="h-5 w-5" style={{ color: dotColor }} />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-lg font-medium">{r.title}</h4>
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold"
                                style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
                              >
                                {r.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">{r.date}</span>
                          </div>
                          {(r.diagnosis || r.prescription) && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                              {r.diagnosis && (
                                <div>
                                  <span className="text-muted-foreground">Diagnosis:</span>{" "}
                                  <span className="text-foreground">{r.diagnosis}</span>
                                </div>
                              )}
                              {r.prescription && (
                                <div>
                                  <span className="text-muted-foreground">Rx:</span>{" "}
                                  <span className="text-foreground">{r.prescription}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {r.notes && (
                            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{r.notes}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2">
                            <span>Professional: <strong className="text-foreground">{r.professional}</strong></span>
                            <div className="flex items-center gap-3">
                              {r.next_due && (
                                <span>Next: <strong className="text-primary">{r.next_due}</strong></span>
                              )}
                              {r.cost != null && r.cost > 0 && (
                                <span>Cost: <strong className="text-foreground">${r.cost}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TABS: NUTRITION ───────────────── */}
          {tab === "Alimentación" && (
            <NutritionTab horseId={horse.id} />
          )}

          {/* ───────────────── TABS: TASKS (KANBAN INTERACTION) ───────────────── */}
          {tab === "Labores" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl">Tareas Diarias del Criadero</h3>
                <p className="text-xs text-muted-foreground">Arrastra las tareas entre columnas para actualizar su estado (Pendiente, En Progreso, Completado).</p>
              </div>

              {/* Kanban columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["Pendiente", "En Progreso", "Completado"] as const).map((columnStatus) => {
                  const columnTasks = horseTasks.filter((t) => {
                    const s = t.status || "Pendiente";
                    if (columnStatus === "Pendiente") return s.toLowerCase() === "pendiente" || s.toLowerCase() === "atrasado";
                    if (columnStatus === "En Progreso") return s.toLowerCase() === "en progreso";
                    if (columnStatus === "Completado") return s.toLowerCase() === "completado";
                    return false;
                  });
                  const titleMap = {
                    Pendiente: "Pendiente",
                    "En Progreso": "En Progreso",
                    Completado: "Completado",
                  };
                  return (
                    <div
                      key={columnStatus}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, columnStatus)}
                      className="rounded-2xl bg-secondary/15 border border-border/40 p-4 min-h-[250px] flex flex-col gap-3 transition-colors duration-200 hover:bg-secondary/25"
                    >
                      <div className="flex justify-between items-center px-1 border-b border-border/30 pb-2 mb-1">
                        <span className="font-display font-medium text-[15px]">{titleMap[columnStatus]}</span>
                        <span className="rounded-full bg-secondary/80 border border-border/50 text-[10px] font-mono font-semibold px-2 py-0.5">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-2.5">
                        {columnTasks.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center border border-dashed border-border/40 rounded-2xl p-4 text-[11px] text-muted-foreground/50 text-center select-none py-10">
                            Arrastra tareas aquí
                          </div>
                        ) : (
                          columnTasks.map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, t.id)}
                              className="lux-card p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all duration-200 bg-card/60 shadow-sm flex flex-col justify-between gap-3 relative group"
                            >
                              <div>
                                <span className={`text-[13px] font-semibold leading-tight ${t.status === "Done" || t.status === "completed" ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                                  {t.title}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                                  <span>Hora: {t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}</span>
                                  <span>·</span>
                                  <span>Responsable: {t.notes || "Sin asignar"}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center border-t border-border/30 pt-2">
                                <span className={`h-1.5 w-6 rounded-full ${t.status === "Done" || t.status === "completed" ? "bg-emerald-500" : t.status === "In Progress" || t.status === "in_progress" ? "bg-amber-500" : "bg-primary/50"}`} />
                                {(t.status === "Done" || t.status === "completed") && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Task Form */}
              <div className="lux-card p-5 space-y-3">
                <h4 className="font-display text-base border-b border-border/50 pb-2">Asignar Tarea Rápida</h4>
                <form onSubmit={handleAddTask} className="grid sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1">Título de la Tarea</label>
                    <input
                      className="lux-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Ej. Soltar en el potrero 3 por 1 hora"
                      required
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1">Hora</label>
                    <input
                      className="lux-input"
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1">Asignar a</label>
                    <select
                      className="lux-select"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                    >
                      <option value="Sarah J.">Sarah J. (Palafrenero)</option>
                      <option value="Carlos R.">Carlos R. (Palafrenero)</option>
                      <option value="Henrik L.">Henrik L. (Montador/Entrenador)</option>
                      <option value="Dr. Patel">Dr. Patel (Veterinario)</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-full bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-95"
                    >
                      Asignar Tarea
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ───────────────── TABS: DOCUMENTS ───────────────── */}
          {tab === "Documentos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Bóveda de Documentos</h3>
                  <p className="text-xs text-muted-foreground">Documentos oficiales, sanitarios y registros asociados al caballo.</p>
                </div>
                <button
                  onClick={() => setUploadDocOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-95"
                >
                  <Upload className="h-4 w-4" /> Subir Documento
                </button>
              </div>
              
              {dbDocuments.length === 0 ? (
                <div className="lux-card p-10 text-center text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aún no hay documentos en la bóveda de {horse?.name}.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dbDocuments.map((doc: any) => (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedVaultDoc(doc)}
                      className="lux-card p-4 flex flex-col hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{doc.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{doc.type} · {(doc.file_size ? parseInt(doc.file_size)/1024/1024 : 0).toFixed(2)} MB</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          doc.verified === "Revisado" ? "bg-green-500/10 text-green-600" :
                          doc.verified === "No válido" ? "bg-destructive/10 text-destructive" :
                          "bg-amber-500/10 text-amber-600"
                        }`}>
                          {doc.verified}
                        </div>
                        {doc.expiration_date && (
                          <div className={`text-[10px] font-medium ${new Date(doc.expiration_date) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Vence: {new Date(doc.expiration_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TABS: GALLERY (INTUITIVE MEDIA FILE PICKER) ───────────────── */}
          {tab === "Galería" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Galería Multimedia</h3>
                  <p className="text-xs text-muted-foreground">Fotos de alta resolución, videos de entrenamiento e imágenes médicas.</p>
                </div>
              </div>
 
               {/* Simulated Media dropzone picker */}
              <div className="lux-card p-5 space-y-4">
                <h4 className="font-display text-base border-b border-border/40 pb-2">Adjuntar Foto / Video</h4>
                <form onSubmit={handleSaveMedia} className="space-y-4">
                  <div className="relative border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-secondary/10 flex flex-col items-center justify-center gap-2 group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleMediaFileChange}
                      accept="image/*,video/*"
                    />
                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    {selectedMediaName ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedMediaName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedMediaType}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Arrastra y suelta foto o video aquí, o haz clic para buscar
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Soporta JPG, PNG, MP4, MOV
                        </p>
                      </div>
                    )}
                  </div>
 
                   {newMediaUrl && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="eyebrow block mb-1.5">Descripción / Nombre del Archivo</label>
                        <input
                          className="lux-input"
                          value={mediaCaption}
                          onChange={(e) => setMediaCaption(e.target.value)}
                          placeholder="Ej. Entrenamiento de Chalanería / Adiestramiento"
                          required
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Sección de la Galería</label>
                        <select
                          className="lux-select"
                          value={mediaCategory}
                          onChange={(e) => setMediaCategory(e.target.value as any)}
                        >
                          <option value="Photos">Fotos</option>
                          <option value="Videos">Videos</option>
                          <option value="Medical">Imágenes Médicas</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMediaName("");
                            setSelectedMediaType("");
                            setNewMediaUrl("");
                            setMediaCaption("");
                          }}
                          className="rounded-full bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          Limpiar Archivo
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold hover:opacity-95 inline-flex items-center gap-1.5 animate-pulse"
                        >
                          <Plus className="h-3.5 w-3.5" /> Guardar en Galería
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
 
               {/* Gallery Categorization Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/40">
                {(["All", "Photos", "Videos", "Medical"] as const).map((filterVal) => {
                  const active = galleryFilter === filterVal;
                  const filterValEs = filterVal === "All" ? "Todos" :
                                      filterVal === "Photos" ? "Fotos" :
                                      filterVal === "Videos" ? "Videos" : "Médico";
                  return (
                    <button
                      key={filterVal}
                      id={`gallery-filter-${filterVal.toLowerCase()}`}
                      onClick={() => setGalleryFilter(filterVal)}
                      className={`rounded-full px-4 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {filterValEs}
                    </button>
                  );
                })}
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMedia.map((item, i) => (
                  <button
                    key={i}
                    id={`gallery-item-${i}`}
                    onClick={() => {
                      setLightboxIndex(galleryItems.findIndex((m) => m.src === item.src));
                      setLightboxOpen(true);
                    }}
                    className="relative aspect-square overflow-hidden rounded-2xl group border border-border/30 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300"
                  >
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex flex-col justify-end p-3 text-left">
                      <p className="text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium truncate">
                        {item.caption}
                      </p>
                    </div>
                    {item.type === "video" && (
                      <span className="absolute inset-0 grid place-items-center bg-black/10">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-background/90 backdrop-blur shadow">
                          <Play className="h-4 w-4 ml-0.5 text-foreground" />
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDE RAIL: COMPLETED WORKFLOWS & OTHER HORSES */}
        <aside className="space-y-8">
          


          {/* Quick Stats sidebar widget */}
          <div className="lux-card p-5 space-y-4">
            <h4 className="font-display text-base border-b border-border pb-2">Resumen de Rendimiento Activo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40">
                <div className="eyebrow">Campeonatos / Cintas</div>
                <div className="font-display text-2xl mt-1 text-foreground">{horse.wins ?? 0}</div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40">
                <div className="eyebrow">Puntos Fedequinas</div>
                <div className="font-display text-2xl mt-1 text-[var(--gold)]">{formatPoints(horse.earnings)}</div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 col-span-2 flex justify-between items-center">
                <div>
                  <div className="eyebrow">Estado en el Mercado</div>
                  <div className="text-[13px] font-medium mt-0.5">
                    {horse.sale_status === "For Sale" ? "En Venta" : 
                     horse.sale_status === "In Breeding" ? "Para Reproducción" :
                     horse.sale_status || "No está a la venta"}
                  </div>
                </div>
                {horse.price && (
                  <div className="text-right">
                    <div className="eyebrow">Precio Solicitado</div>
                    <div className="text-[13px] font-semibold text-emerald-500">{horse.price}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Other horses block selection */}
          <div>
            <h3 className="font-display text-xl mb-4">Otros Ejemplares del Criadero</h3>
            <div className="space-y-3">
              {otherHorses.map((h) => (
                <Link
                  key={h.id}
                  to="/horses/$horseId"
                  params={{ horseId: h.slug || h.id }}
                  id={`other-cohort-${h.id}`}
                  className="lux-card p-3.5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform block"
                >
                  <img
                    src={h.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover shrink-0 border border-border/40"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[17px] leading-tight truncate">{h.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {h.discipline} · {h.status}
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--gold)] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="h-24 lg:h-12" />

      <EditHorseModal open={editOpen} onOpenChange={setEditOpen} horse={horse} />
      <AddHealthRecordModal open={addHealthOpen} onOpenChange={setAddHealthOpen} defaultHorseId={horse.id} />
      <UploadDocumentModal open={uploadDocOpen} onClose={() => setUploadDocOpen(false)} defaultHorseId={horse.id} />
      <DocumentDetailsModal open={!!selectedVaultDoc} onClose={() => setSelectedVaultDoc(null)} document={selectedVaultDoc} onUploadNewVersion={(doc) => setUploadDocOpen(true)} />
      <AddUpdateModal
        open={addUpdateOpen}
        onOpenChange={setAddUpdateOpen}
        defaultHorseId={horse.id}
      />
      <LightboxModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={galleryItems}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
      <CompetitionDetailModal
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        competition={selectedComp}
      />
    </AppShell>
  );
}

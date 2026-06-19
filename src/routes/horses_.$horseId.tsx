import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { useHorse, useHorses, useDeleteHorse, useUpdateHorse } from "@/lib/hooks/useHorses";
import { useUpdates } from "@/lib/hooks/useUpdates";
import { useCompetitions } from "@/lib/hooks/useCompetitions";
import { useHealthRecords } from "@/lib/hooks/useHealth";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/lib/hooks/useDocuments";
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
  FileText,
  Download,
  Dna,
  Coins,
  ShieldCheck,
  Wheat,
  Droplet,
  Save,
  CheckCircle2,
} from "lucide-react";
import { AddUpdateModal } from "@/components/modals/AddUpdateModal";
import { LightboxModal } from "@/components/modals/LightboxModal";
import { CompetitionDetailModal } from "@/components/modals/CompetitionDetailModal";
import { EditHorseModal } from "@/components/modals/EditHorseModal";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import { PedigreeTree } from "@/components/PedigreeTree";
import { toast } from "sonner";
import type { Competition } from "@/lib/hooks/useCompetitions";

export const Route = createFileRoute("/horses_/$horseId")({
  head: () => ({
    meta: [{ title: "Horse Profile — GaitFlow" }, { name: "description", content: "Detailed horse profile" }],
  }),
  component: HorseProfile,
  notFoundComponent: () => (
    <AppShell>
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">Horse not found</h1>
        <Link to="/horses" className="mt-4 inline-block text-primary hover:underline">
          Back to barn
        </Link>
      </div>
    </AppShell>
  ),
});

const tabs = ["Profile", "Health", "Nutrition", "Tasks", "Documents", "Gallery"] as const;
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
  const [tab, setTab] = useState<Tab>("Profile");
  
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
  const { data: dbDocuments = [] } = useDocuments(horse?.id);
  
  const deleteHorse = useDeleteHorse();
  const updateHorse = useUpdateHorse();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  // ─── LOCAL STATE FOR INTERACTIVE TABS ─────────────────────────────────────
  
  // Nutrition Local State (Persisted in LocalStorage)
  const [isEditingNutrition, setIsEditingNutrition] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState({
    amFeed: "2.0 kg Pavo Sport Performance + 1 flake Alfalfa",
    noonFeed: "1.5 kg Coastal Bermuda Hay",
    pmFeed: "2.0 kg Pavo Sport Performance + 1 flake Alfalfa",
    water: "Automatic drinking trough - clean weekly, monitor daily flow",
    supplements: "Joint Supplement (Glucosamine 15g daily)",
    supplier: "Ocala Equine Feed Store",
  });

  // Water tracker local state (Persisted in LocalStorage)
  const [waterIntake, setWaterIntake] = useState(12);
  const targetWater = 25;

  // Tasks Local State (Kanban System)
  const [tasks, setTasks] = useState<{ id: string; title: string; time: string; assignee: string; status: "Pending" | "In Progress" | "Done" }[]>([]);
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
  const [galleryItems, setGalleryItems] = useState<{ src: string; caption: string; type: "image" | "video"; category: "Photos" | "Videos" | "Medical" }[]>([]);
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaCategory, setMediaCategory] = useState<"Photos" | "Videos" | "Medical">("Photos");
  const [selectedMediaName, setSelectedMediaName] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Load state from localStorage
  useEffect(() => {
    if (horse) {
      // Nutrition
      const savedNutrition = localStorage.getItem(`gaitflow_nutrition_${horse.id}`);
      if (savedNutrition) {
        setNutritionPlan(JSON.parse(savedNutrition));
      } else {
        setNutritionPlan({
          amFeed: "2.0 kg Pavo Sport Performance + 1 flake Alfalfa",
          noonFeed: "1.5 kg Coastal Bermuda Hay",
          pmFeed: "2.0 kg Pavo Sport Performance + 1 flake Alfalfa",
          water: "Automatic drinking trough - clean weekly, monitor daily flow",
          supplements: "Joint Supplement (Glucosamine 15g daily)",
          supplier: "Ocala Equine Feed Store",
        });
      }

      // Water intake
      const savedWater = localStorage.getItem(`gaitflow_water_${horse.id}`);
      if (savedWater) {
        setWaterIntake(Number(savedWater));
      } else {
        setWaterIntake(12);
      }

      // Tasks (Kanban)
      const savedTasks = localStorage.getItem(`gaitflow_tasks_${horse.id}`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        const defaultTasks = [
          { id: "1", title: "Morning feeding (AM)", time: "07:00", assignee: "Carlos R.", status: "Pending" as const },
          { id: "2", title: "Lunge session (25 mins)", time: "10:00", assignee: "Henrik L.", status: "In Progress" as const },
          { id: "3", title: "Groom & brush coat", time: "15:00", assignee: "Sarah J.", status: "Done" as const },
          { id: "4", title: "Evening feeding (PM)", time: "17:00", assignee: "Carlos R.", status: "Pending" as const },
        ];
        setTasks(defaultTasks);
        localStorage.setItem(`gaitflow_tasks_${horse.id}`, JSON.stringify(defaultTasks));
      }

      // Gallery
      const savedGallery = localStorage.getItem(`gaitflow_gallery_${horse.id}`);
      if (savedGallery) {
        setGalleryItems(JSON.parse(savedGallery));
      } else {
        const defaultGallery = [
          {
            src: horse.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80",
            caption: `${horse.name} — Portrait`,
            type: "image" as const,
            category: "Photos" as const,
          },
          {
            src: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
            caption: `${horse.name} — Dressage Session`,
            type: "image" as const,
            category: "Photos" as const,
          },
          {
            src: "https://images.unsplash.com/photo-1534005828468-b7fb473dcc08?auto=format&fit=crop&q=80",
            caption: `${horse.name} — Ground Work`,
            type: "image" as const,
            category: "Photos" as const,
          },
          {
            src: "https://images.unsplash.com/photo-1621245842828-569b3f46f483?auto=format&fit=crop&q=80",
            caption: `${horse.name} — Jump Training`,
            type: "video" as const,
            category: "Videos" as const,
          },
          {
            src: "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80",
            caption: `${horse.name} — Hoof X-Ray`,
            type: "image" as const,
            category: "Medical" as const,
          },
        ];
        setGalleryItems(defaultGallery);
        localStorage.setItem(`gaitflow_gallery_${horse.id}`, JSON.stringify(defaultGallery));
      }
    }
  }, [horse]);

  // Save nutrition
  const handleSaveNutrition = () => {
    if (!horse) return;
    localStorage.setItem(`gaitflow_nutrition_${horse.id}`, JSON.stringify(nutritionPlan));
    setIsEditingNutrition(false);
    toast.success("Nutrition plan updated successfully");
  };

  // Log water intake
  const handleAddWater = (amount: number) => {
    if (!horse) return;
    const newIntake = Math.min(targetWater, Math.max(0, waterIntake + amount));
    setWaterIntake(newIntake);
    localStorage.setItem(`gaitflow_water_${horse.id}`, String(newIntake));
    toast.success(`Logged ${amount > 0 ? "+" : ""}${amount} Gallons of water`);
  };

  // Kanban task drag-and-drop mechanics
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (e: React.DragEvent, newStatus: "Pending" | "In Progress" | "Done") => {
    e.preventDefault();
    const taskId = draggingTaskId || e.dataTransfer.getData("text/plain");
    if (!taskId || !horse) return;

    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    localStorage.setItem(`gaitflow_tasks_${horse.id}`, JSON.stringify(updated));
    setDraggingTaskId(null);
    toast.success(`Task status updated to ${newStatus}`);
  };

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horse || !newTaskTitle.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      time: newTaskTime,
      assignee: newTaskAssignee,
      status: "Pending" as const,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem(`gaitflow_tasks_${horse.id}`, JSON.stringify(updated));
    setNewTaskTitle("");
    toast.success("Task assigned successfully");
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

  // Save document to vault
  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horse || !docName.trim()) {
      toast.error("Please upload a file and enter a document name");
      return;
    }

    const fileUrl = docUrl || `https://gaitflow.s3.amazonaws.com/vault/documents/${docName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.pdf`;
    const fileSizeStr = docSize || "1.2 MB";

    try {
      await createDocument.mutateAsync({
        name: docName,
        category: docCategory,
        file_url: fileUrl,
        file_size: fileSizeStr,
        horse_id: horse.id,
      });

      setDocName("");
      setDocUrl("");
      setDocSize("");
      setSelectedFileName("");
      toast.success("Document added to vault");
    } catch (err) {
      toast.error("Failed to add document");
    }
  };

  // Gallery media selection dropzone helper
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMediaName(file.name);
    const isVideo = file.type.startsWith("video");
    setSelectedMediaType(isVideo ? "Video" : "Photo");
    setMediaCategory(isVideo ? "Videos" : "Photos");
    setMediaCaption(file.name.replace(/\.[^/.]+$/, ""));
    setNewMediaUrl(URL.createObjectURL(file));
  };

  // Save media to gallery
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horse || !newMediaUrl) {
      toast.error("Please drag or click to browse a media file first");
      return;
    }

    const newMedia = {
      src: newMediaUrl,
      caption: mediaCaption || selectedMediaName || "Uploaded Media",
      type: selectedMediaType === "Video" ? "video" as const : "image" as const,
      category: mediaCategory,
    };

    const updated = [newMedia, ...galleryItems];
    setGalleryItems(updated);
    localStorage.setItem(`gaitflow_gallery_${horse.id}`, JSON.stringify(updated));

    setSelectedMediaName("");
    setSelectedMediaType("");
    setNewMediaUrl("");
    setMediaCaption("");
    toast.success("Media added to gallery");
  };

  // Handle Document Delete
  const handleDeleteDocument = async (id: string) => {
    if (!horse) return;
    if (!confirm("Are you sure you want to remove this document?")) return;

    try {
      await deleteDocument.mutateAsync({ id, horseId: horse.id });
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
    }
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
  const handleUpdateLocation = async (newLoc: string) => {
    if (!horse) return;
    try {
      await updateHorse.mutateAsync({
        id: horse.id,
        updates: { location: newLoc },
      });
      setIsChangingLocation(false);
      toast.success(`Horse moved to ${newLoc}`);
      refetchHorse();
    } catch (err) {
      toast.error("Could not update location");
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
          <h1 className="font-display text-3xl">Horse not found</h1>
          <Link to="/horses" className="mt-4 inline-block text-primary hover:underline">
            Back to barn
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
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-primary-foreground">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-[var(--gold)] text-charcoal px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                {horse.status}
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
                value={horse.location || ""}
                onChange={(e) => handleUpdateLocation(e.target.value)}
                onBlur={() => setIsChangingLocation(false)}
                autoFocus
              >
                <option value="">Unassigned</option>
                {locationOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setIsChangingLocation(true)}
                className="text-[14px] font-medium hover:text-primary transition-colors text-left flex items-center gap-1 group"
              >
                <span>{horse.location || "Unassigned"}</span>
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
            <div className="eyebrow">Career</div>
            <div className="text-[14px] font-medium">
              {horse.wins ?? 0} wins · {horse.earnings ?? "—"}
            </div>
          </div>
        </div>

        {/* Edit / Delete actions to complete CRUD */}
        <div className="ml-auto flex items-center gap-2">
          <button
            id="edit-horse-btn"
            onClick={() => setEditOpen(true)}
            className="rounded-full bg-secondary text-foreground border border-border/80 px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit horse
          </button>
          <button
            id="delete-horse-btn"
            onClick={handleDeleteHorse}
            className="rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 text-sm font-medium hover:bg-destructive/15 inline-flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
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
          {tab === "Profile" && (
            <div className="space-y-8">
              {/* Detailed Attributes Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Identification & Official registries */}
                <div className="lux-card p-6 space-y-4">
                  <h3 className="font-display text-lg border-b border-border/60 pb-2 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" /> Identifiers & Registries
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="eyebrow">Height</div>
                      <div className="font-medium mt-0.5">{horse.height ? `${horse.height} hands` : "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Microchip</div>
                      <div className="font-medium mt-0.5 text-[13px]">{horse.microchip || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="eyebrow">Passport #</div>
                      <div className="font-medium mt-0.5">{horse.passport_number || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">USEF ID</div>
                      <div className="font-medium mt-0.5">{horse.usef_id || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">FEI ID</div>
                      <div className="font-medium mt-0.5">{horse.fei_id || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">AQHA ID</div>
                      <div className="font-medium mt-0.5">{horse.aqha_id || "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Registry Reg. #</div>
                      <div className="font-medium mt-0.5">{horse.registry_number || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Acquisition, Financial Value & Ownership */}
                <div className="lux-card p-6 space-y-4">
                  <h3 className="font-display text-lg border-b border-border/60 pb-2 flex items-center gap-2">
                    <Coins className="h-4.5 w-4.5 text-primary" /> Ownership & Value
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="eyebrow">Acquisition Date</div>
                      <div className="font-medium mt-0.5">
                        {horse.acquisition_date ? new Date(horse.acquisition_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow">Estimated Value</div>
                      <div className="font-medium mt-0.5 text-emerald-500 font-semibold">{horse.estimated_value || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="eyebrow mb-2">Ownership History</div>
                      <div className="space-y-2">
                        {horse.ownership_history && Array.isArray(horse.ownership_history) && (horse.ownership_history as any).length > 0 ? (
                          (horse.ownership_history as any).map((owner: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-secondary/30 rounded-xl p-2.5 text-[12px]">
                              <span className="font-medium">{owner.owner}</span>
                              <span className="text-muted-foreground">
                                Since {owner.start_date ? new Date(owner.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "—"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[12px] text-muted-foreground bg-secondary/30 rounded-xl p-2.5 text-center italic">
                            No ownership history logged
                          </div>
                        )}
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
            </div>
          )}

          {/* ───────────────── TABS: HEALTH ───────────────── */}
          {tab === "Health" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Health & Care History</h3>
                  <p className="text-xs text-muted-foreground">Vaccinations, dental, hoof care, and vet checkups.</p>
                </div>
                <button
                  id="tab-log-health-btn"
                  onClick={() => setAddHealthOpen(true)}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Log health event
                </button>
              </div>

              {healthRecords.length === 0 ? (
                <div className="lux-card p-10 text-center text-muted-foreground italic">
                  No health records logged yet. Use the button above to log vet visits, deworming, or shoeing.
                </div>
              ) : (
                <div className="grid gap-4">
                  {healthRecords.map((r) => (
                    <div key={r.id} className="lux-card p-5 flex gap-4 hover:border-primary/20 transition-colors">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary shrink-0 border border-border/40">
                        <HeartPulse className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display text-lg font-medium">{r.title}</h4>
                            <span className="rounded-full bg-secondary/80 border border-border/60 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {r.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">{r.date}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{r.notes}</p>
                        
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2">
                          <span>Professional: <strong className="text-foreground">{r.professional}</strong></span>
                          {r.next_due && (
                            <span>Next review: <strong className="text-primary">{r.next_due}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TABS: NUTRITION ───────────────── */}
          {tab === "Nutrition" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Nutrition Plan & Rations</h3>
                  <p className="text-xs text-muted-foreground">Individualized diet specifications and scheduled servings.</p>
                </div>
                {!isEditingNutrition ? (
                  <button
                    id="edit-nutrition-btn"
                    onClick={() => setIsEditingNutrition(true)}
                    className="rounded-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit diet plan
                  </button>
                ) : (
                  <button
                    id="save-nutrition-btn"
                    onClick={handleSaveNutrition}
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> Save diet plan
                  </button>
                )}
              </div>

              {/* Liquid Water Consumption tracker (Gives life / Premium aesthetics) */}
              <div className="lux-card p-6 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border-sky-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-lg text-sky-400 flex items-center gap-2">
                      <Droplet className="h-5 w-5 fill-current" /> Daily Hydration Log
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Track daily fluid intake (Target: 25 Gallons)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-sky-400">{waterIntake}</span>
                    <span className="text-xs text-muted-foreground"> / {targetWater} Gal</span>
                  </div>
                </div>

                {/* Animated liquid progress tank */}
                <div className="mt-5 relative h-8 w-full rounded-2xl bg-secondary border border-border/50 overflow-hidden shadow-inner flex items-center justify-center">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500 to-sky-400 opacity-70 transition-all duration-700 ease-out"
                    style={{ height: `${(waterIntake / targetWater) * 100}%` }}
                  />
                  <span className="relative z-10 text-[11px] font-bold font-mono text-foreground uppercase tracking-widest drop-shadow-sm">
                    {Math.round((waterIntake / targetWater) * 100)}% Hydrated
                  </span>
                </div>

                {/* Tracking logs buttons */}
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => handleAddWater(-5)}
                    className="rounded-full bg-secondary/80 border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted text-muted-foreground transition-colors"
                  >
                    -5 Gal
                  </button>
                  <button
                    onClick={() => handleAddWater(5)}
                    className="rounded-full bg-sky-500/20 border border-sky-500/40 px-4 py-1.5 text-xs font-bold hover:bg-sky-500/35 text-sky-400 transition-colors"
                  >
                    +5 Gal
                  </button>
                  <button
                    onClick={() => handleAddWater(10)}
                    className="rounded-full bg-sky-500/30 border border-sky-500/60 px-4 py-1.5 text-xs font-bold hover:bg-sky-500/45 text-sky-300 transition-colors"
                  >
                    +10 Gal
                  </button>
                  <button
                    onClick={() => {
                      setWaterIntake(0);
                      localStorage.setItem(`gaitflow_water_${horse.id}`, "0");
                      toast.success("Hydration tracker reset");
                    }}
                    className="rounded-full bg-destructive/15 border border-destructive/30 px-3 py-1.5 text-xs font-bold hover:bg-destructive/25 text-destructive transition-colors ml-2"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="lux-card p-6 space-y-6">
                {isEditingNutrition ? (
                  // EDITING NUTRITION PLAN FORM
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="eyebrow block mb-1.5">Morning Ration (AM)</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.amFeed}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, amFeed: e.target.value })}
                          placeholder="e.g. 2.0 kg Pavo Sport + 1 flake Alfalfa"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Noon Ration</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.noonFeed}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, noonFeed: e.target.value })}
                          placeholder="e.g. 1.5 kg Coastal Hay"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Evening Ration (PM)</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.pmFeed}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, pmFeed: e.target.value })}
                          placeholder="e.g. 2.0 kg Pavo Sport + 1 flake Alfalfa"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Water Specs</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.water}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, water: e.target.value })}
                          placeholder="e.g. Automatic bucket"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="eyebrow block mb-1.5">Supplements & Additives</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.supplements}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, supplements: e.target.value })}
                          placeholder="e.g. Joint Glucosamine 15g daily"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="eyebrow block mb-1.5">Feed Supplier</label>
                        <input
                          className="lux-input"
                          value={nutritionPlan.supplier}
                          onChange={(e) => setNutritionPlan({ ...nutritionPlan, supplier: e.target.value })}
                          placeholder="e.g. Ocala Feed & Supply"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // VIEWING NUTRITION PLAN
                  <div className="space-y-6">
                    {/* Feeding Timeline */}
                    <div>
                      <h4 className="text-[11px] tracking-widest uppercase text-muted-foreground font-semibold mb-4">Daily Feeding Schedule</h4>
                      <div className="relative border-l border-border pl-6 space-y-6 ml-2">
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 grid h-[11px] w-[11px] rounded-full bg-amber-500 ring-4 ring-background" />
                          <div className="flex justify-between items-baseline">
                            <h5 className="font-semibold text-sm text-foreground">Morning (07:00 AM)</h5>
                            <span className="text-[11px] text-muted-foreground">Ration 1</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Wheat className="h-3.5 w-3.5 text-[var(--bronze)]" /> {nutritionPlan.amFeed}
                          </p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 grid h-[11px] w-[11px] rounded-full bg-amber-400 ring-4 ring-background" />
                          <div className="flex justify-between items-baseline">
                            <h5 className="font-semibold text-sm text-foreground">Noon (12:00 PM)</h5>
                            <span className="text-[11px] text-muted-foreground">Ration 2</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Wheat className="h-3.5 w-3.5 text-[var(--bronze)]" /> {nutritionPlan.noonFeed}
                          </p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 grid h-[11px] w-[11px] rounded-full bg-amber-600 ring-4 ring-background" />
                          <div className="flex justify-between items-baseline">
                            <h5 className="font-semibold text-sm text-foreground">Evening (05:00 PM)</h5>
                            <span className="text-[11px] text-muted-foreground">Ration 3</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Wheat className="h-3.5 w-3.5 text-[var(--bronze)]" /> {nutritionPlan.pmFeed}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Water & Supplements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 pt-6">
                      <div className="bg-secondary/20 border border-border/40 rounded-2xl p-4 flex gap-3.5">
                        <span className="grid place-items-center h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 shrink-0 border border-sky-500/15">
                          <Droplet className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="eyebrow">Watering specs</div>
                          <div className="text-[13px] font-medium text-foreground mt-1">{nutritionPlan.water}</div>
                        </div>
                      </div>

                      <div className="bg-secondary/20 border border-border/40 rounded-2xl p-4 flex gap-3.5">
                        <span className="grid place-items-center h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/15">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="eyebrow">Active Supplements</div>
                          <div className="text-[13px] font-medium text-foreground mt-1">{nutritionPlan.supplements}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-secondary/30 rounded-2xl p-4 text-[12px] text-muted-foreground flex justify-between">
                      <span>Ration Supplier: <strong>{nutritionPlan.supplier}</strong></span>
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Organic Certified
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────── TABS: TASKS (KANBAN INTERACTION) ───────────────── */}
          {tab === "Tasks" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl">Daily Stable Tasks</h3>
                <p className="text-xs text-muted-foreground">Drag tasks across columns to update their status (To Do, In Progress, Done).</p>
              </div>

              {/* Kanban columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["Pending", "In Progress", "Done"] as const).map((columnStatus) => {
                  const columnTasks = tasks.filter((t) => t.status === columnStatus);
                  const titleMap = {
                    Pending: "To Do",
                    "In Progress": "In Progress",
                    Done: "Done",
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
                            Drag tasks here
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
                                <span className={`text-[13px] font-semibold leading-tight ${t.status === "Done" ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                                  {t.title}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                                  <span>Time: {t.time}</span>
                                  <span>·</span>
                                  <span>Assignee: {t.assignee}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center border-t border-border/30 pt-2">
                                <span className={`h-1.5 w-6 rounded-full ${t.status === "Done" ? "bg-emerald-500" : t.status === "In Progress" ? "bg-amber-500" : "bg-primary/50"}`} />
                                {t.status === "Done" && (
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
                <h4 className="font-display text-base border-b border-border/50 pb-2">Assign Quick Task</h4>
                <form onSubmit={handleAddTask} className="grid sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1">Task Title</label>
                    <input
                      className="lux-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Turnout in paddock 3 for 1 hour"
                      required
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1">Time</label>
                    <input
                      className="lux-input"
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="eyebrow block mb-1">Assignee</label>
                    <select
                      className="lux-select"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                    >
                      <option value="Sarah J.">Sarah J. (Groom)</option>
                      <option value="Carlos R.">Carlos R. (Groom)</option>
                      <option value="Henrik L.">Henrik L. (Trainer)</option>
                      <option value="Dr. Patel">Dr. Patel (Vet)</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-full bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-95"
                    >
                      Assign Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ───────────────── TABS: DOCUMENTS (INTUITIVE FILE SELECTOR) ───────────────── */}
          {tab === "Documents" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl">Document Vault</h3>
                <p className="text-xs text-muted-foreground">Equestrian contracts, passport certificates, coggins records, and labs.</p>
              </div>

              {/* Upload Document Form */}
              <div className="lux-card p-5 space-y-4">
                <h4 className="font-display text-base border-b border-border/40 pb-2">Attach Official Document</h4>
                
                <form onSubmit={handleAddDocumentSubmit} className="space-y-4">
                  {/* Intuitive drag-and-drop simulated file box */}
                  <div className="relative border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-secondary/10 flex flex-col items-center justify-center gap-2 group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleDocFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                    <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    {selectedFileName ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedFileName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{docSize}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Drag & drop document file here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Supports PDF, DOC, JPG, PNG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedFileName && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="eyebrow block mb-1.5">Document Title</label>
                        <input
                          className="lux-input"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="e.g. Coggins Certificate 2026"
                          required
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Category</label>
                        <select
                          className="lux-select"
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value as any)}
                        >
                          <option value="Passport">Passport</option>
                          <option value="Contract">Breeding/Purchase Contract</option>
                          <option value="Health Certificate">Health Certificate</option>
                          <option value="Coggins">Coggins Record</option>
                          <option value="Pedigree">Pedigree Chart</option>
                          <option value="Other">Other Document</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFileName("");
                            setDocName("");
                            setDocUrl("");
                          }}
                          className="rounded-full bg-secondary text-foreground border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          Clear File
                        </button>
                        <button
                          type="submit"
                          disabled={createDocument.isPending}
                          className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold hover:opacity-95 disabled:opacity-75 inline-flex items-center gap-1.5 animate-pulse"
                        >
                          {createDocument.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Save Document</>}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Document Vault List */}
              {dbDocuments.length === 0 ? (
                <div className="lux-card p-10 text-center text-muted-foreground italic">
                  No documents in the vault yet. Upload documents (Coggins, Health certs, or purchase agreements) using the form above.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {dbDocuments.map((doc) => (
                    <div key={doc.id} className="lux-card p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="grid place-items-center h-10 w-10 rounded-xl bg-secondary text-primary border border-border/40 shrink-0">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="font-semibold text-sm truncate max-w-[180px]">{doc.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{doc.category} · {doc.file_size || "1.5 MB"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TABS: GALLERY (INTUITIVE MEDIA FILE PICKER) ───────────────── */}
          {tab === "Gallery" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Multimedia Repository</h3>
                  <p className="text-xs text-muted-foreground">High resolution photos, training videos, and medical images.</p>
                </div>
              </div>

              {/* Simulated Media dropzone picker */}
              <div className="lux-card p-5 space-y-4">
                <h4 className="font-display text-base border-b border-border/40 pb-2">Attach Photo / Video</h4>
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
                          Drag & drop photo or video here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Supports JPG, PNG, MP4, MOV
                        </p>
                      </div>
                    )}
                  </div>

                  {newMediaUrl && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="eyebrow block mb-1.5">Media Caption / Name</label>
                        <input
                          className="lux-input"
                          value={mediaCaption}
                          onChange={(e) => setMediaCaption(e.target.value)}
                          placeholder="e.g. Show Jumping Practice"
                          required
                        />
                      </div>
                      <div>
                        <label className="eyebrow block mb-1.5">Gallery Section</label>
                        <select
                          className="lux-select"
                          value={mediaCategory}
                          onChange={(e) => setMediaCategory(e.target.value as any)}
                        >
                          <option value="Photos">Photos</option>
                          <option value="Videos">Videos</option>
                          <option value="Medical">Medical Images</option>
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
                          Clear Media
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold hover:opacity-95 inline-flex items-center gap-1.5 animate-pulse"
                        >
                          <Plus className="h-3.5 w-3.5" /> Save to Gallery
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
                      {filterVal}
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
          
          {/* Holt-Winters Seasonal Health Risk Alert (HW-3 Connectivity) */}
          <div className="lux-card p-6 bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)] text-primary-foreground border-transparent">
            <div className="eyebrow !text-primary-foreground/60 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)] fill-current" /> Holt-Winters Alert (HW-3)
            </div>
            <h3 className="font-display text-2xl mt-2 leading-tight">Seasonal Health Risk: 8.2 / 10</h3>
            <p className="text-[13px] text-primary-foreground/75 mt-3 leading-relaxed">
              Ocala's seasonal Strongyle parasite index is peaking. Based on the 3-year historical pattern, we highly recommend scheduling a deworming event before July 15.
            </p>
            <button
              id="schedule-vet-preventive"
              onClick={() => setAddHealthOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--gold)] hover:opacity-90"
            >
              Schedule Vet Checkup <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="lux-card p-5 space-y-4">
            <h4 className="font-display text-base border-b border-border pb-2">Active Performance Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40">
                <div className="eyebrow">Wins (Ocala/HITS)</div>
                <div className="font-display text-2xl mt-1 text-foreground">{horse.wins ?? 0}</div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40">
                <div className="eyebrow">Lifetime Earnings</div>
                <div className="font-display text-2xl mt-1 text-[var(--gold)]">{horse.earnings || "$0"}</div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 col-span-2 flex justify-between items-center">
                <div>
                  <div className="eyebrow">Marketplace Status</div>
                  <div className="text-[13px] font-medium mt-0.5">{horse.sale_status || "Not for Sale"}</div>
                </div>
                {horse.price && (
                  <div className="text-right">
                    <div className="eyebrow">Asking Price</div>
                    <div className="text-[13px] font-semibold text-emerald-500">{horse.price}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Other horses block selection */}
          <div>
            <h3 className="font-display text-xl mb-4">Other Stable Cohorts</h3>
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

      {/* MODAL SYSTEM */}
      <EditHorseModal
        open={editOpen}
        onOpenChange={setEditOpen}
        horse={horse}
      />
      <AddHealthRecordModal
        open={addHealthOpen}
        onOpenChange={setAddHealthOpen}
        defaultHorseId={horse.id}
      />
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

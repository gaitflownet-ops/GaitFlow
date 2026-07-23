import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { 
  useLocations, useCreateLocation, useDeleteLocation, useUpdateLocation,
  useStallUnits, useCreateStallUnit, useAssignHorseToStall, useVacateStall,
  useLocationHistory, useQuarantineHistory, useCreateQuarantine, useReleaseQuarantine,
  useTransportHistory, useCreateTransport, useCompetitionLocations, useCreateCompetitionLocation
} from "@/lib/hooks/useLocations";
import { useHorses } from "@/lib/hooks/useHorses";
import { 
  MapPin, Plus, Home, ChevronRight, UserCheck, LogOut, Check, Loader2,
  Calendar, ShieldAlert, Truck, Trophy, ArrowRight, User, ShieldX, Info, AlertTriangle, Trash2,
  Edit
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/modals/Modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useFarms, useCreateFarm } from "@/lib/hooks/useFarms";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/locations")({
  component: LocationsPage,
});

type SubTab = "mapa" | "movimientos" | "cuarentena" | "transporte" | "competencias";

function LocationsPage() {
  const queryClient = useQueryClient();
  const { data: locations = [], isLoading: locsLoading } = useLocations();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const updateLocation = useUpdateLocation();
  const { data: horses = [] } = useHorses();
  const { data: farms = [] } = useFarms();
  const { state } = useApp();
  const createFarm = useCreateFarm();
  const [selectedFarmId, setSelectedFarmId] = useState("");

  const filteredFarms = useMemo(() => {
    const userOrgId = state.user?.organization_id;
    if (!userOrgId) return farms;
    return farms.filter((f) => f.organization_id === userOrgId);
  }, [farms, state.user?.organization_id]);

  useEffect(() => {
    if (filteredFarms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(filteredFarms[0].id);
    }
  }, [filteredFarms, selectedFarmId]);

  // Form states - New Farm
  const [newFarmOpen, setNewFarmOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmLocation, setNewFarmLocation] = useState("");
  const [newFarmDesc, setNewFarmDesc] = useState("");

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("mapa");

  // Selection state
  const [selectedLoc, setSelectedLoc] = useState<any | null>(null);

  // Modals state
  const [locOpen, setLocOpen] = useState(false);
  const [stallOpen, setStallOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [quarantineOpen, setQuarantineOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [compOpen, setCompOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Form states - Location
  const [locName, setLocName] = useState("");
  const [locType, setLocType] = useState("Stable");
  const [locAddress, setLocAddress] = useState("");
  const [locCapacity, setLocCapacity] = useState(10);
  const [locDailyCost, setLocDailyCost] = useState(0);
  const [locArea, setLocArea] = useState(0);
  const [locGrassType, setLocGrassType] = useState("Kikuyo");
  const [locRotation, setLocRotation] = useState("Resting");

  // Form states - Edit Location
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("Stable");
  const [editAddress, setEditAddress] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);
  const [editDailyCost, setEditDailyCost] = useState(0);
  const [editArea, setEditArea] = useState(0);
  const [editGrassType, setEditGrassType] = useState("");
  const [editRotation, setEditRotation] = useState("Resting");

  // Form states - Stall
  const [stallNumber, setStallNumber] = useState("");

  // Form states - Assign Stall/Movement
  const [assignHorseId, setAssignHorseId] = useState("");
  const [assignStallId, setAssignStallId] = useState<string | null>(null);
  const [assignStallNum, setAssignStallNum] = useState<string | null>(null);
  const [assignReason, setAssignReason] = useState("");
  const [assignResponsibleId, setAssignResponsibleId] = useState("");

  // Form states - Quarantine
  const [quarHorseId, setQuarHorseId] = useState("");
  const [quarReason, setQuarReason] = useState("New Intake");
  const [quarNotes, setQuarNotes] = useState("");
  const [quarResponsibleId, setQuarResponsibleId] = useState("");

  // Form states - Transport
  const [transHorseId, setTransHorseId] = useState("");
  const [transOrigin, setTransOrigin] = useState("");
  const [transDestination, setTransDestination] = useState("");
  const [transReason, setTransReason] = useState("");
  const [transCarrier, setTransCarrier] = useState("");
  const [transCost, setTransCost] = useState(0);
  const [transNotes, setTransNotes] = useState("");

  // Form states - Competition
  const [compHorseId, setCompHorseId] = useState("");
  const [compEventName, setCompEventName] = useState("");
  const [compLocation, setCompLocation] = useState("");
  const [compDate, setCompDate] = useState("");
  const [compStatus, setCompStatus] = useState("Registered");

  // Queries for selected location's stalls
  const { data: stalls = [], isLoading: stallsLoading } = useStallUnits(selectedLoc?.id);

  // Advanced query histories
  const { data: movements = [], isLoading: movsLoading } = useLocationHistory();
  const { data: quarantines = [], isLoading: quarLoading } = useQuarantineHistory();
  const { data: transports = [], isLoading: transLoading } = useTransportHistory();
  const { data: competitions = [], isLoading: compLoading } = useCompetitionLocations();

  // Fetch profiles for responsible dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-responsible"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    }
  });

  // Mutations
  const createStall = useCreateStallUnit();
  const assignHorse = useAssignHorseToStall();
  const vacateStall = useVacateStall();
  const createQuarantine = useCreateQuarantine();
  const releaseQuarantine = useReleaseQuarantine();
  const createTransport = useCreateTransport();
  const createCompetition = useCreateCompetitionLocation();

  // Dynamic Occupancy calculations per location
  const occupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    movements.forEach((m) => {
      if (!m.end_date && m.new_location_id) {
        map[m.new_location_id] = (map[m.new_location_id] || 0) + 1;
      }
    });
    return map;
  }, [movements]);

  // Intelligent alerts list
  const alerts = useMemo(() => {
    const list: any[] = [];

    // 1. Overcapacity Alerts
    locations.forEach((loc) => {
      const occupancy = occupancyMap[loc.id] || 0;
      if (loc.capacity && occupancy > loc.capacity) {
        list.push({
          type: "overcapacity",
          title: `Sobrecupo en ${loc.name}`,
          message: `El espacio cuenta con ${occupancy} ejemplares de ${loc.capacity} máximos.`,
          icon: AlertTriangle,
          color: "border-red-500 bg-red-500/5 text-red-500"
        });
      }
    });

    // 2. Quarantine Alerts
    quarantines.forEach((q) => {
      if (q.status === "Active") {
        list.push({
          type: "quarantine",
          title: `Aislamiento Activo`,
          message: `El ejemplar ${q.horse?.name || "Desconocido"} requiere seguimiento clínico de cuarentena.`,
          icon: ShieldAlert,
          color: "border-amber-500 bg-amber-500/5 text-amber-500"
        });
      }
    });

    // 3. External Cost Alerts (Outside > 7 days)
    movements.forEach((m) => {
      if (!m.end_date && m.new_location_id) {
        const loc = locations.find((l) => l.id === m.new_location_id);
        if (loc && (loc.type?.toLowerCase() === "clinic" || loc.type?.toLowerCase() === "clínica" || (loc.daily_boarding_cost || 0) > 0)) {
          const daysOut = Math.floor((Date.now() - new Date(m.start_date).getTime()) / (1000 * 60 * 60 * 24));
          if (daysOut >= 7) {
            const estCost = daysOut * (loc.daily_boarding_cost || 0);
            list.push({
              type: "external_cost",
              title: `Hospedaje Prolongado`,
              message: `${m.horse?.name} lleva ${daysOut} días en ${loc.name}. Costo est: $${estCost.toLocaleString("es-CO")} COP.`,
              icon: Info,
              color: "border-sky-500 bg-sky-500/5 text-sky-500"
            });
          }
        }
      }
    });

    return list;
  }, [locations, occupancyMap, quarantines, movements]);

  // Handlers
  const handleCreateLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLoc = await createLocation.mutateAsync({
        farm_id: selectedFarmId || "11111111-1111-1111-1111-111111111111",
        name: locName,
        type: locType,
        address: locAddress || null,
        capacity: Number(locCapacity) || 1,
        status: "Available",
        notes: null,
        daily_boarding_cost: Number(locDailyCost) || 0,
        area_hectares: Number(locArea) || 0,
        grass_type: locGrassType || null,
        rotation_status: locRotation || "Resting"
      } as any);

      // Si es un establo, generar las pesebreras automáticamente
      if (locType === "Stable" && newLoc && newLoc.id) {
        const capacity = Number(locCapacity) || 0;
        const currentFarm = farms.find(f => f.id === (selectedFarmId || newLoc.farm_id));
        const farmOrgId = currentFarm?.organization_id;
        const orgId = newLoc.organization_id || farmOrgId || state.user?.organization_id;

        const stallsToCreate: any[] = [];
        for (let i = 1; i <= capacity; i++) {
          const stallPayload: any = {
            location_id: newLoc.id,
            stall_number: i.toString(),
            availability: true,
            horse_id: null
          };
          if (orgId && orgId !== "00000000-0000-0000-0000-000000000000") {
            stallPayload.organization_id = orgId;
          }
          stallsToCreate.push(stallPayload);
        }

        if (stallsToCreate.length > 0) {
          const { error: stallError } = await (supabase as any)
            .from("stall_units")
            .insert(stallsToCreate);

          if (stallError) {
            console.error("Error al generar pesebreras automáticamente:", stallError);
            toast.error("El espacio físico fue creado, pero hubo un error al generar las pesebreras automáticamente.");
          } else {
            toast.success(`Se generaron automáticamente ${capacity} pesebreras.`);
          }
        }
      }

      toast.success("Espacio creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["stall-units"] });
      
      // Auto-seleccionar la finca/criadero creada para que se visualicen los cambios al instante
      if (newLoc) {
        setSelectedLoc(newLoc);
      }
      
      setLocName("");
      setLocAddress("");
      setLocCapacity(10);
      setLocDailyCost(0);
      setLocArea(0);
      setLocOpen(false);
    } catch (err) {
      toast.error("Error al crear espacio físico");
    }
  };

  const handleOpenEdit = () => {
    if (!selectedLoc) return;
    setEditName(selectedLoc.name || "");
    setEditType(selectedLoc.type || "Stable");
    setEditAddress(selectedLoc.address || "");
    setEditCapacity(selectedLoc.capacity || 1);
    setEditDailyCost(selectedLoc.daily_boarding_cost || 0);
    setEditArea(selectedLoc.area_hectares || 0);
    setEditGrassType(selectedLoc.grass_type || "");
    setEditRotation(selectedLoc.rotation_status || "Resting");
    setEditOpen(true);
  };

  const handleEditLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoc) return;

    try {
      const updated = await updateLocation.mutateAsync({
        id: selectedLoc.id,
        name: editName,
        type: editType,
        address: editAddress || null,
        capacity: Number(editCapacity) || 1,
        daily_boarding_cost: Number(editDailyCost) || 0,
        area_hectares: Number(editArea) || 0,
        grass_type: editGrassType || null,
        rotation_status: editRotation || "Resting"
      } as any);

      // Si es un establo, verificar si es necesario generar nuevas pesebreras correlativas
      if (editType === "Stable") {
        const currentStallsCount = stalls.length;
        const newCapacity = Number(editCapacity) || 0;

        if (newCapacity > currentStallsCount) {
          const currentFarm = farms.find(f => f.id === selectedLoc.farm_id);
          const farmOrgId = currentFarm?.organization_id;
          const orgId = selectedLoc.organization_id || farmOrgId || state.user?.organization_id;

          const stallsToCreate: any[] = [];
          for (let i = currentStallsCount + 1; i <= newCapacity; i++) {
            const stallPayload: any = {
              location_id: selectedLoc.id,
              stall_number: i.toString(),
              availability: true,
              horse_id: null
            };
            if (orgId && orgId !== "00000000-0000-0000-0000-000000000000") {
              stallPayload.organization_id = orgId;
            }
            stallsToCreate.push(stallPayload);
          }

          if (stallsToCreate.length > 0) {
            const { error: stallError } = await (supabase as any)
              .from("stall_units")
              .insert(stallsToCreate);

            if (stallError) {
              console.error("Error al generar las nuevas pesebreras:", stallError);
              toast.error("El espacio fue actualizado, pero no se pudieron generar las pesebreras adicionales.");
            } else {
              toast.success(`Se generaron automáticamente ${stallsToCreate.length} pesebreras adicionales.`);
            }
          }
        }
      }

      toast.success("Espacio físico actualizado con éxito");
      setSelectedLoc(updated);
      queryClient.invalidateQueries({ queryKey: ["stall-units", selectedLoc.id] });
      setEditOpen(false);
    } catch (err) {
      toast.error("Error al actualizar espacio físico");
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) return;

    const generatedSlug = newFarmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 1000);

    try {
      const farm = await createFarm.mutateAsync({
        name: newFarmName,
        slug: generatedSlug,
        location: newFarmLocation || null,
        description: newFarmDesc || null,
        owner_id: state.user?.id || null,
        organization_id: state.user?.organization_id || null,
      });

      toast.success("Finca / Criadero creado exitosamente");
      setNewFarmName("");
      setNewFarmLocation("");
      setNewFarmDesc("");
      setNewFarmOpen(false);
      
      if (farm && (farm as any).id) {
        setSelectedFarmId((farm as any).id);
      }
    } catch (err) {
      toast.error("Error al crear la finca");
    }
  };

  const handleCreateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoc || !stallNumber) return;

    try {
      await createStall.mutateAsync({
        location_id: selectedLoc.id,
        stall_number: stallNumber,
        availability: true,
        horse_id: null,
        organization_id: selectedLoc.organization_id || state.user?.organization_id || "00000000-0000-0000-0000-000000000000"
      });
      toast.success(`Pesebrera ${stallNumber} agregada`);
      setStallNumber("");
      setStallOpen(false);
    } catch (err) {
      toast.error("Error al agregar pesebrera");
    }
  };

  const handleAssignHorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoc || !assignHorseId) return;

    // Capacity checks (Warning alert)
    const occupancy = occupancyMap[selectedLoc.id] || 0;
    if (selectedLoc.capacity && occupancy >= selectedLoc.capacity) {
      const confirmMove = window.confirm(`¡Alerta de Capacidad! Este espacio ya alcanzó su cupo máximo de ${selectedLoc.capacity}. ¿Deseas forzar la asignación?`);
      if (!confirmMove) return;
    }

    try {
      await assignHorse.mutateAsync({
        stallId: assignStallId,
        locationId: selectedLoc.id,
        horseId: assignHorseId,
        locationName: selectedLoc.name,
        stallNumber: assignStallNum,
        reason: assignReason,
        responsibleId: assignResponsibleId || undefined
      });
      toast.success("Ejemplar alojado exitosamente");
      setAssignHorseId("");
      setAssignStallId(null);
      setAssignStallNum(null);
      setAssignReason("");
      setAssignResponsibleId("");
      setAssignOpen(false);
    } catch (err) {
      toast.error("Error al alojar ejemplar");
    }
  };

  const handleVacateStallClick = async (stallId: string | null, horseId?: string | null) => {
    if (!selectedLoc) return;
    try {
      await vacateStall.mutateAsync({
        stallId,
        locationId: selectedLoc.id,
        horseId: horseId || null
      });
      toast.success("Alojamiento finalizado");
    } catch (err) {
      toast.error("Error al desocupar espacio");
    }
  };

  const handleCreateQuar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarHorseId || !quarReason) return;
    try {
      await createQuarantine.mutateAsync({
        horse_id: quarHorseId,
        start_date: new Date().toISOString(),
        end_date: null,
        reason: quarReason,
        notes: quarNotes || null,
        responsible_id: quarResponsibleId || null,
        status: "Active"
      });
      toast.success("Ejemplar ingresado a cuarentena");
      setQuarHorseId("");
      setQuarReason("New Intake");
      setQuarNotes("");
      setQuarResponsibleId("");
      setQuarantineOpen(false);
    } catch (err) {
      toast.error("Error al registrar cuarentena");
    }
  };

  const handleReleaseQuar = async (id: string, horseId: string) => {
    const notes = prompt("Observaciones de liberación / alta clínica:");
    try {
      await releaseQuarantine.mutateAsync({ id, horseId, notes: notes || undefined });
      toast.success("Ejemplar de alta médica y liberado");
    } catch (err) {
      toast.error("Error al dar de alta médica");
    }
  };

  const handleCreateTrans = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transHorseId || !transOrigin || !transDestination) return;
    try {
      await createTransport.mutateAsync({
        horse_id: transHorseId,
        origin: transOrigin,
        destination: transDestination,
        date: new Date().toISOString(),
        reason: transReason || null,
        carrier_name: transCarrier || null,
        cost: Number(transCost) || 0,
        notes: transNotes || null
      });
      toast.success("Traslado / Transporte registrado y cargado a finanzas");
      setTransHorseId("");
      setTransOrigin("");
      setTransDestination("");
      setTransReason("");
      setTransCarrier("");
      setTransCost(0);
      setTransNotes("");
      setTransportOpen(false);
    } catch (err) {
      toast.error("Error al registrar transporte");
    }
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compHorseId || !compEventName || !compLocation || !compDate) return;
    try {
      await createCompetition.mutateAsync({
        horse_id: compHorseId,
        event_name: compEventName,
        date: new Date(compDate).toISOString(),
        location: compLocation,
        status: compStatus
      });
      toast.success("Asistencia a feria registrada");
      setCompHorseId("");
      setCompEventName("");
      setCompLocation("");
      setCompDate("");
      setCompOpen(false);
    } catch (err) {
      toast.error("Error al registrar competencia");
    }
  };

  const handleDeleteLocation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Deseas eliminar esta locación y todos sus pesebres permanentemente?")) return;
    try {
      await deleteLocation.mutateAsync(id);
      toast.success("Locación eliminada");
      if (selectedLoc?.id === id) setSelectedLoc(null);
    } catch (err) {
      toast.error("Error al eliminar locación");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, horseId: string) => {
    e.dataTransfer.setData("text/plain", horseId);
  };

  const handleDropToStall = (e: React.DragEvent, targetStallId: string, targetStallNumber: string) => {
    e.preventDefault();
    const horseId = e.dataTransfer.getData("text/plain");
    if (!horseId) return;

    // Check if horse is already assigned to this stall
    const stall = stalls.find(s => s.id === targetStallId);
    if (stall && stall.horse_id === horseId) return;

    setAssignHorseId(horseId);
    setAssignStallId(targetStallId);
    setAssignStallNum(targetStallNumber);
    setAssignOpen(true);
  };

  const handleDropToVacate = (e: React.DragEvent) => {
    e.preventDefault();
    const horseId = e.dataTransfer.getData("text/plain");
    if (!horseId) return;

    // Find the stall where this horse is currently assigned
    const occupiedStall = stalls.find(s => s.horse_id === horseId);
    if (occupiedStall) {
      handleVacateStallClick(occupiedStall.id, horseId);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> Logística Espacial
          </div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Control Geográfico y Pesebreras</h1>
          <p className="text-muted-foreground mt-2">Diagramación en tiempo real de pesebreras, potreros con rotación de pasturas, cuarentenas y transportes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLocOpen(true)}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Añadir Espacio
          </button>
        </div>
      </div>

      {/* INTELLIGENT ALERTS PANEL */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {alerts.slice(0, 3).map((a, idx) => {
            const Icon = a.icon;
            return (
              <div key={idx} className={`p-4 rounded-2xl border flex gap-3 items-start animate-fade-in ${a.color}`}>
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm leading-tight">{a.title}</h4>
                  <p className="text-[11px] mt-1 leading-normal opacity-90">{a.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex overflow-x-auto pb-3 mb-6 gap-2 hide-scrollbar border-b border-border/50">
        {[
          { id: "mapa", label: "Pesebreras & Potreros", icon: Home },
          { id: "movimientos", label: "Historial de Traslados", icon: ChevronRight },
          { id: "cuarentena", label: "Control de Cuarentenas", icon: ShieldAlert },
          { id: "transporte", label: "Logística de Transportes", icon: Truck },
          { id: "competencias", label: "Adaptación CCC (Feria)", icon: Trophy }
        ].map((subTab) => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id as SubTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeSubTab === subTab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <subTab.icon className="h-4 w-4" />
            {subTab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: MAPA & PESEBRERAS */}
      {activeSubTab === "mapa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Locations List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
              <Home className="h-5 w-5 text-[var(--gold)]" /> Espacios Físicos
            </h2>
            {locsLoading ? (
              <div className="h-32 lux-card animate-pulse" />
            ) : locations.length === 0 ? (
              <div className="p-8 text-center lux-card text-muted-foreground text-xs">
                No hay fincas configuradas aún.
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc) => {
                  const occupancy = occupancyMap[loc.id] || 0;
                  const percent = loc.capacity ? Math.min(100, Math.round((occupancy / loc.capacity) * 100)) : 0;
                  let typeLabel = "Finca / Pesebre";
                  if (loc.type === "Clinic" || loc.type === "clínica") typeLabel = "Clínica";
                  if (loc.type === "Paddock" || loc.type === "potrero") typeLabel = "Potrero";
                  if (loc.type === "Competition") typeLabel = "Feria / Pistas";

                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLoc(loc)}
                      className={`w-full text-left lux-card p-5 hover:border-primary/40 transition-all flex justify-between items-center ${
                        selectedLoc?.id === loc.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center">
                          <h3 className="font-display text-lg flex items-center gap-2">
                            <MapPin className="text-muted-foreground h-4 w-4" />
                            {loc.name}
                          </h3>
                          <button
                            onClick={(e) => handleDeleteLocation(loc.id, e)}
                            className="text-muted-foreground hover:text-red-500 p-1 rounded-full hover:bg-secondary transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {typeLabel} · {loc.address || "Sin dirección"}
                        </p>
                        {loc.type === "Paddock" && loc.area_hectares && (
                          <p className="text-[11px] text-emerald-500 font-semibold">
                            Área: {loc.area_hectares} Ha · Pasto: {loc.grass_type || "Kikuyo"}
                          </p>
                        )}
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                            <span>Ocupación: {occupancy} / {loc.capacity || 1}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-1 bg-border/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 50 ? "bg-[var(--gold)]" : "bg-emerald-500"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Diagram / Paddock details */}
          <div className="lg:col-span-2">
            {selectedLoc ? (
              <div className="lux-card p-6 md:p-8 space-y-6 animate-fade-up">
                
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/60 pb-5">
                  <div>
                    <h2 className="font-display text-2xl flex items-center gap-2">
                      {selectedLoc.type === "Paddock" ? "Potrero: " : "Pesebreras en "} {selectedLoc.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedLoc.type === "Paddock" 
                        ? `Gestión de pasturas en rotación de ${selectedLoc.area_hectares || 0} hectáreas` 
                        : "Mapa visual de ocupación física y alojamiento de ejemplares"}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar Espacio
                    </button>
                    {selectedLoc.type !== "Paddock" && (
                      stalls.length >= (selectedLoc.capacity || 0) ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/50 text-muted-foreground text-xs font-semibold select-none border border-dashed border-border">
                          <Check className="h-3.5 w-3.5 text-emerald-500" /> Capacidad Completa
                        </span>
                      ) : (
                        <button
                          onClick={() => setStallOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Añadir Pesebrera
                        </button>
                      )
                    )}
                    <button
                      onClick={() => {
                        setAssignStallId(null);
                        setAssignStallNum(null);
                        setAssignOpen(true);
                      }}
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--primary),0.3)] cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Alojar Ejemplar
                    </button>
                  </div>
                </div>

                {/* Specific Paddock Stats */}
                {selectedLoc.type === "Paddock" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rotación de Pasturas</span>
                      <div className="font-display text-lg mt-1 text-emerald-500 font-bold">
                        {selectedLoc.rotation_status === "Grazing" ? "En Pastoreo (Activo)" : selectedLoc.rotation_status === "Resting" ? "En Descanso" : "Mantenimiento / Abono"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo de Pasto</span>
                      <div className="font-display text-lg mt-1 text-foreground">{selectedLoc.grass_type || "Kikuyo"}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Área Total</span>
                      <div className="font-display text-lg mt-1 text-foreground">{selectedLoc.area_hectares || 0} Hectáreas</div>
                    </div>
                  </div>
                )}

                {/* Stalls Grid / Paddock list */}
                {selectedLoc.type === "Paddock" ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Ejemplares alojados en manada:</h3>
                    {movements.filter(m => !m.end_date && m.new_location_id === selectedLoc.id).length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-xs border border-dashed rounded-xl">
                        Este potrero no tiene caballos pastando en este momento.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {movements.filter(m => !m.end_date && m.new_location_id === selectedLoc.id).map(m => (
                          <div key={m.id} className="p-3 bg-secondary/20 border border-border/40 rounded-xl flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {m.horse?.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">{m.horse?.name}</h4>
                                <p className="text-[10px] text-muted-foreground">Ingresó: {new Date(m.start_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleVacateStallClick(null, m.horse_id)}
                              className="text-xs text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded-md transition-colors"
                            >
                              Retirar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {stallsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : stalls.length === 0 ? (
                      <div className="p-10 text-center text-muted-foreground text-sm">
                        <Home className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Aún no se han añadido pesebreras a esta finca. Haz clic en "Añadir Pesebrera" para comenzar.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stalls.map((s) => {
                            const horse = s.horses;
                            const isQuarantined = quarantines.some(q => q.status === "Active" && q.horse_id === s.horse_id);

                            return (
                              <div
                                key={s.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDropToStall(e, s.id, s.stall_number)}
                                className={`p-5 rounded-2xl border flex items-center justify-between transition-colors duration-300 relative overflow-hidden ${
                                  s.availability
                                    ? "bg-secondary/25 border-border/40 hover:border-border"
                                    : isQuarantined
                                    ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                                    : "bg-primary/5 border-primary/20 hover:border-primary/40"
                                }`}
                              >
                                {isQuarantined && (
                                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-bl">
                                    Aislado
                                  </span>
                                )}
                                <div>
                                  <div className="font-display text-lg flex items-center gap-2">
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                    Pesebrera {s.stall_number}
                                  </div>
                                  {s.availability ? (
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Libre</span>
                                  ) : (
                                    <div 
                                      draggable={true}
                                      onDragStart={(e) => handleDragStart(e, s.horse_id || "")}
                                      className="mt-2 text-xs flex items-center gap-2 bg-background/80 border border-border/40 px-3 py-1.5 rounded-lg cursor-grab active:cursor-grabbing w-fit"
                                    >
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-semibold text-foreground">{horse?.name || `Ejemplar #${s.horse_id?.slice(0, 8)}`}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  {s.availability ? (
                                    <button
                                      onClick={() => {
                                        setAssignStallId(s.id);
                                        setAssignStallNum(s.stall_number);
                                        setAssignOpen(true);
                                      }}
                                      className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserCheck className="h-3.5 w-3.5" /> Alojar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleVacateStallClick(s.id, s.horse_id)}
                                      className="px-3.5 py-1.5 rounded-full border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <LogOut className="h-3.5 w-3.5" /> Desocupar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* DRAG & DROP VACATE ZONE */}
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDropToVacate}
                          className="border-2 border-dashed border-destructive/30 bg-destructive/5 rounded-2xl p-5 text-center transition-colors hover:bg-destructive/10 duration-200"
                        >
                          <LogOut className="h-6 w-6 text-destructive mx-auto mb-2" />
                          <p className="text-xs text-destructive font-semibold">Desocupar Pesebrera</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Arrastra un caballo aquí para retirarlo de la pesebrera.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="lux-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[350px]">
                <MapPin className="h-12 w-12 mb-3 text-muted-foreground/35" />
                <h4 className="font-display text-xl mb-1 text-foreground">Sin finca seleccionada</h4>
                <p className="text-sm max-w-sm">Selecciona una finca o espacio del panel lateral para mapear sus pesebreras, pasturas y ejemplares.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HISTORIAL DE TRASLADOS */}
      {activeSubTab === "movimientos" && (
        <div className="lux-card p-6 md:p-8 space-y-6 animate-fade-up">
          <h2 className="font-display text-2xl flex items-center gap-2"><ChevronRight className="h-5 w-5 text-primary" /> Registro Histórico de Movimientos</h2>
          {movsLoading ? (
            <div className="h-40 animate-pulse bg-secondary rounded-2xl" />
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">No se registran traslados históricos aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    <th className="pb-3">Ejemplar</th>
                    <th className="pb-3">Origen</th>
                    <th className="pb-3">Destino</th>
                    <th className="pb-3">Fecha Entrada</th>
                    <th className="pb-3">Fecha Salida</th>
                    <th className="pb-3">Responsable</th>
                    <th className="pb-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/10">
                      <td className="py-3 font-semibold text-foreground">{m.horse?.name || "Desconocido"}</td>
                      <td className="py-3 text-muted-foreground">{m.previous_location?.name || "—"}</td>
                      <td className="py-3 text-foreground font-medium">{m.new_location?.name || "—"}</td>
                      <td className="py-3 text-[12px] font-mono">{new Date(m.start_date).toLocaleDateString()} {new Date(m.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 text-[12px] font-mono">{m.end_date ? `${new Date(m.end_date).toLocaleDateString()} ${new Date(m.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[9px] font-semibold">Activo</span>}</td>
                      <td className="py-3 text-muted-foreground">{m.responsible?.name || "—"}</td>
                      <td className="py-3 text-xs italic">{m.reason || "Sin observaciones"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CONTROL DE CUARENTENAS */}
      {activeSubTab === "cuarentena" && (
        <div className="space-y-6 animate-fade-up">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-500" /> Aislamiento Clínico y Preventivo</h2>
            <button
              onClick={() => setQuarantineOpen(true)}
              className="rounded-full bg-red-500 text-white px-4 py-2 text-xs font-semibold hover:bg-red-600 transition-colors shadow-md"
            >
              Registrar Cuarentena
            </button>
          </div>

          {quarLoading ? (
            <div className="h-40 animate-pulse bg-secondary rounded-2xl" />
          ) : quarantines.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground text-sm">No se reportan cuarentenas registradas.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quarantines.map((q) => (
                <div 
                  key={q.id} 
                  className={`lux-card p-5 border flex flex-col justify-between ${
                    q.status === "Active" ? "border-red-500/30 bg-red-500/5" : "border-border/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-lg font-bold">{q.horse?.name || "Ejemplar"}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-semibold ${
                        q.status === "Active" ? "bg-red-500 text-white" : "bg-secondary text-muted-foreground"
                      }`}>
                        {q.status === "Active" ? "En Aislamiento" : "De Alta / Completada"}
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Motivo:</span> {q.reason === "New Intake" ? "Nuevo Ingreso" : q.reason === "Sickness" ? "Médico (Enfermedad)" : "Preventivo"}</p>
                      <p><span className="font-semibold text-foreground">Desde:</span> {new Date(q.start_date).toLocaleDateString()}</p>
                      {q.end_date && <p><span className="font-semibold text-foreground">Hasta:</span> {new Date(q.end_date).toLocaleDateString()}</p>}
                      <p><span className="font-semibold text-foreground">Responsable:</span> {q.responsible?.name || "No asignado"}</p>
                    </div>
                    {q.notes && (
                      <p className="bg-background/80 p-2.5 rounded-xl border border-border/40 text-xs italic mt-2">{q.notes}</p>
                    )}
                  </div>

                  {q.status === "Active" && (
                    <button
                      onClick={() => handleReleaseQuar(q.id, q.horse_id)}
                      className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Dar Alta Médica y Liberar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: LOGÍSTICA DE TRANSPORTES */}
      {activeSubTab === "transporte" && (
        <div className="space-y-6 animate-fade-up">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl flex items-center gap-2"><Truck className="h-5 w-5 text-sky-500" /> Logística y Control de Viajes</h2>
            <button
              onClick={() => setTransportOpen(true)}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-95 transition-all shadow-md"
            >
              Registrar Transporte
            </button>
          </div>

          {transLoading ? (
            <div className="h-40 animate-pulse bg-secondary rounded-2xl" />
          ) : transports.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground text-sm">No se reportan registros de viajes.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transports.map((t) => (
                <div key={t.id} className="lux-card p-5 border border-border/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-lg font-bold">{t.horse?.name || "Ejemplar"}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{new Date(t.date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <span className="font-semibold">{t.origin}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-semibold">{t.destination}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Costo:</span> ${t.cost ? Number(t.cost).toLocaleString("es-CO") : 0} COP</p>
                    <p><span className="font-semibold text-foreground">Empresa/Chofer:</span> {t.carrier_name || "Particular"}</p>
                    {t.reason && <p className="col-span-2"><span className="font-semibold text-foreground">Motivo:</span> {t.reason}</p>}
                  </div>

                  {t.notes && (
                    <p className="bg-background/80 p-2.5 rounded-xl border border-border/40 text-[11px] italic">{t.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: FERIAS Y COMPETENCIAS (CCC) */}
      {activeSubTab === "competencias" && (
        <div className="space-y-6 animate-fade-up">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl flex items-center gap-2"><Trophy className="h-5 w-5 text-[var(--gold)]" /> Registro de Ejemplares en Competencia</h2>
            <button
              onClick={() => setCompOpen(true)}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-95 transition-all shadow-md"
            >
              Registrar Salida a Feria
            </button>
          </div>

          {compLoading ? (
            <div className="h-40 animate-pulse bg-secondary rounded-2xl" />
          ) : competitions.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground text-sm">No se reportan ejemplares registrados en ferias.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitions.map((c) => (
                <div key={c.id} className="lux-card p-5 border border-border/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-lg font-bold">{c.horse?.name || "Ejemplar"}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-semibold ${
                      c.status === "Competing" ? "bg-amber-500 text-white" : c.status === "Completed" ? "bg-secondary text-muted-foreground" : "bg-primary text-white"
                    }`}>
                      {c.status === "Registered" ? "Registrado" : c.status === "Competing" ? "En Pista" : "Completado"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Feria / Evento:</span> {c.event_name}</p>
                    <p><span className="font-semibold text-foreground">Ubicación/Pista:</span> {c.location}</p>
                    <p><span className="font-semibold text-foreground">Fecha:</span> {new Date(c.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD LOCATION */}
      <Modal open={locOpen} onClose={() => setLocOpen(false)} title="Crear Espacio Físico">
        <form onSubmit={handleCreateLoc} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Finca / Criadero</label>
            <select 
              className="lux-select text-sm" 
              value={selectedFarmId} 
              onChange={(e) => {
                if (e.target.value === "new_farm") {
                  setNewFarmOpen(true);
                } else {
                  setSelectedFarmId(e.target.value);
                }
              }}
              required
            >
              <option value="" disabled>Seleccionar Finca...</option>
              {filteredFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
              <option value="new_farm">+ Registrar Nueva Finca...</option>
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Nombre del Espacio</label>
            <input required className="lux-input text-sm" value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="e.g. Pesebre Principal A" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Tipo de Espacio</label>
            <select className="lux-select text-sm" value={locType} onChange={(e) => setLocType(e.target.value)}>
              <option value="Stable">Pesebrera / Establo</option>
              <option value="Paddock">Potrero (Pastoreo)</option>
              <option value="Clinic">Clínica Veterinaria (Externa)</option>
              <option value="Competition">Ferias / Competencias</option>
            </select>
          </div>

          {locType === "Paddock" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="eyebrow block mb-1">Área (Hectáreas)</label>
                <input type="number" step="0.1" className="lux-input text-sm" value={locArea} onChange={(e) => setLocArea(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="eyebrow block mb-1">Tipo de Pasto</label>
                <input className="lux-input text-sm" value={locGrassType} onChange={(e) => setLocGrassType(e.target.value)} placeholder="e.g. Kikuyo, Estrella" />
              </div>
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Estado de Rotación</label>
                <select className="lux-select text-sm" value={locRotation} onChange={(e) => setLocRotation(e.target.value)}>
                  <option value="Grazing">En Pastoreo (Activo)</option>
                  <option value="Resting">En Descanso</option>
                  <option value="Maintenance">Mantenimiento / Abono</option>
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label className="eyebrow block mb-1">Capacidad Máxima (Ejemplares)</label>
            <input type="number" required min="1" className="lux-input text-sm" value={locCapacity} onChange={(e) => setLocCapacity(parseInt(e.target.value) || 1)} />
          </div>

          {locType === "Clinic" ? (
            <div>
              <label className="eyebrow block mb-1">Costo Diario de Hospedaje (COP)</label>
              <input type="number" className="lux-input text-sm" value={locDailyCost} onChange={(e) => setLocDailyCost(parseFloat(e.target.value) || 0)} placeholder="Tarifa diaria" />
            </div>
          ) : null}

          <div>
            <label className="eyebrow block mb-1">Dirección / Detalles</label>
            <input className="lux-input text-sm" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} placeholder="e.g. Km 5 Vía Rionegro" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Guardar Espacio
          </button>
        </form>
      </Modal>

      {/* MODAL 2: ADD STALL */}
      <Modal open={stallOpen} onClose={() => setStallOpen(false)} title="Añadir Pesebrera">
        <form onSubmit={handleCreateStall} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Número / Etiqueta de Pesebrera</label>
            <input required className="lux-input text-sm" value={stallNumber} onChange={(e) => setStallNumber(e.target.value)} placeholder="e.g. 101-B" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Guardar Pesebrera
          </button>
        </form>
      </Modal>

      {/* MODAL 3: ASSIGN HORSE */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={assignStallNum ? `Alojar Ejemplar en Pesebrera ${assignStallNum}` : "Alojar Ejemplar"}>
        <form onSubmit={handleAssignHorse} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Seleccionar Ejemplar</label>
            <select className="lux-select text-sm" value={assignHorseId} onChange={(e) => setAssignHorseId(e.target.value)} required>
              <option value="">Elegir ejemplar...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Responsable del Traslado</label>
            <select className="lux-select text-sm" value={assignResponsibleId} onChange={(e) => setAssignResponsibleId(e.target.value)}>
              <option value="">Elegir responsable...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Motivo / Razón del Traslado</label>
            <input className="lux-input text-sm" value={assignReason} onChange={(e) => setAssignReason(e.target.value)} placeholder="e.g. Preparación de Pista, Descanso en Potrero" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Asignar Alojamiento
          </button>
        </form>
      </Modal>

      {/* MODAL 4: QUARANTINE */}
      <Modal open={quarantineOpen} onClose={() => setQuarantineOpen(false)} title="Registrar Ingreso a Cuarentena">
        <form onSubmit={handleCreateQuar} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Seleccionar Ejemplar</label>
            <select className="lux-select text-sm" value={quarHorseId} onChange={(e) => setQuarHorseId(e.target.value)} required>
              <option value="">Elegir ejemplar...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Motivo de Aislamiento</label>
            <select className="lux-select text-sm" value={quarReason} onChange={(e) => setQuarReason(e.target.value)}>
              <option value="New Intake">Nuevo Ingreso al Criadero (Preventivo)</option>
              <option value="Sickness">Médico (Enfermedad / Lesión)</option>
              <option value="Preventive">Contacto Sospechoso</option>
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Responsable Clínico</label>
            <select className="lux-select text-sm" value={quarResponsibleId} onChange={(e) => setQuarResponsibleId(e.target.value)}>
              <option value="">Elegir profesional...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Notas / Observaciones Clínicas</label>
            <textarea className="lux-input text-sm min-h-[80px]" value={quarNotes} onChange={(e) => setQuarNotes(e.target.value)} placeholder="Describir síntomas o protocolo..." />
          </div>
          <button type="submit" className="w-full bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer">
            Iniciar Cuarentena
          </button>
        </form>
      </Modal>

      {/* MODAL 5: TRANSPORT */}
      <Modal open={transportOpen} onClose={() => setTransportOpen(false)} title="Registrar Viaje / Transporte">
        <form onSubmit={handleCreateTrans} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Seleccionar Ejemplar</label>
            <select className="lux-select text-sm" value={transHorseId} onChange={(e) => setTransHorseId(e.target.value)} required>
              <option value="">Elegir ejemplar...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1">Origen</label>
              <input required className="lux-input text-sm" value={transOrigin} onChange={(e) => setTransOrigin(e.target.value)} placeholder="e.g. Criadero Central" />
            </div>
            <div>
              <label className="eyebrow block mb-1">Destino</label>
              <input required className="lux-input text-sm" value={transDestination} onChange={(e) => setTransDestination(e.target.value)} placeholder="e.g. Club Campestre Pista Grado A" />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1">Costo de Transporte (COP)</label>
            <input type="number" className="lux-input text-sm" value={transCost} onChange={(e) => setTransCost(parseFloat(e.target.value) || 0)} placeholder="Ej. 150000" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Empresa / Transportador</label>
            <input className="lux-input text-sm" value={transCarrier} onChange={(e) => setTransCarrier(e.target.value)} placeholder="e.g. Trasté Equinos S.A.S." />
          </div>
          <div>
            <label className="eyebrow block mb-1">Motivo del Traslado</label>
            <input className="lux-input text-sm" value={transReason} onChange={(e) => setTransReason(e.target.value)} placeholder="e.g. Competencia Nacional, Chequeo Especializado" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Notas Adicionales</label>
            <textarea className="lux-input text-sm min-h-[80px]" value={transNotes} onChange={(e) => setTransNotes(e.target.value)} placeholder="e.g. Viajó en guacal acolchado..." />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Registrar Viaje
          </button>
        </form>
      </Modal>

      {/* MODAL 6: COMPETITION / SHOW */}
      <Modal open={compOpen} onClose={() => setCompOpen(false)} title="Registrar Salida a Competencia / Feria">
        <form onSubmit={handleCreateComp} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Seleccionar Ejemplar</label>
            <select className="lux-select text-sm" value={compHorseId} onChange={(e) => setCompHorseId(e.target.value)} required>
              <option value="">Elegir ejemplar...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Nombre del Evento / Feria</label>
            <input required className="lux-input text-sm" value={compEventName} onChange={(e) => setCompEventName(e.target.value)} placeholder="e.g. 62 Exposición Equina Grado A Rionegro" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Ubicación / Coliseo</label>
            <input required className="lux-input text-sm" value={compLocation} onChange={(e) => setCompLocation(e.target.value)} placeholder="e.g. Coliseo Aurelio Mejía, Medellín" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1">Fecha de Feria</label>
              <input type="date" required className="lux-input text-sm" value={compDate} onChange={(e) => setCompDate(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Estado de Registro</label>
              <select className="lux-select text-sm" value={compStatus} onChange={(e) => setCompStatus(e.target.value)}>
                <option value="Registered">Registrado / Inscrito</option>
                <option value="Competing">En Pista (Activo)</option>
                <option value="Completed">Completado</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Registrar Salida a Feria
          </button>
        </form>
      </Modal>

      {/* MODAL 7: ADD FARM */}
      <Modal open={newFarmOpen} onClose={() => setNewFarmOpen(false)} title="Registrar Nueva Finca / Criadero">
        <form onSubmit={handleCreateFarm} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Nombre de la Finca / Criadero</label>
            <input required className="lux-input text-sm" value={newFarmName} onChange={(e) => setNewFarmName(e.target.value)} placeholder="e.g. Criadero La Marqueza" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Ubicación / Ciudad</label>
            <input required className="lux-input text-sm" value={newFarmLocation} onChange={(e) => setNewFarmLocation(e.target.value)} placeholder="e.g. Tamesis - Antioquia" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Descripción / Detalles</label>
            <textarea className="lux-input text-sm min-h-[80px]" value={newFarmDesc} onChange={(e) => setNewFarmDesc(e.target.value)} placeholder="e.g. Finca principal dedicada al adiestramiento y cría de caballos de Paso Fino..." />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Guardar Finca / Criadero
          </button>
        </form>
      </Modal>

      {/* MODAL: EDIT LOCATION */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Espacio Físico">
        <form onSubmit={handleEditLoc} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Nombre del Espacio</label>
            <input required className="lux-input text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Pesebre Principal A" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Tipo de Espacio</label>
            <select className="lux-select text-sm" value={editType} onChange={(e) => setEditType(e.target.value)}>
              <option value="Stable">Pesebrera / Establo</option>
              <option value="Paddock">Potrero (Pastoreo)</option>
              <option value="Clinic">Clínica Veterinaria (Externa)</option>
              <option value="Competition">Ferias / Competencias</option>
            </select>
          </div>

          {editType === "Paddock" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="eyebrow block mb-1">Área (Hectáreas)</label>
                <input type="number" step="0.1" className="lux-input text-sm" value={editArea} onChange={(e) => setEditArea(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="eyebrow block mb-1">Tipo de Pasto</label>
                <input className="lux-input text-sm" value={editGrassType} onChange={(e) => setEditGrassType(e.target.value)} placeholder="e.g. Kikuyo, Estrella" />
              </div>
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Estado de Rotación</label>
                <select className="lux-select text-sm" value={editRotation} onChange={(e) => setEditRotation(e.target.value)}>
                  <option value="Grazing">En Pastoreo (Activo)</option>
                  <option value="Resting">En Descanso</option>
                  <option value="Maintenance">Mantenimiento / Abono</option>
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label className="eyebrow block mb-1">Capacidad Máxima (Ejemplares)</label>
            <input type="number" required min="1" className="lux-input text-sm" value={editCapacity} onChange={(e) => setEditCapacity(parseInt(e.target.value) || 1)} />
            {editType === "Stable" && (
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                Nota: Si aumentas la capacidad, se generarán automáticamente las pesebreras faltantes correlativas.
              </p>
            )}
          </div>

          {editType === "Clinic" ? (
            <div>
              <label className="eyebrow block mb-1">Costo Diario de Hospedaje (COP)</label>
              <input type="number" className="lux-input text-sm" value={editDailyCost} onChange={(e) => setEditDailyCost(parseFloat(e.target.value) || 0)} placeholder="Tarifa diaria" />
            </div>
          ) : null}

          <div>
            <label className="eyebrow block mb-1">Dirección / Detalles</label>
            <input className="lux-input text-sm" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="e.g. Km 5 Vía Rionegro" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity cursor-pointer">
            Actualizar Espacio
          </button>
        </form>
      </Modal>

    </AppShell>
  );
}

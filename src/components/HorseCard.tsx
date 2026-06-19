import { Link } from "@tanstack/react-router";
import { useDeleteHorse, type Horse } from "@/lib/hooks/useHorses";
import { ArrowUpRight, Camera, Trophy, PenLine, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddUpdateModal } from "./modals/AddUpdateModal";
import { AddCompetitionModal } from "./modals/AddCompetitionModal";
import { EditHorseModal } from "./modals/EditHorseModal";
import { toast } from "sonner";

export function HorseCard({ horse }: { horse: Horse }) {
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [updateType, setUpdateType] = useState<"media" | "note">("media");
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteHorse = useDeleteHorse();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${horse.name}?`)) {
      try {
        await deleteHorse.mutateAsync(horse.id);
        toast.success(`${horse.name} has been deleted successfully.`);
      } catch (err) {
        toast.error("Failed to delete horse.");
      }
    }
  };

  const location = horse.location?.split("·")[0]?.trim() || horse.location || "Location pending";

  return (
    <>
      <div className="group lux-card overflow-hidden relative">
        <Link
          to="/horses/$horseId"
          params={{ horseId: horse.slug || horse.id }}
          id={`horse-card-${horse.id}`}
          className="block"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-secondary/15">
            {horse.image_url ? (
              <img
                src={horse.image_url}
                alt={horse.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60 bg-muted/40">
                <Camera className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-xs font-semibold uppercase tracking-wider">No photo uploaded</span>
              </div>
            )}
            <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
            
            {/* Header controls: Status badge + Edit & Delete quick buttons */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase text-foreground">
                {horse.status || "Draft"}
              </span>
              
              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  id={`edit-horse-card-${horse.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-background/85 hover:bg-background backdrop-blur text-foreground shadow-sm transition-colors"
                  title="Edit Profile"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  id={`delete-horse-card-${horse.id}`}
                  onClick={handleDelete}
                  className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 hover:bg-destructive/25 text-destructive shadow-sm transition-colors border border-destructive/20"
                  title="Delete Horse"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
              <div className="eyebrow !text-primary-foreground/70">
                {horse.discipline || "Discipline pending"}
              </div>
              <h3 className="font-display text-3xl leading-none mt-1">{horse.name}</h3>
              <p className="mt-1.5 text-[13px] text-primary-foreground/85">
                {horse.breed || "Breed pending"} · {horse.age ?? "?"}y ·{" "}
                {horse.sex || "Sex pending"}
              </p>
            </div>
          </div>
          
          <div className="p-5">
            <div className="eyebrow">Latest</div>
            <p className="mt-1.5 text-[14px] leading-snug text-foreground/90">
              {horse.latest_achievement || "No recent updates yet."}
            </p>
            <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Trainer · {horse.trainer || "Unassigned"}</span>
              <span>{location}</span>
            </div>
            
            {/* Direct visual cue to Profile & Pedigree tree */}
            <div className="mt-3.5 pt-3 border-t border-border/40 flex items-center justify-between text-[12px] font-semibold text-primary group-hover:text-primary/80 transition-colors">
              <span>View Profile & Pedigree Tree</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </Link>

        {/* Hover quick-actions for Photo, Result, and Note */}
        <div className="absolute bottom-[122px] left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
          <button
            id={`quick-photo-${horse.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUpdateType("media");
              setAddUpdateOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors shadow-sm"
          >
            <Camera className="h-3.5 w-3.5" /> Photo
          </button>
          <button
            id={`quick-comp-${horse.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAddCompOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors shadow-sm"
          >
            <Trophy className="h-3.5 w-3.5" /> Result
          </button>
          <button
            id={`quick-note-${horse.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUpdateType("note");
              setAddUpdateOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors shadow-sm"
          >
            <PenLine className="h-3.5 w-3.5" /> Note
          </button>
        </div>
      </div>

      <AddUpdateModal
        open={addUpdateOpen}
        onOpenChange={setAddUpdateOpen}
        defaultHorseId={horse.id}
        defaultType={updateType}
      />

      <AddCompetitionModal
        open={addCompOpen}
        onOpenChange={setAddCompOpen}
        defaultHorseId={horse.id}
      />

      <EditHorseModal
        open={editOpen}
        onOpenChange={setEditOpen}
        horse={horse}
      />
    </>
  );
}

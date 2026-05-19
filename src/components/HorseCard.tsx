import { Link } from "@tanstack/react-router";
import type { Horse } from "@/lib/data";
import { ArrowUpRight, Camera, Trophy, PenLine } from "lucide-react";
import { useState } from "react";
import { AddUpdateModal } from "./modals/AddUpdateModal";

export function HorseCard({ horse }: { horse: Horse }) {
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [addCompOpen, setAddCompOpen] = useState(false);

  return (
    <>
      <div className="group lux-card overflow-hidden relative">
        <Link
          to="/horses/$horseId"
          params={{ horseId: horse.id }}
          id={`horse-card-${horse.id}`}
          className="block"
        >
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={horse.image}
              alt={horse.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase text-foreground">
                {horse.status}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
              <div className="eyebrow !text-primary-foreground/70">{horse.discipline}</div>
              <h3 className="font-display text-3xl leading-none mt-1">{horse.name}</h3>
              <p className="mt-1.5 text-[13px] text-primary-foreground/85">
                {horse.breed} · {horse.age}y · {horse.sex}
              </p>
            </div>
          </div>
          <div className="p-5">
            <div className="eyebrow">Latest</div>
            <p className="mt-1.5 text-[14px] leading-snug">{horse.latestAchievement}</p>
            <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Trainer · {horse.trainer}</span>
              <span>{horse.location.split("·")[0].trim()}</span>
            </div>
          </div>
        </Link>

        {/* Quick action overlay — appears on hover */}
        <div className="absolute bottom-[88px] left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <button
            id={`quick-photo-${horse.id}`}
            onClick={(e) => { e.preventDefault(); setAddUpdateOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors"
          >
            <Camera className="h-3.5 w-3.5" /> Photo
          </button>
          <button
            id={`quick-comp-${horse.id}`}
            onClick={(e) => { e.preventDefault(); setAddCompOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" /> Result
          </button>
          <button
            id={`quick-note-${horse.id}`}
            onClick={(e) => { e.preventDefault(); setAddUpdateOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-background/90 backdrop-blur py-2 text-[12px] font-medium text-foreground hover:bg-background transition-colors"
          >
            <PenLine className="h-3.5 w-3.5" /> Note
          </button>
        </div>
      </div>

      <AddUpdateModal
        open={addUpdateOpen}
        onClose={() => setAddUpdateOpen(false)}
        defaultHorseId={horse.id}
      />
      <AddUpdateModal
        open={addCompOpen}
        onClose={() => setAddCompOpen(false)}
        defaultHorseId={horse.id}
        defaultType="competition"
      />
    </>
  );
}

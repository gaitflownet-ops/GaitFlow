import { Link } from "@tanstack/react-router";
import type { Horse } from "@/lib/data";
import { ArrowUpRight } from "lucide-react";

export function HorseCard({ horse }: { horse: Horse }) {
  return (
    <Link
      to="/horses/$horseId"
      params={{ horseId: horse.id }}
      className="group lux-card overflow-hidden block"
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
  );
}

import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import type { Horse } from "@/lib/hooks/useHorses";

type Props = {
  horse?: Horse | null;
  allHorses?: Horse[];
  bloodline?: string;
  onEditClick?: () => void;
};

export function PedigreeTree({ horse, allHorses = [], bloodline, onEditClick }: Props) {
  const parts = (bloodline || "Unknown × Unknown").split(/[×xX]/);
  const activeHorse = horse || ({
    id: "dummy",
    name: "Subject",
    breed: "Unknown",
    sex: "Unknown",
    color: "Unknown",
    sire_id: null,
    dam_id: null,
    sire_name: parts[0]?.trim() || "Unknown",
    dam_name: parts[1]?.trim() || "Unknown",
  } as unknown as Horse);

  // Helper to resolve sire and dam recursively or by string name
  const resolveHorse = (id: string | null, name: string | null) => {
    if (id) {
      const found = allHorses.find((h) => h.id === id);
      if (found) return { horse: found, name: found.name, isInternal: true };
    }
    return { horse: null, name: name || "Unknown", isInternal: false };
  };

  // Generation 2 (Parents)
  const sireData = resolveHorse(activeHorse.sire_id, activeHorse.sire_name);
  const damData = resolveHorse(activeHorse.dam_id, activeHorse.dam_name);

  // Generation 3 (Grandparents)
  // Paternal Grandparents
  const paternalGrandSire = sireData.horse
    ? resolveHorse(sireData.horse.sire_id, sireData.horse.sire_name)
    : { horse: null, name: "Unknown", isInternal: false };
  const paternalGrandDam = sireData.horse
    ? resolveHorse(sireData.horse.dam_id, sireData.horse.dam_name)
    : { horse: null, name: "Unknown", isInternal: false };

  // Maternal Grandparents
  const maternalGrandSire = damData.horse
    ? resolveHorse(damData.horse.sire_id, damData.horse.sire_name)
    : { horse: null, name: "Unknown", isInternal: false };
  const maternalGrandDam = damData.horse
    ? resolveHorse(damData.horse.dam_id, damData.horse.dam_name)
    : { horse: null, name: "Unknown", isInternal: false };

  // Sub-component to render an ancestor card
  const AncestorCard = ({
    data,
    relation,
  }: {
    data: { horse: Horse | null; name: string; isInternal: boolean };
    relation: string;
  }) => {
    const isUnknown = data.name === "Unknown";

    const content = (
      <div
        onClick={() => {
          if (!data.isInternal && onEditClick) {
            onEditClick();
          }
        }}
        className={`relative flex flex-col justify-between h-full rounded-2xl border p-3.5 transition-all duration-300 ${
          isUnknown
            ? `bg-secondary/25 border-dashed border-border/50 text-muted-foreground/60 ${onEditClick ? "hover:border-primary/45 hover:bg-secondary/35 cursor-pointer group" : ""}`
            : data.isInternal
              ? "bg-card/75 border-primary/20 shadow-sm hover:shadow-md hover:border-primary/50 text-foreground group cursor-pointer"
              : `bg-card/45 border-border/40 text-foreground ${onEditClick ? "hover:border-primary/45 hover:bg-secondary/15 cursor-pointer group" : ""}`
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
              {relation}
            </span>
            {data.isInternal && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-500 border border-emerald-500/15">
                <ShieldCheck className="h-3 w-3" /> Registered
              </span>
            )}
          </div>
          <h5 className={`font-display text-[15px] mt-1.5 ${isUnknown ? "italic text-muted-foreground/40" : "font-medium"}`}>
            {data.name}
          </h5>
          {!isUnknown && data.horse && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.horse.breed} · {data.horse.color}
            </p>
          )}
        </div>

        {data.isInternal && data.horse ? (
          <div className="mt-3 flex items-center justify-end text-[10px] font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
            <span>View profile</span>
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        ) : (
          onEditClick && (
            <div className="mt-3 flex items-center justify-end text-[9px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <span>{isUnknown ? "Add parent info" : "Link register"}</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          )
        )}
      </div>
    );

    if (data.isInternal && data.horse) {
      return (
        <Link
          to="/horses/$horseId"
          params={{ horseId: data.horse.slug || data.horse.id }}
          className="block h-full"
        >
          {content}
        </Link>
      );
    }

    return <div className="h-full">{content}</div>;
  };

  return (
    <div className="w-full select-none overflow-x-auto pb-4">
      <div className="min-w-[768px] grid grid-cols-3 gap-x-8 gap-y-4 relative">
        {/* Generation 3: Grandparents */}
        <div className="flex flex-col gap-4 justify-between h-[360px]">
          <AncestorCard data={paternalGrandSire} relation="Paternal Grand-Sire" />
          <AncestorCard data={paternalGrandDam} relation="Paternal Grand-Dam" />
          <AncestorCard data={maternalGrandSire} relation="Maternal Grand-Sire" />
          <AncestorCard data={maternalGrandDam} relation="Maternal Grand-Dam" />
        </div>

        {/* Generation 2: Parents */}
        <div className="flex flex-col gap-8 justify-around h-[360px]">
          <div className="h-[140px]">
            <AncestorCard data={sireData} relation="Sire (Father)" />
          </div>
          <div className="h-[140px]">
            <AncestorCard data={damData} relation="Dam (Mother)" />
          </div>
        </div>

        {/* Generation 1: Target Horse */}
        <div className="flex flex-col justify-center h-[360px]">
          <div className="relative rounded-2xl bg-gradient-to-br from-[oklch(0.25_0.03_140)] to-[oklch(0.20_0.02_70)] text-primary-foreground border-transparent p-5 shadow-lg flex flex-col justify-between h-[180px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/60 font-bold">
                  Subject
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--gold)] font-medium">
                  <Sparkles className="h-3.5 w-3.5 fill-current" /> Active
                </span>
              </div>
              <h4 className="font-display text-2xl mt-2 leading-tight">{activeHorse.name}</h4>
              <p className="text-[12px] text-primary-foreground/75 mt-1">
                {activeHorse.breed} · {activeHorse.sex}
              </p>
            </div>
            <div className="text-[11px] text-primary-foreground/60">
              {activeHorse.id === "dummy" ? "Public Directory Node" : `ID: ${activeHorse.id.slice(0, 8)}...`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

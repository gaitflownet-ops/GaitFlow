type NodeProps = {
  name: string;
  type: "sire" | "dam";
  details?: string;
};

function PedigreeNode({ name, type, details }: NodeProps) {
  return (
    <div
      className="lux-card p-3 md:p-4 text-center border-l-2 relative bg-background/50 backdrop-blur-sm"
      style={{ borderLeftColor: type === "sire" ? "var(--leather)" : "var(--bronze)" }}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{type}</div>
      <div className="font-display text-lg">{name}</div>
      {details && <div className="text-xs text-muted-foreground mt-1">{details}</div>}
    </div>
  );
}

export function PedigreeTree({ bloodline }: { bloodline: string }) {
  // Mock parser for the simple "Sire × Dam" format we currently have in data.ts
  const parts = bloodline.split("×").map((p) => p.trim());
  const sire = parts[0] || "Unknown";
  const dam = parts[1] || "Unknown";

  return (
    <div className="relative pt-8">
      {/* Subject */}
      <div className="flex justify-center mb-8 relative">
        <div className="lux-card px-6 py-4 bg-secondary text-center z-10 w-64 border border-[var(--gold)]/20">
          <div className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-1">
            Subject
          </div>
          <div className="font-display text-xl">Current Horse</div>
        </div>
        <div className="absolute top-full left-1/2 w-px h-8 bg-border" />
      </div>

      {/* Parents */}
      <div className="grid grid-cols-2 gap-4 relative before:absolute before:top-0 before:left-[25%] before:right-[25%] before:h-px before:bg-border">
        <div className="relative pt-6">
          <div className="absolute top-0 left-1/2 w-px h-6 bg-border" />
          <PedigreeNode name={sire} type="sire" details="Approved Stallion" />
          {/* Grandparents Sire side (Mock) */}
          <div className="grid grid-cols-2 gap-2 mt-4 relative pt-4 before:absolute before:top-0 before:left-[25%] before:right-[25%] before:h-px before:bg-border">
            <div className="relative">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-border -mt-4" />
              <PedigreeNode name={`${sire}'s Sire`} type="sire" />
            </div>
            <div className="relative">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-border -mt-4" />
              <PedigreeNode name={`${sire}'s Dam`} type="dam" />
            </div>
          </div>
        </div>

        <div className="relative pt-6">
          <div className="absolute top-0 left-1/2 w-px h-6 bg-border" />
          <PedigreeNode name={dam} type="dam" details="Premium Mare" />
          {/* Grandparents Dam side (Mock) */}
          <div className="grid grid-cols-2 gap-2 mt-4 relative pt-4 before:absolute before:top-0 before:left-[25%] before:right-[25%] before:h-px before:bg-border">
            <div className="relative">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-border -mt-4" />
              <PedigreeNode name={`${dam}'s Sire`} type="sire" />
            </div>
            <div className="relative">
              <div className="absolute top-0 left-1/2 w-px h-4 bg-border -mt-4" />
              <PedigreeNode name={`${dam}'s Dam`} type="dam" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

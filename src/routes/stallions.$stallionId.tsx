import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useHorse } from "@/lib/hooks/useHorses";
import { ArrowLeft, Flame, Trophy, HeartPulse, Loader2 } from "lucide-react";
import { InquiryModal } from "@/components/modals/InquiryModal";
import { useState } from "react";
import { PedigreeTree } from "@/components/PedigreeTree";

export const Route = createFileRoute("/stallions/$stallionId")({
  component: StallionProfile,
});

function StallionProfile() {
  const { stallionId } = Route.useParams();
  const { data: horse, isLoading } = useHorse(stallionId);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  if (isLoading) {
    return (
      <PublicShell>
        <div className="py-32 flex justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PublicShell>
    );
  }

  if (!horse || horse.sex !== "Stallion") {
    return (
      <PublicShell>
        <div className="py-32 text-center text-muted-foreground">Stallion not found.</div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="relative h-[60vh] min-h-[500px] w-full bg-black">
        <img
          src={
            horse.image_url ||
            "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
          }
          alt={horse.name}
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute top-8 left-6 md:left-12 z-20">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="absolute bottom-12 left-6 right-6 md:left-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-8">
          <div>
            <div className="flex items-center gap-2 text-[var(--gold)] text-[10px] tracking-widest uppercase font-bold mb-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-3 py-1 rounded-full w-max backdrop-blur-md">
              <Flame className="h-3.5 w-3.5" /> Elite Sire
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white mb-2">{horse.name}</h1>
            <p className="text-xl text-white/80 font-light">{horse.bloodline}</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="font-display text-3xl mb-6">Breeding Overview</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p className="text-lg">
                {horse.story ||
                  `${horse.name} is a spectacular ${horse.age}-year-old ${horse.breed} stallion offering breeders a rare opportunity to access the legendary ${(horse.bloodline || "").split("×")[0]?.trim()} bloodline.`}
              </p>
              <p>
                Known for passing on his extraordinary scope, uphill balance, and exceptional
                rideability, his first crop of foals are already showing immense promise on the
                circuit.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl mb-8 text-center">Pedigree</h2>
            <PedigreeTree bloodline={horse.bloodline || "Unknown × Unknown"} />
          </section>
        </div>

        <div>
          <div className="lux-card p-6 md:p-8 sticky top-24 border-[var(--gold)]/20 bg-secondary/50">
            <h3 className="font-display text-2xl mb-6">Breeding Terms</h3>

            <div className="space-y-4 text-sm mb-8">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Stud Fee</span>
                <span className="text-foreground font-medium">$5,000 USD</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Availability</span>
                <span className="text-foreground">Fresh / Frozen</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Live Foal Guarantee</span>
                <span className="text-foreground">Yes</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">CEM / EVA</span>
                <span className="text-foreground">Negative</span>
              </div>
            </div>

            <button
              onClick={() => setInquiryOpen(true)}
              className="w-full py-3.5 rounded-full bg-[var(--gold)] text-black font-medium text-sm hover:opacity-90 transition-colors uppercase tracking-widest flex justify-center items-center gap-2"
            >
              Request Contract
            </button>
          </div>
        </div>
      </div>

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        type="breeding"
        subjectName={horse.name}
      />
    </PublicShell>
  );
}

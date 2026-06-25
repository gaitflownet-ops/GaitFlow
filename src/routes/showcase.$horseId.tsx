import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useHorse } from "@/lib/hooks/useHorses";
import { useCompetitions } from "@/lib/hooks/useCompetitions";
import { useListings } from "@/lib/hooks/useMarketplace";
import { ArrowLeft, Trophy, Video, Calendar, ArrowUpRight, Flame, Loader2 } from "lucide-react";
import { ReputationBadges } from "@/components/ReputationBadges";
import { PedigreeTree } from "@/components/PedigreeTree";
import { useState } from "react";
import { InquiryModal } from "@/components/modals/InquiryModal";

export const Route = createFileRoute("/showcase/$horseId")({
  component: HorseShowcase,
});

function HorseShowcase() {
  const { horseId } = Route.useParams();
  const { data: horse, isLoading: isHorseLoading } = useHorse(horseId);
  const { data: competitions = [] } = useCompetitions(horse?.id);
  const { data: listings = [] } = useListings("horse");
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const listing = listings.find((l) => l.horse_id === horse?.id);
  const listingId = listing?.id || null;

  if (isHorseLoading) {
    return (
      <PublicShell>
        <div className="py-32 flex justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PublicShell>
    );
  }

  if (!horse) {
    return (
      <PublicShell>
        <div className="py-32 text-center text-muted-foreground">
          Horse not found in public directory.
        </div>
      </PublicShell>
    );
  }

  const horseCompetitions = competitions.filter((c) => c.horse_id === horse.id);

  return (
    <PublicShell>
      {/* Cinematic Hero */}
      <section className="relative h-[80vh] min-h-[600px] w-full bg-black">
        <img
          src={
            horse.image_url ||
            "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
          }
          alt={horse.name}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute top-8 left-6 md:left-12 z-20">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12 z-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="text-white max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              {horse.sale_status && horse.sale_status !== "Not for Sale" && (
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] tracking-widest uppercase font-bold">
                  {horse.sale_status}
                </span>
              )}
              <span className="text-[12px] uppercase tracking-widest text-white/80">
                {horse.discipline}
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-2">{horse.name}</h1>
            <p className="text-lg md:text-xl text-white/80 font-light mb-6">
              {horse.age}y · {horse.sex} · {horse.breed} · {horse.color}
            </p>

            <ReputationBadges badges={horse.badges || []} />
          </div>

          <div className="bg-background/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl min-w-[280px]">
            <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1">
              Asking Price
            </div>
            <div className="font-display text-3xl text-white mb-6">
              {horse.price || "Contact for Price"}
            </div>

            <button
              onClick={() => setInquiryOpen(true)}
              className="w-full py-3.5 rounded-full bg-[var(--gold)] text-black font-medium text-sm hover:bg-[var(--gold)]/90 transition-colors uppercase tracking-widest flex justify-center items-center gap-2"
            >
              Inquire Now <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-20">
          <section>
            <h2 className="font-display text-3xl mb-6">About {horse.name}</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p className="text-lg">
                {horse.story ||
                  `${horse.name} is a spectacular ${horse.age}-year-old ${horse.breed} excelling in ${horse.discipline}. With an exceptional pedigree tracing back to ${(horse.bloodline || "").split("×")[0]?.trim() || "renowned lines"}, this horse represents the pinnacle of modern sport horse breeding.`}
              </p>
              <p>
                Known for a temperament rating of {horse.temperament}/10,{" "}
                {horse.barn_name || horse.name} is both highly competitive and remarkably
                level-headed, making them an ideal partner for the ambitious rider. Currently
                stabled at {horse.location} under the expert guidance of {horse.trainer}.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl mb-8 text-center">Pedigree</h2>
            <PedigreeTree bloodline={horse.bloodline || "Unknown × Unknown"} />
          </section>

          <section>
            <h2 className="font-display text-3xl mb-6">Key Achievements</h2>
            <div className="space-y-4">
              {horseCompetitions.slice(0, 4).map((comp) => (
                <div key={comp.id} className="lux-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{comp.event}</div>
                      <div className="text-sm text-muted-foreground">
                        {comp.category} · {comp.placement}
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm">{comp.date}</div>
                    <div className="text-xs text-muted-foreground">{comp.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="lux-card p-6">
            <h3 className="font-display text-xl mb-4">Quick Facts</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Location</span>
                <span className="text-foreground text-right">{horse.location}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Trainer</span>
                <span className="text-foreground">{horse.trainer}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Height</span>
                <span className="text-foreground">16.2 hh</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Temperament</span>
                <span className="text-foreground">{horse.temperament} / 10</span>
              </div>
            </div>
          </div>

          <div className="lux-card p-6 bg-secondary">
            <h3 className="font-display text-xl mb-2">Represented By</h3>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center font-display text-xl">
                {horse.farm_id === "pinewood-farm" ? "PWF" : "LOS"}
              </div>
              <div>
                <div className="font-medium">
                  {horse.farm_id === "pinewood-farm" ? "Pinewood Farm" : "Live Oak Stables"}
                </div>
                <Link
                  to="/farms/$farmId"
                  params={{ farmId: horse.farm_id || "live-oak-stables" }}
                  className="text-[11px] uppercase tracking-widest text-primary hover:underline"
                >
                  View Facility
                </Link>
              </div>
            </div>
          </div>

          {horse.sex === "Stallion" && (
            <div className="lux-card p-6 border-[var(--gold)]/30 bg-[var(--gold)]/5">
              <div className="flex items-center gap-2 text-[var(--gold)] mb-2">
                <Flame className="h-4 w-4" />
                <h3 className="font-display text-xl">Available for Breeding</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Semen available globally. Contact for stud fee and breeding contract details.
              </p>
              <button
                onClick={() => setInquiryOpen(true)}
                className="w-full py-2.5 rounded-full border border-[var(--gold)] text-[var(--gold)] text-xs uppercase tracking-widest font-medium hover:bg-[var(--gold)]/10 transition-colors"
              >
                Breeding Inquiry
              </button>
            </div>
          )}
        </div>
      </div>

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        type={horse.sex === "Stallion" ? "breeding" : "sale"}
        subjectName={horse.name}
        listingId={listingId}
      />
    </PublicShell>
  );
}

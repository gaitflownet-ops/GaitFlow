import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useFarm } from "@/lib/hooks/useFarms";
import { useHorses } from "@/lib/hooks/useHorses";
import { MapPin, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";
import { InquiryModal } from "@/components/modals/InquiryModal";
import { useState } from "react";

export const Route = createFileRoute("/farms/$farmId")({
  component: FarmProfile,
});

function FarmProfile() {
  const { farmId } = Route.useParams();
  const { data: farm, isLoading: isFarmLoading } = useFarm(farmId);
  const { data: horses = [] } = useHorses();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  if (isFarmLoading) {
    return (
      <PublicShell>
        <div className="py-32 flex justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PublicShell>
    );
  }

  if (!farm) {
    return (
      <PublicShell>
        <div className="py-32 text-center text-muted-foreground">Farm not found in directory.</div>
      </PublicShell>
    );
  }

  const farmHorses = horses.filter((h) => h.farm_id === farm.id);

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full bg-black">
        <img
          src={
            farm.cover_image_url ||
            "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80"
          }
          alt={farm.name}
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute bottom-12 left-6 right-6 md:left-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-8">
          <div className="h-32 w-32 rounded-3xl bg-background border border-border flex items-center justify-center font-display text-5xl shrink-0 shadow-2xl">
            {farm.logo_initials}
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              <MapPin className="h-4 w-4" /> {farm.location}
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white mb-4">{farm.name}</h1>
            <div className="flex flex-wrap gap-2">
              {(farm.badges || []).map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/30 text-[var(--gold)] text-[10px] tracking-widest uppercase font-medium backdrop-blur-md"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="font-display text-3xl mb-6">About the Facility</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{farm.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {(farm.specialties || []).map((spec) => (
                <span
                  key={spec}
                  className="px-4 py-2 bg-secondary rounded-lg text-sm text-foreground border border-border"
                >
                  {spec}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl">Current Collection</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {farmHorses.map((horse) => (
                <Link
                  key={horse.id}
                  to="/showcase/$horseId"
                  params={{ horseId: horse.id }}
                  className="group rounded-2xl overflow-hidden lux-card border border-border hover:border-primary/50 transition-colors block"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={
                        horse.image_url ||
                        "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
                      }
                      alt={horse.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      {horse.discipline}
                    </div>
                    <h3 className="font-display text-2xl">{horse.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <div className="lux-card p-6 md:p-8 sticky top-24">
            <h3 className="font-display text-2xl mb-2">Connect</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Schedule a visit, inquire about a horse, or discuss training opportunities.
            </p>

            <button
              onClick={() => setInquiryOpen(true)}
              className="w-full py-3.5 rounded-full bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors uppercase tracking-widest flex justify-center items-center gap-2 mb-4"
            >
              Contact Stable
            </button>

            <div className="pt-6 mt-6 border-t border-border space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <a href="#" className="hover:text-primary transition-colors">
                  info@{farm.id}.com
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <a href="#" className="hover:text-primary transition-colors">
                  +1 (555) 000-0000
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        type="general"
        subjectName={farm.name}
      />
    </PublicShell>
  );
}

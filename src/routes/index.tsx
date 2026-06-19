import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { ArrowRight, Star, ArrowUpRight, Award, Flame, MessageSquareQuote } from "lucide-react";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

const images = {
  hero: "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80",
  chestnut: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
  black: "https://images.unsplash.com/photo-1534005828468-b7fb473dcc08?auto=format&fit=crop&q=80",
  farm: "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80",
  stable: "https://images.unsplash.com/photo-1621245842828-569b3f46f483?auto=format&fit=crop&q=80",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GaitFlow — The Premium Equine Ecosystem" },
      {
        name: "description",
        content:
          "Discover elite horses, premier genetics, and top-tier stables. The digital infrastructure for the modern premium equine industry.",
      },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <PublicShell>
      {/* Cinematic Hero */}
      <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={images.hero}
            alt="Elite horse"
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] text-[11px] font-medium tracking-widest uppercase mb-6 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Premium Ecosystem</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-foreground tracking-tight">
              Invest in <br />
              <span className="gold-text italic pr-4">Excellence.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed font-light">
              The digital infrastructure for the modern premium equine industry. Discover elite
              horses, premier genetics, and top-tier stables.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/marketplace/sales"
                className="inline-flex h-14 items-center justify-center rounded-full bg-foreground px-8 text-[13px] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95 uppercase tracking-widest gap-2"
              >
                Explore Sales <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/marketplace/stallions"
                className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-background/50 backdrop-blur-md px-8 text-[13px] font-medium transition-all hover:bg-secondary hover:border-border/80 uppercase tracking-widest"
              >
                View Stallions
              </Link>
            </div>
          </div>

          <div className="hidden md:flex justify-end">
            <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden lux-card p-1 rotate-3 hover:rotate-0 transition-transform duration-500 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--gold)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <img
                src={images.chestnut}
                alt="Featured"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="backdrop-blur-md bg-background/80 border border-white/10 p-4 rounded-xl">
                  <div className="text-[10px] text-[var(--gold)] uppercase tracking-widest mb-1">
                    Featured Sale
                  </div>
                  <div className="font-display text-xl">Ember Rose</div>
                  <div className="text-xs text-muted-foreground mt-1">Dressage · 7y · Mare</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker / Brands */}
      <section className="border-y border-border/50 bg-secondary/30 py-6 overflow-hidden">
        <div className="flex gap-12 items-center justify-center opacity-50 grayscale flex-wrap px-6">
          <div className="font-display text-xl tracking-widest uppercase">Live Oak Stables</div>
          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
          <div className="font-display text-xl tracking-widest uppercase">Pinewood Farm</div>
          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
          <div className="font-display text-xl tracking-widest uppercase">Wellington Elite</div>
          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
          <div className="font-display text-xl tracking-widest uppercase">Ocala Genetics</div>
        </div>
      </section>

      {/* Discovery Sections */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-32">
        {/* Elite Stallions Preview */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-[var(--gold)] text-[11px] uppercase tracking-widest mb-3">
                <Award className="h-4 w-4" /> Proven Bloodlines
              </div>
              <h2 className="font-display text-4xl md:text-5xl">Elite Stallions</h2>
            </div>
            <Link
              to="/marketplace/stallions"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
            >
              View Catalog{" "}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Stallion Card */}
            <div className="group rounded-2xl overflow-hidden lux-card cursor-pointer">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img
                  src={images.hero}
                  alt="Stallion"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-[var(--gold)]" /> Hot Sire
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className="font-display text-3xl mb-1">Northern Flame</h3>
                  <p className="text-white/80 text-sm">Tapit × Storm Cat</p>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/60">
                        Stud Fee
                      </div>
                      <div className="font-medium">$5,000</div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusive Genetics Preview */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-secondary border border-border/50 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--gold)]/10 via-transparent to-transparent pointer-events-none" />

          <div className="flex-1 space-y-6 relative z-10">
            <div className="inline-block px-3 py-1 rounded-full bg-background border border-border text-xs tracking-widest uppercase">
              The Future
            </div>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.1]">
              Exclusive
              <br />
              Genetics & Embryos
            </h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Access the most sought-after bloodlines in the world. Secure future champions before
              they even touch the ground.
            </p>
            <Link
              to="/marketplace/genetics"
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-xs font-medium text-background transition-all hover:bg-foreground/90 uppercase tracking-widest mt-4"
            >
              Explore Genetics
            </Link>
          </div>

          <div className="flex-1 w-full relative z-10">
            <div className="aspect-video rounded-2xl overflow-hidden lux-card p-2">
              <img
                src={images.farm}
                alt="Farm"
                className="w-full h-full object-cover rounded-xl opacity-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--gold)] text-[11px] uppercase tracking-widest mb-3">
                <MessageSquareQuote className="h-4 w-4" /> Success Stories
              </div>
              <h2 className="font-display text-4xl md:text-5xl">
                What Ocala's Best
                <br />
                <span className="gold-text italic">Are Saying</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg text-lg font-light">
                From breeding operations and show stables to bloodstock traders — real results from
                the equestrian professionals who run on GaitFlow.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2 text-right">
              <div className="text-5xl font-display gold-text">60%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">
                avg. reduction in
                <br />
                administrative time
              </div>
            </div>
          </div>
        </div>
        <StaggerTestimonials />
      </section>
    </PublicShell>
  );
}

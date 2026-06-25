import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useListings } from "@/lib/hooks/useMarketplace";
import { ArrowUpRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/marketplace/genetics")({
  component: GeneticsMarketplace,
});

function GeneticsMarketplace() {
  // Query all listings and filter for non-horse genetic listings (embryo, semen, breeding service)
  const { data: listings = [], isLoading } = useListings();
  const geneticListings = listings.filter((l) => l.type !== "horse");

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] tracking-widest uppercase mb-4">
            Investments
          </div>
          <h1 className="font-display text-5xl md:text-6xl">Embryos & Genetics</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Secure the future. Access exclusive genetic pairings from proven, world-class bloodlines.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : geneticListings.length === 0 ? (
          <div className="lux-card p-12 text-center text-muted-foreground">
            No genetic listings available.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {geneticListings.map((l) => {
              const horse = l.horses;
              const sireName = horse?.bloodline?.split(" x ")[0] || "Proven Sire";
              const damName = horse?.bloodline?.split(" x ")[1] || "Proven Dam";
              const title = l.title || `${sireName} x ${damName}`;
              const imageUrl = l.type === "semen"
                ? "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"
                : "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80";

              return (
                <div
                  key={l.id}
                  className="group rounded-3xl overflow-hidden lux-card border border-border flex flex-col md:flex-row"
                >
                  <div className="w-full md:w-5/12 relative overflow-hidden bg-secondary">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover mix-blend-luminosity opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:mix-blend-normal group-hover:opacity-100"
                    />
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium border border-white/10 text-white">
                      {l.type}
                    </div>
                  </div>
                  <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display text-2xl mb-4 truncate">
                        {title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {l.description || "Premium genetic material of elite origin stabled at verified facilities."}
                      </p>

                      <div className="space-y-2">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          Origin Details
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Seller: {l.profiles?.name || "Verified Farm"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                          Status: {l.status}
                        </div>
                        <div className="font-display text-xl">
                          {l.price ? `$${Number(l.price).toLocaleString()}` : "Price on Request"}
                        </div>
                      </div>
                      <Link
                        to="/showcase/$horseId"
                        params={{ horseId: horse?.id || l.id }}
                        className="px-5 py-2 rounded-full border border-border hover:bg-foreground hover:text-background transition-colors text-sm font-medium uppercase tracking-widest flex items-center gap-2"
                      >
                        Inquire <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

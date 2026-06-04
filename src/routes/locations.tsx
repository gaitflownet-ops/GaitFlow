import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLocations } from "@/lib/hooks/useLocations";
import { MapPin, Plus } from "lucide-react";

export const Route = createFileRoute("/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  const { data: locations = [], isLoading } = useLocations();

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Facilities</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Locations & Stalls</h1>
          <p className="text-muted-foreground mt-2">Manage physical spaces and horse assignments</p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Space
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="h-32 lux-card animate-pulse" />
        ) : locations.length === 0 ? (
          <div className="col-span-full p-12 text-center lux-card text-muted-foreground">
            No locations configured yet.
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="lux-card p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display text-2xl flex items-center gap-2">
                  <MapPin className="text-muted-foreground h-5 w-5" />
                  {loc.name}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${loc.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-secondary'}`}>
                  {loc.status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Type: <span className="capitalize">{loc.type}</span></p>
                <p>Capacity: {loc.capacity}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

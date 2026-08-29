import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useFavorites } from "@/lib/hooks/useMarketplace";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/marketplace/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data: favorites = [], isLoading } = useFavorites();

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-4xl flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" /> Mis Favoritos
        </h1>
        <p className="text-muted-foreground mt-2">
          Ejemplares y genética que has guardado.
        </p>
      </div>

      {isLoading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-secondary rounded-3xl" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="lux-card p-16 text-center text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-display font-bold text-foreground">Tu lista está vacía</h2>
          <p>Aún no has añadido ningún ejemplar a tus favoritos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav: any) => (
            fav.listings && <ListingCard key={fav.id} listing={fav.listings} isFavorite onToggleFavorite={() => {}} onViewDetail={() => {}} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

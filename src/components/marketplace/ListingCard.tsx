import { useState } from "react";
import { Heart } from "lucide-react";
import type { EnterpriseListing } from "@/lib/hooks/useMarketplace";
import { Link, useNavigate } from "@tanstack/react-router";

interface Props {
  listing: EnterpriseListing;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: Props) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const h = listing.horses;
  const title = listing.title || h?.name || "Ejemplar Premium";

  // Precios
  const price = listing.price ? `COP ${Number(listing.price).toLocaleString("es-CO")}` : "Precio a consultar";
  const originalPrice = listing.original_price ? `COP ${Number(listing.original_price).toLocaleString("es-CO")}` : null;

  // Imagen
  let imageUrl = "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80";
  if (listing.images && listing.images.length > 0) imageUrl = listing.images[0];
  else if (h?.image_url) imageUrl = h.image_url;

  // Edad
  let ageDisplay = "";
  if (h?.birth_date) {
    const bDate = new Date(h.birth_date);
    const diffTime = Math.abs(new Date().getTime() - bDate.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    if (diffMonths < 24) ageDisplay = `${diffMonths} meses`;
    else ageDisplay = `${Math.floor(diffMonths / 12)} años`;
  } else if (h?.age) {
    ageDisplay = `${h.age} años`;
  }

  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";

  return (
    <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Imagen */}
      <div 
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}
      >
        <img
          src={imgError ? "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80" : imageUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        {listing.discount_percentage && !isSold && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{listing.discount_percentage}%
          </div>
        )}
        
        {isSold ? (
          <div className="absolute top-2 right-2 bg-zinc-800 text-white text-xs font-bold px-2 py-1 rounded">
            Vendido
          </div>
        ) : listing.is_promoted ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
            Destacado
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 
          className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}
        >
          {title}
        </h3>
        
        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {h?.breed && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">
              {h.breed}
            </span>
          )}
          {ageDisplay && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">
              {ageDisplay}
            </span>
          )}
          {h?.sex && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">
              {h.sex}
            </span>
          )}
        </div>

        {/* Precio y Location */}
        <div className="mt-4 mt-auto">
          {originalPrice && !isSold && (
            <div className="text-sm text-muted-foreground line-through">
              {originalPrice}
            </div>
          )}
          <div className="text-2xl font-bold text-foreground">
            {price}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            📍 {listing.location_country || "Colombia"} {listing.location_city ? `- ${listing.location_city}` : ""}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}
            className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Ver Ficha
          </button>
          <button
            onClick={onToggleFavorite}
            className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

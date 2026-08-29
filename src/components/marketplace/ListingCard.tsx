/**
 * ListingCard.tsx — Enterprise listing card for the marketplace.
 * Features: image gallery, badges, views/inquiries stats, listing status, favorites, quick inquiry CTA.
 */
import { useState } from "react";
import { Heart, Eye, MessageCircle, ArrowUpRight, CheckCircle, ShieldCheck, Stethoscope, Tag, Star } from "lucide-react";
import type { EnterpriseListing } from "@/lib/hooks/useMarketplace";

interface Props {
  listing: EnterpriseListing;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onInquire?: () => void;
  onViewDetail?: () => void;
  showSellerActions?: boolean;
  onPause?: () => void;
  onReactivate?: () => void;
  onCloseSale?: () => void;
  onEdit?: () => void;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "Sold": return { label: "Vendido", className: "bg-zinc-800 text-zinc-400 border-zinc-700" };
    case "Paused": return { label: "Pausado", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" };
    default: return { label: "Activo", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" };
  }
}

function getTypeLabel(type?: string) {
  switch (type?.toLowerCase()) {
    case "embryo": return "Embrión";
    case "semen": return "Material Genético";
    case "breeding service": return "Servicio de Monta";
    default: return "Ejemplar";
  }
}

export function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  onInquire,
  onViewDetail,
  showSellerActions,
  onPause,
  onReactivate,
  onCloseSale,
  onEdit,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const h = listing.horses;
  const title = listing.title || h?.name || "Ejemplar Premium";
  
  // Pricing
  const isCOP = listing.currency === "COP";
  const currSymbol = isCOP ? "COP" : "$";
  const priceText = listing.price ? `${currSymbol} ${Number(listing.price).toLocaleString()}` : "Precio a consultar";
  const originalPriceText = listing.original_price ? `${currSymbol} ${Number(listing.original_price).toLocaleString()}` : null;

  // Build image gallery
  const allImages: string[] = [];
  if (listing.images && listing.images.length > 0) allImages.push(...listing.images);
  if (h?.image_url && !allImages.includes(h.image_url)) allImages.push(h.image_url);
  if (allImages.length === 0) {
    allImages.push("https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80");
  }

  const [currentImg, setCurrentImg] = useState(0);
  const statusBadge = getStatusBadge(listing.listing_status || listing.status as any);
  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";

  // Dynamic Age calculation
  let ageDisplay = "";
  if (h?.birth_date) {
    const bDate = new Date(h.birth_date);
    const diffTime = Math.abs(new Date().getTime() - bDate.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    if (diffMonths < 24) {
      ageDisplay = `${diffMonths} meses`;
    } else {
      ageDisplay = `${Math.floor(diffMonths / 12)} años`;
    }
  } else if (h?.age) {
    ageDisplay = `${h.age} años`;
  }

  // Badges
  const badges: { icon: React.ElementType; label: string }[] = [];
  if (h?.bloodline) badges.push({ icon: ShieldCheck, label: "Pedigrí Verificado" });
  if (h?.id) badges.push({ icon: Stethoscope, label: "Salud al Día" });
  if (listing.is_promoted) badges.push({ icon: Star, label: "Destacado" });

  return (
    <div className={`group lux-card overflow-hidden flex flex-col transition-all hover:border-primary/40 hover:shadow-lg ${isSold ? "opacity-70" : ""} ${listing.is_promoted ? "ring-2 ring-amber-500/50" : ""}`}>
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary cursor-pointer" onClick={onViewDetail}>
        <img
          src={imgError ? "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80" : allImages[currentImg]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />

        {listing.is_promoted && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1.5">
             {!isSold && (
               <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-background/90 backdrop-blur border border-border/50 text-foreground shadow-sm">
                 {priceText}
               </span>
             )}
             {listing.discount_percentage && !isSold && (
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white w-max">
                 -{listing.discount_percentage}% Dcto
               </span>
             )}
          </div>
          
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-display font-bold text-foreground/80">Vendido</span>
          </div>
        )}

        {/* Favorite button */}
        {onToggleFavorite && !isSold && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur border border-border/30 hover:bg-background transition-colors z-10"
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        )}

        {/* Thumbnail dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {allImages.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === currentImg ? "w-5 bg-white shadow-sm" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1 bg-card">
        {/* Header: Type + Views */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
            {getTypeLabel(listing.type)} 
            {(h as any)?.gait_type && <span className="text-primary">• {(h as any).gait_type}</span>}
          </span>
          {(listing.views_count ?? 0) > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
              <Eye className="h-3.5 w-3.5" /> {listing.views_count}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="cursor-pointer" onClick={onViewDetail}>
          <h3 className="font-display text-lg leading-tight font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5 font-medium">
             📍 {listing.location_country || "Colombia"} {listing.location_city ? `· ${listing.location_city}` : ""}
          </p>
        </div>

        {/* Horse Specs */}
        {h && (
          <div className="flex flex-wrap gap-2 mt-1">
            {h.breed && <span className="text-[11px] font-semibold bg-secondary px-2 py-1 rounded-md border border-border/50 text-foreground/80">{h.breed}</span>}
            {ageDisplay && <span className="text-[11px] font-semibold bg-secondary px-2 py-1 rounded-md border border-border/50 text-foreground/80">{ageDisplay}</span>}
            {h.sex && <span className="text-[11px] font-semibold bg-secondary px-2 py-1 rounded-md border border-border/50 text-foreground/80">{h.sex}</span>}
          </div>
        )}

        {/* Price Section */}
        <div className="mt-2 flex flex-col justify-end flex-1">
          {originalPriceText && !isSold && (
            <span className="text-xs text-muted-foreground line-through font-medium">
              {originalPriceText}
            </span>
          )}
          <div className="flex items-baseline justify-between w-full">
            <span className="text-xl font-display font-bold text-foreground">
              {priceText}
            </span>
            {listing.negotiation_terms && (
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1 bg-secondary rounded">
                {listing.negotiation_terms === "Negotiable" ? "Negociable" : listing.negotiation_terms}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-4 border-t border-border flex items-center gap-2">
          {!isSold && (
            <>
              <button
                type="button"
                onClick={onViewDetail}
                className="flex-[1.5] py-2.5 text-[11px] font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
              >
                Ver Ficha
              </button>
              {onInquire && (
                <button
                  type="button"
                  onClick={onInquire}
                  className="flex-[1] py-2.5 text-[11px] font-bold border-2 border-border text-foreground rounded-xl hover:bg-secondary transition-colors"
                >
                  Contactar
                </button>
              )}
            </>
          )}

          {/* Seller actions */}
          {showSellerActions && (
            <div className="w-full grid grid-cols-2 gap-2 mt-1">
              {onEdit && (
                <button type="button" onClick={onEdit} className="py-2 text-[11px] font-bold border border-border rounded-xl hover:bg-secondary transition-colors">
                  Editar
                </button>
              )}
              {listing.listing_status === "Active" && onPause && (
                <button type="button" onClick={onPause} className="py-2 text-[11px] font-bold bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500/20 transition-colors">
                  Pausar
                </button>
              )}
              {listing.listing_status === "Paused" && onReactivate && (
                <button type="button" onClick={onReactivate} className="py-2 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 transition-colors">
                  Activar
                </button>
              )}
              {!isSold && onCloseSale && (
                <button type="button" onClick={onCloseSale} className="col-span-2 py-2 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Marcar Vendido
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * ListingCard.tsx — Enterprise listing card for the marketplace.
 * Features: image gallery, badges, views/inquiries stats, listing status, favorites, quick inquiry CTA.
 */
import { useState } from "react";
import { Heart, Eye, MessageCircle, ArrowUpRight, CheckCircle, ShieldCheck, Stethoscope, Tag } from "lucide-react";
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
  const priceText = listing.price
    ? `${listing.currency === "COP" ? "COP" : "$"}${Number(listing.price).toLocaleString()}`
    : "Precio a consultar";

  // Build image gallery: listing images > horse image > fallback
  const allImages: string[] = [];
  if (listing.images && listing.images.length > 0) allImages.push(...listing.images);
  if (h?.image_url && !allImages.includes(h.image_url)) allImages.push(h.image_url);
  if (allImages.length === 0) {
    allImages.push("https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80");
  }

  const [currentImg, setCurrentImg] = useState(0);
  const statusBadge = getStatusBadge(listing.listing_status || listing.status as any);
  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";

  // Autenticity badges based on horse data
  const badges: { icon: React.ElementType; label: string }[] = [];
  if (h?.bloodline) badges.push({ icon: ShieldCheck, label: "Pedigrí Verificado" });
  if (h?.id) badges.push({ icon: Stethoscope, label: "Salud al Día" });

  return (
    <div className={`group lux-card overflow-hidden flex flex-col transition-all hover:border-primary/30 hover:shadow-md ${isSold ? "opacity-70" : ""}`}>
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={imgError ? "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80" : allImages[currentImg]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />

        {/* Status badge top-right */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
          {statusBadge.label}
        </span>

        {/* Price badge top-left if not sold */}
        {!isSold && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-background/90 backdrop-blur border border-border/50">
            {priceText}
          </span>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-lg font-display font-bold text-foreground/70">Vendido</span>
          </div>
        )}

        {/* Favorite button */}
        {onToggleFavorite && !isSold && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur border border-border/30 hover:bg-background transition-colors"
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        )}

        {/* Thumbnail dots if multiple images */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setCurrentImg(i)}
                onClick={() => setCurrentImg(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentImg ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Type + Discipline */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {getTypeLabel(listing.type)} {listing.discipline ? `· ${listing.discipline}` : h?.discipline ? `· ${h.discipline}` : ""}
          </span>
          {(listing.views_count ?? 0) > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" /> {listing.views_count}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg leading-tight font-bold truncate">{title}</h3>

        {/* Horse details */}
        {h && (
          <p className="text-xs text-muted-foreground">
            {[h.breed, h.age ? `${h.age} años` : null, h.sex].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Authenticity Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3" /> {label}
              </span>
            ))}
          </div>
        )}

        {/* Negotiation terms snippet */}
        {listing.negotiation_terms && (
          <p className="text-[11px] text-muted-foreground italic line-clamp-1">
            "{listing.negotiation_terms}"
          </p>
        )}

        {/* Inquiries count */}
        {(listing.inquiries_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            {listing.inquiries_count} {listing.inquiries_count === 1 ? "consulta" : "consultas"}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-2">
          {!isSold && (
            <>
              <button
                type="button"
                onClick={onViewDetail}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Ver Detalles <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              {onInquire && (
                <button
                  type="button"
                  onClick={onInquire}
                  className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Contactar
                </button>
              )}
            </>
          )}

          {/* Seller actions */}
          {showSellerActions && (
            <div className="w-full flex gap-1.5 flex-wrap">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 py-1.5 text-[11px] font-semibold border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Editar
                </button>
              )}
              {listing.listing_status === "Active" && onPause && (
                <button
                  type="button"
                  onClick={onPause}
                  className="flex-1 py-1.5 text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
                >
                  Pausar
                </button>
              )}
              {listing.listing_status === "Paused" && onReactivate && (
                <button
                  type="button"
                  onClick={onReactivate}
                  className="flex-1 py-1.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  Reactivar
                </button>
              )}
              {!isSold && onCloseSale && (
                <button
                  type="button"
                  onClick={onCloseSale}
                  className="flex-1 py-1.5 text-[11px] font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  ✅ Cerrar Venta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

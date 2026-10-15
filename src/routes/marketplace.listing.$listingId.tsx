import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing, useFavorites, useToggleFavorite } from "@/lib/hooks/useMarketplace";
import { useApp } from "@/lib/store";
import { ArrowLeft, MapPin, Tag, ShieldCheck, Stethoscope, Medal, Heart, Share2, Info, MessageCircle, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { BuyerInquiryForm } from "@/components/marketplace/BuyerInquiryForm";
import { PedigreeTree } from "@/components/PedigreeTree";

export const Route = createFileRoute("/marketplace/listing/$listingId")({
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { listingId } = Route.useParams();
  const navigate = useNavigate();
  
  const { state } = useApp();
  if (!state.user) return <Navigate to="/" />;
  const isLoggedIn = !!state.user;

  const { data: listing, isLoading } = useListing(listingId);
  const h = (listing?.horses as any) || {};

  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const [inquiryType, setInquiryType] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState(0);

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-8">
          <div className="h-[60vh] bg-secondary rounded-[3rem]" />
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-4">
              <div className="h-12 bg-secondary rounded-xl w-1/2" />
              <div className="h-6 bg-secondary rounded-xl w-1/4" />
              <div className="h-32 bg-secondary rounded-xl" />
            </div>
            <div className="h-96 bg-secondary rounded-3xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!listing) {
    return (
      <AppShell>
        <div className="lux-card p-16 text-center">
          <h2 className="text-2xl font-display font-bold">Publicación no encontrada</h2>
          <p className="text-muted-foreground mt-2">La publicación pudo haber sido eliminada o ya no está disponible.</p>
          <button 
            onClick={() => navigate({ to: "/marketplace" })}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Volver al Catálogo
          </button>
        </div>
      </AppShell>
    );
  }

  const title = listing.title || h.name || "Ejemplar Premium";
  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";
  
  const formatCOP = (p: number | null | undefined) =>
    p ? `COP $${Number(p).toLocaleString("es-CO")}` : "Precio a consultar";

  const priceText = formatCOP(listing.price);
  const originalPriceText = listing.original_price ? formatCOP(listing.original_price) : null;
  
  const allImages = [];
  if (listing.images && listing.images.length > 0) allImages.push(...listing.images);
  if (h.image_url && !allImages.includes(h.image_url)) allImages.push(h.image_url);
  if (allImages.length === 0) allImages.push("https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80");

  const isFav = favorites.some((f: any) => f.listing_id === listing.id);

  let ageDisplay = h.age ? `${h.age} años` : "No especificada";
  if (h.birth_date) {
    const bDate = new Date(h.birth_date);
    const months = Math.floor((Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    ageDisplay = months < 24 ? `${months} meses` : `${Math.floor(months / 12)} años`;
  }

  // Auto-generate some tags from horse data
  const tags = [
    h.breed,
    h.sex,
    ageDisplay !== "No especificada" ? ageDisplay : null,
    listing.discipline || h.discipline,
    h.gait_type,
  ].filter(Boolean);

  const handleFav = () => {
    if (!isLoggedIn) {
      alert("Inicia sesión para guardar en favoritos");
      return;
    }
    toggleFavorite.mutate({ userId: state.user!.id, listingId: listing.id, isFav } as any);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("URL copiada al portapapeles");
    }
  };

  return (
    <AppShell>
      {/* ── Back Navigation ── */}
      <button 
        onClick={() => navigate({ to: "/marketplace" })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al Catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Media & Content ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gallery Hero */}
          <div className="relative aspect-video lg:aspect-[16/10] bg-zinc-950 rounded-[2rem] overflow-hidden group">
            <img 
              src={allImages[currentImg]} 
              alt={title}
              className="w-full h-full object-contain bg-zinc-900/50"
            />
            {isSold && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="px-8 py-3 rounded-full border-2 border-foreground/20 text-foreground font-display text-4xl font-bold uppercase tracking-widest rotate-[-12deg]">
                  Vendido
                </div>
              </div>
            )}
            
            {/* Gallery Navigation Dots */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`h-2 transition-all rounded-full ${i === currentImg ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-colors ${i === currentImg ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg border border-border">
                {t}
              </span>
            ))}
          </div>

          {/* Listing Description */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold border-b border-border pb-4">Acerca de este ejemplar</h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {listing.description || "No hay descripción disponible para esta publicación."}
              </p>
            </div>
            
            {/* Badges / Trust indicators */}
            <div className="flex flex-wrap gap-4 pt-4">
              {h.bloodline && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm font-semibold border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" /> Pedigrí Verificado
                </div>
              )}
              {h.id && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-sm font-semibold border border-blue-500/20">
                  <Stethoscope className="h-5 w-5" /> Salud al Día
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-semibold border border-border">
                <FileText className="h-5 w-5" /> Traspaso Garantizado
              </div>
            </div>
          </section>

          {/* Horse Attributes Grid */}
          <section className="lux-card p-6 md:p-8">
            <h3 className="text-xl font-display font-bold mb-6">Ficha Técnica</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Raza</p>
                <p className="font-semibold">{h.breed || "No especificada"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Sexo</p>
                <p className="font-semibold">{h.sex || "No especificado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Edad</p>
                <p className="font-semibold">{ageDisplay}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Disciplina</p>
                <p className="font-semibold">{listing.discipline || h.discipline || "General"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ubicación</p>
                <p className="font-semibold">{listing.location_country || "Colombia"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Estado Médico</p>
                <p className="font-semibold text-emerald-500">Óptimo</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Tipo de Activo</p>
                <p className="font-semibold">{listing.type === "embryo" ? "Embrión" : listing.type === "semen" ? "Material Genético" : "Ejemplar Vivo"}</p>
              </div>
            </div>
          </section>

          {/* Pedigree Section */}
          {h?.id && (
            <section className="space-y-6">
              <h2 className="text-2xl font-display font-bold border-b border-border pb-4">Genealogía</h2>
              <div className="bg-secondary/50 rounded-3xl p-6 border border-border/50 overflow-x-auto">
                <PedigreeTree horse={h} />
              </div>
            </section>
          )}

        </div>

        {/* ── Right Column: Sticky Commercial Card ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* Price & Actions Card */}
            <div className="lux-card p-6 border-primary/20 shadow-xl shadow-primary/5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  {isSold ? "Vendido" : "En Venta"}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleFav}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <Heart className={`h-5 w-5 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <h1 className="text-3xl font-display font-bold mb-4">{title}</h1>
              
              <div className="mb-6">
                <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Precio de Inversión</p>
                {originalPriceText && (
                  <p className="text-sm font-semibold text-muted-foreground line-through mb-1">
                    {originalPriceText}
                  </p>
                )}
                <p className="text-4xl font-display font-bold text-foreground">
                  {priceText}
                </p>
                {listing.discount_percentage && (
                  <span className="inline-block mt-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500 text-white">
                    -{listing.discount_percentage}% Dcto
                  </span>
                )}
                {listing.negotiation_terms && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> {listing.negotiation_terms}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  disabled={isSold}
                  onClick={() => setInquiryType("Quiero comprar")}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-center flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" /> Contactar al Vendedor
                </button>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="lux-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Vendedor</h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xl border border-primary/20">
                  {listing.organization_id ? "G" : "V"}
                </div>
                <div>
                  <p className="font-semibold">{listing.profiles?.name || "Organización Verificada"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {(listing.location_country || "Colombia")}
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {inquiryType && (
        <Modal open={!!inquiryType} onClose={() => setInquiryType(null)} title="">
          <BuyerInquiryForm
            listingId={listing.id}
            listingTitle={title}
            onClose={() => setInquiryType(null)}
          />
        </Modal>
      )}
    </AppShell>
  );
}




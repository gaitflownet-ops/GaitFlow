/**
 * SellerDashboard.tsx — Private seller panel inside the AppShell.
 * Shows: KPI cards (active, sold, views, inquiries), listings table with management actions,
 * and inquiries inbox with reply functionality.
 */
import { useState } from "react";
import {
  ShoppingBag, DollarSign, Eye, MessageCircle, Pause, Play,
  CheckCircle2, Trash2, Loader2, RefreshCw, Reply, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useSellerListings,
  useSellerInquiries,
  useUpdateListing,
  useDeleteListing,
  useReplyToInquiry,
  type EnterpriseListing,
  type EnterpriseInquiry,
} from "@/lib/hooks/useMarketplace";
import { ListingCard } from "./ListingCard";
import { CloseSaleModal } from "./CloseSaleModal";
import { Modal } from "@/components/modals/Modal";
import { toast } from "sonner";

type SellerTab = "listings" | "inquiries";

function KPICard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="lux-card p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function InquiryRow({ inquiry, onReply }: { inquiry: EnterpriseInquiry; onReply: (id: string, reply: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    await onReply(inquiry.id, replyText);
    setReplyText("");
    setReplying(false);
  };

  const statusColor = inquiry.status === "Replied" ? "text-emerald-500" :
    inquiry.status === "Closed" ? "text-zinc-400" : "text-amber-500";

  const typeLabels: Record<string, string> = {
    Information: "Información",
    Visit: "Visita",
    DirectPurchase: "Compra Directa",
    TrackTrial: "Prueba en Pista",
  };

  return (
    <div className="lux-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{inquiry.buyer_name || "Comprador Anónimo"}</span>
            {inquiry.inquiry_type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border font-semibold">
                {typeLabels[inquiry.inquiry_type] || inquiry.inquiry_type}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
              {inquiry.status || "Pending"}
            </span>
          </div>
          {inquiry.buyer_email && (
            <p className="text-xs text-muted-foreground mt-0.5">{inquiry.buyer_email}{inquiry.buyer_country ? ` · ${inquiry.buyer_country}` : ""}</p>
          )}
          <p className="text-xs mt-2 text-foreground/80 line-clamp-2">{inquiry.message}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1 hover:bg-secondary rounded-lg transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in duration-150">
          {/* Full message */}
          <div className="p-3 bg-secondary rounded-xl text-sm">{inquiry.message}</div>

          {/* Seller reply */}
          {inquiry.seller_reply && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
              <p className="text-[11px] font-bold text-primary mb-1">Tu respuesta:</p>
              {inquiry.seller_reply}
            </div>
          )}

          {/* Reply input if not yet replied */}
          {inquiry.status !== "Replied" && (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
              >
                {replying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Reply className="h-3.5 w-3.5" />}
                Responder
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Recibido: {new Date(inquiry.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}

export function SellerDashboard() {
  const { data: listings = [], isLoading: loadingListings } = useSellerListings();
  const { data: inquiries = [], isLoading: loadingInquiries } = useSellerInquiries();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const replyToInquiry = useReplyToInquiry();

  const [activeTab, setActiveTab] = useState<SellerTab>("listings");
  const [closeSaleTarget, setCloseSaleTarget] = useState<EnterpriseListing | null>(null);

  // KPIs
  const active = listings.filter((l) => l.listing_status === "Active" || (!l.listing_status && l.status === "Active")).length;
  const sold = listings.filter((l) => l.listing_status === "Sold" || l.status === "Sold").length;
  const totalViews = listings.reduce((acc, l) => acc + (l.views_count || 0), 0);
  const pendingInquiries = inquiries.filter((i) => i.status === "Pending" || !i.status).length;

  const handlePause = async (id: string) => {
    try {
      await updateListing.mutateAsync({ id, updates: { listing_status: "Paused" } as any });
      toast.success("Publicación pausada.");
    } catch { toast.error("Error al pausar."); }
  };

  const handleReactivate = async (id: string) => {
    try {
      await updateListing.mutateAsync({ id, updates: { listing_status: "Active" } as any });
      toast.success("Publicación reactivada.");
    } catch { toast.error("Error al reactivar."); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta publicación?")) return;
    try {
      await deleteListing.mutateAsync(id);
      toast.success("Publicación eliminada.");
    } catch { toast.error("Error al eliminar."); }
  };

  const handleReply = async (id: string, reply: string) => {
    try {
      await replyToInquiry.mutateAsync({ id, reply });
      toast.success("Respuesta enviada.");
    } catch { toast.error("Error al enviar respuesta."); }
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={ShoppingBag} label="Publicaciones Activas" value={active} color="bg-emerald-500/10 text-emerald-600" />
        <KPICard icon={CheckCircle2} label="Ventas Cerradas" value={sold} color="bg-blue-500/10 text-blue-500" />
        <KPICard icon={Eye} label="Vistas Totales" value={totalViews.toLocaleString()} color="bg-primary/10 text-primary" />
        <KPICard icon={MessageCircle} label="Consultas Pendientes" value={pendingInquiries} color={pendingInquiries > 0 ? "bg-amber-500/10 text-amber-600" : "bg-secondary text-muted-foreground"} />
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border">
        {(["listings", "inquiries"] as SellerTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all capitalize ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "listings" ? "Mis Publicaciones" : (
              <span className="flex items-center gap-1.5">
                Consultas
                {pendingInquiries > 0 && (
                  <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {pendingInquiries}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <>
          {loadingListings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-secondary rounded-3xl" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="font-display text-xl">Aún no tienes publicaciones</h3>
              <p className="mt-2 text-sm">Usa el botón "Publicar" para añadir tu primer listado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showSellerActions
                  onPause={() => handlePause(listing.id)}
                  onReactivate={() => handleReactivate(listing.id)}
                  onCloseSale={() => setCloseSaleTarget(listing)}
                  onEdit={() => toast.info("Editor de publicación próximamente.")}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Inquiries Tab */}
      {activeTab === "inquiries" && (
        <>
          {loadingInquiries ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-2xl" />)}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="font-display text-xl">Sin consultas aún</h3>
              <p className="mt-2 text-sm">Cuando compradores interesados te contacten, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <InquiryRow key={inq.id} inquiry={inq} onReply={handleReply} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Close Sale Modal */}
      {closeSaleTarget && (
        <Modal
          open={!!closeSaleTarget}
          onClose={() => setCloseSaleTarget(null)}
          title="Cerrar Venta"
        >
          <CloseSaleModal
            listing={closeSaleTarget}
            onClose={() => setCloseSaleTarget(null)}
            onSuccess={() => setCloseSaleTarget(null)}
          />
        </Modal>
      )}
    </div>
  );
}

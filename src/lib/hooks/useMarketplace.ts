import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../store";
import type { Database } from "../supabase.types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];

// ── Extended types for enterprise fields ───────────────────────────────────────
export interface EnterpriseListing extends Listing {
  views_count?: number;
  inquiries_count?: number;
  currency?: "USD" | "COP" | "EUR";
  negotiation_terms?: string;
  listing_status?: "Active" | "Paused" | "Sold" | "Archived";
  sold_at?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_country?: string;
  sale_price?: number;
  featured?: boolean;
  images?: string[];
  discipline?: string;
  location_country?: string;
  location_city?: string;
  original_price?: number;
  discount_percentage?: number;
  is_promoted?: boolean;
  sub_type?: string;
  location_farm?: string;
  is_negotiable?: boolean;
  horses?: {
    id?: string;
    name?: string;
    breed?: string;
    age?: number;
    birth_date?: string;
    sex?: string;
    color?: string;
    discipline?: string;
    image_url?: string;
    location?: string;
    trainer?: string;
    wins?: number;
    bloodline?: string;
    story?: string;
    temperament?: string;
    latest_achievement?: string;
    badges?: any;
    organization_id?: string;
    code?: string;
    pedigree?: any;
  };
  profiles?: {
    name?: string;
  };
}

export interface EnterpriseInquiry {
  id: string;
  message: string;
  created_at: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_country?: string;
  inquiry_type?: string;
  status?: string | null;
  target_price?: number;
  target_currency?: string;
  seller_reply?: string;
  replied_at?: string;
}

export interface MarketplaceFilters {
  search?: string;
  type?: string;
  subType?: string;
  minPrice?: number;
  maxPrice?: number;
  breed?: string;
  sex?: string;
  ageRange?: string; // "0-3", "3-6", "6-12", "12-24", "24-60", "60-120", "120+"
  gaitType?: string;
  gaits?: string[];
  discipline?: string;
  country?: string;
  isNegotiable?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc" | "most_viewed" | "promoted";
}

const LISTING_JOIN = `
  *,
  horses:horse_id (
    id, name, breed, age, birth_date, sex, color, discipline, image_url,
    location, trainer, wins, bloodline, story, temperament,
    latest_achievement, badges, organization_id, code, gait_type
  ),
  profiles:seller_id (
    name,
    stable_name
  )
`;

// ── 1. Public Catalog (no auth required) ──────────────────────────────────────
export function usePublicListings(filters?: MarketplaceFilters) {
  return useQuery<EnterpriseListing[]>({
    queryKey: ["public-listings", filters],
    queryFn: async () => {
      let query = (supabase.from("listings") as any)
        .select(LISTING_JOIN)
        .in("listing_status", ["Active"])
        .order("created_at", { ascending: false });

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type.toLowerCase());
      }
      if (filters?.minPrice) query = query.gte("price", filters.minPrice);
      if (filters?.maxPrice) query = query.lte("price", filters.maxPrice);
      if (filters?.discipline) query = query.ilike("discipline", `%${filters.discipline}%`);
      if (filters?.country) query = query.ilike("location_country", `%${filters.country}%`);

      if (filters?.sortBy === "price_asc") query = query.order("price", { ascending: true });
      else if (filters?.sortBy === "price_desc") query = query.order("price", { ascending: false });
      else if (filters?.sortBy === "most_viewed") query = query.order("views_count", { ascending: false });

      const { data, error } = await query;
      if (error) return [];

      let results = (data as EnterpriseListing[]).map((listing) => {
        if (listing.horses?.image_url?.startsWith("/src/assets/")) {
          listing.horses.image_url = listing.horses.image_url.replace("/src/assets/", "/media/");
        }
        return listing;
      });

      // Client-side filters for breed, sex, age (joined horse fields)
      if (filters?.breed) {
        const b = filters.breed.toLowerCase();
        results = results.filter((l) => l.horses?.breed?.toLowerCase().includes(b));
      }
      if (filters?.sex) {
        results = results.filter((l) => l.horses?.sex?.toLowerCase() === filters.sex?.toLowerCase());
      }
      if (filters?.minAge) results = results.filter((l) => (l.horses?.age ?? 0) >= filters.minAge!);
      if (filters?.maxAge) results = results.filter((l) => (l.horses?.age ?? 99) <= filters.maxAge!);
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(
          (l) =>
            l.title?.toLowerCase().includes(s) ||
            l.horses?.name?.toLowerCase().includes(s) ||
            l.horses?.breed?.toLowerCase().includes(s) ||
            l.description?.toLowerCase().includes(s)
        );
      }

      return results;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ── 2. All Listings (org filtered, for AppShell) ───────────────────────────────
export function useListings(typeFilter?: string) {
  return useQuery<EnterpriseListing[]>({
    queryKey: ["listings", typeFilter],
    queryFn: async () => {
      let query = (supabase.from("listings") as any)
        .select(LISTING_JOIN)
        .order("created_at", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data as any[]) || []).map((listing) => {
        if (listing.horses?.image_url?.startsWith("/src/assets/")) {
          listing.horses.image_url = listing.horses.image_url.replace("/src/assets/", "/media/");
        }
        return listing;
      }) as EnterpriseListing[];
    },
  });
}

// ── 3. Seller's own listings ───────────────────────────────────────────────────
export function useSellerListings() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<EnterpriseListing[]>({
    queryKey: ["seller-listings", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("listings") as any)
        .select(LISTING_JOIN)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) return [];
      return (data || []) as EnterpriseListing[];
    },
  });
}

// ── 4. Create Listing ──────────────────────────────────────────────────────────
export function useCreateListing() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (
      newListing: Omit<Database["public"]["Tables"]["listings"]["Insert"], "organization_id"> & {
        currency?: string;
        negotiation_terms?: string;
        discipline?: string;
        location_country?: string;
        location_city?: string;
        images?: string[];
        listing_status?: string;
      }
    ) => {
      const { data, error } = await (supabase.from("listings") as any)
        .insert([{
          ...newListing,
          organization_id: state.user?.organization_id,
          listing_status: newListing.listing_status || "Active",
          views_count: 0,
          inquiries_count: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      queryClient.invalidateQueries({ queryKey: ["public-listings"] });
    },
  });
}

// ── 5. Update Listing ──────────────────────────────────────────────────────────
export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<EnterpriseListing>;
    }) => {
      const { data, error } = await (supabase.from("listings") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      queryClient.invalidateQueries({ queryKey: ["public-listings"] });
    },
  });
}

// ── 6. Delete Listing ──────────────────────────────────────────────────────────
export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
    },
  });
}

// ── 7. Close Sale (enterprise workflow) ───────────────────────────────────────
export interface CloseSalePayload {
  listingId: string;
  horseId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCountry?: string;
  salePrice: number;
  currency?: "USD" | "COP" | "EUR";
  notes?: string;
}

export function useCloseSale() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (payload: CloseSalePayload) => {
      const orgId = state.user?.organization_id;
      const sellerId = state.user?.id;
      const now = new Date().toISOString();

      // 1. Update listing status to Sold and capture buyer data
      const { error: listingErr } = await (supabase.from("listings") as any)
        .update({
          listing_status: "Sold",
          status: "Sold",
          sold_at: now,
          buyer_name: payload.buyerName,
          buyer_email: payload.buyerEmail,
          buyer_phone: payload.buyerPhone,
          buyer_country: payload.buyerCountry,
          sale_price: payload.salePrice,
        })
        .eq("id", payload.listingId);

      if (listingErr) console.warn("[useCloseSale] listing update error:", listingErr.message);

      // 2. Update horse status to "Vendido"
      if (payload.horseId) {
        await (supabase.from("horses") as any)
          .update({ status: "Vendido" })
          .eq("id", payload.horseId);
      }

      // 3. Auto-generate invoice in financials
      let invoiceId: string | undefined;
      try {
        const { data: invoiceData } = await (supabase.from("financial_transactions") as any)
          .insert([{
            organization_id: orgId,
            type: "income",
            category: "Venta de Ejemplar",
            description: `Venta — Comprador: ${payload.buyerName}`,
            amount: payload.salePrice,
            currency: payload.currency || "USD",
            date: now.split("T")[0],
            status: "completed",
            reference_type: "listing",
            reference_id: payload.listingId,
            notes: payload.notes,
          }])
          .select()
          .single();
        invoiceId = invoiceData?.id;
      } catch (e) {
        console.warn("[useCloseSale] invoice creation non-critical error:", e);
      }

      // 4. Save sale closing record
      const { data: closingData, error: closingErr } = await (supabase.from("sale_closings") as any)
        .insert([{
          listing_id: payload.listingId,
          horse_id: payload.horseId,
          organization_id: orgId,
          seller_id: sellerId,
          buyer_name: payload.buyerName,
          buyer_email: payload.buyerEmail,
          buyer_phone: payload.buyerPhone,
          buyer_country: payload.buyerCountry,
          sale_price: payload.salePrice,
          currency: payload.currency || "USD",
          invoice_id: invoiceId,
          notes: payload.notes,
        }])
        .select()
        .single();

      if (closingErr) console.warn("[useCloseSale] closing record error:", closingErr.message);

      return { success: true, closingId: closingData?.id, invoiceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      queryClient.invalidateQueries({ queryKey: ["public-listings"] });
      queryClient.invalidateQueries({ queryKey: ["horses"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    },
  });
}

// ── 8. Increment Views ─────────────────────────────────────────────────────────
export function useIncrementListingViews() {
  return useMutation({
    mutationFn: async (listingId: string) => {
      try {
        await (supabase.rpc as any)("increment_listing_views", { listing_id_param: listingId });
      } catch {
        // Non-critical, ignore if RPC doesn't exist yet
      }
    },
  });
}

// ── 9. Favorites ───────────────────────────────────────────────────────────────
export function useFavorites() {
  const { state } = useApp();
  const userId = state.user?.id;

  return useQuery<Favorite[]>({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("favorites") as any)
        .select("*")
        .eq("user_id", userId);
      if (error) return [];
      return data as Favorite[];
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listingId,
      isFav,
    }: {
      userId: string;
      listingId: string;
      isFav: boolean;
    }) => {
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);
        if (error) throw error;
        return { listingId, added: false };
      } else {
        const { data, error } = await (supabase.from("favorites") as any)
          .insert({ user_id: userId, listing_id: listingId })
          .select()
          .single();
        if (error) throw error;
        return { listingId, added: true, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

// ── 10. Inquiries ──────────────────────────────────────────────────────────────
export function useInquiries(listingId?: string) {
  return useQuery<EnterpriseInquiry[]>({
    queryKey: ["inquiries", listingId],
    queryFn: async () => {
      let query = (supabase.from("inquiries") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (listingId) {
        query = query.eq("listing_id", listingId);
      }
      const { data, error } = await query;
      if (error) return [];
      return data as EnterpriseInquiry[];
    },
  });
}

export function useSellerInquiries() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<EnterpriseInquiry[]>({
    queryKey: ["seller-inquiries", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Join with listings to filter by organization
      const { data, error } = await (supabase.from("inquiries") as any)
        .select("*, listing:listing_id(title, type, organization_id, horse_id)")
        .order("created_at", { ascending: false });

      if (error) return [];
      return ((data || []) as any[]).filter(
        (inq: any) => inq.listing?.organization_id === orgId
      ) as EnterpriseInquiry[];
    },
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newInquiry: {
        listing_id: string;
        message: string;
        buyer_name?: string;
        buyer_email?: string;
        buyer_phone?: string;
        buyer_country?: string;
        inquiry_type?: string;
      }
    ) => {
      const { data, error } = await (supabase.from("inquiries") as any)
        .insert([{
          ...newInquiry,
          status: "Pending",
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", variables.listing_id] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["seller-inquiries"] });
    },
  });
}

export function useReplyToInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const { data, error } = await (supabase.from("inquiries") as any)
        .update({ seller_reply: reply, status: "Replied", replied_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["seller-inquiries"] });
    },
  });
}

export { useApp } from "../store";

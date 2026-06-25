import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];

export function useListings(typeFilter?: string) {
  return useQuery<any[]>({
    queryKey: ["listings", typeFilter],
    queryFn: async () => {
      // Fetch listings and join with horse details (if horse_id is set) and seller profiles
      let query = supabase
        .from("listings")
        .select(`
          *,
          horses:horse_id (
            name,
            breed,
            age,
            sex,
            color,
            discipline,
            image_url,
            location,
            trainer,
            wins,
            bloodline,
            story,
            temperament,
            latest_achievement,
            badges
          ),
          profiles:seller_id (
            name,
            stable_name
          )
        `)
        .order("created_at", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]).map((listing) => {
        if (listing.horses && listing.horses.image_url?.startsWith('/src/assets/')) {
          listing.horses.image_url = listing.horses.image_url.replace('/src/assets/', '/media/');
        }
        return listing;
      });
    },
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newListing: Omit<Database["public"]["Tables"]["listings"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("listings") as any)
        .insert([newListing])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Database["public"]["Tables"]["listings"]["Update"]>;
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
    },
  });
}

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
    },
  });
}

export function useFavorites() {
  return useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("*");
      if (error) throw error;
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
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);
        if (error) throw error;
        return { listingId, added: false };
      } else {
        // Add to favorites
        const { data, error } = await (supabase
          .from("favorites") as any)
          .insert({ user_id: userId, listing_id: listingId })
          .select()
          .single();
        if (error) throw error;
        return { listingId, added: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useInquiries(listingId?: string) {
  return useQuery<Inquiry[]>({
    queryKey: ["inquiries", listingId],
    queryFn: async () => {
      let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
      if (listingId) {
        query = query.eq("listing_id", listingId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Inquiry[];
    },
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newInquiry: Omit<Database["public"]["Tables"]["inquiries"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("inquiries") as any)
        .insert([newInquiry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", variables.listing_id] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });
}

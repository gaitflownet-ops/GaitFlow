import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import { useApp } from "../store";
import type { Database } from "../supabase.types";
import { toast } from "sonner";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export type DocumentFilters = {
  owner_type?: string;
  owner_id?: string;
  category?: string;
  verified?: string;
};

/**
 * Hook to fetch documents based on filters
 */
export function useDocuments(filters?: DocumentFilters) {
  const { state } = useApp();
  const organization_id = state.user?.organization_id;

  return useQuery({
    queryKey: ["documents", organization_id, filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !organization_id) return [];

      let query = supabase
        .from("documents")
        .select("*")
        .eq("organization_id", organization_id)
        .order("created_at", { ascending: false });

      if (filters?.owner_type) query = query.eq("owner_type", filters.owner_type);
      if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id);
      if (filters?.category) query = query.eq("type", filters.category);
      if (filters?.verified) query = query.eq("verified", filters.verified);

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentRow[];
    },
    enabled: !!organization_id && isSupabaseConfigured,
  });
}

/**
 * Generate SHA-256 hash of a file
 */
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Hook to upload a new document (or new version)
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (params: {
      file: File;
      name: string;
      type: string;
      issue_date?: string;
      expiration_date?: string;
      access_level?: string;
      owner_type?: string;
      owner_id?: string;
      reference_module?: string;
      reference_id?: string;
      previous_version_id?: string;
    }) => {
      if (!isSupabaseConfigured || !state.user?.organization_id) throw new Error("No org");

      // 1. Generate SHA-256 Hash
      const hash = await generateFileHash(params.file);

      // 2. Upload file to Storage
      const fileExt = params.file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${state.user.organization_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("horse-documents")
        .upload(filePath, params.file, { upsert: false });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("horse-documents").getPublicUrl(filePath);

      // 4. Calculate new version if it's an update
      let newVersion = 1;
      if (params.previous_version_id) {
        const { data: prevDoc } = await (supabase as any)
          .from("documents")
          .select("version")
          .eq("id", params.previous_version_id)
          .single();
        if (prevDoc) {
          newVersion = (prevDoc.version || 1) + 1;
        }
      }

      // 5. Auto-verify if uploader is OWNER or SUPER_ADMIN
      const userRole = state.user.role?.toUpperCase() || "";
      const isOwnerOrAdmin = ["OWNER", "SUPER_ADMIN", "STABLE_ADMIN"].includes(userRole);
      const autoVerified = isOwnerOrAdmin ? "Revisado" : "Pendiente";

      // 6. Insert record in Database
      const { data, error: insertError } = await (supabase as any)
        .from("documents")
        .insert({
          organization_id: state.user.organization_id,
          name: params.name,
          type: params.type,
          file_url: publicUrl,
          file_size: params.file.size.toString(),
          uploaded_by: state.user.id,
          issue_date: params.issue_date || null,
          expiration_date: params.expiration_date || null,
          access_level: params.access_level || "private",
          integrity_hash: hash,
          version: newVersion,
          owner_type: params.owner_type || null,
          owner_id: params.owner_id || null,
          reference_module: params.reference_module || null,
          reference_id: params.reference_id || null,
          previous_version_id: params.previous_version_id || null,
          verified: autoVerified,
          verified_by: isOwnerOrAdmin ? state.user.id : null,
          verification_date: isOwnerOrAdmin ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) {
        // Rollback storage if DB fails
        await supabase.storage.from("horse-documents").remove([filePath]);
        throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento subido exitosamente.");
    },
    onError: (err: any) => {
      toast.error(`Error al subir documento: ${err.message}`);
    },
  });
}

/**
 * Hook to verify a document
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (params: { id: string; status: "Revisado" | "No válido" | "Pendiente" }) => {
      if (!isSupabaseConfigured) throw new Error("Supabase no configurado");
      const { error } = await (supabase as any)
        .from("documents")
        .update({
          verified: params.status,
          verified_by: state.user?.id,
          verification_date: new Date().toISOString(),
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Estado de verificación actualizado.");
    },
  });
}

/**
 * Hook to delete a document (or archive it ideally, but let's do delete for now)
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      if (!isSupabaseConfigured) throw new Error("Supabase no configurado");
      // Optionally remove from storage as well
      const urlParts = doc.file_url.split("/");
      const fileName = urlParts.pop();
      const orgFolder = urlParts.pop();
      if (fileName && orgFolder) {
        await supabase.storage.from("horse-documents").remove([`${orgFolder}/${fileName}`]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento eliminado.");
    },
  });
}

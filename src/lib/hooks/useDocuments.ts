import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { Database } from "../supabase.types";

export type Document = Database["public"]["Tables"]["documents"]["Row"];

// Initial mock files for the document vault seed
const seededDocs: Document[] = [
  {
    id: "doc-1",
    name: "Equestrian Passport Scan",
    category: "Passport",
    file_url: "https://gaitflow.s3.amazonaws.com/vault/documents/passport_scan.pdf",
    file_size: "1.4 MB",
    horse_id: "northern-flame",
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "doc-2",
    name: "Coggins Test Record 2026",
    category: "Coggins",
    file_url: "https://gaitflow.s3.amazonaws.com/vault/documents/coggins_2026.pdf",
    file_size: "450 KB",
    horse_id: "northern-flame",
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "doc-3",
    name: "Breeding Stud Agreement",
    category: "Contract",
    file_url: "https://gaitflow.s3.amazonaws.com/vault/documents/breeding_stud_agreement.pdf",
    file_size: "2.1 MB",
    horse_id: "ember-rose",
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "doc-4",
    name: "FEI Health Certificate",
    category: "Health Certificate",
    file_url: "https://gaitflow.s3.amazonaws.com/vault/documents/health_cert.pdf",
    file_size: "980 KB",
    horse_id: "midnight-oak",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

function getLocalStorageDocs(): Document[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("gaitflow_documents");
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem("gaitflow_documents", JSON.stringify(seededDocs));
  return seededDocs;
}

function saveLocalStorageDocs(list: Document[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gaitflow_documents", JSON.stringify(list));
}

export function useDocuments(horseId?: string) {
  return useQuery<Document[]>({
    queryKey: ["documents", horseId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageDocs();
        if (horseId) {
          return list.filter((doc) => doc.horse_id === horseId);
        }
        return list;
      }

      if (!horseId) return [];
      
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("horse_id", horseId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("relation \"documents\" does not exist")) {
          return [];
        }
        throw error;
      }
      return data as Document[];
    },
    enabled: !!horseId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDoc: Database["public"]["Tables"]["documents"]["Insert"]) => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageDocs();
        const created: Document = {
          ...newDoc,
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          file_size: newDoc.file_size ?? "1.0 MB",
          horse_id: newDoc.horse_id ?? null,
        } as Document;

        const updatedList = [created, ...list];
        saveLocalStorageDocs(updatedList);
        return created;
      }

      const { data, error } = await (supabase.from("documents") as any)
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.horse_id) {
        queryClient.invalidateQueries({ queryKey: ["documents", variables.horse_id] });
      }
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, horseId }: { id: string; horseId: string }) => {
      if (!isSupabaseConfigured) {
        const list = getLocalStorageDocs();
        const updatedList = list.filter((doc) => doc.id !== id);
        saveLocalStorageDocs(updatedList);
        return { id, horseId };
      }

      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      return { id, horseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", data.horseId] });
    },
  });
}

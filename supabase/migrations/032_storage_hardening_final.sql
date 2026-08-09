-- ============================================================
-- Migration: 032_storage_hardening_final.sql
-- Purpose: 
--   1. Refactor public.get_storage_org_id to be IMMUTABLE, PARALLEL SAFE,
--      without SECURITY DEFINER, with leading slash sanitization and regex UUID validation.
--   2. Enforce both USING and WITH CHECK clauses on horse_documents_tenant_update policy.
--   3. Drop all legacy and overly permissive policies for horse-documents bucket.
-- ============================================================

-- 1. Refactorización segura de la función public.get_storage_org_id
CREATE OR REPLACE FUNCTION public.get_storage_org_id(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  clean_path TEXT;
  parts TEXT[];
  candidate TEXT;
BEGIN
  IF object_name IS NULL OR length(trim(object_name)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Sanitizar slashes iniciales (ej. '/org-id/file.pdf' -> 'org-id/file.pdf')
  clean_path := ltrim(object_name, '/');
  
  -- Dividir en segmentos por '/'
  parts := string_to_array(clean_path, '/');
  
  IF array_length(parts, 1) >= 1 THEN
    candidate := parts[1];
    -- Validar formato UUID v4 estricto mediante Expresión Regular
    IF candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN candidate::UUID;
    END IF;
  END IF;
  
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 2. Limpieza de Políticas Legacy en storage.objects para horse-documents
DROP POLICY IF EXISTS "Public horse documents"                        ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload horse documents" ON storage.objects;
DROP POLICY IF EXISTS "Public horse documents select"                 ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_public_select"                 ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_private_select"                ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_private_insert"                ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_private_delete"                ON storage.objects;

-- 3. Re-creación Estricta de la Política UPDATE con USING + WITH CHECK
DROP POLICY IF EXISTS "horse_documents_tenant_update" ON storage.objects;

CREATE POLICY "horse_documents_tenant_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'horse-documents'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  )
  WITH CHECK (
    bucket_id = 'horse-documents'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  );

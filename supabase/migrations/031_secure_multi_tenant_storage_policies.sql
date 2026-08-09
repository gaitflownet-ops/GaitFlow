-- ============================================================
-- Migration: 031_secure_multi_tenant_storage_policies.sql
-- Purpose: 
--   1. Enforce private status on horse-documents bucket.
--   2. Implement helper function get_storage_org_id to extract organization_id from object path.
--   3. Create strict multi-tenant RLS policies on storage.objects using public.get_user_orgs().
-- ============================================================

-- 1. Asegurar que el bucket horse-documents sea estrictamente PRIVADO
UPDATE storage.buckets
SET public = false
WHERE id = 'horse-documents';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'horse-documents',
  'horse-documents',
  false, -- Estrictamente privado
  52428800, -- 50MB máximo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Función Helper: Extrae el organization_id del path del archivo ({organization_id}/{filename})
CREATE OR REPLACE FUNCTION public.get_storage_org_id(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  parts TEXT[];
BEGIN
  parts := string_to_array(object_name, '/');
  IF array_length(parts, 1) >= 1 THEN
    RETURN parts[1]::UUID;
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 3. Limpiar políticas antiguas desalineadas o basadas en el esquema legacy stable_id
DROP POLICY IF EXISTS "horse_documents_private_select" ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_private_insert" ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_private_delete" ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_tenant_select"  ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_tenant_insert"  ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_tenant_update"  ON storage.objects;
DROP POLICY IF EXISTS "horse_documents_tenant_delete"  ON storage.objects;

-- 4. Crear Políticas Multi-Tenant Estrictas por organization_id en storage.objects

-- Lectura: Solo usuarios que pertenezcan a la organización del primer segmento de la ruta
CREATE POLICY "horse_documents_tenant_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'horse-documents'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  );

-- Inserción: Solo usuarios autenticados subiendo a la ruta de su propia organización
CREATE POLICY "horse_documents_tenant_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'horse-documents'
    AND auth.role() = 'authenticated'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  );

-- Actualización: Solo usuarios pertenecientes a la organización propietaria
CREATE POLICY "horse_documents_tenant_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'horse-documents'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  );

-- Eliminación: Solo usuarios pertenecientes a la organización propietaria
CREATE POLICY "horse_documents_tenant_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'horse-documents'
    AND public.get_storage_org_id(name) = ANY(public.get_user_orgs())
  );

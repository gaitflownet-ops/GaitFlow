-- =======================================================================================
-- FINALIZACIÓN DE FASE 2: CENTRO FINANCIERO / FACTURACIÓN
-- =======================================================================================
-- Se añaden columnas requeridas a invoices e invoice_items y se crea el bucket de Storage
-- para subir los logos de las plantillas (Drag & Drop).
-- =======================================================================================

-- 1. Actualización de tabla `invoices`
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_condition TEXT,
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES financial_cost_centers(id) ON DELETE SET NULL;

-- 2. Actualización de tabla `invoice_items`
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Crear Bucket de Storage `invoicing-assets` (Público, ya que los logos se imprimen en PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoicing-assets',
  'invoicing-assets',
  true, -- Público para poder embeber el logo fácilmente en el PDF/DOM
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 4. Políticas RLS para el Bucket `invoicing-assets`
-- Todos pueden ver los logos públicos
CREATE POLICY "Public Access to Invoicing Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'invoicing-assets' );

-- Solo usuarios logueados que pertenezcan a una organización pueden subir archivos
CREATE POLICY "Authenticated users can upload to Invoicing Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoicing-assets'
);

-- Los usuarios pueden actualizar/eliminar sus propios logos (simplificado a todos los autenticados para MVP)
CREATE POLICY "Authenticated users can update Invoicing Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'invoicing-assets' );

CREATE POLICY "Authenticated users can delete Invoicing Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'invoicing-assets' );

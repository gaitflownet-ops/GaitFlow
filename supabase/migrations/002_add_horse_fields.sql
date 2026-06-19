-- Add new columns to horses table for C.1 Horse Module
ALTER TABLE horses 
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS microchip TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS usef_id TEXT,
ADD COLUMN IF NOT EXISTS fei_id TEXT,
ADD COLUMN IF NOT EXISTS aqha_id TEXT,
ADD COLUMN IF NOT EXISTS registry_number TEXT,
ADD COLUMN IF NOT EXISTS ownership_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS acquisition_date TEXT,
ADD COLUMN IF NOT EXISTS estimated_value TEXT,
ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES horses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES horses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sire_name TEXT,
ADD COLUMN IF NOT EXISTS dam_name TEXT;

-- Create documents table for G.2 Document Vault & C.1 Documents tab
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Passport', 'Contract', 'Health Certificate', 'Coggins', 'Pedigree', 'Other'
  file_url TEXT NOT NULL,
  file_size TEXT,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies: viewable and insertable by horse owners
CREATE POLICY "Documents are viewable by horse owner" ON documents 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM horses WHERE id = horse_id AND owner_id = auth.uid())
);

CREATE POLICY "Documents insertable by horse owner" ON documents 
FOR ALL USING (
  EXISTS (SELECT 1 FROM horses WHERE id = horse_id AND owner_id = auth.uid())
);

-- Insert bucket for horse documents
INSERT INTO storage.buckets (id, name, public) VALUES ('horse-documents', 'horse-documents', true) ON CONFLICT DO NOTHING;

-- Storage Policies for documents
CREATE POLICY "Public horse documents" ON storage.objects FOR SELECT USING (bucket_id = 'horse-documents');
CREATE POLICY "Authenticated users can upload horse documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'horse-documents' AND auth.role() = 'authenticated');

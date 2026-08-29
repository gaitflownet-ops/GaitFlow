-- Migration 031: Marketplace Enterprise Enhancements
-- Adds: views_count, listing_images, negotiation_terms, buyer contact fields, listing stats

-- 1. Add enterprise columns to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiries_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS negotiation_terms text,
  ADD COLUMN IF NOT EXISTS listing_status varchar(20) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS sold_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_email text,
  ADD COLUMN IF NOT EXISTS buyer_phone text,
  ADD COLUMN IF NOT EXISTS buyer_country text,
  ADD COLUMN IF NOT EXISTS sale_price numeric(15,2),
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discipline varchar(100),
  ADD COLUMN IF NOT EXISTS location_country varchar(100),
  ADD COLUMN IF NOT EXISTS location_city varchar(100);

-- 2. Add buyer contact fields to inquiries
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS buyer_name text,
  ADD COLUMN IF NOT EXISTS buyer_email text,
  ADD COLUMN IF NOT EXISTS buyer_phone text,
  ADD COLUMN IF NOT EXISTS buyer_country text,
  ADD COLUMN IF NOT EXISTS inquiry_type varchar(50) DEFAULT 'Information',
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS seller_reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- 3. Create listing_images table for multi-photo support
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Create sale_closings table (audit trail of completed sales)
CREATE TABLE IF NOT EXISTS sale_closings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES listings(id),
  horse_id uuid REFERENCES horses(id),
  organization_id uuid,
  seller_id uuid,
  buyer_name text NOT NULL,
  buyer_email text,
  buyer_phone text,
  buyer_country text,
  sale_price numeric(15,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  contract_url text,
  invoice_id uuid,
  vault_document_id uuid,
  closed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Function to auto-increment views_count when listing is viewed
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE listings SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to sync inquiries_count after insert
CREATE OR REPLACE FUNCTION sync_listing_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings SET inquiries_count = (
    SELECT COUNT(*) FROM inquiries WHERE listing_id = NEW.listing_id
  ) WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_inquiry_count ON inquiries;
CREATE TRIGGER trg_sync_inquiry_count
AFTER INSERT ON inquiries
FOR EACH ROW EXECUTE FUNCTION sync_listing_inquiry_count();

-- 7. RLS for listing_images
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listing_images_public_read" ON listing_images;
CREATE POLICY "listing_images_public_read" ON listing_images
  FOR SELECT USING (true);

-- 8. RLS for sale_closings  
ALTER TABLE sale_closings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_closings_org_isolation" ON sale_closings;
CREATE POLICY "sale_closings_org_isolation" ON sale_closings
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

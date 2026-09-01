-- Migration 033: Marketplace Public Access
-- Allows anonymous users to browse active listings and submit inquiries without an account.

-- 1. PUBLIC READ ACCESS FOR LISTINGS (Active only)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_public_read" ON listings;
DROP POLICY IF EXISTS "listings_org_all_read" ON listings;
DROP POLICY IF EXISTS "listings_insert" ON listings;
DROP POLICY IF EXISTS "listings_update" ON listings;
DROP POLICY IF EXISTS "listings_delete" ON listings;

-- Allow ANYONE (anon + authenticated) to read Active listings
CREATE POLICY "listings_public_read" ON listings
  FOR SELECT
  USING (listing_status = 'Active' OR listing_status IS NULL);

-- Allow authenticated users to also read their own org listings (any status)
CREATE POLICY "listings_org_all_read" ON listings
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Allow authenticated users to INSERT listings
CREATE POLICY "listings_insert" ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Allow authenticated users to UPDATE their org listings
CREATE POLICY "listings_update" ON listings
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Allow authenticated users to DELETE their org listings
CREATE POLICY "listings_delete" ON listings
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- 2. PUBLIC INQUIRY SUBMISSION (anon can send contact forms)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_public_insert" ON inquiries;
DROP POLICY IF EXISTS "inquiries_seller_read" ON inquiries;
DROP POLICY IF EXISTS "inquiries_seller_update" ON inquiries;

CREATE POLICY "inquiries_public_insert" ON inquiries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "inquiries_seller_read" ON inquiries
  FOR SELECT
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "inquiries_seller_update" ON inquiries
  FOR UPDATE
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

-- 3. LISTING IMAGES — Public read
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listing_images_public_read" ON listing_images;
CREATE POLICY "listing_images_public_read" ON listing_images
  FOR SELECT USING (true);

-- 4. FAVORITES — Only authenticated users
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_user_access" ON favorites;
CREATE POLICY "favorites_user_access" ON favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Add granular classification columns to listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS sub_type varchar(50),
  ADD COLUMN IF NOT EXISTS location_farm varchar(150),
  ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false;

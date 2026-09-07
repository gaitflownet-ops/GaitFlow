-- Rich media for marketplace listings: photographs remain in images and videos are stored separately.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;

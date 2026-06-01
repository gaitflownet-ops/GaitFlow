-- Create tables for EquiSales

-- 1. Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Owner',
  stable_name TEXT,
  initials TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Farms
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  logo_initials TEXT,
  cover_image_url TEXT,
  specialties TEXT[],
  badges TEXT[],
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Horses
CREATE TABLE horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  barn_name TEXT NOT NULL,
  breed TEXT,
  age INT,
  sex TEXT,
  color TEXT,
  discipline TEXT,
  owner_id UUID REFERENCES profiles(id),
  trainer TEXT,
  location TEXT,
  farm_id UUID REFERENCES farms(id),
  bloodline TEXT,
  latest_achievement TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'In Training',
  wins INT DEFAULT 0,
  earnings TEXT,
  price TEXT,
  sale_status TEXT DEFAULT 'Not for Sale',
  badges TEXT[],
  temperament INT,
  story TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Updates
CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_url TEXT,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  by TEXT NOT NULL,
  at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Competitions
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) NOT NULL,
  event TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  category TEXT,
  placement TEXT,
  rider TEXT,
  prize TEXT,
  notes TEXT,
  judges TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Health Records
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) NOT NULL,
  horse_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL,
  professional TEXT NOT NULL,
  date TEXT NOT NULL,
  next_due TEXT,
  status TEXT DEFAULT 'clear',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Genetics
CREATE TABLE genetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  sire TEXT NOT NULL,
  dam TEXT NOT NULL,
  price TEXT,
  availability TEXT,
  description TEXT,
  expected_traits TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  horse_id UUID REFERENCES horses(id),
  at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles: Anyone can view profiles, users can update their own
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Farms: Public read
CREATE POLICY "Farms are viewable by everyone." ON farms FOR SELECT USING (true);
CREATE POLICY "Farm owners can update" ON farms FOR ALL USING (auth.uid() = owner_id);

-- Horses: Public read
CREATE POLICY "Horses are viewable by everyone." ON horses FOR SELECT USING (is_public = true);
CREATE POLICY "Horse owners can update" ON horses FOR ALL USING (auth.uid() = owner_id);

-- Updates: Owner only for now (or public if associated horse is public)
CREATE POLICY "Updates are viewable by horse owner" ON updates FOR SELECT USING (true);
CREATE POLICY "Updates insertable by owner" ON updates FOR ALL USING (auth.uid() = owner_id);

-- Competitions: Public read
CREATE POLICY "Competitions are viewable by everyone." ON competitions FOR SELECT USING (true);
CREATE POLICY "Competitions insertable by owner" ON competitions FOR ALL USING (
  EXISTS (SELECT 1 FROM horses WHERE id = horse_id AND owner_id = auth.uid())
);

-- Health Records: Owner only
CREATE POLICY "Health records are viewable by horse owner" ON health_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM horses WHERE id = horse_id AND owner_id = auth.uid())
);
CREATE POLICY "Health records insertable by owner" ON health_records FOR ALL USING (
  EXISTS (SELECT 1 FROM horses WHERE id = horse_id AND owner_id = auth.uid())
);

-- Genetics: Public read
CREATE POLICY "Genetics are viewable by everyone." ON genetics FOR SELECT USING (true);

-- Notifications: User only
CREATE POLICY "Notifications are viewable by user" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications updateable by user" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('horse-images', 'horse-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('farm-covers', 'farm-covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('updates-media', 'updates-media', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public horse images" ON storage.objects FOR SELECT USING (bucket_id = 'horse-images');
CREATE POLICY "Public farm covers" ON storage.objects FOR SELECT USING (bucket_id = 'farm-covers');
CREATE POLICY "Public updates media" ON storage.objects FOR SELECT USING (bucket_id = 'updates-media');

CREATE POLICY "Authenticated users can upload horse images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'horse-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload farm covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'farm-covers' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload update media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'updates-media' AND auth.role() = 'authenticated');

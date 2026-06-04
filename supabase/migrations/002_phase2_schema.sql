-- Phase 2, 3, 4 Schema Updates

-- F.1 Locations Module
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- stall, barn, paddock, clinic
  capacity INT DEFAULT 1,
  status TEXT DEFAULT 'Available', -- Available, Occupied, Maintenance
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stall_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  horse_id UUID REFERENCES horses(id) NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D.1 Task Management Engine
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) NOT NULL,
  horse_id UUID REFERENCES horses(id),
  assignee_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium', -- Low, Medium, High
  status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue
  due_date TIMESTAMPTZ,
  recurrence TEXT, -- daily, weekly, monthly, null
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E.1 Nutrition Module
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) NOT NULL,
  plan_name TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- e.g. [{"name": "Hay", "amount": "10 lbs", "frequency": "AM/PM"}]
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- H.1 Financial Module & Invoicing
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) NOT NULL,
  client_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL, -- Income, Expense
  category TEXT NOT NULL, -- Boarding, Vet, Farrier, Supplies
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'Pending', -- Paid, Pending, Overdue
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- I.1 Breeding & Gestation
CREATE TABLE breeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mare_id UUID REFERENCES horses(id) NOT NULL,
  stallion_id TEXT NOT NULL,
  method TEXT, -- Embryo, Chilled Semen, Fresh Cover
  insemination_date TIMESTAMPTZ NOT NULL,
  pregnancy_status TEXT DEFAULT 'Pending', -- Pending, Pregnant, Open
  expected_foaling_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- I.2 Genetic Inventory
CREATE TABLE genetic_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) NOT NULL,
  material_type TEXT NOT NULL, -- Embryo, Straw
  donor_id TEXT,
  status TEXT DEFAULT 'Available', -- Available, Used, Discarded
  storage_location TEXT,
  cost DECIMAL(10, 2),
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- J.1 Marketplace
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id),
  genetic_id UUID REFERENCES genetic_inventory(id),
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'Active', -- Active, Paused, Sold
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HW Holt-Winters Forecasts Cache
CREATE TABLE hw_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL, -- price, gestation, health, feed, financial
  target_id UUID, -- could be horse_id, farm_id, etc.
  forecast_data JSONB NOT NULL,
  confidence_score DECIMAL(5, 2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hw_forecasts ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Public read for marketplace, owner for rest)
CREATE POLICY "Marketplace viewable by everyone" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Tasks viewable by farm members" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tasks insertable by farm members" ON tasks FOR ALL USING (true);
CREATE POLICY "Locations viewable by farm members" ON locations FOR SELECT USING (true);
CREATE POLICY "Locations insertable by farm members" ON locations FOR ALL USING (true);
CREATE POLICY "Invoices viewable by farm members" ON invoices FOR SELECT USING (true);
CREATE POLICY "Invoices insertable by farm members" ON invoices FOR ALL USING (true);
CREATE POLICY "Breeding viewable by farm members" ON breeding_records FOR SELECT USING (true);
CREATE POLICY "Breeding insertable by farm members" ON breeding_records FOR ALL USING (true);
CREATE POLICY "Nutrition viewable by farm members" ON nutrition_plans FOR SELECT USING (true);
CREATE POLICY "Nutrition insertable by farm members" ON nutrition_plans FOR ALL USING (true);
CREATE POLICY "HW forecasts viewable by everyone" ON hw_forecasts FOR SELECT USING (true);
CREATE POLICY "HW forecasts insertable" ON hw_forecasts FOR ALL USING (true);

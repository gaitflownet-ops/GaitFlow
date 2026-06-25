-- ============================================================
-- SECTION A — GaitFlow Public Website
-- Migration 003: Lead Captures, Contact Submissions,
--               Demo Requests, Success Stories
-- ============================================================

-- A.1 Lead Captures (from registration / demo requests / CTAs)
CREATE TABLE IF NOT EXISTS lead_captures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT NOT NULL,
  email          TEXT NOT NULL,
  stable_name    TEXT,
  state_country  TEXT,
  plan_interest  TEXT,         -- 'Starter' | 'Professional' | 'Enterprise'
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_term       TEXT,
  utm_content    TEXT,
  traffic_origin TEXT,         -- full referrer URL
  form_type      TEXT NOT NULL, -- 'registration' | 'demo_request' | 'contact' | 'pricing_cta'
  profile_id     UUID REFERENCES profiles(id), -- populated after registration
  status         TEXT DEFAULT 'new', -- 'new' | 'contacted' | 'converted' | 'disqualified'
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- A.2 Contact / Demo Request Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  stable_name  TEXT,
  subject      TEXT,
  category     TEXT NOT NULL, -- 'support' | 'sales' | 'partnership' | 'general'
  message      TEXT NOT NULL,
  status       TEXT DEFAULT 'new', -- 'new' | 'in_review' | 'resolved'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- A.3 Demo Requests (qualification form + Calendly)
CREATE TABLE IF NOT EXISTS demo_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  stable_name      TEXT,
  business_type    TEXT, -- 'Private Owner' | 'Training Stable' | 'Breeding Farm' | 'Competition Barn' | 'Multi-Location'
  horse_count      TEXT, -- '1-5' | '6-15' | '16-30' | '31-50' | '50+'
  primary_interest TEXT, -- 'Health & Care' | 'Task Management' | 'Marketplace' | 'Financial' | 'Full Suite'
  plan_interest    TEXT, -- 'Starter' | 'Professional' | 'Enterprise'
  scheduled_at     TIMESTAMPTZ,   -- Calendly confirmed booking time
  calendly_event   TEXT,          -- Calendly event URI
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  status           TEXT DEFAULT 'pending', -- 'pending' | 'scheduled' | 'completed' | 'no_show'
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- A.4 Success Stories (bilingual, from DB)
CREATE TABLE IF NOT EXISTS success_stories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_name      TEXT NOT NULL,
  location       TEXT NOT NULL,         -- e.g. 'Ocala, Florida'
  avatar_initials TEXT NOT NULL,
  contact_name   TEXT NOT NULL,
  contact_role   TEXT NOT NULL,
  -- English content
  quote_en       TEXT NOT NULL,
  metric_label_en TEXT NOT NULL,
  metric_value   TEXT NOT NULL,         -- e.g. '40%'
  metric_desc_en TEXT NOT NULL,
  -- Spanish content
  quote_es       TEXT NOT NULL,
  metric_label_es TEXT NOT NULL,
  metric_desc_es TEXT NOT NULL,
  -- ordering & display
  is_featured    BOOLEAN DEFAULT false,
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE lead_captures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories     ENABLE ROW LEVEL SECURITY;

-- Public INSERT (anyone can submit)
DROP POLICY IF EXISTS "Lead captures insertable by anyone" ON lead_captures;
CREATE POLICY "Lead captures insertable by anyone"
  ON lead_captures FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Contact submissions insertable by anyone" ON contact_submissions;
CREATE POLICY "Contact submissions insertable by anyone"
  ON contact_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Demo requests insertable by anyone" ON demo_requests;
CREATE POLICY "Demo requests insertable by anyone"
  ON demo_requests FOR INSERT WITH CHECK (true);

-- Public SELECT (only success stories are public)
DROP POLICY IF EXISTS "Success stories viewable by everyone" ON success_stories;
CREATE POLICY "Success stories viewable by everyone"
  ON success_stories FOR SELECT USING (true);

-- Authenticated SELECT only (for admin/CRM access)
DROP POLICY IF EXISTS "Lead captures viewable by authenticated" ON lead_captures;
CREATE POLICY "Lead captures viewable by authenticated"
  ON lead_captures FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Contact submissions viewable by authenticated" ON contact_submissions;
CREATE POLICY "Contact submissions viewable by authenticated"
  ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Demo requests viewable by authenticated" ON demo_requests;
CREATE POLICY "Demo requests viewable by authenticated"
  ON demo_requests FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed: Initial Success Stories (bilingual)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM success_stories) THEN
    INSERT INTO success_stories
      (farm_name, location, avatar_initials, contact_name, contact_role,
       quote_en, metric_label_en, metric_value, metric_desc_en,
       quote_es, metric_label_es, metric_desc_es,
       is_featured, sort_order)
    VALUES
    (
      'Live Oak Stables',
      'Ocala, Florida',
      'LO',
      'Marisol Vega',
      'Head of Operations',
      'GaitFlow replaced three separate spreadsheets and a whiteboard. Our morning briefings went from 30 minutes to under 5.',
      'Time saved per day',
      '2.5 hrs',
      'Across 42 horses and a team of 8 staff.',
      'GaitFlow reemplazó tres hojas de cálculo separadas y una pizarra. Nuestras reuniones matutinas pasaron de 30 minutos a menos de 5.',
      'Tiempo ahorrado por día',
      'Entre 42 caballos y un equipo de 8 personas.',
      true,
      1
    ),
    (
      'Pinewood Farm',
      'Marion County, Florida',
      'PF',
      'James Thornton',
      'Owner & Trainer',
      'The health calendar and automatic vet reminders alone are worth it. We caught a deworming gap we would have missed entirely.',
      'Missed appointments prevented',
      '0',
      'In our first 6 months of use.',
      'El calendario de salud y los recordatorios automáticos del veterinario ya lo justifican. Detectamos un fallo en el desparasitado que habríamos pasado por alto.',
      'Citas olvidadas evitadas',
      'En nuestros primeros 6 meses de uso.',
      true,
      2
    ),
    (
      'Wellington Elite',
      'Wellington, Florida',
      'WE',
      'Sarah Mitchell',
      'Stable Manager',
      'Our invoicing used to take a full day every month. With GaitFlow it takes 20 minutes, and clients get a PDF that actually looks professional.',
      'Monthly invoicing time reduction',
      '87%',
      'From 8 hours to under 1 hour.',
      'Nuestra facturación solía llevarnos un día completo al mes. Con GaitFlow toma 20 minutos, y los clientes reciben un PDF que realmente parece profesional.',
      'Reducción en tiempo de facturación mensual',
      'De 8 horas a menos de 1 hora.',
      false,
      3
    );
  END IF;
END $$;

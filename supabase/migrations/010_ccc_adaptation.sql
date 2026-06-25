-- Migration: 010_ccc_adaptation.sql
-- Description: Add Colombian Criollo Horse (CCC) specific fields to existing tables

-- 1. Add CCC fields to 'horses' table
ALTER TABLE public.horses
  ADD COLUMN IF NOT EXISTS registered_name text,
  ADD COLUMN IF NOT EXISTS stable_name text,
  ADD COLUMN IF NOT EXISTS gait_type text,
  ADD COLUMN IF NOT EXISTS movement_category text,
  ADD COLUMN IF NOT EXISTS training_level text,
  ADD COLUMN IF NOT EXISTS morphology_notes text,
  ADD COLUMN IF NOT EXISTS criadero text,
  ADD COLUMN IF NOT EXISTS breeder_name text,
  ADD COLUMN IF NOT EXISTS registration_category text,
  ADD COLUMN IF NOT EXISTS fedequinas_id text,
  ADD COLUMN IF NOT EXISTS association text,
  ADD COLUMN IF NOT EXISTS brio integer,
  ADD COLUMN IF NOT EXISTS nobleza integer,
  ADD COLUMN IF NOT EXISTS performance_notes text;

-- 2. Add CCC fields to 'competitions' table
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS gait_category text,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS ribbon_color text,
  ADD COLUMN IF NOT EXISTS championship_title text,
  ADD COLUMN IF NOT EXISTS trainer text;

-- 3. Add CCC fields to 'breeding_cycles' table
ALTER TABLE public.breeding_cycles
  ADD COLUMN IF NOT EXISTS semen_type text,
  ADD COLUMN IF NOT EXISTS breeding_report_number text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 4. Add CCC fields to 'pregnancies' table
ALTER TABLE public.pregnancies
  ADD COLUMN IF NOT EXISTS ultrasound_dates jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stallion_id text,
  ADD COLUMN IF NOT EXISTS birth_report_number text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 5. Add CCC fields to 'listings' table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS gait_type text,
  ADD COLUMN IF NOT EXISTS registration_info text,
  ADD COLUMN IF NOT EXISTS criadero text,
  ADD COLUMN IF NOT EXISTS breeding_value text,
  ADD COLUMN IF NOT EXISTS competition_summary text,
  ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;

-- 6. Add CCC fields to 'mares' table
ALTER TABLE public.mares
  ADD COLUMN IF NOT EXISTS heat_cycle_notes text,
  ADD COLUMN IF NOT EXISTS last_ultrasound date,
  ADD COLUMN IF NOT EXISTS breeding_status text;

-- Force schema cache reload (PGRST)
NOTIFY pgrst, 'reload schema';

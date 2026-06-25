-- Migration: 012_nutrition_center_updates.sql
-- Purpose: Add tracking fields for the global Nutrition Center operations.

-- Add purchase and expiration tracking to feed_inventory
ALTER TABLE feed_inventory
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

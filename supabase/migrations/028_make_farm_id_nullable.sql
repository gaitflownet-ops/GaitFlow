-- Migration: 019_make_farm_id_nullable.sql
-- Purpose: Since the application migrated to organization_id as the primary tenant identifier,
-- farm_id is no longer guaranteed to exist, especially for new accounts that only create an organization.
-- This migration drops the NOT NULL constraint on farm_id for tables created in phase 2.

ALTER TABLE public.tasks ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE public.locations ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE public.genetic_inventory ALTER COLUMN farm_id DROP NOT NULL;

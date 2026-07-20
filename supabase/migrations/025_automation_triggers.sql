-- Migration: 025_automation_triggers.sql
-- Purpose: Connect the operational tables to the System Events Queue via Postgres Triggers

-- 1. Triggers para HEALTH RECORDS
CREATE OR REPLACE FUNCTION trg_emit_health_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es un registro nuevo (INSERT)
  IF TG_OP = 'INSERT' THEN
    PERFORM dispatch_system_event(
      NEW.organization_id,
      'health',
      'health.record.created',
      row_to_json(NEW)::jsonb
    );
  -- Si es una actualización (UPDATE) y queremos detectar cambios de estado, etc.
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM dispatch_system_event(
      NEW.organization_id,
      'health',
      'health.record.updated',
      jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS emit_health_event_trigger ON health_records;
CREATE TRIGGER emit_health_event_trigger
  AFTER INSERT OR UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION trg_emit_health_event();


-- 2. Triggers para MARKETPLACE (Si la tabla existe, que asumo se llama marketplace_listings)
-- Reviso si existe la tabla primero para no romper la migración
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_listings') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION trg_emit_marketplace_event()
      RETURNS TRIGGER AS $f$
      BEGIN
        IF TG_OP = ''UPDATE'' AND OLD.status != ''sold'' AND NEW.status = ''sold'' THEN
          PERFORM dispatch_system_event(
            NEW.organization_id,
            ''marketplace'',
            ''marketplace.sale.completed'',
            row_to_json(NEW)::jsonb
          );
        END IF;
        RETURN NEW;
      END;
      $f$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS emit_marketplace_event_trigger ON marketplace_listings;
      CREATE TRIGGER emit_marketplace_event_trigger
        AFTER UPDATE ON marketplace_listings
        FOR EACH ROW EXECUTE FUNCTION trg_emit_marketplace_event();
    ';
  END IF;
END $$;

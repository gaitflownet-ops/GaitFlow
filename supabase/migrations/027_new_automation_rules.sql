-- Migration: 027_new_automation_rules.sql
-- Purpose: Add triggers and seed rules for Phase 3 Automation Engine Expansion

-- 1. Triggers para INVENTARIO (Stock added, Stock low)
CREATE OR REPLACE FUNCTION trg_emit_inventory_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Stock Added (Insert) con costo > 0
  IF TG_OP = 'INSERT' AND NEW.cost_per_unit > 0 THEN
    PERFORM dispatch_system_event(
      NEW.organization_id,
      'inventory',
      'inventory.stock_added',
      row_to_json(NEW)::jsonb
    );
  END IF;
  
  -- Stock Low (Update)
  IF TG_OP = 'UPDATE' AND NEW.stock_quantity <= NEW.min_stock_alert AND OLD.stock_quantity > NEW.min_stock_alert THEN
    PERFORM dispatch_system_event(
      NEW.organization_id,
      'inventory',
      'inventory.stock_low',
      row_to_json(NEW)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS emit_inventory_event_trigger ON pharmaceutical_inventory;
CREATE TRIGGER emit_inventory_event_trigger
  AFTER INSERT OR UPDATE ON pharmaceutical_inventory
  FOR EACH ROW EXECUTE FUNCTION trg_emit_inventory_event();


-- 2. Triggers para CABALLOS (Breeding)
CREATE OR REPLACE FUNCTION trg_emit_horse_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Pregnancy Confirmed (Cambio de status a breeding)
  IF TG_OP = 'UPDATE' AND LOWER(OLD.status) != 'breeding' AND (LOWER(NEW.status) = 'breeding' OR LOWER(NEW.status) = 'en reproducción') THEN
    PERFORM dispatch_system_event(
      NEW.organization_id,
      'breeding',
      'breeding.pregnancy_confirmed',
      row_to_json(NEW)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS emit_horse_event_trigger ON horses;
CREATE TRIGGER emit_horse_event_trigger
  AFTER UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION trg_emit_horse_event();


-- 3. Triggers para MOVIMIENTOS (Location Changed)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ccc_location_movements') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION trg_emit_movement_event()
      RETURNS TRIGGER AS $f$
      BEGIN
        IF TG_OP = ''INSERT'' THEN
          PERFORM dispatch_system_event(
            NEW.organization_id,
            ''horse'',
            ''horse.location_changed'',
            row_to_json(NEW)::jsonb
          );
        END IF;
        RETURN NEW;
      END;
      $f$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS emit_movement_event_trigger ON ccc_location_movements;
      CREATE TRIGGER emit_movement_event_trigger
        AFTER INSERT ON ccc_location_movements
        FOR EACH ROW EXECUTE FUNCTION trg_emit_movement_event();
    ';
  END IF;
END $$;


-- 4. Sembrar las 5 reglas maestras para todas las organizaciones existentes
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    
    -- Regla 1: Inventario a Finanzas (Stock added -> Expense)
    INSERT INTO automation_rules (organization_id, name, description, trigger_module, trigger_event, trigger_conditions, action_type, action_config, is_enabled, priority)
    VALUES (
      org_record.id,
      'Generar Gasto por Nuevo Medicamento',
      'Crea una factura de compra cuando ingresa un nuevo insumo al inventario con costo > 0',
      'inventory',
      'inventory.stock_added',
      '{}',
      'create_expense',
      '{
         "amount_compute": { "field1": "cost_per_unit", "field2": "stock_quantity", "operator": "multiply" },
         "description_template": "Compra de Insumo (Inventario): {{name}}"
       }'::jsonb,
      true,
      100
    ) ON CONFLICT DO NOTHING;

    -- Regla 2: Alerta de Stock a Tareas
    INSERT INTO automation_rules (organization_id, name, description, trigger_module, trigger_event, trigger_conditions, action_type, action_config, is_enabled, priority)
    VALUES (
      org_record.id,
      'Alerta de Stock Crítico',
      'Genera una tarea cuando un medicamento baja de su límite mínimo',
      'inventory',
      'inventory.stock_low',
      '{}',
      'create_task',
      '{
         "title_template": "¡Stock crítico! Comprar más {{name}}"
       }'::jsonb,
      true,
      90
    ) ON CONFLICT DO NOTHING;

    -- Regla 3: Reproducción a Salud
    INSERT INTO automation_rules (organization_id, name, description, trigger_module, trigger_event, trigger_conditions, action_type, action_config, is_enabled, priority)
    VALUES (
      org_record.id,
      'Agendar Ecografías por Preñez',
      'Crea un aviso para agendar ecografías cuando se confirma la preñez',
      'breeding',
      'breeding.pregnancy_confirmed',
      '{}',
      'create_task',
      '{
         "title_template": "Agendar ecografías (30, 45, 60 días) para la yegua {{name}}"
       }'::jsonb,
      true,
      80
    ) ON CONFLICT DO NOTHING;

    -- Regla 4: Movimiento a Cobro
    INSERT INTO automation_rules (organization_id, name, description, trigger_module, trigger_event, trigger_conditions, action_type, action_config, is_enabled, priority)
    VALUES (
      org_record.id,
      'Facturar Llegada de Caballo',
      'Genera una factura borrador cuando un caballo cambia de locación/llega',
      'horse',
      'horse.location_changed',
      '{}',
      'create_invoice',
      '{
         "amount_field": "cost",
         "description_template": "Pensión / Mensualidad por ingreso de caballo",
         "timeline_title": "Factura de pensión generada por movimiento"
       }'::jsonb,
      true,
      70
    ) ON CONFLICT DO NOTHING;

    -- Regla 5: Salud a Tareas Médicas (Completado -> Historial Clínico)
    -- En este caso lo configuramos por defecto
    INSERT INTO automation_rules (organization_id, name, description, trigger_module, trigger_event, trigger_conditions, action_type, action_config, is_enabled, priority)
    VALUES (
      org_record.id,
      'Registrar Tarea Médica en Historial',
      'Genera un registro médico cuando una tarea de salud se marca como completada',
      'task',
      'task.health_completed',
      '{}',
      'create_health_record',
      '{
         "notes_template": "Tarea completada: {{title}}"
       }'::jsonb,
      true,
      60
    ) ON CONFLICT DO NOTHING;

  END LOOP;
END $$;

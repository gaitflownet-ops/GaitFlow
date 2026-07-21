-- Migration: 024_initial_automation_seed.sql
-- Purpose: Crear reglas de automatización por defecto que las organizaciones pueden activar o desactivar

-- Función helper para asegurar que la organización tenga sus reglas iniciales
CREATE OR REPLACE FUNCTION seed_organization_automation_rules(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 1. Salud -> Gastos (Consultas y Vacunas)
  INSERT INTO automation_rules (
    organization_id, name, description, is_enabled, is_system, priority,
    trigger_module, trigger_event, trigger_conditions,
    action_type, action_config
  ) VALUES (
    org_id, 
    'Generar Gasto desde Módulo de Salud', 
    'Crea un gasto automáticamente cuando se registra un evento de salud (consulta, vacuna, etc.) con costo.',
    true, true, 10,
    'health', 'health.record.created', 
    '{"field": "cost", "operator": "gt", "value": 0}'::jsonb,
    'create_expense',
    '{"description_template": "Registro de Salud - {{type}}: {{horse_name}}", "amount_field": "cost", "status": "pending", "category": "Veterinaria y Sanidad"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- 2. Marketplace -> Factura / Ingreso
  INSERT INTO automation_rules (
    organization_id, name, description, is_enabled, is_system, priority,
    trigger_module, trigger_event, trigger_conditions,
    action_type, action_config
  ) VALUES (
    org_id, 
    'Facturar Venta de Ejemplar', 
    'Genera una factura borrador e ingreso cuando un caballo se marca como Vendido en el Marketplace.',
    true, true, 20,
    'marketplace', 'marketplace.sale.completed', 
    '{}'::jsonb,
    'create_invoice',
    '{"status": "draft", "description_template": "Venta de Ejemplar: {{horse_name}}", "amount_field": "price"}'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Aquí se pueden agregar más en el futuro (Nutrición, Competencias, Reproducción)
END;
$$ LANGUAGE plpgsql;

-- Al crear una organización nueva, se le insertan estas reglas por defecto
CREATE OR REPLACE FUNCTION trg_seed_org_rules()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_organization_automation_rules(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_org_rules_on_create ON organizations;
CREATE TRIGGER trg_seed_org_rules_on_create
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION trg_seed_org_rules();

-- Ejecutar para las organizaciones que ya existen (retroactividad)
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    PERFORM seed_organization_automation_rules(org.id);
  END LOOP;
END;
$$;

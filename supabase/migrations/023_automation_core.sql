-- Migration: 023_automation_core.sql
-- Purpose: Create foundational tables for the Event-Driven Architecture (Automation Engine, Timeline, Notifications)

-- ────────────────────────────────────────────────────────────
-- 1. System Events Queue (El Bus de Eventos)
-- ────────────────────────────────────────────────────────────
-- Toda acción importante en cualquier módulo insertará un registro aquí.
-- Una Edge Function escuchará estas inserciones para orquestar la lógica asíncrona.

CREATE TABLE IF NOT EXISTS system_events_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  module          TEXT NOT NULL, -- ej: 'health', 'marketplace', 'crm'
  event_name      TEXT NOT NULL, -- ej: 'health.record.created'
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb, -- Datos del evento (ej: { "cost": 100000, "horse_id": "..." })
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seq_org_status ON system_events_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_seq_module_event ON system_events_queue(module, event_name);

ALTER TABLE system_events_queue ENABLE ROW LEVEL SECURITY;
-- Solo el sistema (Edge Functions / Triggers) y administradores deben ver esto
CREATE POLICY "events_org_isolation" ON system_events_queue
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ────────────────────────────────────────────────────────────
-- 2. Global Timeline (El Feed Visual del ERP)
-- ────────────────────────────────────────────────────────────
-- Aquí se registran todos los hitos (tanto manuales como automatizados)
-- para que el usuario pueda ver la "historia" de la organización en tiempo real.

CREATE TABLE IF NOT EXISTS global_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  module          TEXT NOT NULL, -- 'health', 'financial', 'automation', etc.
  icon            TEXT,          -- Opcional para la UI (ej: 'Activity', 'DollarSign')
  metadata        JSONB DEFAULT '{}'::jsonb, -- Enlaces a entidades (ej: { "invoice_id": "..." })
  is_automated    BOOLEAN DEFAULT FALSE,     -- Para distinguir acciones hechas por el Automation Engine
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_org_time ON global_timeline(organization_id, created_at DESC);

ALTER TABLE global_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_org_isolation" ON global_timeline
  USING (organization_id = ANY(get_user_orgs()));
-- Timeline is append-only by the system
CREATE POLICY "timeline_insert" ON global_timeline
  FOR INSERT WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ────────────────────────────────────────────────────────────
-- 3. Notifications (Bandeja de entrada del usuario)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Si es null, es para toda la organización
  title           TEXT NOT NULL,
  body            TEXT,
  type            TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  read            BOOLEAN DEFAULT FALSE,
  action_url      TEXT, -- Link opcional para clickear en la UI
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read" ON notifications
  FOR SELECT USING (
    organization_id = ANY(get_user_orgs()) AND 
    (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    organization_id = ANY(get_user_orgs()) AND 
    (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ────────────────────────────────────────────────────────────
-- 4. Helper Function para despachar eventos fácilmente desde otros triggers
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dispatch_system_event(
  p_org_id UUID,
  p_module TEXT,
  p_event_name TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO system_events_queue (organization_id, module, event_name, payload)
  VALUES (p_org_id, p_module, p_event_name, p_payload)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

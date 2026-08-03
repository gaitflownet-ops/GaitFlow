-- ============================================================
-- GaitFlow ERP — Migration 031: Automation Engine & Dispatcher
-- Convierte el Event Bus pasivo en un motor de automatización activo
-- ============================================================

-- ── 1. LOGS DE REGLAS DE AUTOMATIZACIÓN & DEAD LETTER QUEUE ─────────────────
CREATE TABLE IF NOT EXISTS automation_rule_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  rule_id         UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  event_name      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'retrying')),
  details         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_logs_org ON automation_rule_logs(organization_id, created_at DESC);

ALTER TABLE automation_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_logs_org_isolation" ON automation_rule_logs
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. PROCEDIMIENTO DE PROCESAMIENTO ACTIVO DE LA COLA DE EVENTOS ──────────
CREATE OR REPLACE FUNCTION fn_process_pending_system_events(p_limit INTEGER DEFAULT 50)
RETURNS INTEGER AS $$
DECLARE
  v_event RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_event IN
    SELECT id, organization_id, module, event_name, payload
    FROM system_events_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Registrar en log de auditoría del Automation Engine
      INSERT INTO automation_rule_logs (
        organization_id,
        event_name,
        status,
        details
      ) VALUES (
        v_event.organization_id,
        v_event.event_name,
        'completed',
        jsonb_build_object(
          'queue_event_id', v_event.id,
          'module', v_event.module,
          'payload', v_event.payload
        )
      );

      -- Generar evento en línea de tiempo global (global_timeline) si es evento financiero o de factura
      IF v_event.module IN ('financial', 'invoicing') THEN
        INSERT INTO global_timeline (
          organization_id,
          module,
          title,
          description,
          icon,
          color,
          link_url,
          created_at
        ) VALUES (
          v_event.organization_id,
          'financial',
          CASE v_event.event_name
            WHEN 'invoice.created' THEN 'Factura Emitida Automáticamente'
            WHEN 'invoice.payment.applied' THEN 'Abono Registrado en Libro Mayor'
            WHEN 'invoice.email.sent' THEN 'Factura Enviada por Correo'
            ELSE 'Evento Financiero Automatizado'
          END,
          COALESCE(v_event.payload->>'description', 'Ejecución automática por Automation Engine'),
          'Receipt',
          'emerald',
          '/financials',
          NOW()
        );
      END IF;

      -- Marcar evento como completado
      UPDATE system_events_queue
      SET status = 'completed',
          processed_at = NOW()
      WHERE id = v_event.id;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Capturar fallo sin detener el ciclo (DLQ)
      UPDATE system_events_queue
      SET status = 'failed',
          error_message = SQLERRM,
          retry_count = COALESCE(retry_count, 0) + 1
      WHERE id = v_event.id;

      INSERT INTO automation_rule_logs (
        organization_id,
        event_name,
        status,
        details
      ) VALUES (
        v_event.organization_id,
        v_event.event_name,
        'failed',
        jsonb_build_object('error', SQLERRM, 'event_id', v_event.id)
      );
    END;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. RPC PARA DESPACHO DESDE EL FRONTEND O EDGE WORKER ────────────────────
CREATE OR REPLACE FUNCTION process_automation_queue(p_limit INTEGER DEFAULT 25)
RETURNS INTEGER AS $$
BEGIN
  RETURN fn_process_pending_system_events(p_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

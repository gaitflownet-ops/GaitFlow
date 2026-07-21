import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

console.log("Automation Engine is running!");

// Database Webhook Payload from Supabase
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  schema: string;
  old_record: any;
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    
    // Solo nos interesan los INSERTS en system_events_queue
    if (payload.table !== "system_events_queue" || payload.type !== "INSERT") {
      return new Response("Not an event queue insertion", { status: 200 });
    }

    const event = payload.record;
    
    // Initialize Supabase Client with Service Role (Bypass RLS para leer reglas y escribir tx)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing Event: [${event.module}] ${event.event_name}`);

    // Marcar como 'processing'
    await supabase.from("system_events_queue").update({ status: "processing" }).eq("id", event.id);

    // 1. Buscar las reglas activas de la organización para este evento (ordenadas por prioridad)
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("organization_id", event.organization_id)
      .eq("is_enabled", true)
      .eq("trigger_module", event.module)
      .eq("trigger_event", event.event_name)
      .order("priority", { ascending: false });

    if (rulesError) throw rulesError;

    let rulesExecuted = 0;

    // 2. Evaluar y ejecutar cada regla
    for (const rule of rules || []) {
      // Evaluar trigger_conditions (Motor simple JSON)
      const conditions = rule.trigger_conditions || {};
      let passes = true;
      
      if (conditions.field && conditions.operator && conditions.value !== undefined) {
        const payloadValue = event.payload[conditions.field];
        if (conditions.operator === 'gt' && !(payloadValue > conditions.value)) passes = false;
        if (conditions.operator === 'eq' && !(payloadValue === conditions.value)) passes = false;
        // Se pueden añadir más operadores (lt, in, contains, etc)
      }

      if (!passes) continue;

      console.log(`Executing Rule: ${rule.name} (${rule.action_type})`);

      // 3. Ejecutar Action Handler
      if (rule.action_type === 'create_expense') {
        let amount = 0;
        
        // Handle computed amounts (e.g. cost_per_unit * stock_quantity)
        if (rule.action_config.amount_compute) {
            const f1 = event.payload[rule.action_config.amount_compute.field1] || 0;
            const f2 = event.payload[rule.action_config.amount_compute.field2] || 0;
            if (rule.action_config.amount_compute.operator === 'multiply') amount = f1 * f2;
        } else {
            amount = event.payload[rule.action_config.amount_field || 'cost'] || 0;
        }
        
        let desc = rule.action_config.description_template || "Gasto Automático";
        Object.keys(event.payload).forEach(k => {
          desc = desc.replace(new RegExp(`{{${k}}}`, 'g'), event.payload[k]);
        });

        await supabase.from("financial_transactions").insert({
          organization_id: event.organization_id,
          type: "expense",
          amount: amount,
          description: desc,
          status: rule.action_config.status || "completed",
          reference_module: event.module,
          reference_id: event.payload.id,
          horse_id: event.payload.horse_id // Si viene en el payload
        });

        await supabase.from("global_timeline").insert({
          organization_id: event.organization_id,
          title: rule.action_config.timeline_title || "Gasto generado automáticamente",
          description: desc,
          module: "financial",
          is_automated: true
        });

      } else if (rule.action_type === 'create_invoice') {
        const amount = event.payload[rule.action_config.amount_field || 'price'] || 0;
        let desc = rule.action_config.description_template || "Factura Automática";
        Object.keys(event.payload).forEach(k => {
          desc = desc.replace(new RegExp(`{{${k}}}`, 'g'), event.payload[k]);
        });

        const { data: invoice } = await supabase.from("invoices").insert({
          organization_id: event.organization_id,
          status: rule.action_config.status || "draft",
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          subtotal: amount,
          total: amount
        }).select().single();

        if (invoice) {
          await supabase.from("invoice_items").insert({
            invoice_id: invoice.id,
            description: desc,
            quantity: 1,
            unit_price: amount,
            total_price: amount
          });

          await supabase.from("global_timeline").insert({
            organization_id: event.organization_id,
            title: rule.action_config.timeline_title || `Factura borrador creada automáticamente`,
            description: desc,
            module: "financial",
            is_automated: true,
            metadata: { invoice_id: invoice.id }
          });
        }
      } else if (rule.action_type === 'create_task') {
        let title = rule.action_config.title_template || "Nueva tarea automatizada";
        Object.keys(event.payload).forEach(k => {
            title = title.replace(new RegExp(`{{${k}}}`, 'g'), event.payload[k]);
        });

        // TBD: Insert into Tasks table (assuming a tasks table exists)
        // Since we don't have a strict tasks table schema identified yet, we'll log it in global timeline directly.
        await supabase.from("global_timeline").insert({
          organization_id: event.organization_id,
          title: title,
          description: "Notificación prioritaria generada por el motor de automatizaciones",
          module: event.module,
          is_automated: true
        });
      } else if (rule.action_type === 'create_health_record') {
        let notes = rule.action_config.notes_template || "Registro automático desde tarea";
        Object.keys(event.payload).forEach(k => {
            notes = notes.replace(new RegExp(`{{${k}}}`, 'g'), event.payload[k]);
        });

        if (event.payload.horse_id) {
            await supabase.from("health_records").insert({
                organization_id: event.organization_id,
                horse_id: event.payload.horse_id,
                record_type: rule.action_config.record_type || 'General',
                date: new Date().toISOString().split('T')[0],
                notes: notes,
                provider: 'Automation Engine',
                cost: 0
            });
            // Triggers de DB se encargarán del timeline de health
        }
      }
      
      rulesExecuted++;
    }

    // Marcar como completed
    await supabase.from("system_events_queue").update({ 
      status: "completed", 
      updated_at: new Date().toISOString() 
    }).eq("id", event.id);

    return new Response(JSON.stringify({ success: true, rulesExecuted }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("Error processing event:", error);
    // Intentar marcar como fallido si tenemos el ID
    try {
      const payload = await req.clone().json();
      if (payload?.record?.id) {
        // Cannot cleanly access supabase here without re-initializing, just an example
      }
    } catch(e) {}
    
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})

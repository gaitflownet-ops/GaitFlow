import { useState } from 'react';
import { Settings, Save, Building2, Receipt, Percent, Globe, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useFinancialSettings, useUpdateFinancialSettings, type FinancialSettings } from '@/lib/hooks/useFinancialSettings';

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <Icon size={18} />
        <h4>{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function FinancialSettingsPanel() {
  const { data: settings, isLoading } = useFinancialSettings();
  const updateSettings = useUpdateFinancialSettings();

  const [form, setForm] = useState<Partial<FinancialSettings> | null>(null);

  // Inicializar form cuando lleguen los settings
  const current = form ?? settings;
  const set = (k: keyof FinancialSettings, v: any) =>
    setForm(prev => ({ ...(prev ?? settings ?? {}), [k]: v }));
  const setFiscal = (k: string, v: string) =>
    setForm(prev => ({
      ...(prev ?? settings ?? {}),
      fiscal_info: { ...(prev?.fiscal_info ?? settings?.fiscal_info ?? {}), [k]: v },
    }));

  const handleSave = async () => {
    if (!form) return;
    try {
      await updateSettings.mutateAsync(form);
      setForm(null);
      toast.success('Configuración financiera guardada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading || !current) {
    return (
      <div className="panel-loading">
        <div className="spinner" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const isDirty = form !== null;

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h3><Settings size={20} /> Configuración Financiera</h3>
          <p>Adapta el Centro Financiero a la operación de tu criadero.</p>
        </div>
        {isDirty && (
          <button className="btn-primary" onClick={handleSave} disabled={updateSettings.isPending}>
            <Save size={16} />
            {updateSettings.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      <div className="settings-grid">
        {/* Moneda y región */}
        <SectionCard icon={Globe} title="Moneda y Región">
          <div className="form-row">
            <div className="form-group">
              <label>Moneda principal</label>
              <select value={current.default_currency ?? 'COP'} onChange={e => set('default_currency', e.target.value)}>
                <option value="COP">🇨🇴 COP — Peso Colombiano</option>
                <option value="USD">🇺🇸 USD — Dólar Americano</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Inicio del año fiscal</label>
              <input
                type="text"
                value={current.fiscal_year_start ?? '01-01'}
                onChange={e => set('fiscal_year_start', e.target.value)}
                placeholder="MM-DD (ej: 01-01)"
              />
            </div>
          </div>
        </SectionCard>

        {/* Facturación */}
        <SectionCard icon={Receipt} title="Numeración de Facturas">
          <div className="form-row">
            <div className="form-group">
              <label>Prefijo</label>
              <input
                value={current.invoice_prefix ?? 'GF'}
                onChange={e => set('invoice_prefix', e.target.value)}
                placeholder="GF"
                maxLength={5}
              />
            </div>
            <div className="form-group">
              <label>Secuencia actual</label>
              <input
                type="number"
                min="1"
                value={current.invoice_sequence ?? 1}
                onChange={e => set('invoice_sequence', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="settings-preview">
            <span>Próxima factura: </span>
            <strong>
              {current.invoice_prefix ?? 'GF'}-{new Date().getFullYear()}-
              {String(current.invoice_sequence ?? 1).padStart(4, '0')}
            </strong>
          </div>
        </SectionCard>

        {/* Impuestos */}
        <SectionCard icon={Percent} title="Impuestos">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del impuesto</label>
              <input value={current.tax_name ?? 'IVA'} onChange={e => set('tax_name', e.target.value)} placeholder="IVA" />
            </div>
            <div className="form-group">
              <label>Tasa predeterminada (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={current.default_tax_rate ?? 0}
                onChange={e => set('default_tax_rate', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={current.tax_included_in_price ?? false}
                onChange={e => set('tax_included_in_price', e.target.checked)}
              />
              {' '}Los precios incluyen impuesto
            </label>
          </div>
        </SectionCard>

        {/* Datos fiscales */}
        <SectionCard icon={Building2} title="Datos Fiscales">
          <div className="form-row">
            <div className="form-group">
              <label>NIT / Identificación tributaria</label>
              <input
                value={(current.fiscal_info as any)?.nit ?? ''}
                onChange={e => setFiscal('nit', e.target.value)}
                placeholder="900.123.456-7"
              />
            </div>
            <div className="form-group">
              <label>Razón Social</label>
              <input
                value={(current.fiscal_info as any)?.razon_social ?? ''}
                onChange={e => setFiscal('razon_social', e.target.value)}
                placeholder="Hacienda El Nogal S.A.S"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Régimen tributario</label>
              <select
                value={(current.fiscal_info as any)?.regimen ?? 'persona_natural'}
                onChange={e => setFiscal('regimen', e.target.value)}
              >
                <option value="persona_natural">Persona Natural</option>
                <option value="responsable_iva">Responsable de IVA</option>
                <option value="no_responsable_iva">No Responsable de IVA</option>
                <option value="regimen_simple">Régimen Simple</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input
                value={(current.fiscal_info as any)?.ciudad ?? ''}
                onChange={e => setFiscal('ciudad', e.target.value)}
                placeholder="Medellín, Antioquia"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección fiscal</label>
            <input
              value={(current.fiscal_info as any)?.direccion ?? ''}
              onChange={e => setFiscal('direccion', e.target.value)}
              placeholder="Km 3 vía El Retiro, Vereda La Palma"
            />
          </div>
        </SectionCard>

        {/* Recordatorios */}
        <SectionCard icon={Bell} title="Recordatorios de Pago">
          <p className="settings-hint">
            Días antes del vencimiento en que se enviará un recordatorio automático.
          </p>
          <div className="form-group">
            <label>Días de recordatorio</label>
            <input
              value={(current.payment_reminder_days ?? [3, 7, 15]).join(', ')}
              onChange={e =>
                set('payment_reminder_days', e.target.value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n)))
              }
              placeholder="3, 7, 15"
            />
            <small>Ingresa los días separados por coma</small>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

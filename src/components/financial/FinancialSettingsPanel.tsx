import { useState } from 'react';
import { Settings, Save, Building2, Receipt, Percent, Globe, Calendar, Bell, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useFinancialSettings, useUpdateFinancialSettings, type FinancialSettings } from '@/lib/hooks/useFinancialSettings';
import { useFinancialPeriods, useToggleFiscalPeriod } from '@/lib/hooks/useFinancialCenter';

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

const MONTHS_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function FiscalPeriodLockCard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data: periods, isLoading } = useFinancialPeriods(selectedYear);
  const togglePeriod = useToggleFiscalPeriod();

  const isMonthClosed = (m: number) => {
    const found = periods?.find((p: any) => p.month === m);
    return found ? found.is_closed : false;
  };

  const handleToggle = async (month: number, currentlyClosed: boolean) => {
    try {
      await togglePeriod.mutateAsync({
        year: selectedYear,
        month,
        isClosed: !currentlyClosed
      });
      toast.success(currentlyClosed ? `Mes de ${MONTHS_LABELS[month - 1]} abierto nuevamente` : `Mes de ${MONTHS_LABELS[month - 1]} cerrado y protegido contra modificaciones`);
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado del periodo fiscal');
    }
  };

  return (
    <SectionCard icon={Lock} title="Cierre de Período Contable Fiscal (Auditoría)">
      <p className="settings-hint">
        Protege y congela los meses contables cerrados para evitar inserciones, ediciones o borrados de movimientos en períodos auditados o declarados ante la DIAN/SAT.
      </p>
      <div className="flex items-center justify-between mb-4 mt-2">
        <span className="text-sm font-medium text-foreground">Año Fiscal:</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium"
        >
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear + 1}>{currentYear + 1}</option>
        </select>
      </div>
      {isLoading ? (
        <div className="text-center py-4 text-xs text-muted-foreground">Cargando períodos del año...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {MONTHS_LABELS.map((monthName, idx) => {
            const monthNumber = idx + 1;
            const closed = isMonthClosed(monthNumber);
            return (
              <button
                key={monthNumber}
                type="button"
                disabled={togglePeriod.isPending}
                onClick={() => handleToggle(monthNumber, closed)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                  closed
                    ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-secondary/40 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {closed ? <Lock size={14} className="shrink-0 text-red-500" /> : <Unlock size={14} className="shrink-0 text-emerald-600 opacity-60" />}
                  <span className="text-xs truncate">{monthName}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  closed ? 'bg-red-500/20 text-red-800 dark:text-red-300' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  {closed ? 'Cerrado' : 'Abierto'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
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

        {/* Cierre de Período Contable Fiscal */}
        <FiscalPeriodLockCard />

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

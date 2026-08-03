import { useState } from 'react';
import { Settings, Save, Building2, Receipt, Percent, Globe, Bell, Lock, Unlock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useFinancialSettings, useUpdateFinancialSettings, type FinancialSettings } from '@/lib/hooks/useFinancialSettings';
import { useFinancialPeriods, useToggleFiscalPeriod } from '@/lib/hooks/useFinancialCenter';

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  colSpan = "col-span-1",
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colSpan?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 ${colSpan}`}>
      <div>
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Icon size={18} />
          </div>
          <div>
            <h4 className="font-semibold text-base text-foreground">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="pt-4 space-y-4">{children}</div>
      </div>
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
      toast.success(
        currentlyClosed
          ? `Mes de ${MONTHS_LABELS[month - 1]} abierto nuevamente para edición`
          : `Mes de ${MONTHS_LABELS[month - 1]} cerrado y protegido contra modificaciones`
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado del periodo fiscal');
    }
  };

  return (
    <SectionCard
      icon={Lock}
      title="Cierre de Período Contable Fiscal (Auditoría DIAN/SAT)"
      subtitle="Protege y congela los meses contables cerrados para evitar inserciones, ediciones o borrados de movimientos en períodos auditados."
      colSpan="col-span-1 md:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" />
          <span className="text-xs text-muted-foreground">
            Los cierres fiscales se aplican en tiempo real al Libro Mayor y bloquean transacciones con fecha del período cerrado.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Año Fiscal:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-xs text-muted-foreground">Cargando períodos fiscales del año...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {MONTHS_LABELS.map((monthName, idx) => {
            const monthNumber = idx + 1;
            const closed = isMonthClosed(monthNumber);
            return (
              <button
                key={monthNumber}
                type="button"
                disabled={togglePeriod.isPending}
                onClick={() => handleToggle(monthNumber, closed)}
                className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                  closed
                    ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold shadow-sm hover:bg-red-500/15'
                    : 'border-border bg-card hover:bg-secondary/40 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-2">
                  <span className="text-xs font-bold truncate">{monthName}</span>
                  {closed ? (
                    <Lock size={14} className="shrink-0 text-red-500" />
                  ) : (
                    <Unlock size={14} className="shrink-0 text-emerald-600 opacity-60" />
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit ${
                    closed
                      ? 'bg-red-500/20 text-red-800 dark:text-red-300'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
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

  const current = form ?? settings;
  const set = (k: keyof FinancialSettings, v: any) =>
    setForm((prev) => ({ ...(prev ?? settings ?? {}), [k]: v }));
  const setFiscal = (k: string, v: string) =>
    setForm((prev) => ({
      ...(prev ?? settings ?? {}),
      fiscal_info: { ...(prev?.fiscal_info ?? settings?.fiscal_info ?? {}), [k]: v },
    }));

  const handleSave = async () => {
    if (!form) return;
    try {
      await updateSettings.mutateAsync(form);
      setForm(null);
      toast.success('Configuración financiera guardada exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    }
  };

  if (isLoading || !current) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando configuración del criadero...</p>
      </div>
    );
  }

  const isDirty = form !== null;

  return (
    <div className="space-y-6 relative pb-28">
      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings size={20} className="text-primary" /> Configuración General y Tributaria
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Adapta la numeración, impuestos, datos de facturación y períodos contables de tu criadero de caballos.
          </p>
        </div>

        {isDirty && (
          <button
            type="button"
            className="btn-primary text-xs flex items-center gap-2 px-4 py-2.5 shrink-0"
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            <Save size={15} />
            {updateSettings.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos Fiscales */}
        <SectionCard
          icon={Building2}
          title="Datos Fiscales y Razón Social"
          subtitle="Información legal utilizada para el encabezado de facturas emitidas y reportes tributarios."
          colSpan="col-span-1 md:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                NIT / Identificación Tributaria
              </label>
              <input
                className="form-input text-sm w-full"
                value={(current.fiscal_info as any)?.nit ?? ''}
                onChange={(e) => setFiscal('nit', e.target.value)}
                placeholder="900.123.456-7"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Razón Social / Criadero
              </label>
              <input
                className="form-input text-sm w-full"
                value={(current.fiscal_info as any)?.razon_social ?? ''}
                onChange={(e) => setFiscal('razon_social', e.target.value)}
                placeholder="Criadero Equino El Nogal S.A.S"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Régimen Tributario
              </label>
              <select
                className="form-input text-sm w-full"
                value={(current.fiscal_info as any)?.regimen ?? 'persona_natural'}
                onChange={(e) => setFiscal('regimen', e.target.value)}
              >
                <option value="persona_natural">Persona Natural</option>
                <option value="responsable_iva">Responsable de IVA</option>
                <option value="no_responsable_iva">No Responsable de IVA</option>
                <option value="regimen_simple">Régimen Simple de Tributación</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Ciudad / Departamento
              </label>
              <input
                className="form-input text-sm w-full"
                value={(current.fiscal_info as any)?.ciudad ?? ''}
                onChange={(e) => setFiscal('ciudad', e.target.value)}
                placeholder="Medellín, Antioquia"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Dirección Fiscal del Criadero
              </label>
              <input
                className="form-input text-sm w-full"
                value={(current.fiscal_info as any)?.direccion ?? ''}
                onChange={(e) => setFiscal('direccion', e.target.value)}
                placeholder="Km 3 Vía Llanogrande, Vereda La Palma"
              />
            </div>
          </div>
        </SectionCard>

        {/* Moneda y región */}
        <SectionCard icon={Globe} title="Moneda y Región" subtitle="Configuración predeterminada del libro mayor y tesorería.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Moneda principal
              </label>
              <select
                className="form-input text-sm w-full"
                value={current.default_currency ?? 'COP'}
                onChange={(e) => set('default_currency', e.target.value)}
              >
                <option value="COP">🇨🇴 COP — Peso Colombiano ($)</option>
                <option value="USD">🇺🇸 USD — Dólar Americano ($)</option>
                <option value="EUR">🇪🇺 EUR — Euro (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Inicio Año Fiscal
              </label>
              <input
                className="form-input text-sm w-full"
                type="text"
                value={current.fiscal_year_start ?? '01-01'}
                onChange={(e) => set('fiscal_year_start', e.target.value)}
                placeholder="MM-DD (ej: 01-01)"
              />
            </div>
          </div>
        </SectionCard>

        {/* Facturación */}
        <SectionCard
          icon={Receipt}
          title="Numeración de Facturas"
          subtitle="Prefijo legal y número de secuencia consecutivo automático."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Prefijo Factura
              </label>
              <input
                className="form-input text-sm w-full"
                value={current.invoice_prefix ?? 'GF'}
                onChange={(e) => set('invoice_prefix', e.target.value)}
                placeholder="GF"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Secuencia Actual
              </label>
              <input
                className="form-input text-sm w-full"
                type="number"
                min="1"
                value={current.invoice_sequence ?? 1}
                onChange={(e) => set('invoice_sequence', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50 text-xs">
            <span className="text-muted-foreground font-medium">Previsualización próxima factura:</span>
            <strong className="text-primary font-mono text-sm">
              {current.invoice_prefix ?? 'GF'}-{new Date().getFullYear()}-
              {String(current.invoice_sequence ?? 1).padStart(4, '0')}
            </strong>
          </div>
        </SectionCard>

        {/* Impuestos */}
        <SectionCard icon={Percent} title="Configuración de Impuestos" subtitle="Impuesto por defecto y reglas de precios en cotizaciones.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Nombre del Impuesto
              </label>
              <input
                className="form-input text-sm w-full"
                value={current.tax_name ?? 'IVA'}
                onChange={(e) => set('tax_name', e.target.value)}
                placeholder="IVA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                Tasa Predeterminada (%)
              </label>
              <input
                className="form-input text-sm w-full"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={current.default_tax_rate ?? 0}
                onChange={(e) => set('default_tax_rate', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                checked={current.tax_included_in_price ?? false}
                onChange={(e) => set('tax_included_in_price', e.target.checked)}
              />
              Los precios cotizados y facturados ya incluyen este impuesto
            </label>
          </div>
        </SectionCard>

        {/* Recordatorios */}
        <SectionCard icon={Bell} title="Recordatorios de Cobro" subtitle="Alerta automática antes de vencimientos de facturas.">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
              Días previos para recordar pago
            </label>
            <input
              className="form-input text-sm w-full"
              value={(current.payment_reminder_days ?? [3, 7, 15]).join(', ')}
              onChange={(e) =>
                set(
                  'payment_reminder_days',
                  e.target.value
                    .split(',')
                    .map((v) => parseInt(v.trim()))
                    .filter((n) => !isNaN(n))
                )
              }
              placeholder="3, 7, 15"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Ingresa los días separados por coma. Ejemplo: 3, 7, 15
            </p>
          </div>
        </SectionCard>

        {/* Cierre de Período Contable Fiscal */}
        <FiscalPeriodLockCard />
      </div>

      {/* Floating Action Bar de Guardado */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 left-6 md:left-72 bg-card/95 backdrop-blur-md border border-primary/40 rounded-2xl p-4 shadow-2xl z-50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Tienes cambios pendientes de guardar en la Configuración</p>
              <p className="text-xs text-muted-foreground">Los cambios aplicarán a la numeración, impuestos y reportes del criadero.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setForm(null);
                toast.info('Cambios descartados');
              }}
              className="btn-ghost text-xs px-4 py-2"
              disabled={updateSettings.isPending}
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="btn-primary text-xs flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-primary/25"
            >
              <Save size={15} />
              {updateSettings.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

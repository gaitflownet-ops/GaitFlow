import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { storeUTM } from "@/lib/leads";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Star,
  Zap,
  Heart,
  ClipboardList,
  DollarSign,
  ShoppingBag,
  Dna,
  MapPin,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type BillingCycle = "monthly" | "annual";

// ── Static data ──────────────────────────────────────────────

const FEATURES = [
  {
    icon: Heart,
    title: "Salud y Bienestar",
    desc:
      "Calendario médico interactivo con citas veterinarias, calendarios de desparasitación, alertas de vacunas e inventario farmacéutico — todo en un solo lugar.",
    color: "var(--gold)",
  },
  {
    icon: ClipboardList,
    title: "Motor de Labores",
    desc:
      "El núcleo operativo de GaitFlow. Asignación dinámica de tareas, tableros Kanban, plantillas recurrentes y alertas push en tiempo real para cada miembro del equipo.",
    color: "var(--forest)",
  },
  {
    icon: Zap,
    title: "Gestión de Ejemplares",
    desc:
      "Perfiles digitales completos: genealogía, historial de salud, récords de competición, galería multimedia y vínculos a registros de Fedequinas y Asdepaso.",
    color: "var(--bronze)",
  },
  {
    icon: Dna,
    title: "Cría y Genética",
    desc:
      "Seguimiento de gestación, gestión de inventario de embriones, pronósticos de éxito de embarazo Holt-Winters e integración perfecta con el Mercado.",
    color: "var(--leather)",
  },
  {
    icon: ShoppingBag,
    title: "Mercado",
    desc:
      "Lista ejemplares, embriones y material genético directamente desde sus perfiles. Los compradores descubren, consultan y cierran — tus listados generan facturas y contratos automáticamente.",
    color: "var(--primary)",
  },
  {
    icon: DollarSign,
    title: "Módulo Financiero",
    desc:
      "Facturación completa, categorización de gastos, generación de PDF con marca del criadero y pronósticos de ingresos Holt-Winters. Desde costos de insumos hasta facturación de clientes.",
    color: "var(--charcoal)",
  },
];

const PLANS = [
  {
    name: "Inicial",
    priceMonthly: 249000,
    priceAnnual: 199000,
    desc: "Para propietarios privados que gestionan un pequeño grupo de ejemplares.",
    features: [
      "Hasta 10 perfiles de ejemplares",
      "Calendario de salud y bienestar",
      "Gestión de labores (básico)",
      "1 cuenta de usuario",
      "3 publicaciones activas en el Mercado",
      "Soporte por correo",
    ],
    cta: "Prueba Gratuita",
    featured: false,
  },
  {
    name: "Profesional",
    priceMonthly: 649000,
    priceAnnual: 519000,
    desc:
      "Para criaderos de entrenamiento y centros de cría con un equipo de operaciones completo.",
    features: [
      "Hasta 50 perfiles de ejemplares",
      "Suite completa de salud y bienestar",
      "Motor de labores avanzado (Kanban + plantillas)",
      "Hasta 8 miembros del equipo",
      "Seguimiento de cría y gestación",
      "Módulo financiero y facturación PDF",
      "Análisis predictivo Holt-Winters",
      "Publicaciones ilimitadas en el Mercado",
      "Soporte prioritario",
    ],
    cta: "Prueba Gratuita",
    featured: true,
  },
  {
    name: "Empresarial",
    priceMonthly: null,
    priceAnnual: null,
    desc:
      "Para operaciones en múltiples fincas, centros de cría comercial y portafolios de inversión.",
    features: [
      "Perfiles de ejemplares ilimitados",
      "Gestión multi-finca / multi-ubicación",
      "Miembros del equipo ilimitados con roles",
      "Acceso completo a la API",
      "PDF y marca blanca personalizados",
      "Incorporación y capacitación personalizadas",
      "Gerente de cuenta dedicado",
      "Soporte con SLA (99.9% uptime)",
      "Cumplimiento Habeas Data",
    ],
    cta: "Contactar Ventas",
    featured: false,
  },
];

const FAQS = [
  {
    q: "¿Hay una prueba gratuita?",
    a: "Sí. Los planes Inicial y Profesional incluyen una prueba gratuita de 14 días, sin tarjeta de crédito. Puedes importar tus ejemplares y probar todas las funciones antes de comprometerte.",
  },
  {
    q: "¿Puedo migrar datos desde mi sistema actual?",
    a: "GaitFlow admite importación CSV para registros de ejemplares, historial de salud y datos financieros. Nuestros planes Profesional y Empresarial incluyen migración de datos asistida por nuestro equipo de soporte.",
  },
  {
    q: "¿Cómo funciona el motor predictivo Holt-Winters?",
    a: "El motor Holt-Winters de GaitFlow analiza tus datos históricos — eventos de salud, finanzas, ciclos de cría — y muestra pronósticos directamente en tu panel. Cuanto más uses GaitFlow, más precisas serán las predicciones.",
  },
  {
    q: "¿Cuántos miembros del equipo puedo agregar?",
    a: "Inicial admite 1 usuario. Profesional admite hasta 8 miembros del equipo con acceso basado en roles (Propietario, Veterinario, Chalán, Palafrenero, Herrero). Empresarial incluye miembros ilimitados y roles completamente personalizables.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Todos los datos están cifrados en tránsito y en reposo. Realizamos copias de seguridad diarias automáticas con retención de 90 días, y los datos de cada criadero están completamente aislados en nuestra arquitectura de nube en Colombia.",
  },
  {
    q: "¿Puedo cambiar de plan más adelante?",
    a: "Sí. Puedes actualizar o disminuir tu plan en cualquier momento. Al actualizar, obtienes acceso inmediato a todas las nuevas funciones. La disminución tiene efecto en el próximo mes de facturación.",
  },
];

const STATS = [
  { value: "3.200+", label: "Ejemplares gestionados" },
  { value: "$48.000M", label: "Transacciones registradas" },
  { value: "140+", label: "Criaderos premium" },
  { value: "87%", label: "Tiempo ahorrado en administración" },
];

const FARM_LOGOS = [
  "Criadero La Luisa",
  "Criadero El Rosario",
  "Hacienda Nápoles",
  "Criadero San Jerónimo",
  "Criadero El Diamante",
  "Hacienda La Aurora",
];

// ── Component helpers ─────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] text-[10px] font-medium tracking-[0.2em] uppercase mb-4">
      <Star className="h-3 w-3 fill-current" />
      <span>{label}</span>
    </div>
  );
}

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQS)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-secondary/40 transition-colors"
      >
        <span className="font-medium text-[15px] text-foreground pr-4">
          {item.q}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-[14px] text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
          {item.a}
        </div>
      )}
    </div>
  );
}

// ── Route ────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GaitFlow — La Plataforma Integral de Operaciones para Criaderos" },
      {
        name: "description",
        content:
          "GaitFlow unifica la gestión de caballos, salud y bienestar, labores, cría, mercado y finanzas en una sola plataforma premium hecha para el CCC.",
      },
    ],
  }),
  component: LandingPage,
} as any);

function LandingPage() {
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    storeUTM();
  }, []);

  return (
    <PublicShell>
      {/* ════════════════════════════════════
          HEROE
      ════════════════════════════════════ */}
      <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=2400"
            alt="Criadero ecuestre de élite"
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-foreground tracking-tight">
              El Sistema
              <br />
              Operativo para
              <br />
              <span className="gold-text italic">Criaderos de Élite.</span>
            </h1>
            <p className="mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed font-light">
              GaitFlow unifica la gestión de ejemplares, salud y bienestar, labores, cría, mercado y finanzas — todo en una plataforma premium hecha para la industria del Caballo Criollo Colombiano.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center rounded-full bg-foreground px-8 text-[13px] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95 uppercase tracking-widest gap-2.5 shadow-lg"
              >
                Prueba Gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex h-14 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--gold)]/10 backdrop-blur-md px-8 text-[13px] font-medium text-[var(--gold)] transition-all hover:bg-[var(--gold)]/20 uppercase tracking-widest gap-2"
              >
                Solicitar Demo
              </Link>
            </div>

            {/* Micro-estadísticas */}
            <div className="mt-12 flex flex-wrap gap-6">
              {STATS.map((s) => (
                <div key={s.value} className="flex flex-col">
                  <span className="font-display text-2xl text-foreground">{s.value}</span>
                  <span className="text-[11px] text-muted-foreground tracking-wide">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vista previa del héroe */}
          <div className="hidden lg:flex flex-col gap-4 items-end">
            <div className="w-80 rounded-2xl lux-card overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500 group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=600"
                alt="Caballo destacado"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-5">
                <div className="text-[10px] text-[var(--gold)] uppercase tracking-widest mb-1">
                  Alerta de Salud
                </div>
                <div className="font-display text-lg">Llama del Norte</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-[78%] rounded-full bg-[var(--gold)]" />
                  </div>
                  <span className="text-[12px] text-muted-foreground">Vet. en 2d</span>
                </div>
              </div>
            </div>

            <div className="w-64 rounded-xl lux-card p-4 -rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Labores de Hoy
              </div>
              {["Alimentación AM — Pesebrera A", "Herrador — Rosa de Fuego", "Control vet. — 3 ejemplares"].map(
                (t, i) => (
                  <div key={t} className="flex items-center gap-2.5 py-1.5">
                    <div
                      className={`h-4 w-4 rounded-full border-2 grid place-items-center ${
                        i === 0 ? "border-[var(--gold)] bg-[var(--gold)]" : "border-border"
                      }`}
                    >
                      {i === 0 && <Check className="h-2.5 w-2.5 text-background" />}
                    </div>
                    <span
                      className={`text-[12px] ${i === 0 ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {t}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          BARRA DE PRUEBA SOCIAL
      ════════════════════════════════════ */}
      <section className="border-y border-border/50 bg-secondary/40 py-7 overflow-hidden">
        <div className="flex gap-10 items-center justify-center opacity-50 grayscale flex-wrap px-6 text-[13px] tracking-widest uppercase font-display">
          {FARM_LOGOS.map((name, i) => (
            <div key={name} className="flex items-center gap-10">
              <span>{name}</span>
              {i < FARM_LOGOS.length - 1 && (
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-foreground/60" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════
          FUNCIONALIDADES
      ════════════════════════════════════ */}
      <section id="features" className="py-28 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <SectionLabel label="Módulos de Plataforma" />
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Todo lo que tu criadero necesita.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
            Seis módulos completamente integrados — desde el primer registro de salud de un ejemplar hasta su publicación en el Mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="lux-card p-7 flex flex-col gap-5 group hover:-translate-y-1 transition-transform duration-300"
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklab, ${feat.color} 15%, transparent)` }}
                >
                  <Icon className="h-6 w-6" style={{ color: feat.color }} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-foreground mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-muted-foreground text-[14px] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════
          HISTORIAS DE ÉXITO
      ════════════════════════════════════ */}
      <section id="stories" className="py-28 bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <SectionLabel label="Historias de Éxito" />
              <h2 className="font-display text-4xl md:text-5xl text-foreground">
                Lo que dicen los mejores
                <br />
                <span className="gold-text italic">criaderos de Colombia.</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg text-[15px] leading-relaxed">
                Desde operaciones de cría y pesebreras de competencia hasta comerciantes de ejemplares — resultados reales de profesionales que usan GaitFlow.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <div className="font-display text-5xl gold-text">60%</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest text-right">
                reducción promedio en
                <br />
                tiempo administrativo
              </div>
            </div>
          </div>
        </div>
        <StaggerTestimonials />
      </section>

      {/* ════════════════════════════════════
          PRECIOS
      ════════════════════════════════════ */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <SectionLabel label="Precios Transparentes" />
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Planes diseñados para tu criadero.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-[15px]">
            14 días de prueba gratuita en todos los planes de pago. Sin tarjeta de crédito.
          </p>

          {/* Selector de facturación */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full bg-secondary border border-border p-1">
            {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={`px-5 py-2 rounded-full text-[12px] font-medium uppercase tracking-widest transition-all ${
                  billing === cycle
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cycle === "monthly" ? "Mensual" : "Anual"}
                {cycle === "annual" && (
                  <span className="ml-2 text-[10px] text-[var(--gold)]">
                    Ahorra 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const price =
              plan.priceMonthly === null
                ? null
                : billing === "monthly"
                  ? plan.priceMonthly
                  : plan.priceAnnual;

            return (
              <div
                key={plan.name}
                className={`rounded-3xl border p-8 flex flex-col gap-6 transition-all duration-300 ${
                  plan.featured
                    ? "border-[var(--gold)] bg-foreground text-background shadow-[0_8px_40px_oklch(0.18_0.018_60/0.15)] scale-[1.02]"
                    : "border-border bg-card lux-card"
                }`}
              >
                {plan.featured && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] text-[10px] font-medium uppercase tracking-widest w-fit">
                    <Star className="h-3 w-3 fill-current" />
                    Más Popular
                  </div>
                )}

                <div>
                  <div
                    className={`font-display text-2xl mb-2 ${plan.featured ? "text-background" : "text-foreground"}`}
                  >
                    {plan.name}
                  </div>
                  <p
                    className={`text-[13px] leading-relaxed ${plan.featured ? "text-background/70" : "text-muted-foreground"}`}
                  >
                    {plan.desc}
                  </p>
                </div>

                <div className="flex items-end gap-1.5">
                  {price !== null ? (
                    <>
                      <span
                        className={`font-display text-4xl tracking-tight ${plan.featured ? "text-background" : "text-foreground"}`}
                      >
                        ${price.toLocaleString('es-CO')}
                      </span>
                      <span
                        className={`mb-1.5 ml-1 text-[13px] font-medium ${plan.featured ? "text-background/70" : "text-muted-foreground"}`}
                      >
                        COP/mes
                      </span>
                    </>
                  ) : (
                    <span
                      className={`font-display text-3xl ${plan.featured ? "text-background" : "text-foreground"}`}
                    >
                      A medida
                    </span>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full flex-shrink-0 mt-0.5 ${
                          plan.featured
                            ? "bg-[var(--gold)] text-[oklch(0.18_0.018_60)]"
                            : "bg-[var(--gold)]/15 text-[var(--gold)]"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span
                        className={`text-[13px] leading-relaxed ${plan.featured ? "text-background/85" : "text-muted-foreground"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-current/10">
                  {plan.name === "Empresarial" ? (
                    <Link
                      to="/demo"
                      className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-medium uppercase tracking-widest transition-all hover:opacity-90 ${
                        plan.featured
                          ? "bg-[var(--gold)] text-[oklch(0.18_0.018_60)]"
                          : "bg-foreground text-background"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      search={{ plan: plan.name.toLowerCase() }}
                      className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-medium uppercase tracking-widest transition-all hover:opacity-90 ${
                        plan.featured
                          ? "bg-[var(--gold)] text-[oklch(0.18_0.018_60)]"
                          : "bg-foreground text-background"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════
          PREGUNTAS FRECUENTES
      ════════════════════════════════════ */}
      <section id="faq" className="py-28 bg-secondary/30 border-y border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionLabel label="Preguntas Frecuentes" />
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              ¿Tienes preguntas?
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                item={faq}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════ */}
      <section className="py-32 max-w-7xl mx-auto px-6 w-full text-center">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-foreground px-8 py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.78_0.13_80/0.15)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <SectionLabel label="¿Listo para Transformar?" />
            <h2 className="font-display text-4xl md:text-6xl text-background leading-tight max-w-2xl mx-auto">
              Tu criadero merece algo mejor que hojas de cálculo.
            </h2>
            <p className="mt-6 text-background/60 text-[16px] max-w-xl mx-auto leading-relaxed">
              Únete a más de 140 criaderos premium que ya operan con GaitFlow. Comienza tu prueba gratuita de 14 días hoy — sin tarjeta de crédito.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--gold)] px-8 text-[13px] font-medium text-[oklch(0.18_0.018_60)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest gap-2.5 shadow-lg"
              >
                Prueba Gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex h-14 items-center justify-center rounded-full border border-background/30 bg-background/10 text-background px-8 text-[13px] font-medium uppercase tracking-widest hover:bg-background/20 transition-colors gap-2"
              >
                Solicitar una Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

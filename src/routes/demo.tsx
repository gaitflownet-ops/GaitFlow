import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PublicShell } from "@/components/PublicShell";
import { insertDemoRequest, insertContactSubmission, storeUTM } from "@/lib/leads";
import {
  ArrowRight,
  Check,
  Calendar,
  ChevronDown,
  Quote,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Clock,
  Users,
} from "lucide-react";

type Lang = "en" | "es";

// ── Static content ─────────────────────────────────────────

const BUSINESS_TYPES = [
  { value: "Private Owner", labelEn: "Private Owner", labelEs: "Propietario Privado" },
  { value: "Training Stable", labelEn: "Training Stable", labelEs: "Pesebreras de Entrenamiento" },
  { value: "Breeding Farm", labelEn: "Breeding Farm", labelEs: "Granja de Cría" },
  { value: "Competition Barn", labelEn: "Competition Barn", labelEs: "Pesebreras de Competición" },
  { value: "Multi-Location", labelEn: "Multi-Location Operation", labelEs: "Operación Multi-Sede" },
];

const HORSE_COUNTS = [
  { value: "1-5", label: "1 – 5" },
  { value: "6-15", label: "6 – 15" },
  { value: "16-30", label: "16 – 30" },
  { value: "31-50", label: "31 – 50" },
  { value: "50+", label: "50+" },
];

const PRIMARY_INTERESTS = [
  {
    value: "Health & Care",
    labelEn: "Health & Care Calendar",
    labelEs: "Calendario de Salud y Cuidado",
  },
  {
    value: "Task Management",
    labelEn: "Task Flow Engine",
    labelEs: "Motor de Flujo de Tareas",
  },
  {
    value: "Marketplace",
    labelEn: "Marketplace & Sales",
    labelEs: "Marketplace y Ventas",
  },
  {
    value: "Financial",
    labelEn: "Financial Suite",
    labelEs: "Suite Financiera",
  },
  {
    value: "Breeding",
    labelEn: "Breeding & Genetics",
    labelEs: "Cría y Genética",
  },
  {
    value: "Full Suite",
    labelEn: "Full Platform Suite",
    labelEs: "Suite Completa",
  },
];

const PLAN_OPTIONS = [
  { value: "Starter", labelEn: "Starter — $79/mo", labelEs: "Inicial — $79/mes" },
  {
    value: "Professional",
    labelEn: "Professional — $199/mo",
    labelEs: "Profesional — $199/mes",
  },
  { value: "Enterprise", labelEn: "Enterprise — Custom", labelEs: "Empresarial — A medida" },
  { value: "Unsure", labelEn: "Not sure yet", labelEs: "Aún no lo sé" },
];

const TRUST_POINTS = [
  {
    icon: Shield,
    titleEn: "No commitment required",
    titleEs: "Sin compromiso",
    descEn: "Demos are 100% free and no-obligation. We'll walk through your specific workflow.",
    descEs:
      "Las demos son 100% gratuitas y sin compromiso. Revisaremos tu flujo de trabajo específico.",
  },
  {
    icon: Clock,
    titleEn: "30-minute focused session",
    titleEs: "Sesión enfocada de 30 minutos",
    descEn: "Tailored to your stable size and primary needs — not a generic walkthrough.",
    descEs:
      "Adaptada al tamaño de tu criadero y tus necesidades principales, no una presentación genérica.",
  },
  {
    icon: Users,
    titleEn: "Ocala-based team",
    titleEs: "Equipo basado en Ocala",
    descEn: "You'll speak with someone who understands equestrian operations firsthand.",
    descEs: "Hablarás con alguien que entiende las operaciones ecuestres de primera mano.",
  },
];

const DEMO_FAQS = [
  {
    qEn: "Who conducts the demo?",
    qEs: "¿Quién conduce la demo?",
    aEn: "A GaitFlow product specialist from our Ocala team — someone who understands equestrian operations, not just software.",
    aEs: "Un especialista de producto de GaitFlow de nuestro equipo de Ocala — alguien que entiende las operaciones ecuestres, no solo el software.",
  },
  {
    qEn: "What should I prepare?",
    qEs: "¿Qué debo preparar?",
    aEn: "Nothing required. Optionally, have a list of your horses and current pain points. The demo is most valuable when it addresses your specific workflow.",
    aEs: "No se requiere nada. Opcionalmente, ten una lista de tus caballos y los problemas actuales. La demo es más valiosa cuando aborda tu flujo de trabajo específico.",
  },
  {
    qEn: "Can I invite my team?",
    qEs: "¿Puedo invitar a mi equipo?",
    aEn: "Absolutely. We encourage it. The more people who understand GaitFlow before you start, the smoother your onboarding will be.",
    aEs: "Por supuesto. Lo alentamos. Cuantas más personas entiendan GaitFlow antes de comenzar, más fluida será tu incorporación.",
  },
  {
    qEn: "What happens after the demo?",
    qEs: "¿Qué pasa después de la demo?",
    aEn: "You'll receive a recording, a customized setup guide for your stable type, and access to start your free trial immediately if you're ready.",
    aEs: "Recibirás una grabación, una guía de configuración personalizada para tu tipo de criadero y acceso para comenzar tu prueba gratuita de inmediato si estás listo.",
  },
];

// ── Route ────────────────────────────────────────────────────

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Book a Demo — GaitFlow" },
      {
        name: "description",
        content:
          "See GaitFlow in action. Book a personalized 30-minute demo with our Ocala-based team and discover how to streamline your entire stable operation.",
      },
    ],
  }),
  component: DemoPage,
});

// ── Demo Page ─────────────────────────────────────────────────

function DemoPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<"form" | "calendar" | "success">("form");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stableName, setStableName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [horseCount, setHorseCount] = useState("");
  const [primaryInterest, setPrimaryInterest] = useState("");
  const [planInterest, setPlanInterest] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Contact sales form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storeUTM();
  }, []);

  // Scroll to calendar when reaching that step
  useEffect(() => {
    if (step === "calendar" && calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const handleQualifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !businessType || !horseCount || !primaryInterest) {
      setFormError(
        lang === "en"
          ? "Please fill in all required fields."
          : "Por favor completa todos los campos requeridos.",
      );
      return;
    }
    setFormError("");
    setSubmitting(true);

    await insertDemoRequest({
      full_name: fullName,
      email,
      phone,
      stable_name: stableName,
      business_type: businessType,
      horse_count: horseCount,
      primary_interest: primaryInterest,
      plan_interest: planInterest,
    });

    setSubmitting(false);
    setStep("calendar");
  };

  const handleContactSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitting(true);
    await insertContactSubmission({
      full_name: contactName,
      email: contactEmail,
      category: "sales",
      message: contactMessage,
      stable_name: stableName,
    });
    setContactSubmitting(false);
    setContactSuccess(true);
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/10 text-[14px] transition-all";

  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <PublicShell>
      {/* Lang toggle */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background text-[12px] font-medium tracking-widest uppercase shadow-lg hover:scale-105 transition-transform"
        >
          {lang === "en" ? "🇲🇽 ES" : "🇺🇸 EN"}
        </button>
      </div>

      {/* ════════════ HERO ════════════ */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--forest-deep)]/8 via-transparent to-[var(--gold)]/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] text-[10px] font-medium tracking-[0.2em] uppercase mb-6">
            <Star className="h-3 w-3 fill-current" />
            <span>{lang === "en" ? "Free · No Commitment" : "Gratis · Sin Compromiso"}</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-foreground">
            {lang === "en" ? (
              <>
                See GaitFlow
                <br />
                <span className="gold-text italic">in action.</span>
              </>
            ) : (
              <>
                Mira GaitFlow
                <br />
                <span className="gold-text italic">en acción.</span>
              </>
            )}
          </h1>
          <p className="mt-6 text-[16px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {lang === "en"
              ? "Book a free, personalized 30-minute demo with our Ocala-based team. We'll walk through your specific workflow — no generic slides."
              : "Reserva una demo personalizada de 30 minutos con nuestro equipo de Ocala. Revisaremos tu flujo de trabajo específico — sin diapositivas genéricas."}
          </p>

          {/* Trust points */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TRUST_POINTS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.titleEn}
                  className="lux-card p-6 flex flex-col items-center text-center gap-3"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gold)]/15">
                    <Icon className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <div className="font-medium text-[15px] text-foreground">
                    {lang === "en" ? t.titleEn : t.titleEs}
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {lang === "en" ? t.descEn : t.descEs}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <section className="pb-28 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* ── Left: Qualification Form / Calendar ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* STEP INDICATOR */}
            <div className="flex items-center gap-3 mb-8">
              {(["form", "calendar"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full text-[13px] font-semibold transition-all ${
                      step === s || (s === "form" && step === "success")
                        ? "bg-foreground text-background"
                        : step === "calendar" && s === "form"
                          ? "bg-[var(--gold)] text-[oklch(0.18_0.018_60)]"
                          : "bg-secondary border border-border text-muted-foreground"
                    }`}
                  >
                    {step === "calendar" && s === "form" ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[13px] font-medium ${
                      step === s ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {i === 0
                      ? lang === "en"
                        ? "Tell us about you"
                        : "Cuéntanos sobre ti"
                      : lang === "en"
                        ? "Pick a time"
                        : "Elige un horario"}
                  </span>
                  {i === 0 && <div className="h-px flex-1 bg-border min-w-[32px]" />}
                </div>
              ))}
            </div>

            {/* QUALIFICATION FORM */}
            {step === "form" && (
              <div className="lux-card p-8 animate-fade-up">
                <h2 className="font-display text-2xl text-foreground mb-2">
                  {lang === "en" ? "Before we meet" : "Antes de reunirnos"}
                </h2>
                <p className="text-muted-foreground text-[14px] mb-8">
                  {lang === "en"
                    ? "Two minutes to tailor your demo experience."
                    : "Dos minutos para personalizar tu experiencia de demo."}
                </p>

                <form onSubmit={handleQualifySubmit} className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                        {lang === "en" ? "Full Name *" : "Nombre Completo *"}
                      </label>
                      <input
                        id="demo-name"
                        className={inputClass}
                        placeholder={lang === "en" ? "James Thornton" : "Carlos Mendoza"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                        {lang === "en" ? "Email *" : "Correo *"}
                      </label>
                      <input
                        id="demo-email"
                        type="email"
                        className={inputClass}
                        placeholder="james@stablename.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone + Stable */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                        {lang === "en" ? "Phone" : "Teléfono"}
                      </label>
                      <input
                        id="demo-phone"
                        type="tel"
                        className={inputClass}
                        placeholder="+1 (352) 555-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                        {lang === "en" ? "Stable / Farm Name" : "Nombre del Criadero"}
                      </label>
                      <input
                        id="demo-stable"
                        className={inputClass}
                        placeholder="Live Oak Stables"
                        value={stableName}
                        onChange={(e) => setStableName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                      {lang === "en" ? "Location (State/Country)" : "Ubicación (Estado/País)"}
                    </label>
                    <input
                      id="demo-location"
                      className={inputClass}
                      placeholder={lang === "en" ? "Ocala, FL" : "Ocala, FL"}
                      onChange={(e) => {}} // Could wire to state if needed, but adding UI for now
                    />
                  </div>

                  {/* Business type */}
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                      {lang === "en" ? "Business Type *" : "Tipo de Negocio *"}
                    </label>
                    <div className="relative">
                      <select
                        id="demo-business-type"
                        className={selectClass}
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        required
                      >
                        <option value="">
                          {lang === "en" ? "Select type..." : "Selecciona tipo..."}
                        </option>
                        {BUSINESS_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value}>
                            {lang === "en" ? bt.labelEn : bt.labelEs}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Horse count */}
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-2">
                      {lang === "en" ? "How many horses? *" : "¿Cuántos caballos? *"}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {HORSE_COUNTS.map((hc) => (
                        <button
                          key={hc.value}
                          type="button"
                          id={`demo-horses-${hc.value}`}
                          onClick={() => setHorseCount(hc.value)}
                          className={`rounded-xl border py-3 text-[13px] font-medium transition-all ${
                            horseCount === hc.value
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-secondary hover:border-foreground/50 text-muted-foreground"
                          }`}
                        >
                          {hc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary interest */}
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-2">
                      {lang === "en" ? "Primary Interest *" : "Interés Principal *"}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRIMARY_INTERESTS.map((pi) => (
                        <button
                          key={pi.value}
                          type="button"
                          id={`demo-interest-${pi.value.toLowerCase().replace(/\s/g, "-")}`}
                          onClick={() => setPrimaryInterest(pi.value)}
                          className={`rounded-xl border py-2.5 px-3 text-[12px] font-medium text-left transition-all ${
                            primaryInterest === pi.value
                              ? "border-[var(--gold)] bg-[var(--gold)]/10 text-foreground"
                              : "border-border bg-secondary hover:border-border/80 text-muted-foreground"
                          }`}
                        >
                          {lang === "en" ? pi.labelEn : pi.labelEs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan interest */}
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                      {lang === "en" ? "Plan of Interest" : "Plan de Interés"}
                    </label>
                    <div className="relative">
                      <select
                        id="demo-plan"
                        className={selectClass}
                        value={planInterest}
                        onChange={(e) => setPlanInterest(e.target.value)}
                      >
                        <option value="">
                          {lang === "en" ? "Not sure yet..." : "Aún no lo sé..."}
                        </option>
                        {PLAN_OPTIONS.map((po) => (
                          <option key={po.value} value={po.value}>
                            {lang === "en" ? po.labelEn : po.labelEs}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-[13px] text-red-500 bg-red-500/10 rounded-xl px-4 py-3">
                      {formError}
                    </p>
                  )}

                  <button
                    id="demo-qualify-submit"
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-4 text-[14px] font-medium uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-60 mt-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {lang === "en" ? "Pick a Time" : "Elegir Horario"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* CALENDLY EMBED */}
            {step === "calendar" && (
              <div ref={calendarRef} className="lux-card p-8 animate-fade-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gold)]/15">
                    <Calendar className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-foreground">
                      {lang === "en" ? "Pick your time" : "Elige tu horario"}
                    </h2>
                    <p className="text-[13px] text-muted-foreground">
                      {lang === "en"
                        ? "30-minute session with a GaitFlow specialist"
                        : "Sesión de 30 minutos con un especialista de GaitFlow"}
                    </p>
                  </div>
                </div>

                {/* Calendly inline embed */}
                <div
                  className="calendly-inline-widget rounded-2xl overflow-hidden border border-border bg-secondary/30"
                  data-url="https://calendly.com/gaitflow-demo/30min"
                  style={{ minWidth: "100%", height: "600px" }}
                />
                <script
                  type="text/javascript"
                  src="https://assets.calendly.com/assets/external/widget.js"
                  async
                />

                {/* Fallback if Calendly not configured */}
                <div className="mt-4 p-5 rounded-xl bg-[var(--gold)]/8 border border-[var(--gold)]/20">
                  <p className="text-[13px] text-foreground font-medium mb-1">
                    {lang === "en"
                      ? "🗓 Calendly not yet configured?"
                      : "🗓 ¿Calendly aún no configurado?"}
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {lang === "en"
                      ? "Replace the Calendly URL with your actual scheduling link. Until then, your qualification form submission has been saved — our team will reach out within 24 hours."
                      : "Reemplaza la URL de Calendly con tu enlace de programación real. Mientras tanto, el envío de tu formulario ha sido guardado — nuestro equipo se pondrá en contacto en 24 horas."}
                  </p>
                  <button
                    onClick={() => setStep("success")}
                    className="mt-3 text-[13px] text-[var(--gold)] hover:underline font-medium"
                  >
                    {lang === "en" ? "Continue without scheduling →" : "Continuar sin programar →"}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <div className="lux-card p-10 text-center animate-fade-up">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold)]/15 mx-auto mb-6">
                  <Check className="h-8 w-8 text-[var(--gold)]" />
                </div>
                <h2 className="font-display text-3xl text-foreground mb-3">
                  {lang === "en" ? "You're all set!" : "¡Todo listo!"}
                </h2>
                <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mx-auto">
                  {lang === "en"
                    ? "Your request is confirmed. Expect a confirmation email within a few minutes. Our team will come prepared for your specific workflow."
                    : "Tu solicitud está confirmada. Recibirás un correo de confirmación en pocos minutos. Nuestro equipo llegará preparado para tu flujo de trabajo específico."}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-[13px] font-medium uppercase tracking-widest hover:bg-foreground/90 transition-all"
                  >
                    {lang === "en" ? "Start Free Trial" : "Prueba Gratuita"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-[13px] font-medium uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    {lang === "en" ? "Back to Home" : "Volver al Inicio"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Quote */}
            <div className="lux-card p-7">
              <Quote className="h-7 w-7 text-[var(--gold)]/50 mb-4" />
              <p className="text-[15px] text-foreground leading-relaxed italic">
                {lang === "en"
                  ? '"GaitFlow replaced three separate spreadsheets and a whiteboard. Our morning briefings went from 30 minutes to under 5."'
                  : '"GaitFlow reemplazó tres hojas de cálculo separadas y una pizarra. Nuestras reuniones matutinas pasaron de 30 minutos a menos de 5."'}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] font-display text-[13px] font-semibold">
                  LO
                </div>
                <div>
                  <div className="text-[14px] font-medium text-foreground">Marisol Vega</div>
                  <div className="text-[12px] text-muted-foreground">
                    Head of Operations · Live Oak Stables
                  </div>
                </div>
              </div>
            </div>

            {/* What you'll see */}
            <div className="lux-card p-7">
              <h3 className="font-display text-lg text-foreground mb-5">
                {lang === "en" ? "What we'll cover" : "Lo que cubriremos"}
              </h3>
              <ul className="space-y-3">
                {[
                  lang === "en" ? "Full dashboard & KPI overview" : "Tablero completo y KPIs",
                  lang === "en"
                    ? "Horse profiles & health calendar"
                    : "Perfiles y calendario de salud",
                  lang === "en" ? "Task engine & team management" : "Motor de tareas y equipos",
                  lang === "en" ? "Financial suite & invoicing" : "Suite financiera y facturación",
                  lang === "en"
                    ? "Marketplace listing walkthrough"
                    : "Proceso de listado en Marketplace",
                  lang === "en"
                    ? "Q&A tailored to your operation"
                    : "Preguntas adaptadas a tu operación",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)] flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-[13px] text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div className="lux-card p-7 space-y-4">
              <h3 className="font-display text-lg text-foreground">
                {lang === "en" ? "Prefer to reach out?" : "¿Prefieres contactarnos?"}
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-[var(--gold)]" />
                  <span>demo@gaitflow.io</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-[var(--gold)]" />
                  <span>+1 (352) 555-GATE</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-[var(--gold)]" />
                  <span>Ocala, Florida · Mon–Fri 9am–6pm EST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section className="py-24 bg-secondary/30 border-y border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              {lang === "en" ? "Demo FAQ" : "Preguntas sobre la Demo"}
            </h2>
          </div>
          <div className="space-y-3">
            {DEMO_FAQS.map((faq, i) => (
              <div key={i} className="border border-border/60 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-secondary/40 transition-colors"
                >
                  <span className="font-medium text-[15px] text-foreground pr-4">
                    {lang === "en" ? faq.qEn : faq.qEs}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[14px] text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                    {lang === "en" ? faq.aEn : faq.aEs}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CONTACT SALES ════════════ */}
      <section id="contact" className="py-24 max-w-3xl mx-auto px-6 w-full">
        <div className="lux-card p-10">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-foreground">
              {lang === "en" ? "Prefer to talk to Sales?" : "¿Prefieres hablar con Ventas?"}
            </h2>
            <p className="mt-3 text-muted-foreground text-[14px]">
              {lang === "en"
                ? "Leave your details and a GaitFlow sales specialist will reach out within one business day."
                : "Deja tus datos y un especialista de ventas de GaitFlow se comunicará contigo en un día hábil."}
            </p>
          </div>

          {contactSuccess ? (
            <div className="text-center py-8">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold)]/15 mx-auto mb-5">
                <Check className="h-8 w-8 text-[var(--gold)]" />
              </div>
              <p className="font-display text-2xl text-foreground mb-2">
                {lang === "en" ? "Message received!" : "¡Mensaje recibido!"}
              </p>
              <p className="text-muted-foreground text-[14px]">
                {lang === "en"
                  ? "We'll be in touch within one business day."
                  : "Nos pondremos en contacto en un día hábil."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSales} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                    {lang === "en" ? "Full Name *" : "Nombre Completo *"}
                  </label>
                  <input
                    id="contact-name"
                    className={inputClass}
                    placeholder="Your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                    {lang === "en" ? "Email *" : "Correo *"}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className={inputClass}
                    placeholder="you@stable.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  {lang === "en" ? "Message *" : "Mensaje *"}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder={
                    lang === "en"
                      ? "Tell us about your stable and what you're looking for..."
                      : "Cuéntanos sobre tu criadero y lo que buscas..."
                  }
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                />
              </div>
              <button
                id="contact-sales-submit"
                type="submit"
                disabled={contactSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-4 text-[14px] font-medium uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-60"
              >
                {contactSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {lang === "en" ? "Send Message" : "Enviar Mensaje"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

/**
 * lib/leads.ts
 * Utilities for Section A lead capture, UTM tracking,
 * contact submissions, and demo request handling.
 */

import { supabase } from "./supabase";

// ── UTM helpers ──────────────────────────────────────────────

export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  traffic_origin: string | null;
}

/** Extract UTM parameters from the current URL search params */
export function captureUTM(): UTMParams {
  if (typeof window === "undefined")
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      traffic_origin: null,
    };

  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_term: p.get("utm_term"),
    utm_content: p.get("utm_content"),
    traffic_origin: document.referrer || null,
  };
}

/** Persist UTM params in sessionStorage so they survive across page navigations */
export function storeUTM(): void {
  if (typeof window === "undefined") return;
  const utm = captureUTM();
  // Only overwrite if we got actual UTM params this visit
  if (utm.utm_source) {
    sessionStorage.setItem("gf_utm", JSON.stringify(utm));
  }
}

/** Retrieve stored UTM params (falls back to current URL) */
export function getStoredUTM(): UTMParams {
  if (typeof window === "undefined") return captureUTM();
  try {
    const raw = sessionStorage.getItem("gf_utm");
    if (raw) return JSON.parse(raw) as UTMParams;
  } catch {
    // ignore parse errors
  }
  return captureUTM();
}

// ── Lead capture ─────────────────────────────────────────────

export interface LeadCaptureInput {
  full_name: string;
  email: string;
  stable_name?: string;
  state_country?: string;
  plan_interest?: string;
  form_type: "registration" | "demo_request" | "contact" | "pricing_cta";
  profile_id?: string;
}

export async function insertLeadCapture(input: LeadCaptureInput): Promise<void> {
  const utm = getStoredUTM();
  const { error } = await (supabase.from("lead_captures") as any).insert({
    ...input,
    ...utm,
  });
  if (error) {
    // Non-fatal — log but don't block the user flow
    console.warn("[GaitFlow] Lead capture failed:", error.message);
  }
}

// ── Contact submission ────────────────────────────────────────

export interface ContactSubmissionInput {
  full_name: string;
  email: string;
  phone?: string;
  stable_name?: string;
  subject?: string;
  category: "support" | "sales" | "partnership" | "general";
  message: string;
}

export async function insertContactSubmission(
  input: ContactSubmissionInput,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase.from("contact_submissions") as any).insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Demo request ──────────────────────────────────────────────

export interface DemoRequestInput {
  full_name: string;
  email: string;
  phone?: string;
  stable_name?: string;
  business_type?: string;
  horse_count?: string;
  primary_interest?: string;
  plan_interest?: string;
  scheduled_at?: string;
  calendly_event?: string;
}

export async function insertDemoRequest(
  input: DemoRequestInput,
): Promise<{ success: boolean; error?: string }> {
  const utm = getStoredUTM();
  const { error } = await (supabase.from("demo_requests") as any).insert({
    ...input,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
  });
  if (error) return { success: false, error: error.message };

  // Also log as a lead capture for CRM visibility
  await insertLeadCapture({
    full_name: input.full_name,
    email: input.email,
    stable_name: input.stable_name,
    plan_interest: input.plan_interest,
    form_type: "demo_request",
  });

  return { success: true };
}

// ── Success Stories ───────────────────────────────────────────

export interface SuccessStory {
  id: string;
  farm_name: string;
  location: string;
  avatar_initials: string;
  contact_name: string;
  contact_role: string;
  quote_en: string;
  metric_label_en: string;
  metric_value: string;
  metric_desc_en: string;
  quote_es: string;
  metric_label_es: string;
  metric_desc_es: string;
  is_featured: boolean;
  sort_order: number;
}

export async function fetchSuccessStories(): Promise<SuccessStory[]> {
  const { data, error } = await (supabase.from("success_stories") as any)
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[GaitFlow] Success stories fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as SuccessStory[];
}

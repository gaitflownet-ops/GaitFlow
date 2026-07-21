import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return "Sin estado";
  const s = status.toLowerCase();
  if (s === "competing" || s === "en competencia" || s === "en pista" || s === "en_pista") return "En Competencia";
  if (s === "in training" || s === "en adiestramiento" || s === "en arreglo" || s === "in_training") return "En Adiestramiento";
  if (s === "resting" || s === "en descanso" || s === "en potrero" || s === "en_descanso") return "En Descanso";
  if (s === "breeding" || s === "en reproducción" || s === "reproducción" || s === "en_reproduccion") return "En Reproducción";
  return status;
}

/**
 * Format a number to currency.
 * Defaults to Colombian Pesos (COP) and Spanish Colombia (es-CO) locale.
 * Scales to support USD and other currencies if the app grows.
 */
export function formatMoney(amount: number | null | undefined, currency: string = 'COP'): string {
  if (amount == null) return formatMoney(0, currency);
  
  // Decide locale based on currency to make it scalable (e.g. if USD -> en-US)
  const locale = currency === 'USD' ? 'en-US' : 'es-CO';
  
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(amount);
}

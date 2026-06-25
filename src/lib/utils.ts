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

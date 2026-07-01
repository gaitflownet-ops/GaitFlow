/**
 * GaitFlow Document Classification System
 * 
 * Each document type has a verification policy:
 * - "auto_verified": Archival documents (pedigrees, photos, results) → auto-Revisado
 * - "requires_review": Legal/health documents → starts as "Por revisar"  
 * - "expires": Documents that expire → starts as "Por revisar" + suggests expiration date
 */

// ── Verification Policies ──────────────────────────────────────────────────
export type VerificationPolicy = "auto_verified" | "requires_review" | "expires";

export interface DocumentTypeConfig {
  label: string;
  policy: VerificationPolicy;
  /** Hint shown to user explaining why this policy applies */
  policyHint: string;
  /** Suggested expiration period in days (only for 'expires' policy) */
  suggestedExpirationDays?: number;
  /** Icon emoji for quick identification */
  icon: string;
}

// ── Smart Document Type Registry ───────────────────────────────────────────
export const DOCUMENT_TYPE_REGISTRY: Record<string, DocumentTypeConfig> = {
  // ─── CABALLOS ────────────────────────────────
  "Registro genealógico": {
    label: "Registro genealógico",
    policy: "auto_verified",
    policyHint: "Documento de archivo permanente",
    icon: "📜",
  },
  "Pedigree": {
    label: "Pedigree",
    policy: "auto_verified",
    policyHint: "Documento de archivo permanente",
    icon: "🧬",
  },
  "Registro de propiedad": {
    label: "Registro de propiedad",
    policy: "requires_review",
    policyHint: "Documento legal — requiere verificación",
    icon: "📋",
  },
  "Certificados sanitarios": {
    label: "Certificados sanitarios",
    policy: "expires",
    policyHint: "Vence periódicamente — requiere fecha de vencimiento",
    suggestedExpirationDays: 365,
    icon: "🏥",
  },
  "Exámenes veterinarios": {
    label: "Exámenes veterinarios",
    policy: "expires",
    policyHint: "Resultado clínico — requiere revisión y puede vencer",
    suggestedExpirationDays: 180,
    icon: "🩺",
  },
  "Radiografías": {
    label: "Radiografías",
    policy: "requires_review",
    policyHint: "Resultado diagnóstico — requiere revisión profesional",
    icon: "🦴",
  },
  "Laboratorios": {
    label: "Laboratorios",
    policy: "expires",
    policyHint: "Resultado de laboratorio — puede requerir seguimiento",
    suggestedExpirationDays: 90,
    icon: "🧪",
  },
  "Historial competitivo": {
    label: "Historial competitivo",
    policy: "auto_verified",
    policyHint: "Registro de competencias — archivo permanente",
    icon: "🏆",
  },
  "Resultados de ferias": {
    label: "Resultados de ferias",
    policy: "auto_verified",
    policyHint: "Resultado oficial — archivo permanente",
    icon: "🎪",
  },
  "Fotografías oficiales": {
    label: "Fotografías oficiales",
    policy: "auto_verified",
    policyHint: "Material visual — archivo permanente",
    icon: "📸",
  },

  // ─── REPRODUCCIÓN ──────────────────────────────
  "Certificados de semen": {
    label: "Certificados de semen",
    policy: "expires",
    policyHint: "Material genético con vigencia — requiere fecha de vencimiento",
    suggestedExpirationDays: 365,
    icon: "🧫",
  },
  "Certificados de embriones": {
    label: "Certificados de embriones",
    policy: "expires",
    policyHint: "Material genético con vigencia — requiere fecha de vencimiento",
    suggestedExpirationDays: 365,
    icon: "🥚",
  },
  "Contratos de monta": {
    label: "Contratos de monta",
    policy: "requires_review",
    policyHint: "Contrato legal — requiere revisión y aprobación",
    icon: "📝",
  },
  "Transferencias embrionarias": {
    label: "Transferencias embrionarias",
    policy: "requires_review",
    policyHint: "Procedimiento reproductivo — requiere verificación",
    icon: "🔬",
  },
  "Historial reproductivo": {
    label: "Historial reproductivo",
    policy: "auto_verified",
    policyHint: "Historial de referencia — archivo permanente",
    icon: "📊",
  },

  // ─── OPERACIÓN ─────────────────────────────────
  "Facturas": {
    label: "Facturas",
    policy: "requires_review",
    policyHint: "Documento financiero — requiere verificación contable",
    icon: "🧾",
  },
  "Compras": {
    label: "Compras",
    policy: "requires_review",
    policyHint: "Registro de compra — requiere verificación",
    icon: "🛒",
  },
  "Proveedores": {
    label: "Proveedores",
    policy: "auto_verified",
    policyHint: "Información de proveedor — archivo de referencia",
    icon: "🏭",
  },
  "Contratos": {
    label: "Contratos",
    policy: "requires_review",
    policyHint: "Documento legal — requiere revisión y aprobación",
    icon: "📄",
  },
  "Documentos de transporte": {
    label: "Documentos de transporte",
    policy: "expires",
    policyHint: "Guía de transporte — puede tener vigencia limitada",
    suggestedExpirationDays: 30,
    icon: "🚚",
  },
  "Seguros": {
    label: "Seguros",
    policy: "expires",
    policyHint: "Póliza de seguro — vence anualmente",
    suggestedExpirationDays: 365,
    icon: "🛡️",
  },

  // ─── ADMINISTRATIVO ────────────────────────────
  "Contratos comerciales": {
    label: "Contratos comerciales",
    policy: "requires_review",
    policyHint: "Contrato comercial — requiere revisión legal",
    icon: "💼",
  },
  "Documentos legales": {
    label: "Documentos legales",
    policy: "requires_review",
    policyHint: "Documento legal — requiere verificación",
    icon: "⚖️",
  },
  "Acuerdos de venta": {
    label: "Acuerdos de venta",
    policy: "requires_review",
    policyHint: "Acuerdo comercial — requiere revisión y firma",
    icon: "🤝",
  },
};

// ── Helper: Get verification status based on document type and user role ──
export function getSmartVerificationStatus(
  documentType: string,
  userRole: string
): { verified: string; hint: string; suggestExpiration: boolean; suggestedDays?: number } {
  const config = DOCUMENT_TYPE_REGISTRY[documentType];
  const role = userRole?.toUpperCase() || "";
  const isOwnerOrAdmin = ["OWNER", "SUPER_ADMIN", "STABLE_ADMIN"].includes(role);

  if (!config) {
    return {
      verified: isOwnerOrAdmin ? "Revisado" : "Pendiente",
      hint: "",
      suggestExpiration: false,
    };
  }

  switch (config.policy) {
    case "auto_verified":
      // Archival docs: always auto-verified regardless of role
      return {
        verified: "Revisado",
        hint: config.policyHint,
        suggestExpiration: false,
      };

    case "requires_review":
      return {
        verified: isOwnerOrAdmin ? "Revisado" : "Por revisar",
        hint: config.policyHint,
        suggestExpiration: false,
      };

    case "expires":
      return {
        verified: isOwnerOrAdmin ? "Revisado" : "Por revisar",
        hint: config.policyHint,
        suggestExpiration: true,
        suggestedDays: config.suggestedExpirationDays,
      };

    default:
      return {
        verified: "Pendiente",
        hint: "",
        suggestExpiration: false,
      };
  }
}

// ── Categories (preserved for backward compatibility) ──────────────────────
export const DOCUMENT_CATEGORIES = {
  CABALLOS: [
    "Registro genealógico",
    "Pedigree",
    "Registro de propiedad",
    "Certificados sanitarios",
    "Exámenes veterinarios",
    "Radiografías",
    "Laboratorios",
    "Historial competitivo",
    "Resultados de ferias",
    "Fotografías oficiales",
  ],
  REPRODUCCIÓN: [
    "Certificados de semen",
    "Certificados de embriones",
    "Contratos de monta",
    "Transferencias embrionarias",
    "Historial reproductivo",
  ],
  OPERACIÓN: [
    "Facturas",
    "Compras",
    "Proveedores",
    "Contratos",
    "Documentos de transporte",
    "Seguros",
  ],
  ADMINISTRATIVO: [
    "Contratos comerciales",
    "Documentos legales",
    "Acuerdos de venta",
  ],
} as const;

export type DocumentMainCategory = keyof typeof DOCUMENT_CATEGORIES;

export const ALLOWED_FILE_TYPES = {
  documentos: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  imagenes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
};

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const VERIFICATION_STATUSES = ["Pendiente", "Por revisar", "Revisado", "No válido"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

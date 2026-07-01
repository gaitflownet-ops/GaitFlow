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
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  ],
  imagenes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
};

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const VERIFICATION_STATUSES = ["Pendiente", "Revisado", "No válido"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

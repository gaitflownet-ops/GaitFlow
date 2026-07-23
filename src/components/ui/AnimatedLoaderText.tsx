import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export type LoaderContext = "auth" | "saving" | "uploading" | "default";

const contextPhrases: Record<LoaderContext, string[]> = {
  auth: [
    "Verificando credenciales seguras...",
    "Cargando tu entorno de trabajo...",
    "Sincronizando permisos...",
  ],
  saving: [
    "Guardando registro en la bóveda...",
    "Asegurando la información...",
    "Sincronizando con la nube...",
  ],
  uploading: [
    "Procesando archivos...",
    "Subiendo contenido multimedia...",
    "Optimizando recursos visuales...",
  ],
  default: [
    "Cargando información...",
    "Procesando solicitud...",
    "Por favor espera...",
  ]
};

export function AnimatedLoaderText({ 
  className = "", 
  context = "default" 
}: { 
  className?: string;
  context?: LoaderContext;
}) {
  const phrases = contextPhrases[context] || contextPhrases.default;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [context, phrases.length]);

  return (
    <span className={`flex items-center justify-center gap-2 animate-fade-in ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      <span className="text-sm font-medium animate-pulse">{phrases[index] || phrases[0]}</span>
    </span>
  );
}

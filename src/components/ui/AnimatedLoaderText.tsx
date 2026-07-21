import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const phrases = [
  "Preparando los datos...",
  "Conectando con el servidor seguro...",
  "Guardando información en la bóveda...",
  "Procesando las imágenes...",
  "Sincronizando con el criadero...",
  "Casi listo, por favor espera...",
  "Optimizando tu registro...",
  "Finalizando la operación..."
];

export function AnimatedLoaderText({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2500); // Change phrase every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`flex items-center justify-center gap-2 animate-fade-in ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      <span className="text-sm font-medium animate-pulse">{phrases[index]}</span>
    </span>
  );
}

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial:
      "GaitFlow nos redujo el papeleo a la mitad. Pasamos de 3 horas diarias de administración a menos de 45 minutos — y ya nada se nos escapa.",
    by: "Carolina M., Propietaria — Criadero La Luisa, Sabana de Bogotá",
    imgSrc:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 1,
    testimonial:
      "El pronóstico de precios de Holt-Winters nos indicó listar nuestro reproductor en septiembre. Lo vendimos en 12 días, un 18% por encima de lo que pedíamos.",
    by: "Roberto K., Socio Director — Criadero El Rosario, Pereira",
    imgSrc:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 2,
    testimonial:
      "Como veterinario, tener el historial médico completo, los registros de vacunación y el inventario farmacéutico en un solo lugar es revolucionario. Me ahorro mínimo 2 horas por visita.",
    by: "Dra. Sandra V., Veterinaria Equina — Medellín",
    imgSrc:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 3,
    testimonial:
      "Nuestro programa de cría funcionaba con hojas de cálculo y pura intuición. Los puntajes de probabilidad de gestación de GaitFlow han mejorado de verdad nuestros resultados de parín esta temporada.",
    by: "Jaime A., Director de Cría — Criadero San Jerónimo, Eje Cafetero",
    imgSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 4,
    testimonial:
      "Manejar 40 ejemplares en tres pesebreras era un caos total. Ahora mis palafreneros reciben su lista de labores en el celular cada mañana. No más alimentos olvidados, no más confusiones.",
    by: "Diana L., Administradora — Hacienda Nápoles, Antioquia",
    imgSrc:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 5,
    testimonial:
      "El índice de riesgo sanitario estacional nos alertó sobre tres caballos en riesgo de parásitos dos semanas antes de que yo los hubiera detectado. Esa intervención temprana nos ahorró una urgencia veterinaria.",
    by: "Marcos T., Jefe de Operaciones — Criadero El Diamante, Valle del Cauca",
    imgSrc:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 6,
    testimonial:
      "El listado del Mercado se alimenta directamente del perfil del ejemplar. Lo que antes nos tomaba 2 horas por publicación, ahora son unos 3 minutos. Increíble.",
    by: "Elena F., Directora de Ventas — Hacienda La Aurora, Cundinamarca",
    imgSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 7,
    testimonial:
      "La facturación era una pesadilla mensual. GaitFlow genera facturas automáticamente cuando se registra la pesebrera. Mi contador quedó impresionado con lo limpio que quedaron los libros.",
    by: "Tomás H., Director Financiero — Grupo Equino del Pacífico, Cali",
    imgSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 8,
    testimonial:
      "Probamos tres plataformas antes de GaitFlow. Esta es la primera que de verdad entiende cómo funciona un criadero de Criollo Colombiano.",
    by: "Sofía R., Propietaria — Criadero La Marqueza, Sabana de Bogotá",
    imgSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 9,
    testimonial:
      "El pronóstico de costos de alimentación nos ha ahorrado plata de verdad. Compramos heno al por mayor antes del alza de temporada de ferias, justo como GaitFlow lo recomendó.",
    by: "Miguel B., Gerente de Operaciones — Criadero Los Potrillos, Llanos Orientales",
    imgSrc:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 10,
    testimonial:
      "Solo el árbol genealógico y la bóveda de documentos ya valen la suscripción. Todo en un solo lugar — registros de Fedequinas, resultados de laboratorio, contratos. Por fin.",
    by: "Ana P., Directora de Cría — Criadero Santa Helena, Risaralda",
    imgSrc:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 11,
    testimonial:
      "Mi equipo de 12 personas en dos fincas ahora está perfectamente coordinado. Los permisos por rol hacen que cada persona vea exactamente lo que necesita — ni más, ni menos.",
    by: "Patricio O., Propietario — Hacienda El Paraíso, Cauca",
    imgSrc:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 12,
    testimonial:
      "GaitFlow nos ha permitido crecer de 15 a 45 ejemplares sin contratar ni un solo administrativo más. La plataforma crece con vos.",
    by: "Isabella N., Cofundadora — Novus Equine Partners, Bogotá",
    imgSrc:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 13,
    testimonial:
      "El tablero financiero les da a nuestros inversionistas la transparencia que necesitan. Informes mensuales, tendencias de ingresos, desglose de gastos — todo exportable en minutos.",
    by: "Gregorio M., CEO — Fondo Ganadero del Tolima",
    imgSrc:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
  },
];

interface TestimonialCardProps {
  position: number;
  testimonial: (typeof testimonials)[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 text-[oklch(0.18_0.018_60)] border-[var(--gold)]"
          : "z-0 bg-card text-card-foreground border-border hover:border-[var(--gold)]/50",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px var(--border)" : "0px 0px 0px 0px transparent",
        background: isCenter ? "var(--gradient-gold)" : "var(--card)",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={testimonial.by.split(",")[0]}
        className="mb-4 h-14 w-12 bg-muted object-cover object-top"
        style={{
          boxShadow: isCenter ? "3px 3px 0px var(--charcoal)" : "3px 3px 0px var(--border)",
        }}
      />
      <h3
        className={cn(
          "text-base sm:text-xl font-medium",
          isCenter ? "text-[oklch(0.18_0.018_60)]" : "text-foreground",
        )}
      >
        "{testimonial.testimonial}"
      </h3>
      <p
        className={cn(
          "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
          isCenter ? "text-[oklch(0.18_0.018_60)]/80" : "text-muted-foreground",
        )}
      >
        — {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-muted/30" style={{ height: 600 }}>
      {testimonialsList.map((testimonial, index) => {
        const position =
          testimonialsList.length % 2
            ? index - (testimonialsList.length + 1) / 2
            : index - testimonialsList.length / 2;
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-[var(--gold)] hover:text-charcoal hover:border-[var(--gold)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          aria-label="Testimonio anterior"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-[var(--gold)] hover:text-charcoal hover:border-[var(--gold)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          aria-label="Siguiente testimonio"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

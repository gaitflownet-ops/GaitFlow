"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial:
      "GaitFlow cut our administrative workload in half. We went from 3 hours of daily paperwork to under 45 minutes — and nothing falls through the cracks.",
    by: "Caroline M., Owner — Live Oak Stables, Ocala FL",
    imgSrc:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 1,
    testimonial:
      "The Holt-Winters price forecast told us to list our Warmblood mare in September. We sold her 12 days later, 18% above our original asking price.",
    by: "Robert K., Managing Partner — Pinewood Farm, Ocala FL",
    imgSrc:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 2,
    testimonial:
      "As a vet, having the full medical history, vaccination records, and pharmaceutical inventory in one place has been transformational. I save at least 2 hours per farm visit.",
    by: "Dr. Sandra V., Equine Veterinarian — Wellington Elite",
    imgSrc:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 3,
    testimonial:
      "Our breeding program used to run on spreadsheets and gut feeling. GaitFlow's gestation probability scores have genuinely improved our foaling outcomes this season.",
    by: "James A., Breeding Director — Ocala Genetics",
    imgSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 4,
    testimonial:
      "Managing 40 horses across three barns was chaos. Now my grooms get their task list on their phones every morning. No more missed feedings, no more confusion.",
    by: "Diana L., Stable Manager — Emerald Creek Farm",
    imgSrc:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 5,
    testimonial:
      "The seasonal health risk index flagged three horses for parasite risk two weeks before I would have caught it. That early intervention saved us an emergency vet call.",
    by: "Marcus T., Head of Operations — Cypress Ridge Stables",
    imgSrc:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 6,
    testimonial:
      "The Marketplace listing pulls directly from our horse profiles. What used to take 2 hours of data entry per listing now takes about 3 minutes. Incredible.",
    by: "Elena F., Sales Director — Golden Gate Equestrian",
    imgSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 7,
    testimonial:
      "Our invoicing used to be a monthly nightmare. GaitFlow generates client invoices automatically when boarding is logged. My accountant was shocked how clean our books are now.",
    by: "Thomas H., CFO — Heritage Bloodstock Group",
    imgSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 8,
    testimonial:
      "We tried three other platforms before GaitFlow. This is the first one built by people who actually understand how a real equestrian operation works.",
    by: "Sophia R., Owner — Silver Spur Ranch, Ocala FL",
    imgSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 9,
    testimonial:
      "The feed cost forecast has saved us real money. We bulk-purchased hay before the show season price spike based on the GaitFlow recommendation — exactly right.",
    by: "Michael B., Operations Manager — WEC Area Stables",
    imgSrc:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 10,
    testimonial:
      "The pedigree tree and document vault alone are worth the subscription. Everything in one place — passports, USEF records, lab results, contracts. Finally.",
    by: "Anna P., Breeding Manager — Thornberry Farm",
    imgSrc:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 11,
    testimonial:
      "My team of 12 across two properties is now perfectly coordinated. The RBAC permissions mean each person sees exactly what they need — nothing more, nothing less.",
    by: "Patrick O., Owner — Fairfield Equestrian Center",
    imgSrc:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 12,
    testimonial:
      "From the moment we onboarded, the GaitFlow team was responsive, thorough, and clearly deeply invested in our success. Support is exceptional.",
    by: "Laura C., General Manager — Blue Ridge Show Stables",
    imgSrc:
      "https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 13,
    testimonial:
      "The stall occupancy map is something I never knew I needed. Moving horses between barns and tracking boarding costs is now completely seamless.",
    by: "Nathan W., Facility Director — Summerfield Equestrian",
    imgSrc:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 14,
    testimonial:
      "GaitFlow has allowed us to scale from 15 horses to 45 without adding a single administrative hire. The platform scales with you.",
    by: "Isabella N., Co-Founder — Novus Equine Partners",
    imgSrc:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=150&q=80",
  },
  {
    tempId: 15,
    testimonial:
      "The financial dashboard gives our investors the transparency they need. Monthly reports, revenue trends, expense breakdowns — all exportable in minutes.",
    by: "Gregory M., CEO — Meridian Bloodstock Fund",
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
          aria-label="Previous testimonial"
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
          aria-label="Next testimonial"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

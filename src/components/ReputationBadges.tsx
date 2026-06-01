import { Award, Flame, Star, ShieldCheck } from "lucide-react";

type Props = {
  badges: string[];
  className?: string;
};

export function ReputationBadges({ badges, className = "" }: Props) {
  if (!badges || badges.length === 0) return null;

  const getIcon = (badge: string) => {
    if (badge.includes("Champion")) return <Award className="h-3.5 w-3.5" />;
    if (badge.includes("Hot") || badge.includes("Rising")) return <Flame className="h-3.5 w-3.5" />;
    if (badge.includes("Elite") || badge.includes("Proven"))
      return <Star className="h-3.5 w-3.5" />;
    return <ShieldCheck className="h-3.5 w-3.5" />;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] text-[11px] font-medium tracking-widest uppercase backdrop-blur-md"
        >
          {getIcon(badge)}
          <span>{badge}</span>
        </div>
      ))}
    </div>
  );
}

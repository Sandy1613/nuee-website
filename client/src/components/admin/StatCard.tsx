import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="border border-ivory/10 p-6 bg-charcoal-light/20">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-ivory/45">{label}</p>
        <Icon size={16} className="text-gold" />
      </div>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

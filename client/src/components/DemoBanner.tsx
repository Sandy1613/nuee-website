import { AlertTriangle } from "lucide-react";
import { useSystemMode } from "@/hooks/useSystemMode";

export function DemoBanner() {
  const { isDemo } = useSystemMode();

  if (!isDemo) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[70] h-9 bg-amber-400 text-charcoal-deep text-[11px] sm:text-xs font-medium px-4 flex items-center justify-center gap-2 text-center overflow-hidden">
      <AlertTriangle size={13} className="shrink-0" />
      <span className="truncate">
        Demo Mode — sample data only, not a production database. Do not enter real personal information.
      </span>
    </div>
  );
}

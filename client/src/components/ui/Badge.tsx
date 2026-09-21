import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-3 py-1 text-[11px] uppercase tracking-widest font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

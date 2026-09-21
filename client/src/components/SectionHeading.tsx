import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className={cn("font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-balance", light ? "text-ivory" : "text-ivory")}>
        {title}
      </h2>
      <div className={cn("divider-gold my-6", align === "center" && "mx-auto")} />
      {description && <p className="text-ivory/60 leading-relaxed">{description}</p>}
    </div>
  );
}

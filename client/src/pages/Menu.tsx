import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MenuCategory, MenuItem } from "@shared/schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

type CategoryWithItems = MenuCategory & { items: MenuItem[] };

export default function Menu() {
  const { data: categories, isLoading } = useQuery<CategoryWithItems[]>({ queryKey: ["/api/menu"] });
  const [type, setType] = useState<"food" | "beverage">("food");
  const [subtype, setSubtype] = useState<"veg" | "non_veg">("veg");

  const filtered = (categories ?? []).filter((c) => {
    if (c.type !== type) return false;
    if (type === "food") return c.subtype === subtype;
    return true;
  });

  return (
    <div className="pt-40 pb-28">
      <div className="container-editorial mb-16">
        <Reveal>
          <SectionHeading
            eyebrow="Nuée Menu"
            title="Seasonal, Considered, Shared"
            description="A living menu that shifts with the season. Sample content below is clearly marked and editable by our team."
          />
        </Reveal>
      </div>

      <div className="container-editorial">
        <Reveal className="flex flex-wrap gap-3 mb-6">
          {(["food", "beverage"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "px-6 py-2.5 text-xs uppercase tracking-widest border transition-colors duration-300",
                type === t ? "border-gold text-gold bg-gold/10" : "border-ivory/15 text-ivory/60 hover:border-ivory/40",
              )}
            >
              {t === "food" ? "Food" : "Beverages"}
            </button>
          ))}
        </Reveal>

        {type === "food" && (
          <Reveal className="flex flex-wrap gap-3 mb-14">
            {(["veg", "non_veg"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSubtype(s)}
                className={cn(
                  "px-5 py-2 text-xs uppercase tracking-widest border transition-colors duration-300",
                  subtype === s ? "border-gold text-gold" : "border-ivory/10 text-ivory/45 hover:border-ivory/30",
                )}
              >
                {s === "veg" ? "Vegetarian" : "Non-Vegetarian"}
              </button>
            ))}
          </Reveal>
        )}

        {isLoading && <p className="text-ivory/50">Loading menu…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-ivory/50">No items in this category yet.</p>
        )}

        <div className="space-y-16">
          {filtered.map((category) => (
            <Reveal key={category.id}>
              <h3 className="font-display text-3xl mb-8 pb-4 border-b border-ivory/10">{category.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                {category.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-6">
                    <div>
                      <p className="text-ivory flex items-center gap-2">
                        {item.name}
                        {item.isSignature && <span className="text-gold text-[10px] uppercase tracking-widest border border-gold/40 px-2 py-0.5">Signature</span>}
                      </p>
                      {item.description && <p className="text-ivory/45 text-sm mt-1 max-w-md">{item.description}</p>}
                    </div>
                    <p className="text-gold shrink-0">{item.price}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

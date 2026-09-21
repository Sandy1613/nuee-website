import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";

const sections = [
  {
    eyebrow: "Our Story",
    title: "Nuée began with a single idea.",
    body: "That a great evening out shouldn't feel like a performance. Nuée opened in Kalyani Nagar as a tavern and bar for people who want their dinner unhurried — a room built for long conversations, considered plates, and a glass that's never left empty for long.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Seasonal Dining Philosophy",
    title: "We cook with the calendar, not against it.",
    body: "Our kitchen changes with what the season offers. Rather than chase trends, we let produce set the pace — building menus around what's genuinely at its best, week to week.",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Craftsmanship",
    title: "Every detail is made, not bought.",
    body: "From the way our cocktails are batched to the linen on your table, Nuée favours craft over convenience. It's a slower way of doing things — and it shows in the details.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Thoughtful Hospitality",
    title: "Service that notices, never intrudes.",
    body: "Our team is trained to read a table, not just take an order — refilling water before it's asked for, recommending a dish because they know you'll love it, and giving you space when that's what an evening calls for.",
    image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Culinary Approach",
    title: "Rooted in the region, open to the world.",
    body: "Our menus draw heavily from Maharashtra's culinary heritage — including recipes that have quietly disappeared from most restaurant tables — while staying open to techniques and ingredients from further afield.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Atmosphere",
    title: "Warm light, low hum, room to breathe.",
    body: "Deep charcoal walls, warm ivory linens and muted gold accents set the tone — a room designed to feel calm at 7pm and alive by 10.",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Events & Experiences",
    title: "Evenings worth returning for.",
    body: "From Saturday's Bollywood Jamming Sessions to Sunday's Lost Recipes of Maharashtra, our calendar is built around experiences that give guests a reason to come back — not just once, but every week.",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function About() {
  const { data: content } = useQuery<Record<string, string>>({ queryKey: ["/api/website-content"] });

  return (
    <div className="pt-40 pb-28">
      <div className="container-editorial mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="About Nuée"
            title="A Tavern Built On Quiet Confidence"
            description={content?.intro_text}
          />
        </Reveal>
      </div>

      <div className="space-y-28 sm:space-y-36">
        {sections.map((section, i) => (
          <div key={section.title} className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
              <div className="aspect-[4/5] overflow-hidden">
                <img src={section.image} alt={section.title} className="h-full w-full object-cover" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className={i % 2 === 1 ? "lg:order-1" : ""}>
              <p className="eyebrow mb-5">{section.eyebrow}</p>
              <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-6 text-balance">{section.title}</h2>
              <p className="text-ivory/60 leading-relaxed">{section.body}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { parseSiteImages } from "@/lib/siteImages";

const sections = [
  {
    eyebrow: "How We Started",
    title: "It started as a bar with a kitchen attached.",
    body: "That's still roughly true. Nuée opened in Kalyani Nagar because a few people wanted a place they'd actually want to sit in themselves — long tables, a bar that doesn't shut early, and a kitchen willing to cook things that take four hours instead of forty minutes.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "The Kitchen",
    title: "The menu changes when the produce does.",
    body: "We rewrite parts of the menu most months — sometimes because something's out of season, sometimes because the chef got bored of a dish. Expect a few things to vanish without warning, and better things to take their place.",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "In The Details",
    title: "The cocktail syrups take three days to make.",
    body: "Some of what's behind our bar is started well before the week it's served — slower than buying a mixer off the shelf, but it's the part our bar team cares about most. Same logic applies to the bread, made fresh every day.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Service",
    title: "We'd rather under-interrupt than over-serve.",
    body: "Our team is trained to read a table before approaching it — topping up water without being asked, holding the next course if you're mid-conversation, and stepping back when a table clearly wants the room to itself.",
    image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "On The Menu",
    title: "Half of it, you won't find elsewhere in Pune.",
    body: "We dig into Maharashtrian dishes that have mostly disappeared from restaurant menus — some from home kitchens, a couple relearned from cooks willing to share a recipe that hadn't left the family in decades.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "The Room",
    title: "Deliberately dim, on purpose.",
    body: "We kept the lighting low and the walls dark because a loud, bright room works against a long dinner. Come at 7 and it's calm. Come at 10 on a Saturday and the bar's three-deep — same room, different night.",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Events",
    title: "Saturdays and Sundays look different here.",
    body: "Saturday nights, our house band plays Bollywood classics unplugged. Sunday afternoons, it's a set Maharashtrian menu built around recipes you won't find on a regular menu. Both need a reservation — both fill up.",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function About() {
  const { data: content } = useQuery<Record<string, string>>({ queryKey: ["/api/website-content"] });
  const aboutImages = parseSiteImages(content?.site_images).about.sections;

  return (
    <div className="pt-40 pb-28">
      <div className="container-editorial mb-24">
        <Reveal>
          <SectionHeading
            eyebrow="About Nuée"
            title="A Tavern First, A Bar Close Behind"
            description={content?.intro_text}
          />
        </Reveal>
      </div>

      <div className="space-y-28 sm:space-y-36">
        {sections.map((section, i) => (
          <div key={section.title} className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
              <div className="aspect-[4/5] overflow-hidden">
                <img src={aboutImages[i] ?? section.image} alt={section.title} className="h-full w-full object-cover" />
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

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPin, Phone, Clock, Star } from "lucide-react";
import type { EventWithSessions, Review } from "@shared/schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/Button";
import { useTableBookingModal } from "@/context/TableBookingModalContext";

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=800&auto=format&fit=crop",
];

export default function Home() {
  const { open } = useTableBookingModal();
  const { data: events } = useQuery<EventWithSessions[]>({ queryKey: ["/api/events"] });
  const { data: reviews } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });
  const { data: content } = useQuery<Record<string, string>>({ queryKey: ["/api/website-content"] });

  const featured = (events ?? []).filter((e) => e.isFeatured).slice(0, 3);
  const bollywood = (events ?? []).find((e) => e.slug === "saturday-bollywood-jamming");
  const lostRecipes = (events ?? []).find((e) => e.slug === "lost-recipes-of-maharashtra");

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[640px] flex items-end grain-overlay overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop"
          alt="Nuée Tavern & Bar interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-charcoal-deep/20" />
        <div className="container-editorial relative pb-20 sm:pb-28">
          <Reveal>
            <p className="eyebrow mb-5">Kalyani Nagar, Pune</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-3xl text-balance mb-6">
              {content?.hero_title ?? "An Evening, Unhurried."}
            </h1>
            <p className="text-ivory/70 text-lg max-w-xl mb-10 leading-relaxed">
              {content?.hero_subtitle ??
                "Nuée Tavern & Bar — fine dining, live evenings and seasonal menus in Kalyani Nagar, Pune."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/events"><Button size="lg">Explore Events</Button></Link>
              <Button size="lg" variant="outline" onClick={open}>Book a Table</Button>
              <Link href="/menu"><Button size="lg" variant="ghost">View Menu</Button></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-28 sm:py-36">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="eyebrow mb-5">Nuée</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6 text-balance">
              A tavern built around slowness.
            </h2>
            <p className="text-ivory/65 leading-relaxed mb-6">
              {content?.intro_text ??
                "Nuée is a tavern and bar built around slowness — considered plates, warm light, and evenings that don't rush toward last call."}
            </p>
            <Link href="/about" className="text-gold text-sm uppercase tracking-widest border-b border-gold/40 pb-1 hover:border-gold transition-colors">
              Our Story
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop"
                alt="Nuée dining room"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured Events */}
      {featured.length > 0 && (
        <section className="py-20 sm:py-28 bg-charcoal-light/40">
          <div className="container-editorial">
            <Reveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
                <SectionHeading eyebrow="What's On" title="Featured Upcoming Events" />
                <Link href="/events" className="text-gold text-sm uppercase tracking-widest border-b border-gold/40 pb-1 hover:border-gold transition-colors shrink-0">
                  View All Events
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {featured.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.1}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Saturday Bollywood Jamming */}
      <section className="py-28 sm:py-36">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop"
                alt="Saturday Bollywood Jamming"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2" delay={0.1}>
            <p className="eyebrow mb-5">Every Saturday · 7:30 PM Onwards</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6 text-balance">
              Saturday Bollywood Jamming
            </h2>
            <p className="text-ivory/65 leading-relaxed mb-8">
              Live Bollywood music and an intimate dining atmosphere at Nuée Tavern &amp; Bar, Kalyani Nagar. Our
              house band takes the room through a soulful, unplugged evening — no cover charge, just good company
              and a full à la carte menu.
            </p>
            <Link href={bollywood ? `/events/${bollywood.slug}` : "/events"}>
              <Button variant="outline">Reserve Your Table</Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Sunday Lost Recipes */}
      <section className="py-28 sm:py-36 bg-charcoal-light/40">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="eyebrow mb-5">Sundays · Lunch 1:30 PM &amp; Dinner 7:30 PM</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6 text-balance">
              Lost Recipes of Maharashtra
            </h2>
            <p className="text-ivory/65 leading-relaxed mb-4">
              A curated exploration of forgotten regional recipes, revived and served family-style. ₹2,500++ per
              person, reservation only.
            </p>
            <p className="text-ivory/45 text-sm mb-8">Reservation required — limited covers each session.</p>
            <Link href={lostRecipes ? `/events/${lostRecipes.slug}` : "/events"}>
              <Button variant="outline">Reserve Your Seat</Button>
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200&auto=format&fit=crop"
                alt="Lost Recipes of Maharashtra"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Fine dining + seasonal philosophy */}
      <section className="py-28 sm:py-36">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Reveal>
            <p className="eyebrow mb-5">The Experience</p>
            <h3 className="font-display text-3xl mb-5 text-balance">Fine dining, without the formality.</h3>
            <p className="text-ivory/60 leading-relaxed">
              Every table at Nuée is set with intention — soft light, unhurried service, and a room designed to make
              two hours feel like an evening well spent. It's fine dining measured in comfort, not ceremony.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-5">The Menu</p>
            <h3 className="font-display text-3xl mb-5 text-balance">Seasonal by philosophy, not by trend.</h3>
            <p className="text-ivory/60 leading-relaxed">
              Our menus shift with what the season offers — produce at its peak, recipes revisited, and a bar list
              that changes as often as the weather. Nothing is on the menu because it's easy; everything is there
              because it's right for now.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 sm:py-28 bg-charcoal-light/40">
        <div className="container-editorial">
          <Reveal>
            <SectionHeading eyebrow="Moments" title="From the Nuée Gallery" align="center" />
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-14">
            {GALLERY_IMAGES.map((src, i) => (
              <Reveal key={src} delay={i * 0.05} className="aspect-square overflow-hidden group">
                <img
                  src={src}
                  alt="Nuée gallery"
                  className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-110"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="py-28 sm:py-36">
          <div className="container-editorial">
            <Reveal>
              <SectionHeading eyebrow="Guests Speak" title="What Our Guests Say" align="center" />
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16">
              {reviews.slice(0, 3).map((review, i) => (
                <Reveal key={review.id} delay={i * 0.1} className="text-center">
                  <div className="flex justify-center gap-1 mb-4 text-gold">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} size={16} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="font-serif text-xl leading-relaxed text-ivory/80 mb-5 italic">
                    "{review.reviewText}"
                  </p>
                  <p className="text-xs uppercase tracking-widest text-ivory/40">
                    {review.guestName} · {review.source}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location + Hours */}
      <section className="py-28 sm:py-36 bg-charcoal-light/40">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="eyebrow mb-5">Find Us</p>
            <h3 className="font-display text-4xl mb-8 text-balance">Kalyani Nagar, Pune</h3>
            <div className="space-y-5 text-ivory/65">
              <p className="flex gap-3"><MapPin className="text-gold shrink-0 mt-1" size={18} /> {content?.address}</p>
              <p className="flex gap-3"><Clock className="text-gold shrink-0 mt-1" size={18} /> {content?.hours}</p>
              <p className="flex gap-3"><Phone className="text-gold shrink-0 mt-1" size={18} /> {content?.phone}</p>
            </div>
            <div className="flex gap-4 mt-10">
              <a href={content?.maps_link ?? "#"} target="_blank" rel="noreferrer">
                <Button variant="outline">Get Directions</Button>
              </a>
              <Link href="/visit"><Button variant="ghost">Visit Us Page</Button></Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop"
                alt="Nuée exterior"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 sm:py-40 text-center">
        <div className="container-editorial">
          <Reveal>
            <p className="eyebrow mb-6">Reserve</p>
            <h2 className="font-display text-4xl sm:text-6xl leading-tight max-w-3xl mx-auto text-balance mb-10">
              Your table at Nuée is waiting.
            </h2>
            <Button size="lg" onClick={open}>Book a Table</Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

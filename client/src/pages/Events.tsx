import { useQuery } from "@tanstack/react-query";
import type { EventWithSessions } from "@shared/schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { EventCard } from "@/components/EventCard";

export default function Events() {
  const { data: events, isLoading } = useQuery<EventWithSessions[]>({ queryKey: ["/api/events"] });

  const featured = (events ?? []).filter((e) => e.isFeatured);
  const rest = (events ?? []).filter((e) => !e.isFeatured);

  return (
    <div className="pt-40 pb-28">
      <div className="container-editorial mb-16">
        <Reveal>
          <SectionHeading
            eyebrow="Nuée Events"
            title="Upcoming Events & Experiences"
            description="From our weekly live music evenings to seasonal tasting menus — reserve your place at the table."
          />
        </Reveal>
      </div>

      <div className="container-editorial">
        {isLoading && <p className="text-ivory/50">Loading events…</p>}

        {!isLoading && events && events.length === 0 && (
          <p className="text-ivory/50">No events are currently published. Please check back soon.</p>
        )}

        {featured.length > 0 && (
          <div className="mb-20">
            <p className="eyebrow mb-8">Featured</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {featured.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.08}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <p className="eyebrow mb-8">All Events</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {rest.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.08}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

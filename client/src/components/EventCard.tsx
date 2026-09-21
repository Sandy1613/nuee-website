import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import type { EventWithSessions } from "@shared/schema";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES } from "@/lib/availability";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function EventCard({ event }: { event: EventWithSessions }) {
  const nextSession = event.sessions[0];

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <div className="relative overflow-hidden aspect-[4/5] mb-5 bg-charcoal-light">
        {event.coverImageUrl && (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-1000 ease-editorial group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/80 via-transparent to-transparent" />
        {event.isFeatured && (
          <Badge className="absolute top-4 left-4 border-gold/60 text-gold bg-charcoal-deep/70">Featured</Badge>
        )}
        <Badge className={`absolute top-4 right-4 ${AVAILABILITY_STYLES[event.overallAvailability]}`}>
          {AVAILABILITY_LABELS[event.overallAvailability]}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold mb-2">
            {event.category} {event.theme && `· ${event.theme}`}
          </p>
          <h3 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors duration-300">
            {event.title}
          </h3>
          <p className="text-sm text-ivory/55">
            {event.recurrenceLabel || (nextSession ? formatDate(nextSession.sessionDate) : "")}
            {nextSession && ` · ${formatTime(nextSession.startTime)}`}
          </p>
          <p className="text-sm text-ivory/45 mt-1">{event.displayPrice}</p>
        </div>
        <ArrowUpRight className="text-gold shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
    </Link>
  );
}

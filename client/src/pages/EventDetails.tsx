import { useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, ChevronDown } from "lucide-react";
import type { EventWithSessions, InsertBooking } from "@shared/schema";
import { insertBookingSchema } from "@shared/schema";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES, isBookable } from "@/lib/availability";
import { formatDate, formatTime } from "@/lib/utils";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/Field";
import { useSystemMode } from "@/hooks/useSystemMode";
import NotFound from "@/pages/NotFound";

export default function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { data: event, isLoading, isError } = useQuery<EventWithSessions>({
    queryKey: [`/api/events/${slug}`],
  });

  if (isLoading) return <div className="pt-40 pb-28 container-editorial text-ivory/50">Loading…</div>;
  if (isError || !event) return <NotFound />;

  return <EventDetailsContent event={event} onBooked={(ref) => navigate(`/booking-confirmation/${ref}`)} />;
}

function EventDetailsContent({
  event,
  onBooked,
}: {
  event: EventWithSessions;
  onBooked: (reference: string) => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isDemo } = useSystemMode();
  const bookableSessions = event.sessions.filter((s) => isBookable(s.availability));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InsertBooking>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      eventId: event.id,
      sessionId: bookableSessions[0]?.id ?? event.sessions[0]?.id,
      guestCount: 2,
    },
  });

  const selectedSessionId = watch("sessionId");
  const selectedSession = useMemo(
    () => event.sessions.find((s) => s.id === Number(selectedSessionId)),
    [event.sessions, selectedSessionId],
  );

  const mutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      const res = await apiRequest("POST", "/api/bookings", { ...data, eventId: event.id, sessionId: Number(data.sessionId), guestCount: Number(data.guestCount) });
      return res.json();
    },
    onSuccess: (data) => onBooked(data.reference),
  });

  const maxGuests = Math.min(
    event.maxGuestsPerBooking,
    selectedSession ? Math.max(selectedSession.remainingSeats, 1) : event.maxGuestsPerBooking,
  );

  return (
    <div className="pb-28">
      {/* Cover */}
      <section className="relative h-[70vh] min-h-[440px] flex items-end">
        <img src={event.coverImageUrl} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/40 to-transparent" />
        <div className="container-editorial relative pb-16">
          <p className="eyebrow mb-4">{event.category} {event.theme && `· ${event.theme}`}</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl max-w-3xl text-balance mb-4">{event.title}</h1>
          <Badge className={AVAILABILITY_STYLES[event.overallAvailability]}>
            {AVAILABILITY_LABELS[event.overallAvailability]}
          </Badge>
        </div>
      </section>

      <div className="container-editorial grid grid-cols-1 lg:grid-cols-3 gap-16 pt-16">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-14">
          <Reveal>
            <h2 className="font-display text-2xl mb-4">About This Experience</h2>
            <p className="text-ivory/65 leading-relaxed whitespace-pre-line">{event.description}</p>
          </Reveal>

          <Reveal className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-y border-ivory/10 py-10">
            <div>
              <p className="eyebrow mb-2">Venue</p>
              <p className="text-ivory/70 flex gap-2"><MapPin size={16} className="text-gold mt-0.5 shrink-0" /> {event.venue}</p>
              {event.mapsLink && (
                <a href={event.mapsLink} target="_blank" rel="noreferrer" className="text-gold text-sm underline underline-offset-4 mt-2 inline-block">
                  View on Google Maps
                </a>
              )}
            </div>
            <div>
              <p className="eyebrow mb-2">Schedule</p>
              <p className="text-ivory/70">{event.recurrenceLabel}</p>
              {event.host && <p className="text-ivory/50 text-sm mt-1">Hosted by {event.host}</p>}
            </div>
            {event.inclusions && (
              <div>
                <p className="eyebrow mb-2">Inclusions</p>
                <p className="text-ivory/70 text-sm">{event.inclusions}</p>
              </div>
            )}
            {event.foodBeverageInfo && (
              <div>
                <p className="eyebrow mb-2">Food &amp; Beverage</p>
                <p className="text-ivory/70 text-sm">{event.foodBeverageInfo}</p>
              </div>
            )}
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl mb-6">Sessions &amp; Availability</h2>
            <div className="space-y-3">
              {event.sessions.map((session) => (
                <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 border border-ivory/10 px-6 py-4">
                  <div>
                    <p className="text-ivory">{session.name} · {formatDate(session.sessionDate)}</p>
                    <p className="text-ivory/45 text-sm">{formatTime(session.startTime)}{session.endTime && ` – ${formatTime(session.endTime)}`}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-ivory/40">Capacity {session.capacity}</p>
                      <p className="text-xs text-ivory/40">{session.remainingSeats} seats left</p>
                    </div>
                    <Badge className={AVAILABILITY_STYLES[session.availability]}>
                      {AVAILABILITY_LABELS[session.availability]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl mb-4">Cancellation Policy</h2>
            <p className="text-ivory/60 text-sm leading-relaxed">{event.cancellationPolicy}</p>
            <div className="grid grid-cols-2 gap-6 mt-6 text-sm text-ivory/50">
              <p><span className="text-ivory/70">Dress Code:</span> {event.dressCode}</p>
              <p><span className="text-ivory/70">Age Requirement:</span> {event.ageRequirement}</p>
            </div>
          </Reveal>

          {event.faqs.length > 0 && (
            <Reveal>
              <h2 className="font-display text-2xl mb-6">Frequently Asked Questions</h2>
              <div className="divide-y divide-ivory/10 border-y border-ivory/10">
                {event.faqs.map((faq, i) => (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between py-5 text-left"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="text-ivory">{faq.question}</span>
                      <ChevronDown className={`text-gold transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} size={18} />
                    </button>
                    {openFaq === i && <p className="pb-5 text-ivory/55 text-sm leading-relaxed">{faq.answer}</p>}
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* Booking form */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 border border-ivory/10 p-8 bg-charcoal-light/30">
            <p className="eyebrow mb-2">Reserve Your Spot</p>
            <p className="font-display text-2xl mb-1">{event.displayPrice}</p>
            <p className="text-xs text-ivory/40 mb-8">Online payments coming soon — no payment required to reserve.</p>

            {mutation.isSuccess ? (
              <div className="text-center py-6">
                <p className="text-gold font-display text-xl mb-2">Enquiry Sent</p>
                <p className="text-ivory/60 text-sm">Redirecting to your confirmation…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                <div>
                  <Label>Session</Label>
                  <Select {...register("sessionId", { valueAsNumber: true })}>
                    {event.sessions.map((s) => (
                      <option key={s.id} value={s.id} disabled={!isBookable(s.availability)}>
                        {s.name} · {formatDate(s.sessionDate, { year: undefined })} · {formatTime(s.startTime)}
                        {!isBookable(s.availability) ? ` (${AVAILABILITY_LABELS[s.availability]})` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Number of Guests</Label>
                  <Input type="number" min={1} max={maxGuests} {...register("guestCount", { valueAsNumber: true })} />
                  <p className="text-xs text-ivory/35 mt-1">Up to {maxGuests} guests per booking</p>
                  <FieldError>{errors.guestCount?.message}</FieldError>
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input {...register("name")} placeholder="Your name" />
                  <FieldError>{errors.name?.message}</FieldError>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input {...register("mobile")} placeholder="+91" />
                  <FieldError>{errors.mobile?.message}</FieldError>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} placeholder="you@example.com" />
                  <FieldError>{errors.email?.message}</FieldError>
                </div>
                <div>
                  <Label>Dietary Preferences</Label>
                  <Input {...register("dietaryPreferences")} placeholder="Vegetarian, vegan..." />
                </div>
                <div>
                  <Label>Allergy Information</Label>
                  <Input {...register("allergyInfo")} placeholder="Nuts, shellfish..." />
                </div>
                <div>
                  <Label>Special Requests</Label>
                  <Textarea rows={3} {...register("specialRequests")} />
                </div>

                {mutation.isError && (
                  <p className="text-sm text-red-400">
                    {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={mutation.isPending || bookableSessions.length === 0}>
                  {bookableSessions.length === 0
                    ? "Bookings Unavailable"
                    : mutation.isPending
                      ? "Sending…"
                      : "Send Booking Enquiry"}
                </Button>
                <p className="text-xs text-ivory/35 text-center">
                  This confirms an enquiry, pending our team's confirmation. No payment is collected.
                </p>
                {isDemo && (
                  <p className="text-xs text-amber-300/80 text-center">
                    Demo Mode: please do not enter real personal information. This submission is stored temporarily
                    in memory for this preview only and is never saved permanently.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="container-editorial mt-16">
        <Link href="/events" className="text-gold text-sm uppercase tracking-widest border-b border-gold/40 pb-1">
          ← Back to All Events
        </Link>
      </div>
    </div>
  );
}

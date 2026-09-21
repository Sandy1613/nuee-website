import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/Reveal";

interface BookingDetail {
  reference: string;
  name: string;
  guestCount: number;
  status: string;
  eventTitle?: string | null;
  eventSlug?: string | null;
  sessionName?: string | null;
  sessionDate?: string | null;
  startTime?: string | null;
  venue?: string | null;
}

export default function BookingConfirmation() {
  const { reference } = useParams<{ reference: string }>();
  const { data: booking, isLoading, isError } = useQuery<BookingDetail>({
    queryKey: [`/api/bookings/${reference}`],
  });

  return (
    <div className="pt-44 pb-28 min-h-[70vh]">
      <div className="container-editorial max-w-2xl text-center">
        <Reveal>
          <CheckCircle2 className="mx-auto text-gold mb-6" size={48} strokeWidth={1.25} />
          <p className="eyebrow mb-3">Booking Enquiry Received</p>
          <h1 className="font-display text-4xl sm:text-5xl mb-6 text-balance">Thank you for reserving with Nuée.</h1>

          {isLoading && <p className="text-ivory/50">Loading your confirmation…</p>}
          {isError && <p className="text-ivory/50">We couldn't find that booking reference.</p>}

          {booking && (
            <div className="border border-gold/30 bg-gold/5 px-8 py-8 text-left mt-10 space-y-4">
              <div className="flex justify-between border-b border-ivory/10 pb-4">
                <span className="text-ivory/50 text-sm uppercase tracking-widest">Reference</span>
                <span className="font-display text-2xl text-gold">{booking.reference}</span>
              </div>
              {booking.eventTitle && (
                <div className="flex justify-between text-sm">
                  <span className="text-ivory/50">Event</span>
                  <span className="text-ivory">{booking.eventTitle}</span>
                </div>
              )}
              {booking.sessionName && (
                <div className="flex justify-between text-sm">
                  <span className="text-ivory/50">Session</span>
                  <span className="text-ivory">
                    {booking.sessionName}
                    {booking.sessionDate && ` · ${formatDate(booking.sessionDate)}`}
                    {booking.startTime && ` · ${formatTime(booking.startTime)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-ivory/50">Guests</span>
                <span className="text-ivory">{booking.guestCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivory/50">Status</span>
                <span className="text-gold uppercase tracking-widest text-xs">Pending Confirmation</span>
              </div>
              {booking.venue && (
                <div className="flex justify-between text-sm">
                  <span className="text-ivory/50">Venue</span>
                  <span className="text-ivory text-right">{booking.venue}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-ivory/45 text-sm mt-8 leading-relaxed">
            Your reservation is <span className="text-gold">pending confirmation</span> — our team will reach out
            shortly to confirm the details. No payment has been collected; online payments are coming soon.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link href="/events"><Button variant="outline">Browse More Events</Button></Link>
            <Link href="/"><Button variant="ghost">Return Home</Button></Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

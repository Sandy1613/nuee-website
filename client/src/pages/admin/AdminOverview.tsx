import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, FileEdit, Send, Users, Armchair, Ban, ClipboardList, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";

interface Overview {
  upcomingEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalBookingEnquiries: number;
  totalGuestCount: number;
  seatsRemaining: number;
  soldOutSessions: number;
  tableReservationRequests: number;
}

export default function AdminOverview() {
  const { data, isLoading } = useQuery<Overview>({ queryKey: ["/api/admin/overview"] });

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Overview</h1>
      <p className="text-ivory/50 text-sm mb-10">A snapshot of Nuée's events, bookings and availability.</p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Upcoming Events" value={data.upcomingEvents} icon={CalendarClock} />
          <StatCard label="Published Events" value={data.publishedEvents} icon={CalendarCheck} />
          <StatCard label="Draft Events" value={data.draftEvents} icon={FileEdit} />
          <StatCard label="Total Booking Enquiries" value={data.totalBookingEnquiries} icon={Send} />
          <StatCard label="Total Guest Count" value={data.totalGuestCount} icon={Users} />
          <StatCard label="Seats Remaining" value={data.seatsRemaining} icon={Armchair} />
          <StatCard label="Sold-Out Sessions" value={data.soldOutSessions} icon={Ban} />
          <StatCard label="Table Reservation Requests" value={data.tableReservationRequests} icon={ClipboardList} />
        </div>
      )}
    </div>
  );
}

import type { EventSession, SessionAvailability } from "@shared/schema";

export function computeSessionAvailability(
  session: Pick<EventSession, "capacity" | "isCancelled" | "bookingDeadline">,
  remainingSeats: number,
): SessionAvailability {
  if (session.isCancelled) return "bookings_closed";
  if (session.bookingDeadline && new Date(session.bookingDeadline).getTime() < Date.now()) {
    return "bookings_closed";
  }
  if (remainingSeats <= 0) return "sold_out";
  const ratio = session.capacity > 0 ? remainingSeats / session.capacity : 0;
  if (ratio <= 0.15) return "few_seats_left";
  if (ratio <= 0.4) return "filling_fast";
  return "available";
}

export function overallAvailability(list: SessionAvailability[]): SessionAvailability {
  if (list.length === 0) return "bookings_closed";
  if (list.some((a) => a === "available")) return "available";
  if (list.some((a) => a === "filling_fast")) return "filling_fast";
  if (list.some((a) => a === "few_seats_left")) return "few_seats_left";
  if (list.every((a) => a === "sold_out")) return "sold_out";
  return "bookings_closed";
}

export const AVAILABILITY_LABELS: Record<SessionAvailability, string> = {
  available: "Available",
  filling_fast: "Filling Fast",
  few_seats_left: "Few Seats Left",
  sold_out: "Sold Out",
  bookings_closed: "Bookings Closed",
};

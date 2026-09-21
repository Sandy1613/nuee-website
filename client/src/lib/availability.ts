export type SessionAvailability =
  | "available"
  | "filling_fast"
  | "few_seats_left"
  | "sold_out"
  | "bookings_closed";

export const AVAILABILITY_LABELS: Record<SessionAvailability, string> = {
  available: "Available",
  filling_fast: "Filling Fast",
  few_seats_left: "Few Seats Left",
  sold_out: "Sold Out",
  bookings_closed: "Bookings Closed",
};

export const AVAILABILITY_STYLES: Record<SessionAvailability, string> = {
  available: "text-gold border-gold/40 bg-gold/10",
  filling_fast: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  few_seats_left: "text-orange-300 border-orange-300/40 bg-orange-300/10",
  sold_out: "text-ivory/50 border-ivory/20 bg-ivory/5",
  bookings_closed: "text-ivory/40 border-ivory/10 bg-ivory/5",
};

export function isBookable(availability: SessionAvailability) {
  return availability === "available" || availability === "filling_fast" || availability === "few_seats_left";
}

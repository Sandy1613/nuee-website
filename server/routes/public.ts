import { Router } from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import {
  getPublishedEvents,
  getPublishedEventBySlug,
  createBooking,
  createTableReservation,
  getMenu,
  getPublishedReviews,
  getPublishedFaqs,
  getWebsiteContentMap,
  getSessionById,
  getSessionGuestCount,
} from "../storage";
import { insertBookingSchema, insertTableReservationSchema } from "@shared/schema";
import { computeSessionAvailability } from "../availability";

export const publicRouter = Router();

publicRouter.get("/events", async (_req, res) => {
  const events = await getPublishedEvents();
  res.json(events);
});

publicRouter.get("/events/:slug", async (req, res) => {
  const event = await getPublishedEventBySlug(req.params.slug);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
});

publicRouter.get("/menu", async (_req, res) => {
  res.json(await getMenu());
});

publicRouter.get("/reviews", async (_req, res) => {
  res.json(await getPublishedReviews());
});

publicRouter.get("/faqs", async (_req, res) => {
  res.json(await getPublishedFaqs());
});

publicRouter.get("/website-content", async (_req, res) => {
  res.json(await getWebsiteContentMap());
});

publicRouter.post("/bookings", async (req, res) => {
  const parsed = insertBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const session = await getSessionById(parsed.data.sessionId);
  if (!session || session.eventId !== parsed.data.eventId) {
    return res.status(400).json({ message: "Selected session is invalid for this event." });
  }
  const confirmed = await getSessionGuestCount(session.id);
  const remaining = session.capacity - confirmed;
  const availability = computeSessionAvailability(session, remaining);
  if (availability === "bookings_closed") {
    return res.status(409).json({ message: "Bookings are closed for this session." });
  }
  if (availability === "sold_out") {
    return res
      .status(409)
      .json({ message: "This session is sold out. Please choose another session or contact us directly." });
  }
  const booking = await createBooking(parsed.data);
  res.status(201).json({ reference: booking.reference, booking });
});

publicRouter.get("/bookings/:reference", async (req, res) => {
  const { getBookingByReference } = await import("../storage");
  const booking = await getBookingByReference(req.params.reference);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
});

publicRouter.post("/table-reservations", async (req, res) => {
  const parsed = insertTableReservationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const reservation = await createTableReservation(parsed.data);
  res.status(201).json({ reference: reservation.reference, reservation });
});

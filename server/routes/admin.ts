import { Router } from "express";
import { fromError } from "zod-validation-error";
import { z } from "zod";
import { requireAdmin, verifyPassword, hashPassword } from "../auth";
import {
  adminLoginSchema,
  insertEventSchema,
  insertEventSessionSchema,
  adminCreateBookingSchema,
  insertMenuCategorySchema,
  insertMenuItemSchema,
  insertReviewSchema,
  insertFaqSchema,
  eventStatusEnum,
  bookingStatusEnum,
  tableReservationStatusEnum,
} from "@shared/schema";
import * as storage from "../storage";

export const adminRouter = Router();

function auditFrom(req: any) {
  return { adminUserId: req.session.adminUserId as number, ipAddress: req.ip ?? "" };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

adminRouter.post("/login", async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const user = await storage.getAdminUserByEmail(parsed.data.email);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  req.session.adminUserId = user.id;
  req.session.adminEmail = user.email;
  req.session.adminName = user.name;
  await storage.touchAdminLastLogin(user.id);
  await storage.recordAuditLog({
    adminUserId: user.id,
    action: "admin.login",
    ipAddress: req.ip ?? "",
  });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

adminRouter.post("/logout", requireAdmin, async (req, res) => {
  await storage.recordAuditLog({ ...auditFrom(req), action: "admin.logout" });
  req.session.destroy(() => {
    res.clearCookie("nuee.admin.sid");
    res.json({ ok: true });
  });
});

adminRouter.get("/me", requireAdmin, async (req, res) => {
  res.json({
    id: req.session.adminUserId,
    email: req.session.adminEmail,
    name: req.session.adminName,
  });
});

adminRouter.use(requireAdmin);

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

adminRouter.get("/overview", async (_req, res) => {
  res.json(await storage.getOverviewStats());
});

adminRouter.get("/audit-logs", async (_req, res) => {
  res.json(await storage.getRecentAuditLogs());
});

adminRouter.put("/me/password", async (req, res) => {
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const user = await storage.getAdminUserById(req.session.adminUserId!);
  if (!user) return res.status(404).json({ message: "User not found" });
  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Current password is incorrect." });
  const newHash = await hashPassword(parsed.data.newPassword);
  await storage.updateAdminPasswordHash(user.id, newHash);
  await storage.recordAuditLog({ ...auditFrom(req), action: "admin.password_change" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

adminRouter.get("/events", async (_req, res) => {
  res.json(await storage.getAllEventsAdmin());
});

adminRouter.get("/events/:id", async (req, res) => {
  const event = await storage.getEventByIdAdmin(Number(req.params.id));
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
});

adminRouter.post("/events", async (req, res) => {
  const parsed = insertEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const event = await storage.createEvent(parsed.data);
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "event.create",
    entityType: "event",
    entityId: String(event.id),
    details: { title: event.title },
  });
  res.status(201).json(event);
});

adminRouter.put("/events/:id", async (req, res) => {
  const parsed = insertEventSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const event = await storage.updateEvent(Number(req.params.id), parsed.data);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "event.update",
    entityType: "event",
    entityId: String(event.id),
  });
  res.json(event);
});

const statusValues = eventStatusEnum.enumValues;
adminRouter.post("/events/:id/status", async (req, res) => {
  const schema = z.object({ status: z.enum(statusValues as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const event = await storage.setEventStatus(Number(req.params.id), parsed.data.status as any);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: `event.status.${parsed.data.status}`,
    entityType: "event",
    entityId: String(event.id),
  });
  res.json(event);
});

adminRouter.post("/events/:id/duplicate", async (req, res) => {
  const copy = await storage.duplicateEvent(Number(req.params.id));
  if (!copy) return res.status(404).json({ message: "Event not found" });
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "event.duplicate",
    entityType: "event",
    entityId: String(copy.id),
  });
  res.status(201).json(copy);
});

adminRouter.delete("/events/:id", async (req, res) => {
  await storage.deleteEvent(Number(req.params.id));
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "event.delete",
    entityType: "event",
    entityId: req.params.id,
  });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Event sessions
// ---------------------------------------------------------------------------

adminRouter.post("/events/:id/sessions", async (req, res) => {
  const parsed = insertEventSessionSchema.safeParse({ ...req.body, eventId: Number(req.params.id) });
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const session = await storage.createSession(parsed.data);
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "session.create",
    entityType: "event_session",
    entityId: String(session.id),
  });
  res.status(201).json(session);
});

adminRouter.put("/sessions/:id", async (req, res) => {
  const parsed = insertEventSessionSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  try {
    const session = await storage.updateSession(Number(req.params.id), parsed.data);
    if (!session) return res.status(404).json({ message: "Session not found" });
    await storage.recordAuditLog({
      ...auditFrom(req),
      action: "session.update",
      entityType: "event_session",
      entityId: String(session.id),
    });
    res.json(session);
  } catch (err) {
    if (err instanceof storage.CapacityBelowConfirmedError) {
      return res.status(409).json({ message: err.message });
    }
    throw err;
  }
});

adminRouter.delete("/sessions/:id", async (req, res) => {
  await storage.deleteSession(Number(req.params.id));
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "session.delete",
    entityType: "event_session",
    entityId: req.params.id,
  });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

adminRouter.get("/bookings", async (req, res) => {
  const { search, eventId, sessionId, status, dateFrom, dateTo } = req.query;
  const bookings = await storage.getBookingsAdmin({
    search: typeof search === "string" ? search : undefined,
    eventId: eventId ? Number(eventId) : undefined,
    sessionId: sessionId ? Number(sessionId) : undefined,
    status: typeof status === "string" ? status : undefined,
    dateFrom: typeof dateFrom === "string" ? dateFrom : undefined,
    dateTo: typeof dateTo === "string" ? dateTo : undefined,
  });
  res.json(bookings);
});

adminRouter.get("/bookings/export.csv", async (req, res) => {
  const { search, eventId, sessionId, status } = req.query;
  const bookings = await storage.getBookingsAdmin({
    search: typeof search === "string" ? search : undefined,
    eventId: eventId ? Number(eventId) : undefined,
    sessionId: sessionId ? Number(sessionId) : undefined,
    status: typeof status === "string" ? status : undefined,
  });
  const csv = await storage.bookingsToCsv(bookings);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=nuee-bookings.csv");
  res.send(csv);
});

adminRouter.post("/bookings", async (req, res) => {
  const parsed = adminCreateBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const booking = await storage.adminCreateBooking(parsed.data);
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: booking.isComplimentary ? "booking.create.complimentary" : "booking.create.manual",
    entityType: "booking",
    entityId: String(booking.id),
  });
  res.status(201).json(booking);
});

const bookingStatusValues = bookingStatusEnum.enumValues;
adminRouter.put("/bookings/:id/status", async (req, res) => {
  const schema = z.object({ status: z.enum(bookingStatusValues as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const booking = await storage.updateBookingStatus(Number(req.params.id), parsed.data.status as any);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: `booking.status.${parsed.data.status}`,
    entityType: "booking",
    entityId: String(booking.id),
  });
  res.json(booking);
});

adminRouter.put("/bookings/:id/notes", async (req, res) => {
  const schema = z.object({ internalNotes: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const booking = await storage.updateBookingNotes(Number(req.params.id), parsed.data.internalNotes);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
});

adminRouter.post("/bookings/:id/checkin", async (req, res) => {
  const booking = await storage.getBookingById(Number(req.params.id));
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  const checkIn = await storage.checkInBooking(
    booking.id,
    req.session.adminUserId,
    booking.guestCount,
    typeof req.body?.notes === "string" ? req.body.notes : "",
  );
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "booking.checkin",
    entityType: "booking",
    entityId: String(booking.id),
  });
  res.status(201).json(checkIn);
});

// ---------------------------------------------------------------------------
// Table reservations
// ---------------------------------------------------------------------------

adminRouter.get("/table-reservations", async (req, res) => {
  const { status } = req.query;
  res.json(await storage.getTableReservationsAdmin(typeof status === "string" ? status : undefined));
});

const tableReservationStatusValues = tableReservationStatusEnum.enumValues;
adminRouter.put("/table-reservations/:id/status", async (req, res) => {
  const schema = z.object({ status: z.enum(tableReservationStatusValues as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const reservation = await storage.updateTableReservationStatus(Number(req.params.id), parsed.data.status as any);
  if (!reservation) return res.status(404).json({ message: "Reservation not found" });
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: `table_reservation.status.${parsed.data.status}`,
    entityType: "table_reservation",
    entityId: String(reservation.id),
  });
  res.json(reservation);
});

adminRouter.put("/table-reservations/:id/notes", async (req, res) => {
  const schema = z.object({ internalNotes: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const reservation = await storage.updateTableReservationNotes(Number(req.params.id), parsed.data.internalNotes);
  if (!reservation) return res.status(404).json({ message: "Reservation not found" });
  res.json(reservation);
});

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

adminRouter.get("/menu", async (_req, res) => {
  res.json(await storage.getMenuAdmin());
});

adminRouter.post("/menu/categories", async (req, res) => {
  const parsed = insertMenuCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const category = await storage.createMenuCategory(parsed.data);
  res.status(201).json(category);
});

adminRouter.put("/menu/categories/:id", async (req, res) => {
  const parsed = insertMenuCategorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const category = await storage.updateMenuCategory(Number(req.params.id), parsed.data);
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
});

adminRouter.delete("/menu/categories/:id", async (req, res) => {
  await storage.deleteMenuCategory(Number(req.params.id));
  res.json({ ok: true });
});

adminRouter.post("/menu/items", async (req, res) => {
  const parsed = insertMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const item = await storage.createMenuItem(parsed.data);
  res.status(201).json(item);
});

adminRouter.put("/menu/items/:id", async (req, res) => {
  const parsed = insertMenuItemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const item = await storage.updateMenuItem(Number(req.params.id), parsed.data);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
});

adminRouter.delete("/menu/items/:id", async (req, res) => {
  await storage.deleteMenuItem(Number(req.params.id));
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

adminRouter.get("/reviews", async (_req, res) => {
  res.json(await storage.getReviewsAdmin());
});

adminRouter.post("/reviews", async (req, res) => {
  const parsed = insertReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  res.status(201).json(await storage.createReview(parsed.data));
});

adminRouter.put("/reviews/:id", async (req, res) => {
  const parsed = insertReviewSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const review = await storage.updateReview(Number(req.params.id), parsed.data);
  if (!review) return res.status(404).json({ message: "Review not found" });
  res.json(review);
});

adminRouter.delete("/reviews/:id", async (req, res) => {
  await storage.deleteReview(Number(req.params.id));
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

adminRouter.get("/faqs", async (_req, res) => {
  res.json(await storage.getFaqsAdmin());
});

adminRouter.post("/faqs", async (req, res) => {
  const parsed = insertFaqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  res.status(201).json(await storage.createFaq(parsed.data));
});

adminRouter.put("/faqs/:id", async (req, res) => {
  const parsed = insertFaqSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const faq = await storage.updateFaq(Number(req.params.id), parsed.data);
  if (!faq) return res.status(404).json({ message: "FAQ not found" });
  res.json(faq);
});

adminRouter.delete("/faqs/:id", async (req, res) => {
  await storage.deleteFaq(Number(req.params.id));
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Website content
// ---------------------------------------------------------------------------

adminRouter.get("/website-content", async (_req, res) => {
  res.json(await storage.getWebsiteContent());
});

adminRouter.put("/website-content/:key", async (req, res) => {
  const schema = z.object({ label: z.string(), value: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: fromError(parsed.error).toString() });
  }
  const content = await storage.upsertWebsiteContent(req.params.key, parsed.data.label, parsed.data.value);
  await storage.recordAuditLog({
    ...auditFrom(req),
    action: "website_content.update",
    entityType: "website_content",
    entityId: req.params.key,
  });
  res.json(content);
});

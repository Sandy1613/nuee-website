import { and, desc, eq, gte, ilike, inArray, lte, or, sql, sum, ne } from "drizzle-orm";
import { db } from "./db";
import {
  adminUsers,
  events,
  eventSessions,
  bookings,
  checkIns,
  tableReservations,
  menuCategories,
  menuItems,
  reviews,
  faqs,
  websiteContent,
  auditLogs,
  type AdminUser,
  type InsertAdminUser,
  type Event,
  type InsertEvent,
  type EventSession,
  type InsertEventSession,
  type Booking,
  type InsertBooking,
  type AdminCreateBooking,
  type TableReservation,
  type InsertTableReservation,
  type MenuCategory,
  type InsertMenuCategory,
  type MenuItem,
  type InsertMenuItem,
  type Review,
  type InsertReview,
  type Faq,
  type InsertFaq,
  type WebsiteContent,
  type EventWithSessions,
  type EventSessionWithAvailability,
} from "@shared/schema";
import { computeSessionAvailability, overallAvailability } from "./availability";
import { generateReference, slugify } from "./idUtils";
import { bookingsToCsv as bookingsToCsvShared } from "./csv";
import { CapacityBelowConfirmedError } from "./errors";

export { CapacityBelowConfirmedError };

// Booking statuses that hold a seat against session capacity.
const SEAT_HOLDING_STATUSES: Booking["status"][] = [
  "enquiry_received",
  "pending_confirmation",
  "confirmed",
  "checked_in",
];

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------

export async function getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
  return row;
}

export async function getAdminUserById(id: number): Promise<AdminUser | undefined> {
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return row;
}

export async function createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
  const [row] = await db
    .insert(adminUsers)
    .values({ ...data, email: data.email.toLowerCase() })
    .returning();
  return row;
}

export async function touchAdminLastLogin(id: number) {
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
}

export async function updateAdminPasswordHash(id: number, passwordHash: string) {
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
}

// ---------------------------------------------------------------------------
// Sessions / availability helpers
// ---------------------------------------------------------------------------

async function guestCountsBySession(sessionIds: number[]): Promise<Map<number, number>> {
  if (sessionIds.length === 0) return new Map();
  const rows = await db
    .select({
      sessionId: bookings.sessionId,
      total: sum(bookings.guestCount).mapWith(Number),
    })
    .from(bookings)
    .where(and(inArray(bookings.sessionId, sessionIds), inArray(bookings.status, SEAT_HOLDING_STATUSES)))
    .groupBy(bookings.sessionId);
  const map = new Map<number, number>();
  for (const row of rows) map.set(row.sessionId, row.total ?? 0);
  return map;
}

export async function getSessionGuestCount(sessionId: number): Promise<number> {
  const map = await guestCountsBySession([sessionId]);
  return map.get(sessionId) ?? 0;
}

function decorateSession(
  session: EventSession,
  confirmedGuestCount: number,
): EventSessionWithAvailability {
  const remainingSeats = Math.max(session.capacity - confirmedGuestCount, 0);
  return {
    ...session,
    confirmedGuestCount,
    remainingSeats,
    availability: computeSessionAvailability(session, remainingSeats),
  };
}

async function decorateSessions(sessions: EventSession[]): Promise<EventSessionWithAvailability[]> {
  const counts = await guestCountsBySession(sessions.map((s) => s.id));
  return sessions
    .map((s) => decorateSession(s, counts.get(s.id) ?? 0))
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate) || a.startTime.localeCompare(b.startTime));
}

async function attachSessions(eventRows: Event[]): Promise<EventWithSessions[]> {
  if (eventRows.length === 0) return [];
  const allSessions = await db
    .select()
    .from(eventSessions)
    .where(inArray(eventSessions.eventId, eventRows.map((e) => e.id)));
  const bySessionEvent = new Map<number, EventSession[]>();
  for (const s of allSessions) {
    const list = bySessionEvent.get(s.eventId) ?? [];
    list.push(s);
    bySessionEvent.set(s.eventId, list);
  }
  const decoratedAll = await decorateSessions(allSessions);
  const decoratedBySession = new Map(decoratedAll.map((s) => [s.id, s]));

  return eventRows.map((event) => {
    const rawSessions = bySessionEvent.get(event.id) ?? [];
    const sessions = rawSessions
      .map((s) => decoratedBySession.get(s.id)!)
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate) || a.startTime.localeCompare(b.startTime));
    const totalCapacity = sessions.reduce((acc, s) => acc + s.capacity, 0);
    const totalRemainingSeats = sessions.reduce((acc, s) => acc + s.remainingSeats, 0);
    return {
      ...event,
      sessions,
      totalCapacity,
      totalRemainingSeats,
      overallAvailability: overallAvailability(sessions.map((s) => s.availability)),
    };
  });
}

// ---------------------------------------------------------------------------
// Events (public)
// ---------------------------------------------------------------------------

export async function getPublishedEvents(): Promise<EventWithSessions[]> {
  const rows = await db
    .select()
    .from(events)
    .where(inArray(events.status, ["published", "sold_out", "bookings_closed"]))
    .orderBy(desc(events.isFeatured), events.sortOrder, desc(events.createdAt));
  return attachSessions(rows);
}

export async function getPublishedEventBySlug(slug: string): Promise<EventWithSessions | undefined> {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), inArray(events.status, ["published", "sold_out", "bookings_closed"])));
  if (!row) return undefined;
  const [withSessions] = await attachSessions([row]);
  return withSessions;
}

// ---------------------------------------------------------------------------
// Events (admin)
// ---------------------------------------------------------------------------

export async function getAllEventsAdmin(): Promise<EventWithSessions[]> {
  const rows = await db.select().from(events).orderBy(desc(events.updatedAt));
  return attachSessions(rows);
}

export async function getEventByIdAdmin(id: number): Promise<EventWithSessions | undefined> {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  if (!row) return undefined;
  const [withSessions] = await attachSessions([row]);
  return withSessions;
}

export async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = slugify(base) || "event";
  let counter = 1;
  while (true) {
    const [existing] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
    if (!existing || existing.id === excludeId) return slug;
    counter += 1;
    slug = `${slugify(base)}-${counter}`;
  }
}

export async function createEvent(data: InsertEvent): Promise<Event> {
  const slug = await ensureUniqueSlug(data.slug || data.title);
  const [row] = await db
    .insert(events)
    .values({ ...data, slug })
    .returning();
  return row;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
  const updates: Partial<InsertEvent> & { updatedAt: Date; slug?: string } = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.slug || data.title) {
    updates.slug = await ensureUniqueSlug(data.slug || data.title || "", id);
  }
  const [row] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
  return row;
}

export async function setEventStatus(id: number, status: Event["status"]): Promise<Event | undefined> {
  const updates: Partial<Event> = { status, updatedAt: new Date() };
  if (status === "published") updates.publishedAt = new Date();
  const [row] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
  return row;
}

export async function duplicateEvent(id: number): Promise<Event | undefined> {
  const [original] = await db.select().from(events).where(eq(events.id, id));
  if (!original) return undefined;
  const { id: _id, createdAt, updatedAt, publishedAt, ...rest } = original;
  const slug = await ensureUniqueSlug(`${rest.title}-copy`);
  const [copy] = await db
    .insert(events)
    .values({ ...rest, title: `${rest.title} (Copy)`, slug, status: "draft" })
    .returning();

  const originalSessions = await db.select().from(eventSessions).where(eq(eventSessions.eventId, id));
  if (originalSessions.length > 0) {
    await db.insert(eventSessions).values(
      originalSessions.map((s) => ({
        eventId: copy.id,
        name: s.name,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        displayPrice: s.displayPrice,
        bookingDeadline: s.bookingDeadline,
      })),
    );
  }
  return copy;
}

export async function deleteEvent(id: number): Promise<void> {
  await db.delete(events).where(eq(events.id, id));
}

// ---------------------------------------------------------------------------
// Event sessions (admin)
// ---------------------------------------------------------------------------

export async function getSessionsForEvent(eventId: number): Promise<EventSessionWithAvailability[]> {
  const rows = await db.select().from(eventSessions).where(eq(eventSessions.eventId, eventId));
  return decorateSessions(rows);
}

export async function getSessionById(id: number): Promise<EventSession | undefined> {
  const [row] = await db.select().from(eventSessions).where(eq(eventSessions.id, id));
  return row;
}

export async function createSession(data: InsertEventSession): Promise<EventSession> {
  const [row] = await db.insert(eventSessions).values(data).returning();
  return row;
}

export async function updateSession(
  id: number,
  data: Partial<InsertEventSession>,
): Promise<EventSession | undefined> {
  if (typeof data.capacity === "number") {
    const confirmed = await getSessionGuestCount(id);
    if (data.capacity < confirmed) {
      throw new CapacityBelowConfirmedError(confirmed);
    }
  }
  const [row] = await db
    .update(eventSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eventSessions.id, id))
    .returning();
  return row;
}

export async function deleteSession(id: number): Promise<void> {
  await db.delete(eventSessions).where(eq(eventSessions.id, id));
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function createBooking(
  data: InsertBooking,
  overrides: Partial<Pick<Booking, "source" | "status" | "isComplimentary" | "internalNotes">> = {},
): Promise<Booking> {
  const reference = generateReference("NUEE");
  const [row] = await db
    .insert(bookings)
    .values({
      ...data,
      reference,
      source: overrides.source ?? "customer",
      status: overrides.status ?? "enquiry_received",
      isComplimentary: overrides.isComplimentary ?? false,
      internalNotes: overrides.internalNotes ?? "",
    })
    .returning();
  return row;
}

export async function adminCreateBooking(data: AdminCreateBooking): Promise<Booking> {
  const reference = generateReference("NUEE");
  const [row] = await db
    .insert(bookings)
    .values({ ...data, reference })
    .returning();
  return row;
}

export interface BookingFilters {
  search?: string;
  eventId?: number;
  sessionId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getBookingsAdmin(filters: BookingFilters = {}) {
  const conditions = [] as any[];
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(ilike(bookings.name, term), ilike(bookings.mobile, term), ilike(bookings.email, term), ilike(bookings.reference, term)),
    );
  }
  if (filters.eventId) conditions.push(eq(bookings.eventId, filters.eventId));
  if (filters.sessionId) conditions.push(eq(bookings.sessionId, filters.sessionId));
  if (filters.status) conditions.push(eq(bookings.status, filters.status as Booking["status"]));
  if (filters.dateFrom) conditions.push(gte(bookings.createdAt, new Date(filters.dateFrom)));
  if (filters.dateTo) conditions.push(lte(bookings.createdAt, new Date(filters.dateTo)));

  const rows = await db
    .select({
      booking: bookings,
      eventTitle: events.title,
      sessionName: eventSessions.name,
      sessionDate: eventSessions.sessionDate,
    })
    .from(bookings)
    .leftJoin(events, eq(bookings.eventId, events.id))
    .leftJoin(eventSessions, eq(bookings.sessionId, eventSessions.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt));

  return rows.map((r) => ({ ...r.booking, eventTitle: r.eventTitle, sessionName: r.sessionName, sessionDate: r.sessionDate }));
}

export async function getBookingByReference(reference: string) {
  const [row] = await db
    .select({
      booking: bookings,
      eventTitle: events.title,
      eventSlug: events.slug,
      sessionName: eventSessions.name,
      sessionDate: eventSessions.sessionDate,
      startTime: eventSessions.startTime,
      venue: events.venue,
    })
    .from(bookings)
    .leftJoin(events, eq(bookings.eventId, events.id))
    .leftJoin(eventSessions, eq(bookings.sessionId, eventSessions.id))
    .where(eq(bookings.reference, reference));
  if (!row) return undefined;
  return {
    ...row.booking,
    eventTitle: row.eventTitle,
    eventSlug: row.eventSlug,
    sessionName: row.sessionName,
    sessionDate: row.sessionDate,
    startTime: row.startTime,
    venue: row.venue,
  };
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  return row;
}

export async function updateBookingStatus(
  id: number,
  status: Booking["status"],
): Promise<Booking | undefined> {
  const [row] = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  return row;
}

export async function updateBookingNotes(id: number, internalNotes: string): Promise<Booking | undefined> {
  const [row] = await db
    .update(bookings)
    .set({ internalNotes, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  return row;
}

export async function checkInBooking(
  bookingId: number,
  adminId: number | undefined,
  guestCountCheckedIn: number,
  notes = "",
) {
  const [checkIn] = await db
    .insert(checkIns)
    .values({ bookingId, checkedInByAdminId: adminId, guestCountCheckedIn, notes })
    .returning();
  await db.update(bookings).set({ status: "checked_in", updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  return checkIn;
}

export async function bookingsToCsv(rows: Awaited<ReturnType<typeof getBookingsAdmin>>): Promise<string> {
  return bookingsToCsvShared(rows);
}

// ---------------------------------------------------------------------------
// Table reservations
// ---------------------------------------------------------------------------

export async function createTableReservation(data: InsertTableReservation): Promise<TableReservation> {
  const reference = generateReference("TABLE");
  const [row] = await db.insert(tableReservations).values({ ...data, reference }).returning();
  return row;
}

export async function getTableReservationsAdmin(status?: string): Promise<TableReservation[]> {
  const query = db.select().from(tableReservations).orderBy(desc(tableReservations.createdAt));
  if (status) {
    return db
      .select()
      .from(tableReservations)
      .where(eq(tableReservations.status, status as TableReservation["status"]))
      .orderBy(desc(tableReservations.createdAt));
  }
  return query;
}

export async function updateTableReservationStatus(
  id: number,
  status: TableReservation["status"],
): Promise<TableReservation | undefined> {
  const [row] = await db
    .update(tableReservations)
    .set({ status, updatedAt: new Date() })
    .where(eq(tableReservations.id, id))
    .returning();
  return row;
}

export async function updateTableReservationNotes(
  id: number,
  internalNotes: string,
): Promise<TableReservation | undefined> {
  const [row] = await db
    .update(tableReservations)
    .set({ internalNotes, updatedAt: new Date() })
    .where(eq(tableReservations.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export async function getMenu() {
  const categories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.isActive, true))
    .orderBy(menuCategories.sortOrder);
  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(menuItems.sortOrder);
  return categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) }));
}

export async function getMenuAdmin() {
  const categories = await db.select().from(menuCategories).orderBy(menuCategories.sortOrder);
  const items = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
  return categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) }));
}

export async function createMenuCategory(data: InsertMenuCategory): Promise<MenuCategory> {
  const [row] = await db.insert(menuCategories).values(data).returning();
  return row;
}

export async function updateMenuCategory(
  id: number,
  data: Partial<InsertMenuCategory>,
): Promise<MenuCategory | undefined> {
  const [row] = await db.update(menuCategories).set(data).where(eq(menuCategories.id, id)).returning();
  return row;
}

export async function deleteMenuCategory(id: number): Promise<void> {
  await db.delete(menuCategories).where(eq(menuCategories.id, id));
}

export async function createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
  const [row] = await db.insert(menuItems).values(data).returning();
  return row;
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
  const [row] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
  return row;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function getPublishedReviews(): Promise<Review[]> {
  return db.select().from(reviews).where(eq(reviews.isPublished, true)).orderBy(reviews.sortOrder);
}

export async function getReviewsAdmin(): Promise<Review[]> {
  return db.select().from(reviews).orderBy(reviews.sortOrder);
}

export async function createReview(data: InsertReview): Promise<Review> {
  const [row] = await db.insert(reviews).values(data).returning();
  return row;
}

export async function updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
  const [row] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
  return row;
}

export async function deleteReview(id: number): Promise<void> {
  await db.delete(reviews).where(eq(reviews.id, id));
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function getPublishedFaqs(): Promise<Faq[]> {
  return db.select().from(faqs).where(eq(faqs.isPublished, true)).orderBy(faqs.sortOrder);
}

export async function getFaqsAdmin(): Promise<Faq[]> {
  return db.select().from(faqs).orderBy(faqs.sortOrder);
}

export async function createFaq(data: InsertFaq): Promise<Faq> {
  const [row] = await db.insert(faqs).values(data).returning();
  return row;
}

export async function updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq | undefined> {
  const [row] = await db.update(faqs).set(data).where(eq(faqs.id, id)).returning();
  return row;
}

export async function deleteFaq(id: number): Promise<void> {
  await db.delete(faqs).where(eq(faqs.id, id));
}

// ---------------------------------------------------------------------------
// Website content
// ---------------------------------------------------------------------------

export async function getWebsiteContent(): Promise<WebsiteContent[]> {
  return db.select().from(websiteContent).orderBy(websiteContent.key);
}

export async function getWebsiteContentMap(): Promise<Record<string, string>> {
  const rows = await getWebsiteContent();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function upsertWebsiteContent(key: string, label: string, value: string): Promise<WebsiteContent> {
  const [existing] = await db.select().from(websiteContent).where(eq(websiteContent.key, key));
  if (existing) {
    const [row] = await db
      .update(websiteContent)
      .set({ value, label, updatedAt: new Date() })
      .where(eq(websiteContent.key, key))
      .returning();
    return row;
  }
  const [row] = await db.insert(websiteContent).values({ key, label, value }).returning();
  return row;
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export async function recordAuditLog(entry: {
  adminUserId?: number;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    adminUserId: entry.adminUserId,
    action: entry.action,
    entityType: entry.entityType ?? "",
    entityId: entry.entityId ?? "",
    details: entry.details ?? {},
    ipAddress: entry.ipAddress ?? "",
  });
}

export async function getRecentAuditLogs(limit = 100) {
  return db
    .select({
      log: auditLogs,
      adminName: adminUsers.name,
    })
    .from(auditLogs)
    .leftJoin(adminUsers, eq(auditLogs.adminUserId, adminUsers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export async function getOverviewStats() {
  const allEvents = await db.select().from(events);
  const upcoming = allEvents.filter((e) => e.status === "published" || e.status === "scheduled").length;
  const published = allEvents.filter((e) => e.status === "published").length;
  const draft = allEvents.filter((e) => e.status === "draft").length;

  const allSessions = await db.select().from(eventSessions);
  const guestCounts = await guestCountsBySession(allSessions.map((s) => s.id));
  let soldOutSessions = 0;
  let totalRemainingSeats = 0;
  for (const s of allSessions) {
    const confirmed = guestCounts.get(s.id) ?? 0;
    const remaining = Math.max(s.capacity - confirmed, 0);
    totalRemainingSeats += remaining;
    if (remaining <= 0 && s.capacity > 0) soldOutSessions += 1;
  }

  const allBookings = await db.select().from(bookings);
  const totalEnquiries = allBookings.length;
  const totalGuestCount = allBookings
    .filter((b) => b.status !== "cancelled" && b.status !== "no_show")
    .reduce((acc, b) => acc + b.guestCount, 0);

  const allTableReservations = await db.select().from(tableReservations);
  const tableReservationRequests = allTableReservations.filter((t) => t.status === "pending").length;

  return {
    upcomingEvents: upcoming,
    publishedEvents: published,
    draftEvents: draft,
    totalBookingEnquiries: totalEnquiries,
    totalGuestCount,
    seatsRemaining: totalRemainingSeats,
    soldOutSessions,
    tableReservationRequests,
  };
}

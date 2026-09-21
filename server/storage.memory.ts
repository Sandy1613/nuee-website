// In-memory storage backend used only in demo mode (no DATABASE_URL set).
// It implements the exact same function surface as server/storage.postgres.ts
// so server/storage.ts can swap between the two transparently. Everything
// here lives in process memory only: it resets on every restart, is never
// written to disk, and is not a substitute for the PostgreSQL/Drizzle path
// used in production.
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import type {
  AdminUser,
  InsertAdminUser,
  Event,
  InsertEvent,
  EventSession,
  InsertEventSession,
  Booking,
  InsertBooking,
  AdminCreateBooking,
  CheckIn,
  TableReservation,
  InsertTableReservation,
  MenuCategory,
  InsertMenuCategory,
  MenuItem,
  InsertMenuItem,
  Review,
  InsertReview,
  Faq,
  InsertFaq,
  WebsiteContent,
  AuditLog,
  EventWithSessions,
  EventSessionWithAvailability,
} from "@shared/schema";
import { computeSessionAvailability, overallAvailability } from "./availability";
import { generateReference, slugify } from "./idUtils";
import { bookingsToCsv as bookingsToCsvShared } from "./csv";
import { CapacityBelowConfirmedError } from "./errors";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "./mode";
import {
  DEMO_FAQS,
  DEMO_MENU_CATEGORIES,
  DEMO_REVIEWS,
  DEMO_WEBSITE_CONTENT,
  nextWeekday,
  toDateOnly,
} from "./demoSeedData";

export { CapacityBelowConfirmedError };

const SEAT_HOLDING_STATUSES: Booking["status"][] = [
  "enquiry_received",
  "pending_confirmation",
  "confirmed",
  "checked_in",
];

// ---------------------------------------------------------------------------
// In-memory tables + id counters
// ---------------------------------------------------------------------------

const counters: Record<string, number> = {};
function nextId(table: string): number {
  counters[table] = (counters[table] ?? 0) + 1;
  return counters[table];
}

const adminUsersTable: AdminUser[] = [];
const eventsTable: Event[] = [];
const eventSessionsTable: EventSession[] = [];
const bookingsTable: Booking[] = [];
const checkInsTable: CheckIn[] = [];
const tableReservationsTable: TableReservation[] = [];
const menuCategoriesTable: MenuCategory[] = [];
const menuItemsTable: MenuItem[] = [];
const reviewsTable: Review[] = [];
const faqsTable: Faq[] = [];
const websiteContentTable: WebsiteContent[] = [];
const auditLogsTable: AuditLog[] = [];

function seedDemoData() {
  const passwordHash = bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10);
  adminUsersTable.push({
    id: nextId("admin_users"),
    name: "Demo Admin",
    email: DEMO_ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    lastLoginAt: null,
  });

  const bollywoodId = nextId("events");
  eventsTable.push({
    id: bollywoodId,
    slug: "saturday-bollywood-jamming",
    title: "Saturday Bollywood Jamming Session",
    category: "Live Music",
    theme: "Bollywood, Live Band & Intimate Dining",
    recurrenceLabel: "Every Saturday",
    shortDescription: "Live Bollywood music and an intimate dining atmosphere — every Saturday evening at Nuée.",
    description:
      "Settle into a candlelit corner of the tavern as our resident band takes you through an evening of Bollywood favourites, old and new. Expect soulful acoustic sets, a warm crowd, and a menu built for lingering over. This is Nuée at its most convivial — come for dinner, stay for the encore.",
    coverImageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1600&auto=format&fit=crop",
    galleryImageUrls: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
    ],
    venue: "Nuée Tavern & Bar, Kalyani Nagar, Pune",
    mapsLink: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune",
    host: "Nuée House Band",
    inclusions: "Live music, reserved seating, à la carte dining available",
    foodBeverageInfo: "Full à la carte menu and bar service available through the evening. No fixed menu or cover charge.",
    displayPrice: "No cover charge — à la carte dining",
    maxGuestsPerBooking: 10,
    bookingOpensAt: null,
    bookingClosesAt: null,
    cancellationPolicy:
      "This is a complimentary entry event. We simply ask that you let us know if your plans change so we can offer your table to another guest.",
    dressCode: "Smart casual",
    ageRequirement: "All ages welcome",
    faqs: [
      {
        question: "Is there an entry fee?",
        answer: "No — the Saturday Bollywood Jamming session is complimentary. Regular à la carte pricing applies for food and drink.",
      },
      {
        question: "Do I need a reservation?",
        answer: "Reservations are recommended, especially for larger groups, as seating is limited and fills up quickly.",
      },
    ],
    isFeatured: true,
    status: "published",
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  });
  for (let weeksAhead = 0; weeksAhead < 4; weeksAhead++) {
    const date = nextWeekday(new Date(), 6, weeksAhead);
    eventSessionsTable.push({
      id: nextId("event_sessions"),
      eventId: bollywoodId,
      name: "Saturday Evening",
      sessionDate: toDateOnly(date),
      startTime: "19:30",
      endTime: "23:00",
      capacity: 60,
      displayPrice: "No cover charge",
      bookingDeadline: null,
      isCancelled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const lostRecipesId = nextId("events");
  eventsTable.push({
    id: lostRecipesId,
    slug: "lost-recipes-of-maharashtra",
    title: "Lost Recipes of Maharashtra",
    category: "Culinary Experience",
    theme: "Regional Heritage Tasting Menu",
    recurrenceLabel: "Every Sunday",
    shortDescription: "A curated exploration of forgotten regional recipes, every Sunday at Nuée.",
    description:
      "Our chefs travel the villages of Maharashtra so you don't have to. Lost Recipes is a rotating tasting menu built around recipes that have quietly disappeared from restaurant menus — revived, plated with care, and served family-style. Each Sunday brings a new chapter of the region's culinary history to the table.",
    coverImageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1600&auto=format&fit=crop",
    galleryImageUrls: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
    ],
    venue: "Nuée Tavern & Bar, Kalyani Nagar, Pune",
    mapsLink: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune",
    host: "Nuée Culinary Team",
    inclusions: "Multi-course tasting menu, curated by the chef, reservation required",
    foodBeverageInfo: "Set tasting menu — vegetarian and non-vegetarian variants available on request.",
    displayPrice: "₹2,500++ per person",
    maxGuestsPerBooking: 8,
    bookingOpensAt: null,
    bookingClosesAt: null,
    cancellationPolicy:
      "As this is a reservation-only tasting menu, we request at least 24 hours' notice for cancellations so we can plan accordingly.",
    dressCode: "Smart casual",
    ageRequirement: "All ages welcome",
    faqs: [
      {
        question: "Is this a fixed menu?",
        answer: "Yes, Lost Recipes is a curated multi-course tasting menu that changes seasonally. Please let us know of any allergies in advance.",
      },
      {
        question: "Can I book for lunch and dinner?",
        answer: "Lunch and dinner are separate sessions, each with their own limited seating — please choose one when booking.",
      },
    ],
    isFeatured: true,
    status: "published",
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  });
  for (let weeksAhead = 0; weeksAhead < 4; weeksAhead++) {
    const date = toDateOnly(nextWeekday(new Date(), 0, weeksAhead));
    eventSessionsTable.push({
      id: nextId("event_sessions"),
      eventId: lostRecipesId,
      name: "Sunday Lunch",
      sessionDate: date,
      startTime: "13:30",
      endTime: "16:00",
      capacity: 32,
      displayPrice: "₹2,500++ per person",
      bookingDeadline: null,
      isCancelled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    eventSessionsTable.push({
      id: nextId("event_sessions"),
      eventId: lostRecipesId,
      name: "Sunday Dinner",
      sessionDate: date,
      startTime: "19:30",
      endTime: "22:30",
      capacity: 32,
      displayPrice: "₹2,500++ per person",
      bookingDeadline: null,
      isCancelled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (const cat of DEMO_MENU_CATEGORIES) {
    const categoryId = nextId("menu_categories");
    menuCategoriesTable.push({
      id: categoryId,
      name: cat.name,
      type: cat.type,
      subtype: cat.subtype,
      sortOrder: cat.sortOrder,
      isActive: true,
    });
    cat.items.forEach((item, idx) => {
      menuItemsTable.push({
        id: nextId("menu_items"),
        categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        dietaryTag: "none",
        isSignature: false,
        isAvailable: true,
        sortOrder: idx,
      });
    });
  }

  for (const review of DEMO_REVIEWS) {
    reviewsTable.push({
      id: nextId("reviews"),
      guestName: review.guestName,
      rating: review.rating,
      reviewText: review.reviewText,
      source: review.source,
      isPublished: true,
      sortOrder: review.sortOrder,
      createdAt: new Date(),
    });
  }

  for (const faq of DEMO_FAQS) {
    faqsTable.push({
      id: nextId("faqs"),
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isPublished: true,
    });
  }

  for (const content of DEMO_WEBSITE_CONTENT) {
    websiteContentTable.push({
      id: nextId("website_content"),
      key: content.key,
      label: content.label,
      value: content.value,
      updatedAt: new Date(),
    });
  }
}

seedDemoData();

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------

export async function getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
  return adminUsersTable.find((u) => u.email === email.toLowerCase());
}

export async function getAdminUserById(id: number): Promise<AdminUser | undefined> {
  return adminUsersTable.find((u) => u.id === id);
}

export async function createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
  const user: AdminUser = {
    id: nextId("admin_users"),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role ?? "admin",
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    lastLoginAt: null,
  };
  adminUsersTable.push(user);
  return user;
}

export async function touchAdminLastLogin(id: number) {
  const user = adminUsersTable.find((u) => u.id === id);
  if (user) user.lastLoginAt = new Date();
}

export async function updateAdminPasswordHash(id: number, passwordHash: string) {
  const user = adminUsersTable.find((u) => u.id === id);
  if (user) user.passwordHash = passwordHash;
}

// ---------------------------------------------------------------------------
// Sessions / availability helpers
// ---------------------------------------------------------------------------

function guestCountForSession(sessionId: number): number {
  return bookingsTable
    .filter((b) => b.sessionId === sessionId && SEAT_HOLDING_STATUSES.includes(b.status))
    .reduce((acc, b) => acc + b.guestCount, 0);
}

export async function getSessionGuestCount(sessionId: number): Promise<number> {
  return guestCountForSession(sessionId);
}

function decorateSession(session: EventSession): EventSessionWithAvailability {
  const confirmedGuestCount = guestCountForSession(session.id);
  const remainingSeats = Math.max(session.capacity - confirmedGuestCount, 0);
  return {
    ...session,
    confirmedGuestCount,
    remainingSeats,
    availability: computeSessionAvailability(session, remainingSeats),
  };
}

function sortSessions(sessions: EventSessionWithAvailability[]) {
  return [...sessions].sort(
    (a, b) => a.sessionDate.localeCompare(b.sessionDate) || a.startTime.localeCompare(b.startTime),
  );
}

function attachSessions(eventRows: Event[]): EventWithSessions[] {
  return eventRows.map((event) => {
    const sessions = sortSessions(
      eventSessionsTable.filter((s) => s.eventId === event.id).map((s) => decorateSession(s)),
    );
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

const PUBLIC_EVENT_STATUSES: Event["status"][] = ["published", "sold_out", "bookings_closed"];

export async function getPublishedEvents(): Promise<EventWithSessions[]> {
  const rows = eventsTable
    .filter((e) => PUBLIC_EVENT_STATUSES.includes(e.status))
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  return attachSessions(rows);
}

export async function getPublishedEventBySlug(slug: string): Promise<EventWithSessions | undefined> {
  const row = eventsTable.find((e) => e.slug === slug && PUBLIC_EVENT_STATUSES.includes(e.status));
  if (!row) return undefined;
  return attachSessions([row])[0];
}

// ---------------------------------------------------------------------------
// Events (admin)
// ---------------------------------------------------------------------------

export async function getAllEventsAdmin(): Promise<EventWithSessions[]> {
  const rows = [...eventsTable].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return attachSessions(rows);
}

export async function getEventByIdAdmin(id: number): Promise<EventWithSessions | undefined> {
  const row = eventsTable.find((e) => e.id === id);
  if (!row) return undefined;
  return attachSessions([row])[0];
}

export async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = slugify(base) || "event";
  let counter = 1;
  while (true) {
    const existing = eventsTable.find((e) => e.slug === slug);
    if (!existing || existing.id === excludeId) return slug;
    counter += 1;
    slug = `${slugify(base)}-${counter}`;
  }
}

export async function createEvent(data: InsertEvent): Promise<Event> {
  const slug = await ensureUniqueSlug(data.slug || data.title);
  const now = new Date();
  const event: Event = {
    id: nextId("events"),
    slug,
    title: data.title,
    category: data.category,
    theme: data.theme ?? "",
    recurrenceLabel: data.recurrenceLabel ?? "",
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    coverImageUrl: data.coverImageUrl ?? "",
    galleryImageUrls: data.galleryImageUrls ?? [],
    venue: data.venue ?? "Nuée Tavern & Bar, Kalyani Nagar, Pune",
    mapsLink: data.mapsLink ?? "",
    host: data.host ?? "",
    inclusions: data.inclusions ?? "",
    foodBeverageInfo: data.foodBeverageInfo ?? "",
    displayPrice: data.displayPrice ?? "",
    maxGuestsPerBooking: data.maxGuestsPerBooking ?? 10,
    bookingOpensAt: data.bookingOpensAt ?? null,
    bookingClosesAt: data.bookingClosesAt ?? null,
    cancellationPolicy: data.cancellationPolicy ?? "",
    dressCode: data.dressCode ?? "Smart casual",
    ageRequirement: data.ageRequirement ?? "All ages welcome",
    faqs: data.faqs ?? [],
    isFeatured: data.isFeatured ?? false,
    status: data.status ?? "draft",
    sortOrder: data.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === "published" ? now : null,
  };
  eventsTable.push(event);
  return event;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
  const event = eventsTable.find((e) => e.id === id);
  if (!event) return undefined;
  if (data.slug || data.title) {
    event.slug = await ensureUniqueSlug(data.slug || data.title || "", id);
  }
  Object.assign(event, data, { updatedAt: new Date() });
  return event;
}

export async function setEventStatus(id: number, status: Event["status"]): Promise<Event | undefined> {
  const event = eventsTable.find((e) => e.id === id);
  if (!event) return undefined;
  event.status = status;
  event.updatedAt = new Date();
  if (status === "published") event.publishedAt = new Date();
  return event;
}

export async function duplicateEvent(id: number): Promise<Event | undefined> {
  const original = eventsTable.find((e) => e.id === id);
  if (!original) return undefined;
  const now = new Date();
  const slug = await ensureUniqueSlug(`${original.title}-copy`);
  const copy: Event = {
    ...original,
    id: nextId("events"),
    title: `${original.title} (Copy)`,
    slug,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
  eventsTable.push(copy);

  const originalSessions = eventSessionsTable.filter((s) => s.eventId === id);
  for (const s of originalSessions) {
    eventSessionsTable.push({
      id: nextId("event_sessions"),
      eventId: copy.id,
      name: s.name,
      sessionDate: s.sessionDate,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      displayPrice: s.displayPrice,
      bookingDeadline: s.bookingDeadline,
      isCancelled: false,
      createdAt: now,
      updatedAt: now,
    });
  }
  return copy;
}

export async function deleteEvent(id: number): Promise<void> {
  const idx = eventsTable.findIndex((e) => e.id === id);
  if (idx !== -1) eventsTable.splice(idx, 1);
  for (let i = eventSessionsTable.length - 1; i >= 0; i--) {
    if (eventSessionsTable[i].eventId === id) eventSessionsTable.splice(i, 1);
  }
}

// ---------------------------------------------------------------------------
// Event sessions (admin)
// ---------------------------------------------------------------------------

export async function getSessionsForEvent(eventId: number): Promise<EventSessionWithAvailability[]> {
  return sortSessions(eventSessionsTable.filter((s) => s.eventId === eventId).map((s) => decorateSession(s)));
}

export async function getSessionById(id: number): Promise<EventSession | undefined> {
  return eventSessionsTable.find((s) => s.id === id);
}

export async function createSession(data: InsertEventSession): Promise<EventSession> {
  const now = new Date();
  const session: EventSession = {
    id: nextId("event_sessions"),
    eventId: data.eventId,
    name: data.name,
    sessionDate: data.sessionDate,
    startTime: data.startTime,
    endTime: data.endTime ?? "",
    capacity: data.capacity ?? 0,
    displayPrice: data.displayPrice ?? "",
    bookingDeadline: data.bookingDeadline ?? null,
    isCancelled: data.isCancelled ?? false,
    createdAt: now,
    updatedAt: now,
  };
  eventSessionsTable.push(session);
  return session;
}

export async function updateSession(
  id: number,
  data: Partial<InsertEventSession>,
): Promise<EventSession | undefined> {
  const session = eventSessionsTable.find((s) => s.id === id);
  if (!session) return undefined;
  if (typeof data.capacity === "number") {
    const confirmed = guestCountForSession(id);
    if (data.capacity < confirmed) {
      throw new CapacityBelowConfirmedError(confirmed);
    }
  }
  Object.assign(session, data, { updatedAt: new Date() });
  return session;
}

export async function deleteSession(id: number): Promise<void> {
  const idx = eventSessionsTable.findIndex((s) => s.id === id);
  if (idx !== -1) eventSessionsTable.splice(idx, 1);
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function createBooking(
  data: InsertBooking,
  overrides: Partial<Pick<Booking, "source" | "status" | "isComplimentary" | "internalNotes">> = {},
): Promise<Booking> {
  const now = new Date();
  const booking: Booking = {
    id: nextId("bookings"),
    reference: generateReference("NUEE"),
    eventId: data.eventId,
    sessionId: data.sessionId,
    name: data.name,
    mobile: data.mobile,
    email: data.email ?? "",
    guestCount: data.guestCount ?? 1,
    dietaryPreferences: data.dietaryPreferences ?? "",
    allergyInfo: data.allergyInfo ?? "",
    specialRequests: data.specialRequests ?? "",
    status: overrides.status ?? "enquiry_received",
    source: overrides.source ?? "customer",
    isComplimentary: overrides.isComplimentary ?? false,
    internalNotes: overrides.internalNotes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  bookingsTable.push(booking);
  return booking;
}

export async function adminCreateBooking(data: AdminCreateBooking): Promise<Booking> {
  const now = new Date();
  const booking: Booking = {
    id: nextId("bookings"),
    reference: generateReference("NUEE"),
    eventId: data.eventId,
    sessionId: data.sessionId,
    name: data.name,
    mobile: data.mobile,
    email: data.email ?? "",
    guestCount: data.guestCount ?? 1,
    dietaryPreferences: data.dietaryPreferences ?? "",
    allergyInfo: data.allergyInfo ?? "",
    specialRequests: data.specialRequests ?? "",
    status: data.status ?? "confirmed",
    source: data.source ?? "admin_manual",
    isComplimentary: data.isComplimentary ?? false,
    internalNotes: data.internalNotes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  bookingsTable.push(booking);
  return booking;
}

export interface BookingFilters {
  search?: string;
  eventId?: number;
  sessionId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

function bookingWithJoins(b: Booking) {
  const event = eventsTable.find((e) => e.id === b.eventId);
  const session = eventSessionsTable.find((s) => s.id === b.sessionId);
  return {
    ...b,
    eventTitle: event?.title ?? null,
    sessionName: session?.name ?? null,
    sessionDate: session?.sessionDate ?? null,
  };
}

export async function getBookingsAdmin(filters: BookingFilters = {}) {
  let rows = [...bookingsTable];
  if (filters.search) {
    const term = filters.search.toLowerCase();
    rows = rows.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.mobile.toLowerCase().includes(term) ||
        b.email.toLowerCase().includes(term) ||
        b.reference.toLowerCase().includes(term),
    );
  }
  if (filters.eventId) rows = rows.filter((b) => b.eventId === filters.eventId);
  if (filters.sessionId) rows = rows.filter((b) => b.sessionId === filters.sessionId);
  if (filters.status) rows = rows.filter((b) => b.status === filters.status);
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    rows = rows.filter((b) => b.createdAt.getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    rows = rows.filter((b) => b.createdAt.getTime() <= to);
  }
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.map(bookingWithJoins);
}

export async function getBookingByReference(reference: string) {
  const booking = bookingsTable.find((b) => b.reference === reference);
  if (!booking) return undefined;
  const event = eventsTable.find((e) => e.id === booking.eventId);
  const session = eventSessionsTable.find((s) => s.id === booking.sessionId);
  return {
    ...booking,
    eventTitle: event?.title ?? null,
    eventSlug: event?.slug ?? null,
    sessionName: session?.name ?? null,
    sessionDate: session?.sessionDate ?? null,
    startTime: session?.startTime ?? null,
    venue: event?.venue ?? null,
  };
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  return bookingsTable.find((b) => b.id === id);
}

export async function updateBookingStatus(id: number, status: Booking["status"]): Promise<Booking | undefined> {
  const booking = bookingsTable.find((b) => b.id === id);
  if (!booking) return undefined;
  booking.status = status;
  booking.updatedAt = new Date();
  return booking;
}

export async function updateBookingNotes(id: number, internalNotes: string): Promise<Booking | undefined> {
  const booking = bookingsTable.find((b) => b.id === id);
  if (!booking) return undefined;
  booking.internalNotes = internalNotes;
  booking.updatedAt = new Date();
  return booking;
}

export async function checkInBooking(
  bookingId: number,
  adminId: number | undefined,
  guestCountCheckedIn: number,
  notes = "",
) {
  const checkIn: CheckIn = {
    id: nextId("check_ins"),
    bookingId,
    checkedInByAdminId: adminId ?? null,
    guestCountCheckedIn,
    notes,
    checkedInAt: new Date(),
  };
  checkInsTable.push(checkIn);
  const booking = bookingsTable.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = "checked_in";
    booking.updatedAt = new Date();
  }
  return checkIn;
}

export async function bookingsToCsv(rows: Awaited<ReturnType<typeof getBookingsAdmin>>): Promise<string> {
  return bookingsToCsvShared(rows);
}

// ---------------------------------------------------------------------------
// Table reservations
// ---------------------------------------------------------------------------

export async function createTableReservation(data: InsertTableReservation): Promise<TableReservation> {
  const now = new Date();
  const reservation: TableReservation = {
    id: nextId("table_reservations"),
    reference: generateReference("TABLE"),
    name: data.name,
    mobile: data.mobile,
    email: data.email ?? "",
    partySize: data.partySize ?? 2,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    specialRequests: data.specialRequests ?? "",
    status: "pending",
    internalNotes: "",
    createdAt: now,
    updatedAt: now,
  };
  tableReservationsTable.push(reservation);
  return reservation;
}

export async function getTableReservationsAdmin(status?: string): Promise<TableReservation[]> {
  let rows = [...tableReservationsTable];
  if (status) rows = rows.filter((r) => r.status === status);
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateTableReservationStatus(
  id: number,
  status: TableReservation["status"],
): Promise<TableReservation | undefined> {
  const reservation = tableReservationsTable.find((r) => r.id === id);
  if (!reservation) return undefined;
  reservation.status = status;
  reservation.updatedAt = new Date();
  return reservation;
}

export async function updateTableReservationNotes(
  id: number,
  internalNotes: string,
): Promise<TableReservation | undefined> {
  const reservation = tableReservationsTable.find((r) => r.id === id);
  if (!reservation) return undefined;
  reservation.internalNotes = internalNotes;
  reservation.updatedAt = new Date();
  return reservation;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export async function getMenu() {
  const categories = menuCategoriesTable.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const items = menuItemsTable.filter((i) => i.isAvailable).sort((a, b) => a.sortOrder - b.sortOrder);
  return categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) }));
}

export async function getMenuAdmin() {
  const categories = [...menuCategoriesTable].sort((a, b) => a.sortOrder - b.sortOrder);
  const items = [...menuItemsTable].sort((a, b) => a.sortOrder - b.sortOrder);
  return categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) }));
}

export async function createMenuCategory(data: InsertMenuCategory): Promise<MenuCategory> {
  const category: MenuCategory = {
    id: nextId("menu_categories"),
    name: data.name,
    type: data.type,
    subtype: data.subtype ?? "none",
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
  };
  menuCategoriesTable.push(category);
  return category;
}

export async function updateMenuCategory(
  id: number,
  data: Partial<InsertMenuCategory>,
): Promise<MenuCategory | undefined> {
  const category = menuCategoriesTable.find((c) => c.id === id);
  if (!category) return undefined;
  Object.assign(category, data);
  return category;
}

export async function deleteMenuCategory(id: number): Promise<void> {
  const idx = menuCategoriesTable.findIndex((c) => c.id === id);
  if (idx !== -1) menuCategoriesTable.splice(idx, 1);
  for (let i = menuItemsTable.length - 1; i >= 0; i--) {
    if (menuItemsTable[i].categoryId === id) menuItemsTable.splice(i, 1);
  }
}

export async function createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
  const item: MenuItem = {
    id: nextId("menu_items"),
    categoryId: data.categoryId,
    name: data.name,
    description: data.description ?? "",
    price: data.price ?? "",
    dietaryTag: data.dietaryTag ?? "none",
    isSignature: data.isSignature ?? false,
    isAvailable: data.isAvailable ?? true,
    sortOrder: data.sortOrder ?? 0,
  };
  menuItemsTable.push(item);
  return item;
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
  const item = menuItemsTable.find((i) => i.id === id);
  if (!item) return undefined;
  Object.assign(item, data);
  return item;
}

export async function deleteMenuItem(id: number): Promise<void> {
  const idx = menuItemsTable.findIndex((i) => i.id === id);
  if (idx !== -1) menuItemsTable.splice(idx, 1);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function getPublishedReviews(): Promise<Review[]> {
  return reviewsTable.filter((r) => r.isPublished).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getReviewsAdmin(): Promise<Review[]> {
  return [...reviewsTable].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createReview(data: InsertReview): Promise<Review> {
  const review: Review = {
    id: nextId("reviews"),
    guestName: data.guestName,
    rating: data.rating ?? 5,
    reviewText: data.reviewText,
    source: data.source ?? "Google",
    isPublished: data.isPublished ?? true,
    sortOrder: data.sortOrder ?? 0,
    createdAt: new Date(),
  };
  reviewsTable.push(review);
  return review;
}

export async function updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
  const review = reviewsTable.find((r) => r.id === id);
  if (!review) return undefined;
  Object.assign(review, data);
  return review;
}

export async function deleteReview(id: number): Promise<void> {
  const idx = reviewsTable.findIndex((r) => r.id === id);
  if (idx !== -1) reviewsTable.splice(idx, 1);
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function getPublishedFaqs(): Promise<Faq[]> {
  return faqsTable.filter((f) => f.isPublished).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getFaqsAdmin(): Promise<Faq[]> {
  return [...faqsTable].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createFaq(data: InsertFaq): Promise<Faq> {
  const faq: Faq = {
    id: nextId("faqs"),
    question: data.question,
    answer: data.answer,
    category: data.category ?? "general",
    sortOrder: data.sortOrder ?? 0,
    isPublished: data.isPublished ?? true,
  };
  faqsTable.push(faq);
  return faq;
}

export async function updateFaq(id: number, data: Partial<InsertFaq>): Promise<Faq | undefined> {
  const faq = faqsTable.find((f) => f.id === id);
  if (!faq) return undefined;
  Object.assign(faq, data);
  return faq;
}

export async function deleteFaq(id: number): Promise<void> {
  const idx = faqsTable.findIndex((f) => f.id === id);
  if (idx !== -1) faqsTable.splice(idx, 1);
}

// ---------------------------------------------------------------------------
// Website content
// ---------------------------------------------------------------------------

export async function getWebsiteContent(): Promise<WebsiteContent[]> {
  return [...websiteContentTable].sort((a, b) => a.key.localeCompare(b.key));
}

export async function getWebsiteContentMap(): Promise<Record<string, string>> {
  return Object.fromEntries(websiteContentTable.map((r) => [r.key, r.value]));
}

export async function upsertWebsiteContent(key: string, label: string, value: string): Promise<WebsiteContent> {
  const existing = websiteContentTable.find((c) => c.key === key);
  if (existing) {
    existing.value = value;
    existing.label = label;
    existing.updatedAt = new Date();
    return existing;
  }
  const content: WebsiteContent = { id: nextId("website_content"), key, label, value, updatedAt: new Date() };
  websiteContentTable.push(content);
  return content;
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
  auditLogsTable.push({
    id: nextId("audit_logs"),
    adminUserId: entry.adminUserId ?? null,
    action: entry.action,
    entityType: entry.entityType ?? "",
    entityId: entry.entityId ?? "",
    details: entry.details ?? {},
    ipAddress: entry.ipAddress ?? "",
    createdAt: new Date(),
  });
}

export async function getRecentAuditLogs(limit = 100) {
  const sorted = [...auditLogsTable].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  return sorted.map((log) => ({
    log,
    adminName: adminUsersTable.find((u) => u.id === log.adminUserId)?.name ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export async function getOverviewStats() {
  const upcoming = eventsTable.filter((e) => e.status === "published" || e.status === "scheduled").length;
  const published = eventsTable.filter((e) => e.status === "published").length;
  const draft = eventsTable.filter((e) => e.status === "draft").length;

  let soldOutSessions = 0;
  let totalRemainingSeats = 0;
  for (const s of eventSessionsTable) {
    const confirmed = guestCountForSession(s.id);
    const remaining = Math.max(s.capacity - confirmed, 0);
    totalRemainingSeats += remaining;
    if (remaining <= 0 && s.capacity > 0) soldOutSessions += 1;
  }

  const totalEnquiries = bookingsTable.length;
  const totalGuestCount = bookingsTable
    .filter((b) => b.status !== "cancelled" && b.status !== "no_show")
    .reduce((acc, b) => acc + b.guestCount, 0);

  const tableReservationRequests = tableReservationsTable.filter((t) => t.status === "pending").length;

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

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "scheduled",
  "published",
  "sold_out",
  "bookings_closed",
  "cancelled",
  "completed",
  "archived",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "enquiry_received",
  "pending_confirmation",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show",
]);

export const bookingSourceEnum = pgEnum("booking_source", [
  "customer",
  "admin_manual",
  "admin_complimentary",
]);

export const tableReservationStatusEnum = pgEnum("table_reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const menuTypeEnum = pgEnum("menu_type", ["food", "beverage"]);
export const menuSubtypeEnum = pgEnum("menu_subtype", ["veg", "non_veg", "none"]);

// ---------------------------------------------------------------------------
// admin_users
// ---------------------------------------------------------------------------

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
  },
  (table) => ({
    emailIdx: uniqueIndex("admin_users_email_idx").on(table.email),
  }),
);

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    theme: text("theme").notNull().default(""),
    recurrenceLabel: text("recurrence_label").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    coverImageUrl: text("cover_image_url").notNull().default(""),
    galleryImageUrls: jsonb("gallery_image_urls").$type<string[]>().notNull().default([]),
    venue: text("venue").notNull().default("Nuée Tavern & Bar, Kalyani Nagar, Pune"),
    mapsLink: text("maps_link").notNull().default(""),
    host: text("host").notNull().default(""),
    inclusions: text("inclusions").notNull().default(""),
    foodBeverageInfo: text("food_beverage_info").notNull().default(""),
    displayPrice: text("display_price").notNull().default(""),
    maxGuestsPerBooking: integer("max_guests_per_booking").notNull().default(10),
    bookingOpensAt: timestamp("booking_opens_at"),
    bookingClosesAt: timestamp("booking_closes_at"),
    cancellationPolicy: text("cancellation_policy").notNull().default(
      "Full refund is not applicable as no online payment is currently collected. Please inform us at least 24 hours in advance if you are unable to attend so we can release your seats.",
    ),
    dressCode: text("dress_code").notNull().default("Smart casual"),
    ageRequirement: text("age_requirement").notNull().default("All ages welcome"),
    faqs: jsonb("faqs").$type<{ question: string; answer: string }[]>().notNull().default([]),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: eventStatusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    slugIdx: uniqueIndex("events_slug_idx").on(table.slug),
  }),
);

export const eventsRelations = relations(events, ({ many }) => ({
  sessions: many(eventSessions),
  bookings: many(bookings),
}));

// ---------------------------------------------------------------------------
// event_sessions
// ---------------------------------------------------------------------------

export const eventSessions = pgTable("event_sessions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sessionDate: date("session_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull().default(""),
  capacity: integer("capacity").notNull().default(0),
  displayPrice: text("display_price").notNull().default(""),
  bookingDeadline: timestamp("booking_deadline"),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const eventSessionsRelations = relations(eventSessions, ({ one, many }) => ({
  event: one(events, { fields: [eventSessions.eventId], references: [events.id] }),
  bookings: many(bookings),
}));

// ---------------------------------------------------------------------------
// bookings
// ---------------------------------------------------------------------------

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => eventSessions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email").notNull().default(""),
    guestCount: integer("guest_count").notNull().default(1),
    dietaryPreferences: text("dietary_preferences").notNull().default(""),
    allergyInfo: text("allergy_info").notNull().default(""),
    specialRequests: text("special_requests").notNull().default(""),
    status: bookingStatusEnum("status").notNull().default("enquiry_received"),
    source: bookingSourceEnum("source").notNull().default("customer"),
    isComplimentary: boolean("is_complimentary").notNull().default(false),
    internalNotes: text("internal_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    referenceIdx: uniqueIndex("bookings_reference_idx").on(table.reference),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  event: one(events, { fields: [bookings.eventId], references: [events.id] }),
  session: one(eventSessions, { fields: [bookings.sessionId], references: [eventSessions.id] }),
  checkIns: many(checkIns),
}));

// ---------------------------------------------------------------------------
// check_ins
// ---------------------------------------------------------------------------

export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  checkedInByAdminId: integer("checked_in_by_admin_id").references(() => adminUsers.id),
  guestCountCheckedIn: integer("guest_count_checked_in").notNull().default(1),
  notes: text("notes").notNull().default(""),
  checkedInAt: timestamp("checked_in_at").notNull().defaultNow(),
});

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  booking: one(bookings, { fields: [checkIns.bookingId], references: [bookings.id] }),
}));

// ---------------------------------------------------------------------------
// table_reservations
// ---------------------------------------------------------------------------

export const tableReservations = pgTable(
  "table_reservations",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email").notNull().default(""),
    partySize: integer("party_size").notNull().default(2),
    preferredDate: date("preferred_date").notNull(),
    preferredTime: text("preferred_time").notNull(),
    specialRequests: text("special_requests").notNull().default(""),
    status: tableReservationStatusEnum("status").notNull().default("pending"),
    internalNotes: text("internal_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    referenceIdx: uniqueIndex("table_reservations_reference_idx").on(table.reference),
  }),
);

// ---------------------------------------------------------------------------
// menu_categories / menu_items
// ---------------------------------------------------------------------------

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: menuTypeEnum("type").notNull(),
  subtype: menuSubtypeEnum("subtype").notNull().default("none"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: text("price").notNull().default(""),
  dietaryTag: menuSubtypeEnum("dietary_tag").notNull().default("none"),
  isSignature: boolean("is_signature").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, { fields: [menuItems.categoryId], references: [menuCategories.id] }),
}));

// ---------------------------------------------------------------------------
// reviews
// ---------------------------------------------------------------------------

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  guestName: text("guest_name").notNull(),
  rating: integer("rating").notNull().default(5),
  reviewText: text("review_text").notNull(),
  source: text("source").notNull().default("Google"),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// faqs
// ---------------------------------------------------------------------------

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

// ---------------------------------------------------------------------------
// website_content
// ---------------------------------------------------------------------------

export const websiteContent = pgTable(
  "website_content",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex("website_content_key_idx").on(table.key),
  }),
);

// ---------------------------------------------------------------------------
// audit_logs
// ---------------------------------------------------------------------------

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => adminUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull().default(""),
  entityId: text("entity_id").notNull().default(""),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  ipAddress: text("ip_address").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Zod insert schemas
// ---------------------------------------------------------------------------

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertEventSchema = createInsertSchema(events, {
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  galleryImageUrls: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertEventSessionSchema = createInsertSchema(eventSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings, {
  email: z.string().email().or(z.literal("")),
  mobile: z.string().min(7, "Enter a valid mobile number"),
  guestCount: z.coerce.number().int().min(1).max(50),
}).omit({
  id: true,
  reference: true,
  status: true,
  source: true,
  isComplimentary: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const adminCreateBookingSchema = createInsertSchema(bookings, {
  guestCount: z.coerce.number().int().min(1).max(50),
}).omit({
  id: true,
  reference: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTableReservationSchema = createInsertSchema(tableReservations, {
  email: z.string().email().or(z.literal("")),
  mobile: z.string().min(7, "Enter a valid mobile number"),
  partySize: z.coerce.number().int().min(1).max(30),
}).omit({
  id: true,
  reference: true,
  status: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true });
export const insertWebsiteContentSchema = createInsertSchema(websiteContent).omit({
  id: true,
  updatedAt: true,
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventSession = typeof eventSessions.$inferSelect;
export type InsertEventSession = z.infer<typeof insertEventSessionSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type AdminCreateBooking = z.infer<typeof adminCreateBookingSchema>;

export type CheckIn = typeof checkIns.$inferSelect;

export type TableReservation = typeof tableReservations.$inferSelect;
export type InsertTableReservation = z.infer<typeof insertTableReservationSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export type WebsiteContent = typeof websiteContent.$inferSelect;
export type InsertWebsiteContent = z.infer<typeof insertWebsiteContentSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;

// Event with computed availability, used across API responses
export type SessionAvailability =
  | "available"
  | "filling_fast"
  | "few_seats_left"
  | "sold_out"
  | "bookings_closed";

export type EventSessionWithAvailability = EventSession & {
  confirmedGuestCount: number;
  remainingSeats: number;
  availability: SessionAvailability;
};

export type EventWithSessions = Event & {
  sessions: EventSessionWithAvailability[];
  totalCapacity: number;
  totalRemainingSeats: number;
  overallAvailability: SessionAvailability;
};

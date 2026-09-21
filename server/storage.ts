// Dispatches to the PostgreSQL-backed storage (production) or the in-memory
// storage (demo mode, no DATABASE_URL) based on server/mode.ts. Both modules
// implement the exact same function surface — the type annotation below
// makes the TypeScript compiler verify that parity, so the two
// implementations can never silently drift apart.
import * as postgresStorage from "./storage.postgres";
import * as memoryStorage from "./storage.memory";
import { isDemoMode } from "./mode";

const impl: typeof postgresStorage = isDemoMode() ? memoryStorage : postgresStorage;

export const {
  getAdminUserByEmail,
  getAdminUserById,
  createAdminUser,
  touchAdminLastLogin,
  updateAdminPasswordHash,
  getSessionGuestCount,
  getPublishedEvents,
  getPublishedEventBySlug,
  getAllEventsAdmin,
  getEventByIdAdmin,
  ensureUniqueSlug,
  createEvent,
  updateEvent,
  setEventStatus,
  duplicateEvent,
  deleteEvent,
  getSessionsForEvent,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  createBooking,
  adminCreateBooking,
  getBookingsAdmin,
  getBookingByReference,
  getBookingById,
  updateBookingStatus,
  updateBookingNotes,
  checkInBooking,
  bookingsToCsv,
  createTableReservation,
  getTableReservationsAdmin,
  updateTableReservationStatus,
  updateTableReservationNotes,
  getMenu,
  getMenuAdmin,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getPublishedReviews,
  getReviewsAdmin,
  createReview,
  updateReview,
  deleteReview,
  getPublishedFaqs,
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  getWebsiteContent,
  getWebsiteContentMap,
  upsertWebsiteContent,
  recordAuditLog,
  getRecentAuditLogs,
  getOverviewStats,
  CapacityBelowConfirmedError,
} = impl;

export type { BookingFilters } from "./storage.postgres";

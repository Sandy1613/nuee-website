/**
 * Nuée runs in one of two modes:
 *
 * - "production": DATABASE_URL is set. All data is read from and written to
 *   a real PostgreSQL database via Drizzle ORM (server/storage.postgres.ts).
 * - "demo": DATABASE_URL is not set. The site runs entirely in memory
 *   (server/storage.memory.ts) so it can be previewed without any external
 *   database. Demo mode is for presentation only — it resets on every
 *   restart, uses a fixed demo admin account, and must never be used to
 *   collect real customer data.
 */
export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL;
}

export function getAppMode(): "demo" | "production" {
  return isDemoMode() ? "demo" : "production";
}

export const DEMO_ADMIN_EMAIL = "demo@nuee.example";
export const DEMO_ADMIN_PASSWORD = "demo1234";

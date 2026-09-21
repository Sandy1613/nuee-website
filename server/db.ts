import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Lazily constructed so importing this module never throws — only an actual
// query/connection attempt does. This lets server/storage.ts safely decide
// between the PostgreSQL-backed storage and the in-memory demo storage at
// startup without this module's absence of DATABASE_URL crashing the process
// when demo mode is active. In production (DATABASE_URL set), behavior is
// unchanged: the pool is created on first use and reused after that.
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function ensurePool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a valid PostgreSQL connection string. " +
        "The application requires a real PostgreSQL database in production mode — it will not fall back to " +
        "in-memory or browser storage. To preview the site without a database, simply leave DATABASE_URL unset " +
        "and the app will run in demo mode instead.",
    );
  }
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error", err);
    });
  }
  return _pool;
}

function ensureDb() {
  if (!_db) {
    _db = drizzle(ensurePool(), { schema });
  }
  return _db;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const value = Reflect.get(ensurePool(), prop, receiver);
    return typeof value === "function" ? value.bind(ensurePool()) : value;
  },
});

export const db: ReturnType<typeof drizzle> = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const value = Reflect.get(ensureDb(), prop, receiver);
    return typeof value === "function" ? value.bind(ensureDb()) : value;
  },
});

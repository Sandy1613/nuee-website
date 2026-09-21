import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and provide a valid PostgreSQL connection string. " +
      "The application requires a real PostgreSQL database — it will not fall back to in-memory or browser storage.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

export const db = drizzle(pool, { schema });

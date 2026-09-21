import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    adminUserId?: number;
    adminEmail?: string;
    adminName?: string;
  }
}

const PgSession = connectPgSimple(session);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hour admin session expiry

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Copy .env.example to .env and set a long random SESSION_SECRET value.",
    );
  }
  return session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret,
    name: "nuee.admin.sid",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.adminUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

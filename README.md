# Nuée Tavern & Bar

A premium fine-dining restaurant website and admin dashboard for Nuée Tavern & Bar, Kalyani Nagar, Pune.

Full-stack TypeScript application: React + Vite frontend, Express backend, PostgreSQL with Drizzle ORM.
Online payments are **not** implemented yet — the app displays "Online payments coming soon" and all bookings
are collected as pending-confirmation enquiries. The architecture (see `docs` below) is structured so Razorpay
can be added later without a rewrite.

**No PostgreSQL database yet?** The app runs out of the box in **Demo Mode** — just run `npm install && npm run
dev` with no `.env` file at all. See [Demo Mode](#demo-mode) below.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Node.js + Express
- PostgreSQL + Drizzle ORM (+ drizzle-kit for migrations)
- express-session + connect-pg-simple (server-side sessions stored in Postgres)
- bcryptjs for password hashing
- wouter (routing), TanStack Query (data fetching), react-hook-form + zod (forms/validation), framer-motion (animation)

## Project Structure

```
client/               React frontend (Vite root)
  src/
    pages/             Public pages (Home, Events, EventDetails, Menu, About, Visit, BookingConfirmation, NotFound)
    pages/admin/        Admin dashboard pages
    components/         Shared UI (Navbar, Footer, EventCard, etc.)
    components/admin/   Admin-only components (sessions manager, manual booking modal, stat cards)
    components/ui/      Base UI primitives (Button, Input, Select, Badge, ...)
    context/            React context (table booking modal)
    hooks/              Custom hooks (admin auth)
    lib/                Query client, utils, availability helpers
server/                Express backend
  routes/public.ts      Public API (events, menu, reviews, faqs, bookings, table reservations)
  routes/admin.ts       Protected admin API (auth, events, sessions, bookings, menu, content, audit log)
  routes/system.ts      Public /api/system/mode endpoint (demo vs. production, used for the demo banner)
  storage.ts            Dispatches to storage.postgres.ts or storage.memory.ts based on mode.ts
  storage.postgres.ts   Production storage — all database queries (Drizzle)
  storage.memory.ts     Demo-mode storage — same functions, in-memory only, resets on restart
  mode.ts               Decides demo vs. production mode (isDemoMode = !DATABASE_URL)
  demoSeedData.ts        Sample content used to seed the in-memory demo store
  idUtils.ts / csv.ts / errors.ts  Small helpers shared by both storage backends
  auth.ts               Session + password hashing (Postgres session store in production, in-memory in demo mode)
  availability.ts       Seat availability calculation
  db.ts                 Lazily-initialized Postgres connection (never throws just from being imported)
  seed.ts               Seed script for a real PostgreSQL database (not used by demo mode)
  vite.ts               Dev (Vite middleware) / production (static file) server wiring
shared/schema.ts        Drizzle table definitions, Zod schemas, shared TypeScript types
```

## Demo Mode

The app has two distinct, clearly separated modes, decided entirely by whether `DATABASE_URL` is set
(`server/mode.ts`):

- **Production mode** (`DATABASE_URL` set): everything is read from and written to a real PostgreSQL database via
  Drizzle ORM (`server/storage.postgres.ts`). Sessions are stored in Postgres via `connect-pg-simple`. This is the
  only mode intended for real customers, real bookings, and real admin accounts.
- **Demo mode** (`DATABASE_URL` not set): the exact same UI and API run entirely against an in-memory store
  (`server/storage.memory.ts`) that is pre-seeded with the same sample events, menu, reviews and FAQs used in
  production. There is nothing to configure — `npm install && npm run dev` just works. A fixed demo admin account
  (shown on the login screen: `demo@nuee.example` / `demo1234`) lets you preview the whole admin dashboard.

Demo mode is for presentation and evaluation only, and is designed to never be mistaken for a production
deployment:

- A persistent amber "Demo Mode" banner appears across every public and admin page.
- The admin login screen explicitly labels the demo account as temporary and non-production.
- Booking and table reservation forms show an additional notice asking guests not to enter real personal
  information.
- All data (events, bookings, admin changes, sessions) lives only in server memory and is **wiped on every
  restart** — nothing is written to disk or any external service.
- `npm run db:seed` refuses to run without `DATABASE_URL`, since it only ever seeds a real database, not the demo
  store.

To go from demo mode to production, set `DATABASE_URL` (and ideally `SESSION_SECRET`) in `.env` and restart —
the same codebase switches over automatically, no code changes required.

## Environment Variables

For **demo mode**, no `.env` file is required at all. For **production mode**, copy `.env.example` to `.env` and
fill in real values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Production only | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/nuee_dev`. Leave unset to run in demo mode. |
| `SESSION_SECRET` | Production only (auto-generated in demo mode) | Long random string used to sign the admin session cookie |
| `ADMIN_EMAIL` | Used by seed | Email for the initial admin account created by `npm run db:seed` |
| `ADMIN_PASSWORD` | Used by seed | Password for the initial admin account (change after first login) |
| `PORT` | No (default 5000) | Port the server listens on |
| `NODE_ENV` | Set by npm scripts | `development` or `production` |

In **production mode**, the app **requires** a real PostgreSQL database — it will not silently fall back to
in-memory storage for events, bookings, reservations, authentication or seat availability. If `DATABASE_URL` is
missing, `drizzle-kit` and `npm run db:seed` will fail with a clear error rather than doing nothing; the app
server itself will simply start in demo mode instead, so it is never possible to accidentally run "half"
production, half demo.

## Database Setup

1. Provision a PostgreSQL database (local, Docker, Neon, Supabase, RDS, etc.) and set `DATABASE_URL` in `.env`.
2. Push the schema (creates all tables — no manual SQL needed):
   ```bash
   npm run db:push
   ```
3. Seed initial data (admin user + sample events, menu, reviews, FAQs, website content):
   ```bash
   npm run db:seed
   ```
   Seeding is idempotent — it skips any table that already has rows (except the admin user check, which is by email).

### Tables created

`admin_users`, `events`, `event_sessions`, `bookings`, `check_ins`, `table_reservations`, `menu_categories`,
`menu_items`, `reviews`, `faqs`, `website_content`, `audit_logs`, plus a `session` table auto-created by
`connect-pg-simple` for admin login sessions.

## Running Locally

**Fastest path — demo mode, no database needed:**

```bash
npm install
npm run dev             # starts on http://localhost:5000 in demo mode automatically
```

**With a real PostgreSQL database (production mode):**

```bash
npm install
cp .env.example .env   # then edit .env with real values, at least DATABASE_URL and SESSION_SECRET
npm run db:push
npm run db:seed
npm run dev             # starts Express + Vite dev middleware on http://localhost:5000
```

Production build:

```bash
npm run build           # builds client (dist/public) and bundles the server (dist/index.js)
npm start                # NODE_ENV=production node dist/index.js
```

Type-check only: `npm run check`

## Admin Dashboard

URL: `/admin` (redirects to `/admin/login` if not authenticated)

- **Demo mode**: use `demo@nuee.example` / `demo1234` (also shown on the login screen, with a "Fill demo
  credentials" button). This account and any changes you make reset when the server restarts.
- **Production mode**: credentials come from the seed script's `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars at the
  time `npm run db:seed` was run. Change the password from **Admin → Settings** after first login.

Sections: Overview, Events (create/edit/publish/duplicate/archive + sessions & capacity), Bookings (search,
filter, confirm/reject, manual & complimentary bookings, check-in, CSV export), Table Reservations, Menu
(categories/items, reorder, availability), Reviews, FAQs, Website Content (editable text used across the public
site — address, hours, hero copy, etc.), and Settings (password change + audit log).

### Security implemented

- Server-side sessions (Postgres-backed), 8-hour expiry, `httpOnly` + `sameSite` cookies
- Passwords hashed with bcrypt (12 rounds)
- All admin API routes protected by session middleware; no admin logic or secrets ship to the frontend bundle
- Zod validation on every write endpoint (public and admin)
- Audit log recorded for login/logout, event/session/booking mutations, status changes, and website content edits
- Session capacity cannot be reduced below the number of guests already holding a confirmed seat

## Booking Model

- Customers do not need an account. Event bookings and general table reservations are both collected as
  **enquiries** with a generated reference (e.g. `NUEE-AB12C3`), shown on a confirmation page, and stored in
  Postgres — visible immediately in the admin dashboard.
- Booking statuses: Enquiry Received → Pending Confirmation → Confirmed → Checked In (or Cancelled / No Show).
- Seats remaining = session capacity − guests from all non-cancelled/no-show bookings for that session
  (covers customer bookings, manual admin bookings, and complimentary bookings uniformly).
- Availability labels shown throughout: Available, Filling Fast, Few Seats Left, Sold Out, Bookings Closed.

## What's Awaiting Real Content / Credentials

- **Menu items, reviews and the restaurant's exact address/phone/hours** are seeded as clearly labelled sample
  content ("(Sample)" / "replace with your verified menu") — replace via the Admin → Menu, Reviews, and Website
  Content screens once verified data is available.
- **Production PostgreSQL credentials** — this build was developed and tested against a local PostgreSQL 16
  instance. Point `DATABASE_URL` at your production database (Neon, Supabase, RDS, etc.) and re-run
  `npm run db:push` before going live.
- **Image hosting** — cover/gallery images currently use hotlinked stock photo URLs as placeholders. The cover
  image field accepts any URL and is upload-ready; wire up real object storage (S3, Cloudinary, etc.) when ready
  and swap the field for a proper uploader.
- **Custom domain / production session secret** — generate a fresh, private `SESSION_SECRET` for production
  and never reuse the development one.

## Adding Razorpay Later

The schema and UI already assume payments are separate from booking confirmation, so Razorpay can be layered in
without restructuring:

1. Add a `payments` table (booking/reservation id, Razorpay order id, amount, status, timestamps).
2. Add a `POST /api/bookings/:id/create-order` endpoint that creates a Razorpay order server-side (keep the key
   secret out of the frontend — only the public key ID and order id are sent to the client).
3. Add the Razorpay checkout script to the booking confirmation flow and verify the payment signature
   server-side in a webhook/callback route before marking a booking `confirmed`.
4. Replace the "Online payments coming soon" notices (`EventDetails.tsx`, `TableReservationModal.tsx`) with the
   real checkout flow, and gate it behind an environment flag so it can be toggled per environment.
5. Reconcile refunds/cancellations against the `payments` table from the admin Bookings screen.

## Easiest Free Deployment

For a free, zero-database presentation deployment, run the app in **demo mode** on a free Node host (e.g. Render's
free Web Service) — do not set `DATABASE_URL` there, and it works exactly as it does locally, with the demo
banner and demo admin account. See the deployment walkthrough shared alongside this repository for exact,
beginner-friendly steps. For a real production deployment with persistent data, add a managed PostgreSQL database
(Neon and Supabase both have free tiers) and set `DATABASE_URL` per the Environment Variables section above.

## Production Deployment Checklist

- Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` as real secrets in your hosting
  provider's environment configuration (never commit `.env`).
- Run `npm run build` then `npm start` behind a process manager (systemd, PM2, or your platform's equivalent).
- Put the app behind HTTPS (the session cookie is marked `secure` automatically when `NODE_ENV=production`).
- Run `npm run db:push` against the production database, then `npm run db:seed` once to create the first admin
  account (or insert one directly).
- Replace placeholder images, menu, reviews and address/contact details via the admin dashboard.
- Add Razorpay (see above) before accepting real payments.

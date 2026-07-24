# TechPlus OS — Z Lab Design

A working web system for Z Lab Design (luxury car detailing studio, Indirapuram) built from two prototypes: the public marketing site (`pareekpiyush97.github.io/Z-Lab`) and the shop-floor operations console (`z-lab-internal-ops`). Both are now one real, database-backed system instead of static pages. Built with Next.js 15, TypeScript, Tailwind CSS, and Postgres (Supabase).

## What's in here

**Public site** — pixel-for-pixel port of the original marketing prototype (hero, marquee, Signature Services grid + detail modal, before/after slider, gallery, Why Us, instant-quote form), with content coming from the database and quote submissions saved as leads before the WhatsApp handoff.

**Admin dashboard** (`/admin`) — the "operating system" part, split by role:

- **Staff + Owner** get the shop floor: **Jobs** (intake a car → confirm plate/scope → activate → deliver), **Stock & Logistics** (consumables on hand, low-stock badges), **Service History** (look up a vehicle by plate — visits, spend, full job list).
- **Owner only** additionally gets: **P&L** (revenue vs. purchase cost, by day/week/month/all-time), **Reminders** (manual to-dos + automatic low-stock alerts), **Stock Purchases** (logging restock cost — feeds P&L), and the marketing-site admin (**Leads**, **Services**, **Gallery**, **Settings**).

Sign-in is **Google OAuth** ("Sign in with Google"), gated by two email allowlists — see **Google sign-in setup** below. A username/password fallback still exists for the seeded account.

**Two roadmap items intentionally *not* built yet** (per your instructions), with clean extension points left in place:
- **WhatsApp Business API** (add-on, next phase) — `lib/whatsapp.ts`
- **Fixed-camera plate recognition** (future integration) — `db/schema.sql` (`vehicle_sightings` table), `app/api/integrations/plate-recognition/route.ts`, and a simulated stand-in (`fakeSuggestedPlate()` in `app/api/admin/jobs/route.ts`) that today generates a random plate suggestion so the Jobs workflow already has the right shape for when a real camera feed lands.

See **Roadmap** below for exactly what to do when each of those phases starts.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database schema

In your Supabase project (`efyyugigeqekyvywnacp`): **Dashboard → SQL Editor → paste the contents of `db/schema.sql` → Run.** It's idempotent — safe to re-run any time (including after this update — it only adds what's missing: `jobs`, `stock_items`, `stock_purchases`, `reminders`, and the `role` column on `admin_users`).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

- `DATABASE_URL` — Supabase Dashboard → **Project Settings → Database → Connection string → URI**. Use the **pooled** connection (port `6543`, includes `?pgbouncer=true`) if you'll deploy to Vercel or another serverless host; use the **direct** connection (port `5432`) for a traditional always-on server.
- `SESSION_SECRET` — generate with `openssl rand -base64 48`.
- `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` — the first admin login (password fallback, seeded as an **owner** — see Google sign-in below). **Change the password immediately after first login** (there's no in-app "change password" screen yet — see note below).
- `BUSINESS_WHATSAPP_NUMBER` — already set to the studio's number.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `ALLOWED_OWNER_EMAILS` / `ALLOWED_STAFF_EMAILS` — see **Google sign-in setup** below.

### 3b. Google sign-in setup ("Sign in with Google")

The admin login page has a **Sign in with Google** button as the primary way in, with the username/password form still there as a fallback (click "Use a password instead").

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a project (or use an existing one) → **APIs & Services → OAuth consent screen**. Choose **External**, fill in the basic app info, and add every Z Labs Gmail address that needs access as a test user (or publish the app — for an internal tool, "Testing" mode with those emails added as test users is enough and avoids Google's verification review).
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.**
3. Under **Authorized redirect URIs**, add one entry per environment you'll run this in:
   - `http://localhost:3000/api/admin/auth/google/callback`
   - `https://<your-deployed-domain>/api/admin/auth/google/callback`
4. Copy the generated **Client ID** and **Client secret** into `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Set the two allowlists to comma-separated Gmail addresses:
   - `ALLOWED_OWNER_EMAILS="you@gmail.com"` — full access to everything.
   - `ALLOWED_STAFF_EMAILS="staff1@gmail.com,staff2@gmail.com"` — shop-floor only (Jobs, Stock, Service History). Leave empty if there's no staff access yet.

   Google only proves *who* signed in; these lists decide *what* they can see, or whether they get in at all. Anyone signing in with a Google account on neither list is turned away with an explicit error. If an email's list membership changes later (e.g. staff → owner), their access updates automatically the next time they sign in — no manual DB edit needed.

The first time an allowed email signs in, an admin account is created for it automatically at the matching role (no local password — Google is its only way in). Existing password-based admins are unaffected.

### 4. Seed initial content

```bash
npm run db:seed
```

This loads the exact 6 services and 10 gallery photos from the original marketing prototype, the business info (address/phone/hero copy), and creates your first admin user (role: owner).

### 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin/login` for the dashboard.

### A note on verification

I built, type-checked, and production-built this project successfully at every stage, and verified the entire SQL schema and every query in `lib/repo.ts` (marketing-site tables, then the Jobs/Stock/Purchases/Reminders tables) against a real embedded Postgres engine — correct `jsonb` handling, triggers, constraints, upserts, idempotent re-runs, all confirmed working. What I could **not** do from my sandboxed environment is make a live network connection to your actual Supabase project, call Google's or Vercel's APIs, or exercise the OAuth flow end-to-end — outbound access here is restricted to a small allowlist that doesn't include any of those hosts. So: the setup steps above are the first real end-to-end run against your live database and Google credentials. If anything doesn't come up cleanly, it's almost certainly a `.env` value (most commonly: forgetting to swap `[YOUR-PASSWORD]` in `DATABASE_URL`, the schema not having been run yet, or a redirect URI mismatch in Google Cloud Console) — send me the error and I'll fix it.

---

## Deploying it live

This is a standard Next.js app, so any Next.js-friendly host works. Vercel is the simplest path and keeps you in full control of your own hosting account:

1. Push this folder to your `z-lab-internal-ops` GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Add the same environment variables from your `.env` in the Vercel project's **Settings → Environment Variables** (use the **pooled** `DATABASE_URL`, port 6543, for serverless).
4. Add the deployed domain's callback URL (`https://<your-domain>/api/admin/auth/google/callback`) to the OAuth client's **Authorized redirect URIs** in Google Cloud Console.
5. Deploy. Done — you own the Vercel project, the GitHub repo, and the Supabase project outright, nothing routes through me.

If you'd rather I walk through the GitHub push + Vercel import interactively with you, say the word.

---

## Architecture

```
app/
  page.tsx                    Public homepage (Server Component, fetches live data)
  admin/
    page.tsx                  Overview (owner)
    jobs/, stock/, history/   Shop floor (staff + owner)
    pnl/, reminders/          Financials (owner only)
    leads/, services/,
    gallery/, settings/       Marketing-site admin (owner only)
  api/
    admin/                    Route handlers for every admin write path
    integrations/             Plate-recognition webhook stub
components/
  site/                       Public-site UI (Hero, Services, Gallery, Contact, ...)
  admin/                      Dashboard UI: AdminChrome (role-aware nav), JobsManager,
                               JobProcessPanel, ActiveJobRow, StockManager, HistoryLookup,
                               PnlManager, RemindersManager, JobIcon, + marketing-site managers
lib/
  db.ts                       Postgres connection pool
  repo.ts                     All data access — the only file that writes SQL
  auth.ts / middleware.ts     Session cookies (JWT, role-aware) + route protection
  google-auth.ts              Google OAuth2 flow + owner/staff allowlist resolution
  job-catalog.ts              Fixed shop-floor service menu + stock categories
  validation.ts                zod schemas — every write path is validated server-side
  whatsapp.ts                 WhatsApp abstraction (see Roadmap)
  rate-limit.ts                In-memory rate limiting for public endpoints
db/schema.sql                 Full Postgres schema, run once in Supabase (idempotent)
scripts/seed.ts               Loads prototype content + first admin user
```

**Why Postgres via a direct connection string instead of the Supabase SDK:** simpler, and it means this app owns its own authentication (Google OAuth + bcrypt fallback + signed JWT cookies) rather than depending on Supabase Auth/Row Level Security — easier to reason about and easier to hand over. The schema lives in `db/schema.sql`, so you're never locked into Supabase specifically; it would run on any Postgres host.

**Why the Jobs service menu is a fixed list, not admin-editable:** `lib/job-catalog.ts` mirrors the internal-ops prototype's operational checklist exactly (Wash & Clean, Coating, Protection, Detailing, Customization). It's deliberately separate from the marketing-site `services` table (which *is* editable, under Services) — one is what customers see on the website, the other is the shop's internal work-order menu.

**Why not every marketing prototype section is admin-editable:** the "Why Us" section (4 fixed trust points) is static copy in `components/site/WhyUs.tsx`, not database-backed. It almost never changes and keeping it as code kept scope sane — happy to make it editable too if you'd like.

---

## Security notes

- **Passwords**: bcrypt-hashed (cost factor 12), never stored or logged in plaintext.
- **Sessions**: signed, `httpOnly`, `sameSite=lax` JWT cookies (8-hour expiry), with `role` embedded as a claim so middleware can authorize requests at the edge without a database round-trip — not readable or forgeable from JS or another site.
- **Role enforcement happens twice**: once in `middleware.ts` (blocks the page/API request outright) and implicitly again in what data each page fetches — a staff session is never even handed owner-only data like revenue figures.
- **SQL injection**: every query in `lib/repo.ts` is parameterized (`$1, $2, ...`); no user input is ever concatenated into SQL text.
- **Rate limiting**: the quote form and admin login are both rate-limited per-IP (in-memory — fine for one server instance; swap for Redis if you ever run multiple instances).
- **Input validation**: every write path (public and admin, including Jobs/Stock/Purchases/Reminders) is validated server-side with `zod`, independent of whatever the browser sends.
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` set globally in `next.config.mjs`.
- **Dependency audit**: `npm audit` is clean (0 vulnerabilities) as of this build — Next.js pinned to a patched release (15.5.21) and `postcss`/`sharp` forced to patched versions via `package.json` `overrides`.
- **Image uploads**: filenames are always server-generated (never the client's original filename), so there's no path-traversal vector; only JPEG/PNG/WebP up to 5MB are accepted.
- **Google sign-in**: ID tokens are cryptographically verified against Google's live public keys (issuer + audience checked), not just decoded — a valid Google session alone still isn't enough to get in. `ALLOWED_OWNER_EMAILS` / `ALLOWED_STAFF_EMAILS` are the actual gate; anyone on neither list is rejected even with a legitimate Google account. The OAuth `state` parameter is checked against a short-lived signed cookie to prevent CSRF on the callback.
- **⚠️ Known gap**: there's no "change my password" screen yet in `/admin` — changing the seeded password today means generating a new hash (`npm run hash-password -- "new-password"`) and updating it directly in the `admin_users` table via Supabase's Table Editor. Worth adding before handing this to non-technical staff (or just use Google sign-in exclusively, which sidesteps this entirely).
- **⚠️ Local image uploads on serverless**: `/api/admin/upload` writes to the local filesystem, which is ephemeral on serverless hosts like Vercel — uploaded photos would disappear on the next deploy. Fine for a traditional server; if you deploy serverless, either stick to the "Image URL" field with externally-hosted images, or move this route to Supabase Storage (natural next step, since you're already on Supabase).
- **⚠️ Plate matching is a simple string search**: `searchJobsByPlate` (used by Service History) does a normalized `LIKE` match, not fuzzy/OCR-error-tolerant matching. Worth revisiting once real ANPR is wired in, since camera misreads (`O`/`0`, `I`/`1`) are common.

---

## Roadmap

### Add-on (build after this is live): WhatsApp Business API

Today, "Book This Service" and the quote form open a `wa.me` deep link with a prefilled message — identical to the original prototype, now also saving the lead to the database first.

Everything routes through one interface (`WhatsAppProvider` in `lib/whatsapp.ts`), so switching to the real Business API later is a one-file change:

1. Get a WhatsApp Business Cloud API account (via Meta) and a pre-approved message template (e.g. `new_quote_ack`).
2. Set `WHATSAPP_BUSINESS_API_TOKEN` and `WHATSAPP_BUSINESS_PHONE_NUMBER_ID` in `.env`.
3. Uncomment and finish the `BusinessApiWhatsApp` class sketch already sitting in `lib/whatsapp.ts`, and point `getWhatsAppProvider()` at it.

No other file needs to change — every call site (the quote route, the service modal) only depends on the interface, never on `wa.me` links directly.

### Future integration: fixed single-camera plate recognition

Not started, per your instructions — but reserved for in two places:

- **Vehicle sightings (unattended camera feed)**: `vehicle_sightings` table already exists in `db/schema.sql` (camera ID, plate number, confidence, image, timestamp, `matched_lead_id`). `POST /api/integrations/plate-recognition` already validates/stores a sighting but stays **disabled by default** (returns 501) until you deliberately set `PLATE_RECOGNITION_WEBHOOK_SECRET` in `.env`. When ready, point your camera's edge software (Frigate / OpenALPR / Plate Recognizer's webhook output) at that endpoint with header `X-Webhook-Secret: <your secret>`.
- **Job intake (in-the-moment scan)**: the Jobs console's "Scan (camera)" button and `suggested_plate` field currently call `fakeSuggestedPlate()` — a random plate generator standing in for a real read. Swap that function's body in `app/api/admin/jobs/route.ts` for a call to your actual recognition service (or have the camera pipeline write into `vehicle_sightings` and have this endpoint look up the most recent unmatched sighting instead) — no other file needs to change, since staff already confirm/adjust whatever plate comes back before it's saved.

---

## Scope notes

Combines both source prototypes — the marketing site and the shop-floor ops console — into one system, converted from static HTML/CSS/JS into a live, role-aware app. Deliberate additions beyond what either prototype had on its own: lead persistence, real authentication (replacing the ops console's PIN gate with Google OAuth + roles), and the validation/security layer underneath everything. Nothing was added to the *look and feel* of either prototype beyond what they already had.

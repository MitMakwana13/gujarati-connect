# Deployment Runbook

Zero-to-live guide for GujaratiConnect. Follow in order. Total time: ~90 minutes first time.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  apps/web       │  BFF    │  services/api    │
│  Next.js on     ├────────►│  Fastify on      │
│  Vercel         │  HTTPS  │  Railway         │
└─────────────────┘         └────────┬─────────┘
                                     │
                 ┌───────────────────┼────────────────────┐
                 │                   │                    │
                 ▼                   ▼                    ▼
         ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
         │  Postgres    │    │  Redis       │    │ services/worker │
         │  Railway or  │    │  Railway or  │    │ Railway         │
         │  Supabase    │    │  Upstash     │    │ (same DB+Redis) │
         └──────────────┘    └──────────────┘    └─────────────────┘
```

Media files go to Supabase Storage (already wired).

---

## Step 1 — Provision data services (15 min)

### Postgres
Option A (recommended for v1): **Supabase** — you already use it for storage.
- Create project → note down `DATABASE_URL` from Settings → Database → Connection String → "Session pooler"
- Append `?sslmode=require` to the URL

Option B: **Railway Postgres** — click "New → Database → Postgres" in your Railway project. Railway auto-generates `DATABASE_URL`.

### Redis
Option A (recommended, free): **Upstash** — https://upstash.com → Create Redis DB → copy `UPSTASH_REDIS_URL`. Use the `rediss://` (TLS) URL.

Option B: **Railway Redis** — click "New → Database → Redis". Auto-generates `REDIS_URL`.

### Supabase Storage bucket
Supabase Dashboard → Storage → New bucket named `media` → set to **public**. Media upload route writes here.

---

## Step 2 — Run migrations against production DB (5 min)

From your local machine, point at production and run:

```bash
DATABASE_URL="<your-prod-postgres-url>" pnpm migrate
```

You should see each file in `scripts/migrations/` applied including `005_hardening.sql`. If anything fails, fix the schema and re-run — the migrator is idempotent via `schema_migrations` tracking.

Seed some dev data so the feed is not empty:
```bash
DATABASE_URL="<your-prod-postgres-url>" pnpm exec tsx scripts/seed-dev-data.ts
```

---

## Step 3 — Deploy the API + Worker to Railway (30 min)

1. Go to https://railway.app → New Project → **Deploy from GitHub repo** → pick `gujarati-connect`.
2. Railway will detect the monorepo. Create TWO services from the same repo:
   - Service 1 named **api** → Settings → Root Directory = `/` → Build Config → set Railway config file to `services/api/railway.json`
   - Service 2 named **worker** → same repo → Settings → set Railway config to `services/worker/railway.json`
3. For each service, go to **Variables** tab and paste values from `.env.production.example`. Generate secrets locally:
   ```bash
   # Run these and paste the output into Railway:
   openssl rand -base64 32  # For JWT_ACCESS_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   openssl rand -base64 32  # For COOKIE_SECRET
   ```
4. For the **api** service → Settings → Networking → **Generate Domain**. Note the URL (e.g. `gg-api-production.up.railway.app`).
5. Deploy. Watch logs. First boot should show:
   ```
   [redis] Connected to Redis
   [redis] Redis connection healthy
   Server listening at http://[::]:4000
   ```
6. Hit `https://<your-railway-url>/health` in browser → should return `{"status":"ok",...}`.

If `/health` is 503, check logs for DB or Redis connection errors. The most common cause is missing `?sslmode=require` on `DATABASE_URL`.

---

## Step 4 — Deploy the web app to Vercel (15 min)

1. https://vercel.com → Add New → Project → import `gujarati-connect`.
2. Framework Preset: **Next.js** (auto-detected).
3. Root Directory: **leave as `/`** (vercel.json handles the monorepo routing).
4. Environment Variables — add these from `.env.production.example` Section 1:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-api-url>/api/v1`  ← note the `/api/v1` suffix
   - `NEXTAUTH_SECRET` = (use `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = will be set automatically by Vercel after first deploy — come back and paste the actual URL
5. Deploy. Wait ~2 min.
6. Open the URL. Go through: register → verify OTP (check API logs for the code in dev mode) → see the feed.

Come back to Vercel → update `NEXTAUTH_URL` to the actual deploy URL → redeploy.

---

## Step 5 — Connect CORS (5 min)

Back in Railway → **api** service → Variables → update:
```
CORS_ORIGINS=https://your-app.vercel.app
```

Redeploy the API. Without this, the browser will block requests with a CORS error.

---

## Step 6 — Smoke test the full flow (10 min)

On your live URL:
- [ ] Register a new user with a real email format (you do not need a real inbox in dev mode — OTP prints to API logs)
- [ ] Enter OTP from Railway API logs
- [ ] Land on feed
- [ ] Create a text post → see it appear immediately
- [ ] Like another post
- [ ] Create a group
- [ ] Upload an avatar on profile page → confirm it loads from `*.supabase.co/storage/v1/...`
- [ ] Open `/messages` → start a conversation → send a message → open in two browsers to test real-time

Any failure: check Railway API logs first, then Vercel function logs (for BFF proxy errors).

---

## Step 7 — Custom domain + monitoring (optional but recommended)

**Custom domain on Vercel:** Settings → Domains → Add → point your `A` record at Vercel.

**API behind custom domain on Railway:** Settings → Networking → Custom Domain → follow CNAME instructions.

After custom domain:
- Update `NEXT_PUBLIC_API_URL` on Vercel to the custom API URL
- Update `CORS_ORIGINS` on Railway to include the custom web URL
- Update `NEXTAUTH_URL` on Vercel

**Free monitoring to set up now:**
- **UptimeRobot** — free ping of your `/health` endpoint every 5 min with SMS alerts
- **Sentry** — add `@sentry/nextjs` to apps/web and `@sentry/node` to services/api. 5k errors/month free.
- **Logflare** or **Railway's built-in logs** — good enough for week 1

---

## Production readiness gaps (before real users)

You can onboard friends/family at this point. Before wider launch:

- **Email delivery** — swap the dev SMTP log for Resend/Postmark. Without this, OTP verification breaks for real users.
- **Content moderation** — the API has moderation scaffolding but no automated scanning wired up. Queue up Perspective API or OpenAI moderation for the `moderation.scan` worker handler.
- **Backups** — enable Postgres daily backups (Supabase does this free; Railway has a paid add-on).
- **Rate-limit tuning** — the defaults (1000 req/min global) are loose. Tighten per-route limits before launch.
- **Secrets rotation plan** — document how to rotate JWT/cookie secrets without logging every user out.
- **Privacy policy + terms** — `/privacy` and `/terms` pages required before collecting emails, especially if launching in the EU or California.

---

## Rollback procedure

**Web app:** Vercel → Deployments → find last good one → "Promote to Production". Takes 20 seconds.

**API/Worker:** Railway → Deployments tab → click previous good build → "Redeploy".

**Database:** Supabase has point-in-time-recovery on paid plans. Railway has snapshots. Test your restore path BEFORE you need it.

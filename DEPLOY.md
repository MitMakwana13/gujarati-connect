# Deployment Runbook

Zero-to-live guide for GujaratiConnect. Follow in order. Total time: ~60 minutes first time.

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
         │  Supabase    │    │  Upstash     │    │ services/worker │
         │  Postgres    │    │  Redis       │    │ Railway         │
         └──────────────┘    └──────────────┘    └─────────────────┘
```

Media files go to Supabase Storage (already wired via `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`).

---

## Authoritative Stack

| Layer | Platform |
|---|---|
| Frontend | Vercel — Root Directory: `apps/web` |
| Backend API | Railway — config: `services/api/railway.json` |
| Worker | Railway — config: `services/worker/railway.json` |
| Database | Supabase Postgres |
| Cache | Upstash Redis (TLS `rediss://`) |
| Storage | Supabase Storage (bucket: `media`) |

---

## Step 1 — Provision data services (15 min)

### Supabase (Postgres + Storage)
1. Create project at https://supabase.com
2. Settings → Database → Connection String → **Session pooler** → copy the URL, append `?sslmode=require`
   ```
   DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
3. Storage → New bucket named `media` → set to **public**

### Upstash (Redis)
1. Create database at https://upstash.com
2. Connect tab → copy the **`rediss://`** URL (TLS required)
   ```
   REDIS_URL=rediss://default:PASSWORD@HOSTNAME.upstash.io:6379
   ```
   > **Important:** Set this as `REDIS_URL` in Railway. Do NOT use `UPSTASH_REDIS_URL`.

---

## Step 2 — Run database migrations (5 min)

From your local machine (requires `DATABASE_URL` from Step 1):

```bash
DATABASE_URL="<your-supabase-postgres-url>" pnpm migrate
```

Optionally seed demo data:
```bash
DATABASE_URL="<your-supabase-postgres-url>" pnpm exec tsx scripts/seed-dev-data.ts
```

The migrator is idempotent — safe to re-run. All SQL files from `scripts/migrations/` are applied in order.

---

## Step 3 — Deploy API + Worker to Railway (20 min)

1. Go to https://railway.app → New Project → **Deploy from GitHub** → pick `gujarati-connect`
2. Create **two services** from the same repo:
   - **gujarati-api** → Settings → Railway Config File: `services/api/railway.json`
   - **gujarati-worker** → Settings → Railway Config File: `services/worker/railway.json`

3. For the **gujarati-api** service → Variables tab → add all values from `.env.production.example`:

   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<supabase-url>?sslmode=require
   REDIS_URL=rediss://default:PASSWORD@HOSTNAME.upstash.io:6379
   JWT_ACCESS_SECRET=<openssl rand -base64 32>
   JWT_REFRESH_SECRET=<openssl rand -base64 32>
   COOKIE_SECRET=<openssl rand -base64 32>
   CORS_ORIGINS=https://<your-vercel-app>.vercel.app
   SUPABASE_URL=https://PROJECT.supabase.co
   SUPABASE_SERVICE_KEY=<service-role-key>
   EMAIL_SMTP_HOST=smtp.resend.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=resend
   EMAIL_SMTP_PASS=<resend-api-key>
   EMAIL_FROM=no-reply@yourdomain.com
   ```

4. gujarati-api → Settings → Networking → **Generate Domain** → note the URL (e.g. `gujarati-connect-production.up.railway.app`)
5. Deploy. First healthy boot logs:
   ```
   [redis] Connected to Redis
   Server listening at http://[::]:4000
   ```
6. Verify: `https://<railway-url>/health` → `{"status":"ok"}`

---

## Step 4 — Deploy frontend to Vercel (10 min)

1. https://vercel.com → Add New → Project → import `gujarati-connect`
2. **Root Directory: `apps/web`** ← critical, do not leave as `/`
3. Framework Preset: Next.js (auto-detected)
4. Environment Variables — add:
   ```
   API_BASE_URL=https://<your-railway-api-url>/api/v1
   ```
   > **Do NOT use** `NEXT_PUBLIC_API_URL` — the proxy uses server-side-only `API_BASE_URL`.
   > **Do NOT add** `NEXTAUTH_SECRET` or `NEXTAUTH_URL` — NextAuth is not used.

5. Deploy. Wait ~3 min.
6. Visit the URL → register → verify OTP (check Railway API logs for the OTP code if SMTP is not yet configured) → land on feed.

---

## Step 5 — Wire CORS (2 min)

In Railway → **gujarati-api** service → Variables → update:
```
CORS_ORIGINS=https://your-app.vercel.app
```
Redeploy the API. Without this, browser requests will fail with CORS errors.

---

## Step 6 — Smoke test (10 min)

- [ ] Register a new user (OTP prints to Railway logs if SMTP is not configured)
- [ ] Enter OTP → land on feed
- [ ] Create a text post → confirm it persists on refresh
- [ ] RSVP to an event → confirm it persists on refresh
- [ ] Join a group → confirm membership persists
- [ ] Visit Resource Board → confirm items load

Any failure: check Railway API logs first, then Vercel function logs (for BFF proxy errors).

---

## Step 7 — Custom domain + monitoring (optional)

**Vercel custom domain:** Settings → Domains → Add

**Railway custom domain:** Settings → Networking → Custom Domain

After adding custom domains:
- Update `API_BASE_URL` in Vercel to the custom API URL
- Update `CORS_ORIGINS` in Railway to the custom web URL

**Recommended free monitoring:**
- **UptimeRobot** — ping `/health` every 5 min
- **Sentry** — `@sentry/nextjs` for web, `@sentry/node` for API

---

## Production readiness gaps (before real users)

- **Email delivery** — configure a real SMTP provider (Resend, Postmark). Without this, OTP only logs to console.
- **Auth session hardening** — move refresh token to `HttpOnly` cookie; access token should be memory-only, not `sessionStorage`.
- **Content moderation** — moderation scaffolding exists but automated scanning is not wired.
- **Backups** — enable Supabase daily backups (free tier included).
- **Privacy policy + terms** — required before collecting emails in EU/California.

---

## Rollback

**Web app:** Vercel → Deployments → find last good build → "Promote to Production" (20 seconds).

**API/Worker:** Railway → Deployments → previous good build → "Redeploy".

**Database:** Supabase has point-in-time recovery on paid plans. Test your restore path before you need it.

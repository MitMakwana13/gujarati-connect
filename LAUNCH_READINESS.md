# Launch Readiness Dashboard — First 100 Users

This document tracks the production-beta readiness of Gujarati Global for the first 100 users.

## 1. Readiness Status Table

Launch rule: No RED items. YELLOW allowed only if documented and non-blocking.

| Category | Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Auth** | Login / Register | GREEN | Core flows verified. |
| | Email OTP | YELLOW | Needs production Resend configuration. |
| | Session & Security | GREEN | Refresh cookies + memory access token. |
| **Core Product** | Feed | GREEN | End-to-end verified. |
| | Photo Upload | GREEN | Storage configured. |
| | Comments & Likes | GREEN | End-to-end verified. |
| | Groups | GREEN | End-to-end verified. |
| | Events | GREEN | End-to-end verified. |
| | Resources | GREEN | End-to-end verified. |
| | Discover | GREEN | End-to-end verified. |
| | Messages | GREEN | End-to-end verified. |
| | Notifications | GREEN | End-to-end verified. |
| | Profile | GREEN | End-to-end verified. |
| **Infrastructure**| Database | GREEN | Railway Postgres running. |
| | Redis | GREEN | Upstash Redis TLS running. |
| | Storage | GREEN | Supabase Storage configured. |
| | Backups | GREEN | Manual dumps documented. |
| | Monitoring (Sentry) | GREEN | API & Frontend integrated (optional boot). |
| | Error Handling | GREEN | No secrets leaked in logs or Sentry. |
| **Trust** | Terms & Privacy | GREEN | Startup-safe drafts published. |
| | Support Page | GREEN | Support paths documented. |
| | Report/Abuse | GREEN | Rate limits and reporting exist. |
| **Release** | Rollback Plan | GREEN | Railway/Vercel rollbacks documented. |
| | Smoke Test | GREEN | `pnpm smoke:prod` runs clean. |
| | Runbook | GREEN | First 100 users staged rollout documented. |

---

## 2. Environment Variables Checklist

### Railway API (`services/api/railway.json`)
- [ ] `NODE_ENV=production`
- [ ] `PORT` (Automatic by Railway)
- [ ] `DATABASE_URL` (From Railway Postgres)
- [ ] `REDIS_URL` (Must be `rediss://` TLS from Upstash)
- [ ] `JWT_ACCESS_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `COOKIE_SECRET`
- [ ] `CORS_ORIGINS`
- [ ] `REFRESH_COOKIE_PATH=/api/backend/auth`
- [ ] `EMAIL_SMTP_HOST`
- [ ] `EMAIL_SMTP_PORT`
- [ ] `EMAIL_SMTP_USER`
- [ ] `EMAIL_SMTP_PASS`
- [ ] `EMAIL_FROM`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `SENTRY_DSN` (Optional)
- [ ] `SENTRY_ENVIRONMENT=production`
- [ ] `SENTRY_TRACES_SAMPLE_RATE=0.05`
- [ ] `SENTRY_PROFILES_SAMPLE_RATE=0`

### Vercel Web (`apps/web`)
- [ ] `API_BASE_URL` (Must point to Railway API `https://.../api/v1`)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (Optional)
- [ ] `SENTRY_AUTH_TOKEN` (Optional - for sourcemap uploads)
- [ ] `SENTRY_ORG` (Optional)
- [ ] `SENTRY_PROJECT` (Optional)

### Supabase Storage
- [ ] Project active, not paused
- [ ] Storage bucket named `media` exists
- [ ] Bucket is `public`
- [ ] Upload test passes

---

## 3. Email Deliverability Finalization
- **Provider**: Resend SMTP
- **Verified Sending Domain**: Pending configuration
- **Fallback**: In development or if SMTP fails, OTPs will be printed to Railway logs.

---

## 4. Manual QA Checklist (Incognito)

- [ ] 1. Login / Register
- [ ] 2. Refresh feed
- [ ] 3. Create text post
- [ ] 4. Create photo post
- [ ] 5. Like/unlike post
- [ ] 6. Comment on post
- [ ] 7. Join group
- [ ] 8. Leave group
- [ ] 9. Create group
- [ ] 10. RSVP event
- [ ] 11. Cancel RSVP
- [ ] 12. Create event
- [ ] 13. Filter resources
- [ ] 14. Create resource
- [ ] 15. Discover search/filter/connect
- [ ] 16. Messages empty state or send message
- [ ] 17. Notifications
- [ ] 18. Profile edit
- [ ] 19. Logout
- [ ] 20. Refresh and confirm logged out

*Failures to be logged here.*

---

## 5. Deployment and Rollback

### Deployments
- **Web (Vercel)**: Pushing to `main` triggers an automatic deployment.
- **API & Worker (Railway)**: Pushing to `main` triggers automatic deployment for `gujarati-api` and `gujarati-worker`.

### Rollbacks
- **Web (Vercel)**: 
  1. Go to Vercel Dashboard -> Project -> Deployments.
  2. Find the last known good deployment.
  3. Click the three dots (...) and select **"Promote to Production"**.
- **API (Railway)**:
  1. Go to Railway Dashboard -> Project -> `gujarati-api` -> Deployments.
  2. Find the previous successful deployment.
  3. Click the three dots (...) and select **"Redeploy"**.
- **Database (Railway Postgres)**:
  1. Restore from the latest snapshot or use `pg_dump` backup (see `docs/BACKUP_AND_RESTORE.md`).

---

## 6. Performance Sanity Check
- [ ] Landing page loads < 2s
- [ ] Feed does not hang
- [ ] Images optimized
- [ ] No hydration errors

---

## 7. Known Limitations
- Email SMTP requires a verified domain to avoid spam folders.
- Sentry is configured for errors and basic tracing, but deep profiling is disabled to reduce overhead.
- Legal pages are startup-safe drafts and should be reviewed by legal counsel before wider public launch.

# Gujarati Global Live Demo V1 – Release Report

**Date:** April 28, 2026  
**Status:** 🟢 **GO FOR LAUNCH**  

---

## 1. Final Commit Hash
`5111a4d08b7fb43bf8aee592943b87fcfe56c9c9`

## 2. What is Live
- **Authentication:** Passwordless OTP email login via SMTP abstraction.
- **Home Feed:** Centralized feed with infinite scroll, caching, and robust error handling.
- **Groups:** Group discovery, creation, and requesting to join (with active error boundaries).
- **Events:** Event browsing, RSVP handling, and capacity management.
- **Resources:** Job listings, housing, and community services boards.
- **Profiles:** User discovery by city, industry, and shared roots.
- **Security:** CSRF protection, Next.js BFF proxy routing, structured AppError parsing.

## 3. What is Intentionally Beta
- **Messaging:** Basic UI is present, but fully distributed cross-user Websocket stability is still in Beta.
- **Notifications:** Read/Unread logic is present, but lacks APNs/FCM mobile push functionality.
- **Search:** Localized filtering is operational, but full-text global elastic search is deferred.

## 4. What is Not Included
- Native iOS/Android mobile applications.
- Payment gateway for paid event ticketing.
- Advanced AI auto-moderation for feed images.

## 5. Frontend Deployment Configuration
- **Platform:** Vercel (Monorepo)
- **Root Directory:** `./`
- **Build Command:** `pnpm --filter web build`
- **Output Directory:** `apps/web/.next`
- **Install Command:** `pnpm install --frozen-lockfile`

## 6. Backend Deployment Configuration Assumptions
- **Platform:** Node.js Fastify instance (Hostinger / VPS / Azure App Service).
- **Data Persistence:** PostgreSQL (Connection string required).
- **Caching & Pub/Sub:** Redis cluster (Connection string required).
- **Networking:** Positioned securely behind NGINX or Azure Front Door terminating HTTPS.

## 7. Required Environment Variables
**Frontend (`apps/web`):**
- `NEXT_PUBLIC_API_URL` (e.g., `https://api.gujarati.global/api/v1`)

**Backend (`services/api`):**
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_SMTP_PASS` (Server crashes if absent in production)
- `RATE_LIMIT_ALLOW_LIST` (Optional: highly recommended for demo venue IPs)

## 8. Manual Smoke Test Checklist
- [ ] Load the frontend URL and verify it resolves without 500 errors.
- [ ] Attempt registration as a new user; confirm OTP is received via email.
- [ ] Login using `priya.patel@example.com` / `DevPassword123!`
- [ ] Scroll the Home Feed and trigger a "Like" on a post.
- [ ] Search for a Group and hit "Join". (Verify button transitions gracefully).
- [ ] RSVP to an Event and confirm the capacity bar updates.
- [ ] Force a 404 by visiting an invalid URL to verify the new polished Not Found page.

## 9. Known Blockers Before Public Launch
*(These are not blockers for the investor demo, but must be addressed before mass-market launch)*
- **Playwright E2E Suite:** We are missing an automated headless browser test suite to prevent UI regressions.
- **Global Rate Limiting:** We need a distributed IP firewall (like Cloudflare) to supplement the local Fastify rate-limiter.
- **Media CDN:** High-resolution user uploads need to be deferred to an Azure Blob Storage CDN rather than passing through Fastify buffers.

## 10. Recommended Next Sprint
- Integrate Playwright E2E testing into GitHub Actions.
- Implement Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM).
- Refactor the Messaging module for horizontal WebSocket scaling via Redis Pub/Sub.
- Deploy Azure Blob CDN for media attachments.

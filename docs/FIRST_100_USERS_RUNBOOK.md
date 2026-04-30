# First 100 Users Runbook

This runbook defines the staged rollout process, incident severity levels, and response procedures for the Gujarati Global production-beta launch.

## 1. Invite Staging Strategy
We will gradually invite users to limit the blast radius of any unknown bugs.

1. **Phase 1: Friends & Family (10 Users)**
   - Manually invite 10 trusted users.
   - Ask them to create an account, complete their profile, create a post, and join a group.
   - **Monitor:** Watch Sentry logs and Railway API logs continuously for 24 hours.
   - Address any P0/P1 issues immediately.

2. **Phase 2: Alpha Batch (25 Users)**
   - Expand invites to 25 highly engaged community members.
   - Test event RSVPs, group creation, and messaging.
   - **Monitor:** Track frontend performance, image load times, and error rates.

3. **Phase 3: Beta Batch (50 Users)**
   - Invite 50 users.
   - Verify email deliverability (Resend logs) to ensure OTPs aren't hitting spam.
   - Review Supabase Storage metrics.

4. **Phase 4: Milestone (100 Users)**
   - The platform is now considered stable for the initial target.
   - Begin broader, but still controlled, marketing.

## 2. Severity Definitions
Use these definitions to prioritize bugs reported by the initial cohort.

| Severity | Definition | Examples | Response Target |
| :--- | :--- | :--- | :--- |
| **P0** | Critical App Failure | App completely down, database connection failing, users cannot log in, security vulnerability, data loss. | Immediate (Drop everything) |
| **P1** | Core Feature Broken | Cannot create posts, email OTP not sending, feed not loading. | Same day |
| **P2** | Non-Critical Bug | A specific group page fails to load, UI glitch on mobile, non-critical API 500. | Next sprint / 48 hours |
| **P3** | Polish & UX | Button misalignment, slow image loading, minor copy changes. | Backlog |

## 3. Incident Response Process
If a P0 or P1 incident occurs during the rollout:

1. **Acknowledge & Triage**
   - Confirm the issue in Sentry or logs.
   - Reproduce the issue using the production smoke test account.
2. **Mitigate**
   - If the issue is a bad deployment, immediately rollback Vercel or Railway to the previous known good state.
   - If the issue is bad data, follow `BACKUP_AND_RESTORE.md`.
3. **Communicate**
   - If user-facing, update the support page or send an email broadcast acknowledging the issue.
4. **Resolve & Post-Mortem**
   - Deploy the fix.
   - Document the root cause and add a regression test.

## 4. Feedback Collection
- Direct all users to the `/support` page for bug reports.
- Actively solicit feedback via direct messages or a pinned post in the main "Announcements" group.
- Log all reported bugs in a central tracker (e.g., GitHub Issues) tagged with the appropriate Severity.

## 5. Daily Checks During Beta
- [ ] Check Sentry for new unhandled exceptions.
- [ ] Check Railway Postgres for snapshot completion.
- [ ] Review Resend dashboard for bounced OTP emails.
- [ ] Run `pnpm smoke:prod`.

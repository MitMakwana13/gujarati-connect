# Gujarati Global

A diaspora community platform for Gujaratis worldwide — connecting people across cities, cultures, and borders.

## What it does

- City communities and global groups
- Events with RSVP
- Resource listings (jobs, housing, services)
- Direct messaging
- Notifications
- Content moderation and reporting

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Backend API | Fastify 5 |
| Background jobs | Node.js worker service |
| Database | Supabase Postgres |
| Cache / queues | Upstash Redis |
| Media storage | Supabase Storage |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Monorepo tooling | pnpm + Turborepo |

## Repo structure

```
apps/
  web/              Next.js frontend
services/
  api/              Fastify REST API
  worker/           Background job processor
packages/
  types/            Shared TypeScript domain types
  validators/       Shared Zod schemas
scripts/            Dev utilities (seed, smoke test)
supabase/           Database migrations
```

## Local development

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
pnpm migrate

# Start all services
pnpm dev
```

Frontend runs at `http://localhost:3000`  
API runs at `http://localhost:4000`

## Environment variables

See `.env.example` for local development.  
See `.env.production.example` for production deployment.

## Deployment

| Service | Platform | Config |
|---|---|---|
| `apps/web` | Vercel | Root Directory: `apps/web` |
| `services/api` | Railway | `services/api/railway.json` |
| `services/worker` | Railway | `services/worker/railway.json` |

Full deployment instructions: [`DEPLOY.md`](./DEPLOY.md)

## License

Private — all rights reserved.

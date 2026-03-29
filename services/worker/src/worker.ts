/**
 * worker.ts — Worker service entry point
 *
 * Consumes jobs from Redis lists (BullMQ-compatible format).
 * Pull-based consumer with exponential backoff and DLQ routing.
 * Graceful shutdown on SIGTERM/SIGINT: drains in-flight jobs before exit.
 */

import Redis from 'ioredis';
import { Pool } from 'pg';
import pino, { type BaseLogger } from 'pino';

import { feedFanoutHandler } from './handlers/feed-fanout.js';
import { moderationScanHandler } from './handlers/moderation-scan.js';
import { notificationFanoutHandler } from './handlers/notification-fanout.js';
import { searchSyncHandler } from './handlers/search-sync.js';

// ── Logger ────────────────────────────────────────────────────

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(process.env['NODE_ENV'] === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss Z' } } }
    : {}),
});

// ── Config ────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Required env var ${key} is not set`);
  return v;
}

const DATABASE_URL = requireEnv('DATABASE_URL');
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const REDIS_QUEUE_URL = process.env['REDIS_QUEUE_URL'] ?? 'redis://localhost:6380';
const WORKER_CONCURRENCY = parseInt(process.env['WORKER_CONCURRENCY'] ?? '3', 10);

// ── Queue names ───────────────────────────────────────────────

const QUEUES = [
  'queue:feed.fanout',
  'queue:moderation.scan',
  'queue:notification.fanout',
  'queue:search.sync',
] as const;

type QueueName = (typeof QUEUES)[number];

// ── Job handlers registry ─────────────────────────────────────

type JobPayload = Record<string, unknown>;
type JobHandler = (payload: JobPayload, ctx: WorkerContext) => Promise<void>;

export interface WorkerContext {
  db: Pool;
  redis: Redis;
  logger: BaseLogger;
}


const handlers: Record<string, JobHandler> = {
  'feed.fanout': feedFanoutHandler,
  'moderation.scan': moderationScanHandler,
  'notification.fanout': notificationFanoutHandler,
  'search.sync': searchSyncHandler,
};

// ── Infrastructure ────────────────────────────────────────────

const db = new Pool({
  connectionString: DATABASE_URL,
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
});

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

const queueRedis = new Redis(REDIS_QUEUE_URL, {
  maxRetriesPerRequest: null, // Don't limit; blocking commands need unlimited
  enableReadyCheck: true,
});

redis.on('error', (err) => logger.error({ err }, '[worker] Redis error'));
queueRedis.on('error', (err) => logger.error({ err }, '[worker] Queue Redis error'));
db.on('error', (err) => logger.error({ err }, '[worker] DB pool error'));

const ctx: WorkerContext = { db, redis, logger };

// ── DLQ Router ────────────────────────────────────────────────

async function sendToDlq(queue: string, jobData: unknown, err: Error): Promise<void> {
  const dlqKey = `dlq:${queue}`;
  await redis.lpush(dlqKey, JSON.stringify({
    original: jobData,
    error: err.message,
    stack: err.stack,
    failedAt: new Date().toISOString(),
  }));
  // DLQ items expire after 7 days
  await redis.expire(dlqKey, 7 * 24 * 60 * 60);
}

// ── Job processor ─────────────────────────────────────────────

async function processJob(queue: string, rawJob: string): Promise<void> {
  let jobData: { id?: string; type?: string; payload?: JobPayload; attempts?: number };
  try {
    jobData = JSON.parse(rawJob) as typeof jobData;
  } catch {
    logger.error({ rawJob, queue }, '[worker] Malformed job JSON — discarding');
    return;
  }

  const { id = 'unknown', type, payload = {}, attempts = 0 } = jobData;
  const log = logger.child({ jobId: id, jobType: type, queue });

  if (!type || !handlers[type]) {
    log.warn('[worker] No handler for job type — discarding');
    return;
  }

  try {
    log.info('[worker] Processing job');
    await handlers[type]!(payload, ctx);
    log.info('[worker] Job completed');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.error({ err: error, attempts }, '[worker] Job failed');

    const maxAttempts = 3;
    if (attempts < maxAttempts) {
      // Re-queue with backoff
      const backoffMs = Math.pow(2, attempts) * 1000;
      setTimeout(() => {
        void redis.lpush(`queue:${type}`, JSON.stringify({ ...jobData, attempts: attempts + 1 }));
      }, backoffMs);
      log.info({ backoffMs, nextAttempt: attempts + 1 }, '[worker] Job re-queued with backoff');
    } else {
      log.error('[worker] Job exhausted retries — sending to DLQ');
      await sendToDlq(queue, jobData, error);
    }
  }
}

// ── Consumer loop ─────────────────────────────────────────────

let running = true;
const inFlight = new Set<Promise<void>>();

async function consume(): Promise<void> {
  logger.info({ queues: QUEUES, concurrency: WORKER_CONCURRENCY }, '[worker] Consumer started');

  while (running) {
    // Respect concurrency ceiling
    if (inFlight.size >= WORKER_CONCURRENCY) {
      await Promise.race(inFlight);
      continue;
    }

    try {
      // BRPOP blocks until a job is available (timeout: 2s poll cycle)
      const result = await queueRedis.brpop(...QUEUES, 2);
      if (!result) continue;

      const [queueName, rawJob] = result;
      const job = processJob(queueName, rawJob);
      const tracked = job.finally(() => { inFlight.delete(tracked!); });
      inFlight.add(tracked);
    } catch (err) {
      if (!running) break;
      logger.error({ err }, '[worker] BRPOP error, retrying in 1s');
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Drain in-flight jobs before exit
  logger.info({ count: inFlight.size }, '[worker] Draining in-flight jobs...');
  await Promise.allSettled(inFlight);
  logger.info('[worker] All jobs drained');
}

// ── Graceful shutdown ─────────────────────────────────────────

const shutdown = async (signal: string) => {
  logger.info({ signal }, '[worker] Shutdown signal received');
  running = false;
  await db.end();
  await redis.quit();
  await queueRedis.quit();
  logger.info('[worker] Clean shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('unhandledRejection', (err) => {
  logger.error({ err }, '[worker] Unhandled rejection');
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────

void consume();

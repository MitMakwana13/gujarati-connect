/**
 * plugins/redis.ts — Redis client plugin
 *
 * Registers `fastify.redis` as a shared ioredis client for hot cache.
 * Used for feed sorted sets, rate limit counters, OTP storage, session data.
 */

import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export const redisPlugin = fp(
  async (app: FastifyInstance) => {
    const redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Use lazyConnect to prevent "already connecting" errors
      retryStrategy: (times: number) => {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err: Error) => {
      app.log.error({ err }, '[redis] Connection error');
    });

    redis.on('connect', () => {
      app.log.info('[redis] Connected to Redis');
    });

    redis.on('reconnecting', () => {
      app.log.warn('[redis] Reconnecting to Redis...');
    });

    // Explicitly connect and verify connectivity
    try {
      await redis.connect();
      await redis.ping();
      app.log.info('[redis] Redis connection healthy');
    } catch (err) {
      app.log.error({ err }, '[redis] Initial connection failed');
    }

    app.decorate('redis', redis);

    app.addHook('onClose', async () => {
      await redis.quit();
      app.log.info('[redis] Redis connection closed');
    });
  },
  { name: 'redis', dependencies: ['db'] },
);

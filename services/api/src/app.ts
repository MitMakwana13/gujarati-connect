/**
 * app.ts — Fastify application factory
 *
 * Creates and configures the Fastify instance with all plugins and routes.
 * Separating factory from server.ts makes testing easy (no port binding).
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCsrfProtection from '@fastify/csrf-protection';

import { config } from './config/index.js';
import { dbPlugin } from './plugins/db.js';
import { redisPlugin } from './plugins/redis.js';
import { authPlugin } from './plugins/auth.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { requestContextPlugin } from './plugins/request-context.js';

// Route modules
import authRoutes from './routes/auth/index.js';
import userRoutes from './routes/users/index.js';
import communityRoutes from './routes/communities/index.js';
import groupRoutes from './routes/groups/index.js';
import postRoutes from './routes/posts/index.js';
import commentRoutes from './routes/comments/index.js';
import eventRoutes from './routes/events/index.js';
import resourceRoutes from './routes/resources/index.js';
import messageRoutes from './routes/messages/index.js';
import notificationRoutes from './routes/notifications/index.js';
import searchRoutes from './routes/search/index.js';
import mediaRoutes from './routes/media/index.js';
import reportRoutes from './routes/reports/index.js';
import adminRoutes from './routes/admin/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.env === 'test' ? 'silent' : 'info',
      ...(config.env === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            },
          }
        : {}),
    },
    // Generate request IDs for correlation
    genReqId: () => crypto.randomUUID(),
    // Trust proxy headers from Azure Front Door
    trustProxy: config.env === 'production',
  });

  // ── Security ──────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: config.env === 'production',
  });

  await app.register(cors, {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // ── Rate limiting ─────────────────────────────────────────
  await app.register(rateLimit, {
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.windowMs,
    // Redis backend for distributed rate limiting
    redis: undefined, // Will be injected after redis plugin registers — see plugin order below
    keyGenerator: (req) => {
      // Authenticated users identified by user ID, unauthenticated by IP
      const userId = (req as { userId?: string }).userId;
      return userId ?? (req.ip || 'anonymous');
    },
    errorResponseBuilder: () => ({
      errors: [
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      ],
    }),
  });

  // ── OpenAPI / Swagger ─────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Gujarati Global API',
        description: 'Production API for the Gujarati Global diaspora community platform',
        version: '1.0.0',
      },
      servers: [
        { url: '/api/v1', description: 'Current environment' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication and token management' },
        { name: 'users', description: 'User profiles and discovery' },
        { name: 'communities', description: 'City-level communities' },
        { name: 'groups', description: 'Interest groups within communities' },
        { name: 'posts', description: 'Content posts and reactions' },
        { name: 'comments', description: 'Post comments and replies' },
        { name: 'events', description: 'Events and RSVPs' },
        { name: 'resources', description: 'Resource board listings' },
        { name: 'messages', description: 'Messaging and message requests' },
        { name: 'notifications', description: 'Notification management' },
        { name: 'search', description: 'Full-text search' },
        { name: 'media', description: 'Media upload' },
        { name: 'reports', description: 'Content and user reporting' },
        { name: 'admin', description: 'Admin and moderation (restricted)' },
      ],
    },
  });

  if (config.env !== 'production') {
    await app.register(swaggerUi, {
      routePrefix: '/docs',
    });
  }

  // ── Infrastructure plugins ────────────────────────────────
  await app.register(requestContextPlugin);
  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(errorHandlerPlugin);

  // ── WebSockets & CSRF ────────────────────────────────────
  await app.register(fastifyWebsocket, {
    options: { maxPayload: 1048576 } // 1MB
  });
  
  await app.register(fastifyCsrfProtection, {
    cookieOpts: { signed: true, httpOnly: true, secure: config.env === 'production' }
  });

  // ── Health check ──────────────────────────────────────────
  app.get('/health', {
    schema: { hide: true },
  }, async (_req, reply) => {
    try {
      await app.db.query('SELECT 1');
      await app.redis.ping();
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    } catch (err) {
      app.log.error({ err }, 'Health check failed');
      return reply.status(503).send({
        status: 'degraded',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ── API Routes ────────────────────────────────────────────
  const API_PREFIX = '/api/v1';

  await app.register(authRoutes,         { prefix: `${API_PREFIX}/auth` });
  await app.register(userRoutes,         { prefix: `${API_PREFIX}/users` });
  await app.register(communityRoutes,    { prefix: `${API_PREFIX}/communities` });
  await app.register(groupRoutes,        { prefix: `${API_PREFIX}/groups` });
  await app.register(postRoutes,         { prefix: `${API_PREFIX}/posts` });
  await app.register(commentRoutes,      { prefix: `${API_PREFIX}/comments` });
  await app.register(eventRoutes,        { prefix: `${API_PREFIX}/events` });
  await app.register(resourceRoutes,     { prefix: `${API_PREFIX}/resources` });
  await app.register(messageRoutes,      { prefix: `${API_PREFIX}/messages` });
  await app.register(notificationRoutes, { prefix: `${API_PREFIX}/notifications` });
  await app.register(searchRoutes,       { prefix: `${API_PREFIX}/search` });
  await app.register(mediaRoutes,        { prefix: `${API_PREFIX}/media` });
  await app.register(reportRoutes,       { prefix: `${API_PREFIX}/reports` });
  await app.register(adminRoutes,        { prefix: `${API_PREFIX}/admin` });

  // ── 404 handler ───────────────────────────────────────────
  app.setNotFoundHandler((_req, reply) => {
    void reply.status(404).send({
      errors: [{ code: 'NOT_FOUND', message: 'The requested resource was not found' }],
    });
  });

  return app;
}

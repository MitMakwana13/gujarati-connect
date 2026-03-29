/**
 * plugins/request-context.ts — Request context plugin
 *
 * Attaches correlation/request ID to every request for tracing.
 * Patches the logger to include requestId and userId on every log line.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    /** Set by auth plugin when authenticated */
    userId?: string;
    /** Set by auth plugin when authenticated */
    userRole?: string;
  }
}

export const requestContextPlugin = fp(
  async (app: FastifyInstance) => {
    app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
      // Use the Fastify-generated request ID (configured in buildApp)
      req.requestId = req.id.toString();

      // Propagate request ID to response headers for client-side correlation
      void reply.header('X-Request-ID', req.requestId);
    });

    // Patch logger to always include requestId and userId
    app.addHook('preHandler', async (req: FastifyRequest) => {
      req.log = req.log.child({
        requestId: req.requestId,
        ...(req.userId ? { userId: req.userId } : {}),
      });
    });
  },
  { name: 'request-context' },
);

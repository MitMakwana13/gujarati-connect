/**
 * plugins/error-handler.ts — Global error handler plugin
 *
 * Produces consistent error response shapes for all error types.
 * Never leaks internal error details to clients in production.
 *
 * Response shape: { errors: [{ code, message, details? }] }
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

// Application-level error for known domain errors
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('UNPROCESSABLE', message, 422, details);
  }
}

export const errorHandlerPlugin = fp(
  async (app: FastifyInstance) => {
    app.setErrorHandler((error, req, reply) => {
      // Log with full details internally
      req.log.error(
        {
          err: {
            name: error.name,
            message: error.message,
            code: (error as FastifyError).code,
            statusCode: error.statusCode,
            // Only include stack in dev
            ...(config.env !== 'production' ? { stack: error.stack } : {}),
          },
        },
        'Request error',
      );

      // ── ZodError (validation failures) ───────────────────
      if (error instanceof ZodError) {
        return reply.status(400).send({
          errors: error.issues.map((issue) => ({
            code: 'VALIDATION_ERROR',
            message: issue.message,
            details: {
              path: issue.path.join('.'),
              received: (issue as { received?: unknown }).received,
            },
          })),
        });
      }

      // ── AppError (known domain errors) ───────────────────
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          errors: [
            {
              code: error.code,
              message: error.message,
              ...(error.details ? { details: error.details } : {}),
            },
          ],
        });
      }

      // ── Fastify built-in errors (400, 404, etc.) ─────────
      if (error.statusCode && error.statusCode < 500) {
        return reply.status(error.statusCode).send({
          errors: [
            {
              code: 'REQUEST_ERROR',
              message: error.message,
            },
          ],
        });
      }

      // ── Postgres unique violation ─────────────────────────
      if ((error as { code?: string }).code === '23505') {
        return reply.status(409).send({
          errors: [{ code: 'CONFLICT', message: 'A record with this value already exists' }],
        });
      }

      // ── Postgres foreign key violation ────────────────────
      if ((error as { code?: string }).code === '23503') {
        return reply.status(422).send({
          errors: [{ code: 'INVALID_REFERENCE', message: 'Referenced resource does not exist' }],
        });
      }

      // ── Rate limit errors from @fastify/rate-limit ────────
      if (error.statusCode === 429) {
        return reply.status(429).send({
          errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' }],
        });
      }

      // ── Unknown server errors ─────────────────────────────
      return reply.status(500).send({
        errors: [
          {
            code: 'INTERNAL_ERROR',
            message: config.env === 'production'
              ? 'An unexpected error occurred'
              : error.message,
          },
        ],
      });
    });
  },
  { name: 'error-handler' },
);

/**
 * plugins/auth.ts — JWT authentication plugin
 *
 * Provides:
 * - fastify.authenticate — onRequest hook for protected routes
 * - fastify.authorizeRoles — role-based access check hook
 * - fastify.generateTokens — issues access + refresh token pair
 *
 * Auth flow:
 *   POST /auth/login → returns { accessToken, refreshToken }
 *   Subsequent requests → Authorization: Bearer <accessToken>
 *   POST /auth/refresh → exchanges refreshToken for new token pair
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config/index.js';
import type { UserRole, UserRoleLiteral } from '@gujarati-global/types';


// ── Types ────────────────────────────────────────────────────

interface JwtAccessPayload extends JWTPayload {
  sub: string;       // userId
  email: string;
  role: UserRoleLiteral;
  type: 'access';
}


interface JwtRefreshPayload extends JWTPayload {
  sub: string;       // userId
  type: 'refresh';
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizeRoles: (...roles: UserRoleLiteral[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateTokens: (userId: string, email: string, role: UserRoleLiteral) => Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>;
    verifyRefreshToken: (token: string) => Promise<JwtRefreshPayload>;
  }
}

// ── Helpers ──────────────────────────────────────────────────

const accessSecret = new TextEncoder().encode(config.jwt.accessSecret);
const refreshSecret = new TextEncoder().encode(config.jwt.refreshSecret);

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * (multipliers[unit] ?? 60);
}

// ── Plugin ───────────────────────────────────────────────────

export const authPlugin = fp(
  async (app: FastifyInstance) => {
    const accessExpirySeconds = parseExpiry(config.jwt.accessExpiry);
    const refreshExpirySeconds = parseExpiry(config.jwt.refreshExpiry);

    // ── generateTokens ─────────────────────────────────────

    app.decorate(
      'generateTokens',
      async (userId: string, email: string, role: UserRoleLiteral) => {
        const now = Math.floor(Date.now() / 1000);

        const accessToken = await new SignJWT({
          email,
          role,
          type: 'access',
        } satisfies Omit<JwtAccessPayload, 'sub' | 'iat' | 'exp'>)
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(userId)
          .setIssuedAt(now)
          .setExpirationTime(now + accessExpirySeconds)
          .sign(accessSecret);

        const refreshToken = await new SignJWT({ type: 'refresh' } satisfies Omit<JwtRefreshPayload, 'sub' | 'iat' | 'exp'>)
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(userId)
          .setIssuedAt(now)
          .setExpirationTime(now + refreshExpirySeconds)
          .sign(refreshSecret);

        return { accessToken, refreshToken, expiresIn: accessExpirySeconds };
      },
    );

    // ── verifyRefreshToken ──────────────────────────────────

    app.decorate('verifyRefreshToken', async (token: string) => {
      const { payload } = await jwtVerify<JwtRefreshPayload>(token, refreshSecret, {
        algorithms: ['HS256'],
      });
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    });

    // ── authenticate hook ───────────────────────────────────

    app.decorate(
      'authenticate',
      async (req: FastifyRequest, reply: FastifyReply) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }],
          });
        }

        const token = authHeader.slice(7);
        try {
          const { payload } = await jwtVerify<JwtAccessPayload>(token, accessSecret, {
            algorithms: ['HS256'],
          });

          if (payload.type !== 'access') {
            return reply.status(401).send({
              errors: [{ code: 'UNAUTHORIZED', message: 'Invalid token type' }],
            });
          }

          // Check user is still active (block suspended/banned users immediately)
          const result = await app.db.query<{ status: string; role: string }>(
            'SELECT status, role FROM users WHERE id = $1',
            [payload.sub],
          );

          const user = result.rows[0];
          if (!user || user.status !== 'active') {
            return reply.status(403).send({
              errors: [{ code: 'FORBIDDEN', message: 'Account is not active' }],
            });
          }

          // Attach to request context
          req.userId = payload.sub;
          req.userRole = user.role;

          // Re-patch logger to include userId
          req.log = req.log.child({ userId: req.userId });
        } catch (_err) {
          return reply.status(401).send({
            errors: [{ code: 'UNAUTHORIZED', message: 'Invalid or expired token' }],
          });
        }
      },
    );

    // ── authorizeRoles hook ─────────────────────────────────

    app.decorate(
      'authorizeRoles',
      (...allowedRoles: UserRoleLiteral[]) =>

        async (req: FastifyRequest, reply: FastifyReply) => {
          // Must be called after authenticate
          if (!req.userId || !req.userRole) {
            return reply.status(401).send({
              errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }],
            });
          }

          if (!allowedRoles.includes(req.userRole as UserRoleLiteral)) {
            return reply.status(403).send({
              errors: [{ code: 'FORBIDDEN', message: 'Insufficient permissions for this action' }],
            });
          }
        },
    );
  },
  { name: 'auth', dependencies: ['db', 'redis'] },
);

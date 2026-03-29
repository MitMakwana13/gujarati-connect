/**
 * routes/auth/index.ts — Authentication routes
 *
 * POST /api/v1/auth/register   → register with email + password
 * POST /api/v1/auth/login      → login, returns token pair
 * POST /api/v1/auth/verify-otp → verify email OTP
 * POST /api/v1/auth/refresh    → refresh access token
 * POST /api/v1/auth/logout     → invalidate refresh token
 */

import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { totp } from 'otplib';
import {
  registerSchema,
  loginSchema,
  otpVerifySchema,
  refreshTokenSchema,
} from '@gujarati-global/validators';
import { config } from '../../config/index.js';
import { AppError, ConflictError, NotFoundError } from '../../plugins/error-handler.js';
import { auditLog } from '../../utils/audit.js';
import type { UserRole } from '@gujarati-global/types';

const OTP_PREFIX = 'otp:';

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /csrf ─────────────────────────────────────────────
  app.get(
    '/csrf',
    { schema: { tags: ['auth'], summary: 'Get CSRF Token' } },
    async (req, reply) => {
      const token = await reply.generateCsrf();
      return reply.send({ data: { csrfToken: token } });
    }
  );

  // ── POST /register ────────────────────────────────────────
  app.post(
    '/register',
    {
      config: { rateLimit: { max: config.rateLimit.auth.max, timeWindow: config.rateLimit.auth.windowMs } },
      schema: {
        tags: ['auth'],
        summary: 'Register with email and password',
        body: {
          type: 'object',
          required: ['email', 'password', 'displayName'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            displayName: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const body = registerSchema.parse(req.body);

      // Check email uniqueness
      const existing = await app.db.query<{ id: string }>(
        'SELECT id FROM users WHERE email = $1',
        [body.email],
      );
      if (existing.rows.length > 0) {
        throw new ConflictError('An account with this email already exists');
      }

      const passwordHash = await bcrypt.hash(body.password, config.bcryptRounds);

      const result = await app.db.query<{ id: string; role: string }>(
        `INSERT INTO users (email, password_hash, auth_provider, role, status, email_verified)
         VALUES ($1, $2, 'email', 'user', 'active', false)
         RETURNING id, role`,
        [body.email, passwordHash],
      );

      const user = result.rows[0];
      if (!user) throw new AppError('INTERNAL_ERROR', 'Failed to create user', 500);

      // Update display_name (profile auto-created by trigger)
      await app.db.query(
        'UPDATE profiles SET display_name = $1 WHERE user_id = $2',
        [body.displayName, user.id],
      );

      // Generate and store OTP for email verification
      const otp = await generateAndStoreOtp(app, body.email);

      // In dev, log OTP to console. In prod, send email.
      if (config.env !== 'production') {
        app.log.info({ email: body.email, otp }, '[auth] Dev OTP for email verification');
      }
      // TODO(infra): Integrate email service (SendGrid / Azure Communication Services)
      // Tracking: GG-EMAIL-001. Required before production launch.

      await auditLog(app, {
        actorId: user.id,
        actorRole: user.role as UserRole,
        action: 'user.register',
        targetType: 'user',
        targetId: user.id,
        req,
      });

      return reply.status(201).send({
        data: {
          message: 'Account created. Please verify your email.',
          email: body.email,
        },
      });
    },
  );

  // ── POST /verify-otp ──────────────────────────────────────
  app.post(
    '/verify-otp',
    {
      config: { rateLimit: { max: config.rateLimit.auth.max, timeWindow: config.rateLimit.auth.windowMs } },
      schema: { tags: ['auth'], summary: 'Verify email with OTP' },
    },
    async (req, reply) => {
      const { email, otp } = otpVerifySchema.parse(req.body);

      const storedOtp = await app.redis.get(`${OTP_PREFIX}${email}`);
      if (!storedOtp || storedOtp !== otp) {
        throw new AppError('INVALID_OTP', 'Invalid or expired OTP', 400);
      }

      const result = await app.db.query<{ id: string; role: string; status: string }>(
        `UPDATE users SET email_verified = true, updated_at = NOW()
         WHERE email = $1
         RETURNING id, role, status`,
        [email],
      );

      const user = result.rows[0];
      if (!user) throw new NotFoundError('User');

      if (user.status !== 'active') {
        throw new AppError('ACCOUNT_INACTIVE', 'Account is not active', 403);
      }

      // Delete OTP after successful verification
      await app.redis.del(`${OTP_PREFIX}${email}`);

      const tokens = await app.generateTokens(user.id, email, user.role as UserRole);

      // Update last_login_at
      await app.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const profile = await getPublicProfile(app, user.id);

      return reply.send({
        data: { user: profile, tokens },
      });
    },
  );

  // ── POST /login ───────────────────────────────────────────
  app.post(
    '/login',
    {
      config: { rateLimit: { max: config.rateLimit.auth.max, timeWindow: config.rateLimit.auth.windowMs } },
      schema: { tags: ['auth'], summary: 'Login with email and password' },
    },
    async (req, reply) => {
      const { email, password } = loginSchema.parse(req.body);

      const result = await app.db.query<{
        id: string;
        role: string;
        status: string;
        password_hash: string | null;
        email_verified: boolean;
      }>(
        'SELECT id, role, status, password_hash, email_verified FROM users WHERE email = $1',
        [email],
      );

      const user = result.rows[0];

      // Constant-time comparison to prevent timing attacks
      const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.placeholder.valid';
      const hashToCheck = user?.password_hash ?? dummyHash;
      const passwordValid = await bcrypt.compare(password, hashToCheck);

      if (!user || !passwordValid) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      if (user.status !== 'active') {
        throw new AppError('ACCOUNT_INACTIVE', `Account status: ${user.status}`, 403);
      }

      if (!user.email_verified) {
        // Resend OTP
        const otp = await generateAndStoreOtp(app, email);
        if (config.env !== 'production') {
          app.log.info({ email, otp }, '[auth] Dev OTP resent (email unverified)');
        }
        throw new AppError('EMAIL_UNVERIFIED', 'Please verify your email before logging in', 403);
      }

      const tokens = await app.generateTokens(user.id, email, user.role as UserRole);
      await app.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const profile = await getPublicProfile(app, user.id);

      await auditLog(app, {
        actorId: user.id,
        actorRole: user.role as UserRole,
        action: 'user.login',
        targetType: 'user',
        targetId: user.id,
        req,
      });

      return reply.send({
        data: { user: profile, tokens },
      });
    },
  );

  // ── POST /refresh ─────────────────────────────────────────
  app.post(
    '/refresh',
    {
      onRequest: [app.csrfProtection],
      schema: { tags: ['auth'], summary: 'Refresh access token' },
    },
    async (req, reply) => {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      let payload;
      try {
        payload = await app.verifyRefreshToken(refreshToken);
      } catch {
        throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
      }

      const result = await app.db.query<{ email: string; role: string; status: string }>(
        'SELECT email, role, status FROM users WHERE id = $1',
        [payload.sub],
      );

      const user = result.rows[0];
      if (!user || user.status !== 'active') {
        throw new AppError('ACCOUNT_INACTIVE', 'Account is not active', 403);
      }

      const tokens = await app.generateTokens(payload.sub!, user.email, user.role as UserRole);

      return reply.send({ data: { tokens } });
    },
  );

  // ── POST /logout ──────────────────────────────────────────
  app.post(
    '/logout',
    {
      onRequest: [app.authenticate, app.csrfProtection],
      schema: { tags: ['auth'], summary: 'Logout and invalidate session' },
    },
    async (req, reply) => {
      // TODO(auth): Implement refresh token blocklist in Redis for logout.
      // Tracking: GG-AUTH-002. Requires storing jti on refresh tokens + blocklist check on refresh.
      // Current: tokens expire naturally. Acceptable for Phase 1.

      req.log.info({ userId: req.userId }, '[auth] User logged out');
      return reply.send({ data: { message: 'Logged out successfully' } });
    },
  );
}

// ── Helpers ──────────────────────────────────────────────────

async function generateAndStoreOtp(app: FastifyInstance, email: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await app.redis.setex(`${OTP_PREFIX}${email}`, config.otp.expirySeconds, otp);
  return otp;
}

async function getPublicProfile(app: FastifyInstance, userId: string): Promise<Record<string, unknown>> {
  const result = await app.db.query<Record<string, unknown>>(
    `SELECT u.id, u.email, u.role, u.status, u.email_verified, u.created_at,
            p.display_name, p.bio, p.avatar_url, p.current_city, p.current_country,
            p.user_type, p.interests, p.languages, p.is_discoverable
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  return result.rows[0] ?? {};
}

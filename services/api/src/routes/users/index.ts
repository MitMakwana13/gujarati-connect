/**
 * routes/users/index.ts — User profile and discovery routes
 */

import type { FastifyInstance } from 'fastify';
import {
  updateProfileSchema,
  updatePrivacySchema,
  discoverUsersQuerySchema,
  paginationQuerySchema,
} from '@gujarati-global/validators';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.js';

export default async function userRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /users/me ─────────────────────────────────────────
  app.get(
    '/me',
    { onRequest: [app.authenticate], schema: { tags: ['users'], summary: 'Get current user profile' } },
    async (req, reply) => {
      const result = await app.db.query<Record<string, unknown>>(
        `SELECT u.id, u.email, u.email_verified, u.role, u.status, u.last_login_at, u.created_at,
                p.display_name, p.full_name, p.bio, p.avatar_url, p.cover_photo_url,
                p.current_city, p.current_country, p.home_city_india, p.home_state_india,
                p.user_type, p.university, p.company, p.graduation_year, p.profession,
                p.interests, p.languages, p.is_discoverable, p.discovery_radius_km, p.show_online_status,
                ps.show_email, ps.show_full_name, ps.profile_visibility, ps.allow_message_requests
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN privacy_settings ps ON ps.user_id = u.id
         WHERE u.id = $1`,
        [req.userId],
      );

      if (!result.rows[0]) throw new NotFoundError('User');
      return reply.send({ data: result.rows[0] });
    },
  );

  // ── PATCH /users/me/profile ───────────────────────────────
  app.patch(
    '/me/profile',
    { onRequest: [app.authenticate], schema: { tags: ['users'], summary: 'Update current user profile' } },
    async (req, reply) => {
      const body = updateProfileSchema.parse(req.body);

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      const fieldMap: Record<string, string> = {
        displayName: 'display_name',
        fullName: 'full_name',
        bio: 'bio',
        avatarUrl: 'avatar_url',
        coverPhotoUrl: 'cover_photo_url',
        currentCity: 'current_city',
        currentCountry: 'current_country',
        homeCityIndia: 'home_city_india',
        homeStateIndia: 'home_state_india',
        userType: 'user_type',
        university: 'university',
        company: 'company',
        graduationYear: 'graduation_year',
        profession: 'profession',
        interests: 'interests',
        languages: 'languages',
        isDiscoverable: 'is_discoverable',
        discoveryRadiusKm: 'discovery_radius_km',
        showOnlineStatus: 'show_online_status',
      };

      for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
        const value = (body as Record<string, unknown>)[jsKey];
        if (value !== undefined) {
          setClauses.push(`${dbCol} = $${idx++}`);
          values.push(value);
        }
      }

      if (setClauses.length === 0) {
        return reply.send({ data: { message: 'No fields to update' } });
      }

      values.push(req.userId);
      await app.db.query(
        `UPDATE profiles SET ${setClauses.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
        values,
      );

      return reply.send({ data: { message: 'Profile updated' } });
    },
  );

  // ── PATCH /users/me/privacy ───────────────────────────────
  app.patch(
    '/me/privacy',
    { onRequest: [app.authenticate], schema: { tags: ['users'], summary: 'Update privacy settings' } },
    async (req, reply) => {
      const body = updatePrivacySchema.parse(req.body);

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      const privacyMap: Record<string, string> = {
        showEmail: 'show_email',
        showFullName: 'show_full_name',
        showUniversity: 'show_university',
        showCompany: 'show_company',
        allowMessageRequests: 'allow_message_requests',
        showInNearby: 'show_in_nearby',
        profileVisibility: 'profile_visibility',
      };

      for (const [jsKey, dbCol] of Object.entries(privacyMap)) {
        const value = (body as Record<string, unknown>)[jsKey];
        if (value !== undefined) {
          setClauses.push(`${dbCol} = $${idx++}`);
          values.push(value);
        }
      }

      if (setClauses.length > 0) {
        values.push(req.userId);
        await app.db.query(
          `UPDATE privacy_settings SET ${setClauses.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
          values,
        );
      }

      return reply.send({ data: { message: 'Privacy settings updated' } });
    },
  );

  // ── GET /users/:id ─────────────────────────────────────────
  app.get(
    '/:id',
    { onRequest: [app.authenticate], schema: { tags: ['users'], summary: 'Get user public profile' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      // Check block status in both directions
      const blockCheck = await app.db.query<{ id: string }>(
        `SELECT id FROM user_blocks
         WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
        [req.userId, id],
      );
      if (blockCheck.rows.length > 0) {
        throw new NotFoundError('User');
      }

      const result = await app.db.query<Record<string, unknown>>(
        `SELECT u.id, u.role, u.created_at,
                p.display_name,
                CASE WHEN ps.show_full_name THEN p.full_name ELSE NULL END AS full_name,
                p.bio, p.avatar_url, p.cover_photo_url,
                p.current_city, p.current_country,
                p.user_type,
                CASE WHEN ps.show_university THEN p.university ELSE NULL END AS university,
                CASE WHEN ps.show_company THEN p.company ELSE NULL END AS company,
                p.interests, p.languages,
                ps.allow_message_requests, ps.profile_visibility
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN privacy_settings ps ON ps.user_id = u.id
         WHERE u.id = $1 AND u.status = 'active'`,
        [id],
      );

      if (!result.rows[0]) throw new NotFoundError('User');

      const profile = result.rows[0];

      // Enforce profile visibility
      if (profile['profile_visibility'] === 'connections_only') {
        // TODO(discovery): Check if requester is a connection. GG-DISC-001
        throw new ForbiddenError('This profile is private');
      }

      return reply.send({ data: profile });
    },
  );

  // ── GET /users/discover ────────────────────────────────────
  app.get(
    '/discover',
    { onRequest: [app.authenticate], schema: { tags: ['users'], summary: 'Discover community members' } },
    async (req, reply) => {
      const query = discoverUsersQuerySchema.parse(req.query);

      const conditions = [
        `u.status = 'active'`,
        `p.is_discoverable = true`,
        `ps.profile_visibility != 'connections_only'`,
        `u.id != $1`,
      ];
      const values: unknown[] = [req.userId];
      let idx = 2;

      if (query.cityId) {
        conditions.push(`p.current_city = (SELECT name FROM cities WHERE id = $${idx++})`);
        values.push(query.cityId);
      }

      if (query.userType) {
        conditions.push(`p.user_type = $${idx++}`);
        values.push(query.userType);
      }

      if (query.cursor) {
        conditions.push(`u.created_at < $${idx++}`);
        values.push(query.cursor);
      }

      values.push(query.limit + 1);
      const rows = await app.db.query<Record<string, unknown>>(
        `SELECT u.id, u.created_at,
                p.display_name, p.bio, p.avatar_url,
                p.current_city, p.current_country, p.user_type,
                p.interests, p.languages
         FROM users u
         JOIN profiles p ON p.user_id = u.id
         JOIN privacy_settings ps ON ps.user_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY u.created_at DESC
         LIMIT $${idx}`,
        values,
      );

      const items = rows.rows.slice(0, query.limit);
      const hasMore = rows.rows.length > query.limit;
      const nextCursor = hasMore
        ? (items[items.length - 1]?.['created_at'] as string) ?? null
        : null;

      return reply.send({
        data: items,
        meta: { nextCursor, hasMore },
      });
    },
  );
}

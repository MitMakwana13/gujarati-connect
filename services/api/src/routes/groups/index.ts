/**
 * routes/groups/index.ts — Group management routes
 */

import type { FastifyInstance } from 'fastify';
import {
  createGroupSchema,
  updateGroupSchema,
  groupListQuerySchema,
  paginationQuerySchema,
} from '@gujarati-global/validators';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';

export default async function groupRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /groups ───────────────────────────────────────────
  app.get(
    '/',
    { schema: { tags: ['groups'], summary: 'List groups' } },
    async (req, reply) => {
      const query = groupListQuerySchema.parse(req.query);
      const conditions = [`g.status = 'active'`, `g.visibility != 'hidden'`];
      const values: unknown[] = [];
      let idx = 1;

      if (query.communityId) {
        conditions.push(`g.community_id = $${idx++}`);
        values.push(query.communityId);
      }
      if (query.tag) {
        conditions.push(`$${idx++} = ANY(g.tags)`);
        values.push(query.tag);
      }
      if (query.cursor) {
        conditions.push(`g.created_at < $${idx++}`);
        values.push(query.cursor);
      }

      values.push(query.limit + 1);
      const rows = await app.db.query<Record<string, unknown>>(
        `SELECT g.id, g.name, g.slug, g.description, g.cover_image_url, g.visibility,
                g.join_policy, g.member_count, g.tags, g.created_at,
                p.display_name AS creator_name
         FROM groups g
         JOIN users u ON u.id = g.created_by
         JOIN profiles p ON p.user_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY g.member_count DESC, g.created_at DESC
         LIMIT $${idx}`,
        values,
      );

      const items = rows.rows.slice(0, query.limit);
      return reply.send({
        data: items,
        meta: { nextCursor: rows.rows.length > query.limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > query.limit },
      });
    },
  );

  // ── GET /groups/:slug ─────────────────────────────────────
  app.get(
    '/:slug',
    { schema: { tags: ['groups'], summary: 'Get group by slug' } },
    async (req, reply) => {
      const { slug } = req.params as { slug: string };
      const userId = req.userId;

      const groupResult = await app.db.query<Record<string, unknown>>(
        `SELECT g.*, p.display_name AS creator_name
         FROM groups g JOIN profiles p ON p.user_id = g.created_by
         WHERE g.slug = $1 AND g.status = 'active'`,
        [slug],
      );
      if (!groupResult.rows[0]) throw new NotFoundError('Group');

      const group = groupResult.rows[0];

      if (group['visibility'] === 'hidden' && !userId) {
        throw new NotFoundError('Group');
      }

      let myMembership = null;
      if (userId) {
        const memberResult = await app.db.query<Record<string, unknown>>(
          'SELECT role, status, joined_at FROM group_memberships WHERE group_id = $1 AND user_id = $2',
          [group['id'], userId],
        );
        myMembership = memberResult.rows[0] ?? null;
      }

      return reply.send({ data: { ...group, myMembership } });
    },
  );

  // ── POST /groups ──────────────────────────────────────────
  app.post(
    '/',
    { onRequest: [app.authenticate], schema: { tags: ['groups'], summary: 'Create a group' } },
    async (req, reply) => {
      const body = createGroupSchema.parse(req.body);

      // Auto-generate slug if not provided
      const slug = body.slug ?? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

      const result = await app.db.query<{ id: string }>(
        `INSERT INTO groups (community_id, name, slug, description, visibility, join_policy, max_members, tags, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          body.communityId ?? null,
          body.name,
          slug,
          body.description ?? null,
          body.visibility,
          body.joinPolicy,
          body.maxMembers ?? null,
          body.tags ?? [],
          req.userId,
        ],
      );

      const groupId = result.rows[0]?.id;
      if (!groupId) throw new AppError('INTERNAL_ERROR', 'Failed to create group', 500);

      // Auto-join creator as owner
      await app.db.query(
        `INSERT INTO group_memberships (group_id, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')`,
        [groupId, req.userId],
      );

      return reply.status(201).send({ data: { id: groupId, slug } });
    },
  );

  // ── PATCH /groups/:id ─────────────────────────────────────
  app.patch(
    '/:id',
    { onRequest: [app.authenticate], schema: { tags: ['groups'], summary: 'Update a group' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = updateGroupSchema.parse(req.body);

      // Check caller is admin or owner
      const membership = await app.db.query<{ role: string }>(
        `SELECT role FROM group_memberships WHERE group_id = $1 AND user_id = $2 AND status = 'active'`,
        [id, req.userId],
      );
      const role = membership.rows[0]?.role;
      if (!role || !['admin', 'owner'].includes(role)) {
        throw new ForbiddenError('Only group admins can update group settings');
      }

      const fieldMap: Record<string, string> = {
        name: 'name',
        description: 'description',
        coverImageUrl: 'cover_image_url',
        visibility: 'visibility',
        joinPolicy: 'join_policy',
        maxMembers: 'max_members',
        tags: 'tags',
      };

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const [js, db] of Object.entries(fieldMap)) {
        const v = (body as Record<string, unknown>)[js];
        if (v !== undefined) {
          setClauses.push(`${db} = $${idx++}`);
          values.push(v);
        }
      }

      if (setClauses.length > 0) {
        values.push(id);
        await app.db.query(
          `UPDATE groups SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
          values,
        );
      }

      return reply.send({ data: { message: 'Group updated' } });
    },
  );

  // ── POST /groups/:id/join ─────────────────────────────────
  app.post(
    '/:id/join',
    { onRequest: [app.authenticate], schema: { tags: ['groups'], summary: 'Join a group' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const groupResult = await app.db.query<{ join_policy: string; member_count: number; max_members: number | null; status: string }>(
        'SELECT join_policy, member_count, max_members, status FROM groups WHERE id = $1',
        [id],
      );
      const group = groupResult.rows[0];
      if (!group || group.status !== 'active') throw new NotFoundError('Group');

      if (group.max_members && group.member_count >= group.max_members) {
        throw new AppError('GROUP_FULL', 'This group has reached its maximum capacity', 422);
      }

      const existingMembership = await app.db.query<{ status: string }>(
        'SELECT status FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [id, req.userId],
      );
      if (existingMembership.rows[0]) {
        throw new ConflictError('You are already a member of this group');
      }

      const memberStatus = group.join_policy === 'open' ? 'active' : 'pending';

      await app.db.query(
        `INSERT INTO group_memberships (group_id, user_id, role, status)
         VALUES ($1, $2, 'member', $3)`,
        [id, req.userId, memberStatus],
      );

      return reply.status(201).send({
        data: {
          status: memberStatus,
          message: memberStatus === 'pending' ? 'Join request submitted' : 'Joined group',
        },
      });
    },
  );

  // ── POST /groups/:id/leave ────────────────────────────────
  app.post(
    '/:id/leave',
    { onRequest: [app.authenticate], schema: { tags: ['groups'], summary: 'Leave a group' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const membership = await app.db.query<{ role: string }>(
        'SELECT role FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [id, req.userId],
      );
      if (!membership.rows[0]) throw new NotFoundError('Membership');

      if (membership.rows[0].role === 'owner') {
        throw new AppError('OWNER_CANNOT_LEAVE', 'Group owner cannot leave. Transfer ownership or delete the group.', 422);
      }

      await app.db.query(
        'DELETE FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [id, req.userId],
      );

      return reply.send({ data: { message: 'Left group' } });
    },
  );

  // ── GET /groups/:id/members ───────────────────────────────
  app.get(
    '/:id/members',
    { onRequest: [app.authenticate], schema: { tags: ['groups'], summary: 'List group members' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const query = paginationQuerySchema.parse(req.query);

      // Verify caller is a member
      const membership = await app.db.query<{ status: string }>(
        `SELECT status FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
        [id, req.userId],
      );
      if (!membership.rows[0] || membership.rows[0].status !== 'active') {
        throw new ForbiddenError('Only group members can view the member list');
      }

      const conditions = [`gm.group_id = $1`, `gm.status = 'active'`];
      const values: unknown[] = [id];
      let idx = 2;

      if (query.cursor) {
        conditions.push(`gm.joined_at < $${idx++}`);
        values.push(query.cursor);
      }

      values.push(query.limit + 1);
      const rows = await app.db.query<Record<string, unknown>>(
        `SELECT gm.user_id, gm.role, gm.joined_at,
                p.display_name, p.avatar_url, p.user_type, p.current_city
         FROM group_memberships gm
         JOIN profiles p ON p.user_id = gm.user_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY gm.role DESC, gm.joined_at ASC
         LIMIT $${idx}`,
        values,
      );

      const items = rows.rows.slice(0, query.limit);
      return reply.send({
        data: items,
        meta: {
          nextCursor: rows.rows.length > query.limit ? (items[items.length - 1]?.['joined_at'] as string) : null,
          hasMore: rows.rows.length > query.limit,
        },
      });
    },
  );
}

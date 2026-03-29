/**
 * routes/admin/index.ts — Admin and Moderation routes
 *
 * Secured by authorizeRoles('admin', 'super_admin', 'moderator').
 * Every action here MUST be tracked in the audit_log.
 */

import type { FastifyInstance } from 'fastify';
import { paginationQuerySchema } from '@gujarati-global/validators';
import { AppError, NotFoundError } from '../../plugins/error-handler.js';
import { auditLog } from '../../utils/audit.js';
import type { UserRoleLiteral, TargetTypeLiteral } from '@gujarati-global/types';

import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
  reason: z.string().min(1),
  durationHours: z.number().int().positive().optional(),
});

const moderateContentSchema = z.object({
  moderationStatus: z.enum(['published', 'flagged', 'hidden', 'removed']),
  reason: z.string().min(1),
});

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Common preHandler for all admin routes: Require auth AND appropriate role
  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', app.authorizeRoles('admin', 'super_admin', 'moderator'));

  // ── GET /admin/reports ────────────────────────────────────
  app.get('/reports', { schema: { tags: ['admin'] } }, async (req, reply) => {
    const { status, limit, cursor } = z.object({
      status: z.enum(['pending', 'resolved', 'dismissed']).default('pending'),
      ...paginationQuerySchema.shape,
    }).parse(req.query);

    const conditions = [`r.status = $1`];
    const values: unknown[] = [status];
    let idx = 2;

    if (cursor) { conditions.push(`r.created_at < $${idx++}`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT r.*, p.display_name AS reporter_name
       FROM reports r
       JOIN profiles p ON p.user_id = r.reporter_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at ASC LIMIT $${idx}`,
      values,
    );

    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > limit },
    });
  });

  // ── PATCH /admin/users/:id/status ─────────────────────────
  app.patch('/users/:id/status', { schema: { tags: ['admin'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason, durationHours } = updateStatusSchema.parse(req.body);

    // Cannot suspend/ban another admin/super_admin if you are just a moderator
    const targetQuery = await app.db.query<{ role: string }>('SELECT role FROM users WHERE id = $1', [id]);
    const target = targetQuery.rows[0];
    if (!target) throw new NotFoundError('User');

    if (req.userRole === 'moderator' && ['admin', 'super_admin'].includes(target.role)) {

      throw new AppError('FORBIDDEN', 'Moderators cannot modify admin accounts', 403);
    }

    const suspensionEndsAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : null;

    await app.db.transaction(async (client) => {
      await client.query(
        `UPDATE users SET status = $1, suspension_ends_at = $2, updated_at = NOW() WHERE id = $3`,
        [status, suspensionEndsAt, id],
      );

      // Record moderation action explicitly
      await client.query(
        `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action, reason, expires_at)
         VALUES ($1, 'user', $2, $3, $4, $5)`,
        [req.userId, id, `${status}_user`, reason, suspensionEndsAt],
      );

    });

    // Write to audit log (insert-only table)
    await auditLog(app, {
      actorId: req.userId!,
      actorRole: req.userRole as UserRoleLiteral,
      action: `admin.user.${status}`,
      targetType: 'user' as TargetTypeLiteral,
      targetId: id,
      metadata: { reason, durationHours },
      req,
    });


    return reply.send({ data: { message: `User status changed to ${status}` } });
  });

  // ── PATCH /admin/posts/:id/moderation ─────────────────────
  app.patch('/posts/:id/moderation', { schema: { tags: ['admin'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { moderationStatus, reason } = moderateContentSchema.parse(req.body);

    const targetQuery = await app.db.query<{ author_id: string }>(
      'SELECT author_id FROM posts WHERE id = $1', [id],
    );
    if (!targetQuery.rows[0]) throw new NotFoundError('Post');

    await app.db.transaction(async (client) => {
      await client.query(
        `UPDATE posts SET moderation_status = $1, updated_at = NOW() WHERE id = $2`,
        [moderationStatus, id],
      );

      await client.query(
        `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action, reason)
         VALUES ($1, 'post', $2, $3, $4)`,
        [req.userId, id, `set_status_${moderationStatus}`, reason],
      );

      // If removed by moderator, remove it from feeds practically by soft-deleting
      if (moderationStatus === 'removed') {
        await client.query('UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
      }
    });

    await auditLog(app, {
      actorId: req.userId!,
      actorRole: req.userRole as UserRoleLiteral,
      action: `admin.post.set_${moderationStatus}`,
      targetType: 'post' as TargetTypeLiteral,
      targetId: id,
      metadata: { reason },
      req,
    });


    return reply.send({ data: { message: `Post moderation status set to ${moderationStatus}` } });
  });

  // ── GET /admin/audit-log ──────────────────────────────────
  app.get('/audit-log', { schema: { tags: ['admin'] } }, async (req, reply) => {
    // Only super_admins and admins can view the raw audit log
    if (!['super_admin', 'admin'].includes(req.userRole ?? '')) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions to view audit log', 403);
    }

    const { limit, cursor } = paginationQuerySchema.parse(req.query);
    const conditions = [`1=1`];
    const values: unknown[] = [];
    if (cursor) { conditions.push(`created_at < $1`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT * FROM audit_log
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${values.length}`,
      values,
    );

    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > limit },
    });
  });
}

/**
 * routes/notifications/index.ts — Notification management
 */

import type { FastifyInstance } from 'fastify';
import { updateNotificationPreferencesSchema, registerDeviceTokenSchema, paginationQuerySchema } from '@gujarati-global/validators';
import { NotFoundError } from '../../plugins/error-handler.js';

export default async function notificationRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /notifications ────────────────────────────────────
  app.get('/', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const { cursor, limit } = paginationQuerySchema.parse(req.query);
    const conditions = [`user_id = $1`];
    const values: unknown[] = [req.userId];
    if (cursor) { conditions.push(`created_at < $2`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT id, type, title, body, data, is_read, read_at, push_sent, created_at
       FROM notifications WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${values.length}`,
      values,
    );
    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > limit },
    });
  });

  // ── PATCH /notifications/:id/read ─────────────────────────
  app.patch('/:id/read', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, req.userId],
    );
    return reply.send({ data: { message: 'Marked as read' } });
  });

  // ── PATCH /notifications/read-all ─────────────────────────
  app.patch('/read-all', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    await app.db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.userId],
    );
    return reply.send({ data: { message: 'All notifications marked as read' } });
  });

  // ── GET /notifications/preferences ────────────────────────
  app.get('/preferences', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const result = await app.db.query<Record<string, unknown>>(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.userId],
    );
    if (!result.rows[0]) throw new NotFoundError('Notification preferences');
    return reply.send({ data: result.rows[0] });
  });

  // ── PATCH /notifications/preferences ──────────────────────
  app.patch('/preferences', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const body = updateNotificationPreferencesSchema.parse(req.body);
    const fieldMap: Record<string, string> = {
      groupActivity: 'group_activity', eventReminders: 'event_reminders',
      postReactions: 'post_reactions', commentReplies: 'comment_replies',
      messageRequests: 'message_requests', newMessages: 'new_messages',
      moderation: 'moderation', system: 'system',
      digestFrequency: 'digest_frequency', quietHoursStart: 'quiet_hours_start',
      quietHoursEnd: 'quiet_hours_end', quietHoursTz: 'quiet_hours_tz',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const [js, db] of Object.entries(fieldMap)) {
      const v = (body as Record<string, unknown>)[js];
      if (v !== undefined) { setClauses.push(`${db} = $${idx++}`); values.push(v); }
    }
    if (setClauses.length > 0) {
      values.push(req.userId);
      await app.db.query(
        `UPDATE notification_preferences SET ${setClauses.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
        values,
      );
    }
    return reply.send({ data: { message: 'Preferences updated' } });
  });

  // ── POST /notifications/device-token ──────────────────────
  app.post('/device-token', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const body = registerDeviceTokenSchema.parse(req.body);
    await app.db.query(
      `INSERT INTO device_tokens (user_id, token, platform, device_id, is_active, last_used_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (token) DO UPDATE SET user_id = $1, is_active = true, last_used_at = NOW()`,
      [req.userId, body.token, body.platform, body.deviceId ?? null],
    );
    return reply.status(201).send({ data: { message: 'Device token registered' } });
  });

  // ── DELETE /notifications/device-token/:id ────────────────
  app.delete('/device-token/:id', { onRequest: [app.authenticate], schema: { tags: ['notifications'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.db.query(
      'UPDATE device_tokens SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    return reply.send({ data: { message: 'Device token deactivated' } });
  });
}

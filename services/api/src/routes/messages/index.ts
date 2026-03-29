/**
 * routes/messages/index.ts — Message requests and conversations (Phase 2 shell)
 *
 * Message request state machine enforced here.
 * No unsolicited messaging — request must be accepted before messages flow.
 */

import type { FastifyInstance } from 'fastify';
import { sendMessageRequestSchema, respondMessageRequestSchema, sendMessageSchema, paginationQuerySchema } from '@gujarati-global/validators';
import { AppError, ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';
import messageWsRoutes from './ws.js';

export default async function messageRoutes(app: FastifyInstance): Promise<void> {
  // Register Websockets
  await app.register(messageWsRoutes);

  // ── GET /messages/conversations ───────────────────────────
  app.get('/conversations', { onRequest: [app.authenticate], schema: { tags: ['messages'] } }, async (req, reply) => {
    const { limit, cursor } = paginationQuerySchema.parse(req.query);
    const conditions = [`cp.user_id = $1`, `cp.status = 'active'`];
    const values: unknown[] = [req.userId];
    if (cursor) { conditions.push(`c.last_message_at < $2`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT c.id, c.last_message_at, c.last_message_preview, c.status,
              other_p.display_name AS other_user_name, other_p.avatar_url AS other_user_avatar,
              other_cp.user_id AS other_user_id
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
       JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id AND other_cp.user_id != $1
       JOIN profiles other_p ON other_p.user_id = other_cp.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.last_message_at DESC LIMIT $${values.length}`,
      values,
    );
    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > limit ? (items[items.length - 1]?.['last_message_at'] as string) : null, hasMore: rows.rows.length > limit },
    });
  });

  // ── GET /messages/conversations/:id ──────────────────────
  app.get('/conversations/:id', { onRequest: [app.authenticate], schema: { tags: ['messages'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { limit, cursor } = paginationQuerySchema.parse(req.query);

    // Verify participant
    const participation = await app.db.query<{ status: string }>(
      'SELECT status FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (!participation.rows[0] || participation.rows[0].status !== 'active') {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    // Update last_read_at
    await app.db.query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
      [id, req.userId],
    );

    const conditions = [`m.conversation_id = $1`, `m.deleted_at IS NULL`];
    const values: unknown[] = [id];
    if (cursor) { conditions.push(`m.created_at < $2`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT m.id, m.sender_id, m.body, m.media_urls, m.message_type, m.is_edited, m.created_at,
              p.display_name AS sender_name, p.avatar_url AS sender_avatar
       FROM messages m JOIN profiles p ON p.user_id = m.sender_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY m.created_at DESC LIMIT $${values.length}`,
      values,
    );
    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items.reverse(),  // Return in chronological order
      meta: { nextCursor: rows.rows.length > limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > limit },
    });
  });

  // ── POST /messages/conversations/:id/messages ─────────────
  app.post('/conversations/:id/messages', { onRequest: [app.authenticate], schema: { tags: ['messages'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = sendMessageSchema.parse(req.body);

    // Verify active participant
    const participation = await app.db.query<{ status: string }>(
      'SELECT status FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (!participation.rows[0] || participation.rows[0].status !== 'active') {
      throw new ForbiddenError('Not a participant of this conversation');
    }

    const result = await app.db.query<{ id: string }>(
      `INSERT INTO messages (conversation_id, sender_id, body, media_urls, message_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [id, req.userId, body.body ?? null, body.mediaUrls ?? [], body.messageType ?? 'text'],
    );

    // Update conversation preview
    await app.db.query(
      `UPDATE conversations SET last_message_at = NOW(), last_message_preview = $1, updated_at = NOW()
       WHERE id = $2`,
      [(body.body ?? '📎 Media').substring(0, 200), id],
    );

    // Publish to Redis for WebSockets
    await app.redis.publish(`conversation:${id}`, JSON.stringify({
      type: 'new_message',
      message: {
        id: result.rows[0]?.id,
        senderId: req.userId,
        body: body.body ?? null,
        mediaUrls: body.mediaUrls ?? [],
        messageType: body.messageType ?? 'text',
        createdAt: new Date().toISOString(),
        senderName: participation.rows[0]?.display_name, // Note: would need to join profiles for full data
      }
    }));

    return reply.status(201).send({ data: { id: result.rows[0]?.id } });
  });

  // ── POST /messages/request ────────────────────────────────
  app.post('/request', { onRequest: [app.authenticate], schema: { tags: ['messages'], summary: 'Send a message request' } }, async (req, reply) => {
    const body = sendMessageRequestSchema.parse(req.body);

    if (body.toUserId === req.userId) {
      throw new AppError('INVALID_REQUEST', 'Cannot send a message request to yourself', 400);
    }

    // Check if target allows message requests
    const privacyResult = await app.db.query<{ allow_message_requests: boolean }>(
      'SELECT allow_message_requests FROM privacy_settings WHERE user_id = $1',
      [body.toUserId],
    );
    if (!privacyResult.rows[0]?.allow_message_requests) {
      throw new ForbiddenError('This user is not accepting message requests');
    }

    // Check block status
    const blockResult = await app.db.query<{ id: string }>(
      `SELECT id FROM user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.userId, body.toUserId],
    );
    if (blockResult.rows.length > 0) {
      throw new ForbiddenError('Cannot send message to this user');
    }

    // Upsert to handle re-requests after decline
    await app.db.query(
      `INSERT INTO message_requests (from_user_id, to_user_id, message_preview, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE
         SET status = 'pending', message_preview = $3, responded_at = NULL`,
      [req.userId, body.toUserId, body.messagePreview],
    );

    return reply.status(201).send({ data: { message: 'Message request sent' } });
  });

  // ── PATCH /messages/request/:id ───────────────────────────
  app.patch('/request/:id', { onRequest: [app.authenticate], schema: { tags: ['messages'], summary: 'Respond to a message request' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = respondMessageRequestSchema.parse(req.body);

    const requestResult = await app.db.query<{ from_user_id: string; to_user_id: string; current_status: string }>(
      'SELECT from_user_id, to_user_id, status AS current_status FROM message_requests WHERE id = $1',
      [id],
    );
    const request = requestResult.rows[0];
    if (!request) throw new NotFoundError('Message request');
    if (request.to_user_id !== req.userId) throw new ForbiddenError('Cannot respond to this request');
    if (request.current_status !== 'pending') throw new AppError('REQUEST_NOT_PENDING', 'Request is no longer pending', 422);

    await app.db.transaction(async (client) => {
      await client.query(
        'UPDATE message_requests SET status = $1, responded_at = NOW() WHERE id = $2',
        [status, id],
      );

      if (status === 'accepted') {
        // Create conversation
        const convResult = await client.query<{ id: string }>(
          'INSERT INTO conversations DEFAULT VALUES RETURNING id',
        );
        const convId = convResult.rows[0]?.id;
        if (!convId) throw new AppError('INTERNAL_ERROR', 'Failed to create conversation', 500);

        // Add both participants
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
          [convId, request.from_user_id, request.to_user_id],
        );

        // Link conversation to request
        await client.query(
          'UPDATE message_requests SET conversation_id = $1 WHERE id = $2',
          [convId, id],
        );
      }
    });

    return reply.send({ data: { status, message: `Request ${status}` } });
  });
}

/**
 * routes/posts/index.ts — Post and reaction routes
 *
 * Includes moderation priority scoring on creation.
 * Feed fanout dispatched via queue (not synchronous).
 */

import type { FastifyInstance } from 'fastify';
import {
  createPostSchema,
  updatePostSchema,
  postListQuerySchema,
  reactToPostSchema,
} from '@gujarati-global/validators';
import { AppError, ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';
import { config } from '../../config/index.js';

/** Redis key for rapid-posting burst detection */
const BURST_KEY = (userId: string): string => `post_burst:${userId}`;

export default async function postRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /posts ────────────────────────────────────────────
  app.get(
    '/',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'List posts (feed)' } },
    async (req, reply) => {
      const query = postListQuerySchema.parse(req.query);

      const conditions = [
        `p.deleted_at IS NULL`,
        `p.moderation_status = 'published'`,
      ];
      const values: unknown[] = [];
      let idx = 1;

      if (query.groupId) {
        conditions.push(`p.group_id = $${idx++}`);
        values.push(query.groupId);
      } else if (query.communityId) {
        conditions.push(`p.community_id = $${idx++}`);
        values.push(query.communityId);
      } else if (query.authorId) {
        conditions.push(`p.author_id = $${idx++}`);
        values.push(query.authorId);
      }

      // Exclude content from blocked users
      conditions.push(
        `p.author_id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $${idx}
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $${idx}
        )`,
      );
      values.push(req.userId);
      idx++;

      if (query.cursor) {
        conditions.push(`p.created_at < $${idx++}`);
        values.push(query.cursor);
      }

      values.push(query.limit + 1);
      const rows = await app.db.query<Record<string, unknown>>(
        `SELECT p.id, p.content_type, p.body, p.media_urls, p.link_url, p.link_preview,
                p.like_count, p.comment_count, p.share_count, p.is_pinned, p.created_at,
                p.group_id, p.community_id,
                pr.display_name AS author_display_name, pr.avatar_url AS author_avatar_url,
                p.author_id,
                r.reaction AS my_reaction
         FROM posts p
         JOIN profiles pr ON pr.user_id = p.author_id
         LEFT JOIN reactions r ON r.target_type = 'post' AND r.target_id = p.id AND r.user_id = $${idx}
         WHERE ${conditions.join(' AND ')}
         ORDER BY p.is_pinned DESC, p.created_at DESC
         LIMIT $${idx + 1}`,
        [...values, req.userId, query.limit + 1],
      );

      const items = rows.rows.slice(0, query.limit);
      return reply.send({
        data: items,
        meta: {
          nextCursor: rows.rows.length > query.limit ? (items[items.length - 1]?.['created_at'] as string) : null,
          hasMore: rows.rows.length > query.limit,
        },
      });
    },
  );

  // ── GET /posts/:id ────────────────────────────────────────
  app.get(
    '/:id',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'Get post by ID' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const result = await app.db.query<Record<string, unknown>>(
        `SELECT p.*, pr.display_name AS author_display_name, pr.avatar_url AS author_avatar_url,
                r.reaction AS my_reaction
         FROM posts p
         JOIN profiles pr ON pr.user_id = p.author_id
         LEFT JOIN reactions r ON r.target_type = 'post' AND r.target_id = p.id AND r.user_id = $2
         WHERE p.id = $1 AND p.deleted_at IS NULL AND p.moderation_status = 'published'`,
        [id, req.userId],
      );
      if (!result.rows[0]) throw new NotFoundError('Post');
      return reply.send({ data: result.rows[0] });
    },
  );

  // ── POST /posts ───────────────────────────────────────────
  app.post(
    '/',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: config.rateLimit.post.max, timeWindow: config.rateLimit.post.windowMs } },
      schema: { tags: ['posts'], summary: 'Create a post' },
    },
    async (req, reply) => {
      const body = createPostSchema.parse(req.body);

      // ── Moderation priority scoring ───────────────────────
      const priority = await scoreModerationPriority(app, req.userId!);

      // Create post (optimistic publish)
      const result = await app.db.query<{ id: string }>(
        `INSERT INTO posts
          (author_id, group_id, community_id, content_type, body, media_urls, link_url,
           moderation_status, moderation_priority, moderation_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8, $9)
         RETURNING id`,
        [
          req.userId,
          body.groupId ?? null,
          body.communityId ?? null,
          body.contentType,
          body.body ?? null,
          body.mediaUrls ?? [],
          body.linkUrl ?? null,
          priority.level,
          JSON.stringify(priority.flags),
        ],
      );

      const postId = result.rows[0]?.id;
      if (!postId) throw new AppError('INTERNAL_ERROR', 'Failed to create post', 500);

      // ── Dispatch async jobs ───────────────────────────────

      // 1. Queue moderation scan
      await queueJob(app, 'moderation.scan', {
        type: 'moderation.scan',
        targetType: 'post',
        targetId: postId,
        authorId: req.userId,
        content: body.body ?? '',
        mediaUrls: body.mediaUrls ?? [],
        priority: priority.level ?? 'normal',
        dedupKey: postId,
      });

      // 2. Queue feed fanout (if group post)
      if (body.groupId) {
        const groupResult = await app.db.query<{ member_count: number }>(
          'SELECT member_count FROM groups WHERE id = $1',
          [body.groupId],
        );
        const memberCount = groupResult.rows[0]?.member_count ?? 0;

        await queueJob(app, 'feed.fanout', {
          type: 'feed.fanout',
          postId,
          authorId: req.userId,
          groupId: body.groupId,
          communityId: null,
          groupMemberCount: memberCount,
          createdAt: new Date().toISOString(),
          dedupKey: postId,
        });
      }

      app.log.info({ postId, userId: req.userId, priority: priority.level }, '[posts] Post created');

      return reply.status(201).send({ data: { id: postId } });
    },
  );

  // ── PATCH /posts/:id ──────────────────────────────────────
  app.patch(
    '/:id',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'Update a post' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = updatePostSchema.parse(req.body);

      const existing = await app.db.query<{ author_id: string }>(
        'SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
        [id],
      );
      if (!existing.rows[0]) throw new NotFoundError('Post');
      if (existing.rows[0].author_id !== req.userId) {
        throw new ForbiddenError('You can only edit your own posts');
      }

      await app.db.query(
        'UPDATE posts SET body = COALESCE($1, body), media_urls = COALESCE($2, media_urls), updated_at = NOW() WHERE id = $3',
        [body.body ?? null, body.mediaUrls ?? null, id],
      );

      return reply.send({ data: { message: 'Post updated' } });
    },
  );

  // ── DELETE /posts/:id ─────────────────────────────────────
  app.delete(
    '/:id',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'Delete (soft) a post' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const existing = await app.db.query<{ author_id: string }>(
        'SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL',
        [id],
      );
      if (!existing.rows[0]) throw new NotFoundError('Post');

      // Allow author or moderator+
      const canDelete =
        existing.rows[0].author_id === req.userId ||
        ['moderator', 'admin', 'super_admin'].includes(req.userRole ?? '');

      if (!canDelete) throw new ForbiddenError('Insufficient permissions to delete this post');

      await app.db.query(
        'UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
        [id],
      );

      return reply.send({ data: { message: 'Post deleted' } });
    },
  );

  // ── POST /posts/:id/react ─────────────────────────────────
  app.post(
    '/:id/react',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'React to a post' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { reaction } = reactToPostSchema.parse(req.body);

      await app.db.query(
        `INSERT INTO reactions (user_id, target_type, target_id, reaction)
         VALUES ($1, 'post', $2, $3)
         ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET reaction = $3`,
        [req.userId, id, reaction],
      );

      return reply.status(201).send({ data: { message: 'Reaction saved' } });
    },
  );

  // ── DELETE /posts/:id/react ───────────────────────────────
  app.delete(
    '/:id/react',
    { onRequest: [app.authenticate], schema: { tags: ['posts'], summary: 'Remove reaction from a post' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await app.db.query(
        `DELETE FROM reactions WHERE user_id = $1 AND target_type = 'post' AND target_id = $2`,
        [req.userId, id],
      );
      return reply.send({ data: { message: 'Reaction removed' } });
    },
  );

  // ── GET /posts/:id/comments ───────────────────────────────
  app.get(
    '/:id/comments',
    { onRequest: [app.authenticate], schema: { tags: ['comments'], summary: 'List post comments' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { cursor, limit } = (req.query as { cursor?: string; limit?: number });
      const limitVal = Math.min(Number(limit ?? 20), 50);

      const conditions = [`c.post_id = $1`, `c.deleted_at IS NULL`, `c.parent_id IS NULL`, `c.moderation_status = 'published'`];
      const values: unknown[] = [id];
      if (cursor) { conditions.push(`c.created_at < $2`); values.push(cursor); }
      values.push(limitVal + 1);

      const rows = await app.db.query<Record<string, unknown>>(
        `SELECT c.id, c.body, c.like_count, c.parent_id, c.created_at, c.author_id,
                p.display_name AS author_display_name, p.avatar_url AS author_avatar_url
         FROM comments c JOIN profiles p ON p.user_id = c.author_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY c.created_at ASC LIMIT $${values.length}`,
        values,
      );

      const items = rows.rows.slice(0, limitVal);
      return reply.send({
        data: items,
        meta: { nextCursor: rows.rows.length > limitVal ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > limitVal },
      });
    },
  );

  // ── POST /posts/:id/comments ──────────────────────────────
  app.post(
    '/:id/comments',
    { onRequest: [app.authenticate], schema: { tags: ['comments'], summary: 'Create a comment' } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { body, parentId } = (req.body as { body: string; parentId?: string });
      if (!body?.trim()) throw new AppError('VALIDATION_ERROR', 'Comment body is required', 400);

      const result = await app.db.query<{ id: string }>(
        `INSERT INTO comments (post_id, author_id, parent_id, body)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [id, req.userId, parentId ?? null, body.trim()],
      );

      return reply.status(201).send({ data: { id: result.rows[0]?.id } });
    },
  );
}

// ── Helpers ──────────────────────────────────────────────────

interface PriorityResult {
  level: 'critical' | 'high' | 'normal' | null;
  flags: Record<string, unknown>;
}

async function scoreModerationPriority(app: FastifyInstance, userId: string): Promise<PriorityResult> {
  const [userResult, postCountResult] = await Promise.all([
    app.db.query<{ created_at: string; status: string }>(
      'SELECT created_at, status FROM users WHERE id = $1',
      [userId],
    ),
    app.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM posts WHERE author_id = $1 AND deleted_at IS NULL',
      [userId],
    ),
  ]);

  const user = userResult.rows[0];
  if (!user) return { level: null, flags: {} };

  const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const totalPosts = parseInt(postCountResult.rows[0]?.count ?? '0', 10);

  const flags: Record<string, boolean> = {
    isNewAccount: accountAgeDays < 7,
    isFirstPost: totalPosts < 3,
    hasPriorReports: false, // TODO(moderation): wire up reports check
    hasPriorActions: false, // TODO(moderation): wire up moderation actions check
    postBurstDetected: false,
  };

  // Check rapid posting via Redis counter
  const burstKey = BURST_KEY(userId);
  const burstCount = await app.redis.incr(burstKey);
  await app.redis.expire(burstKey, 60); // 1 minute window
  if (burstCount > 10) {
    flags['postBurstDetected'] = true;
  }

  let level: 'critical' | 'high' | 'normal' | null = null;
  if (flags['postBurstDetected'] || flags['hasPriorActions']) {
    level = 'critical';
  } else if (flags['isNewAccount'] || flags['isFirstPost'] || flags['hasPriorReports']) {
    level = 'high';
  }

  return { level, flags };
}

async function queueJob(app: FastifyInstance, jobType: string, payload: Record<string, unknown>): Promise<void> {
  try {
    // In dev/local: push to Redis list (BullMQ-compatible format)
    // In production: publish to Azure Service Bus
    await app.redis.lpush(`queue:${jobType}`, JSON.stringify({
      id: crypto.randomUUID(),
      type: jobType,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    }));
  } catch (err) {
    // Queue failures must not fail the request. Log for alerting.
    app.log.error({ err, jobType }, '[queue] Failed to enqueue job');
  }
}

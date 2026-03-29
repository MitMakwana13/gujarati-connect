/**
 * handlers/feed-fanout.ts — Feed fanout handler
 *
 * Fan-out-on-write strategy:
 * - Groups < 10K members: write post to each member's Redis sorted-set feed
 * - Groups >= 10K members: hybrid (fan-out to active members, pull for rest)
 *
 * Redis sorted-set key: feed:{userId}
 * Score: UNIX timestamp of post creation
 */

import type { WorkerContext } from '../worker.js';

const FEED_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const FANOUT_CEILING = 10_000;              // Matches config.feedFanoutThreshold
const FEED_MAX_SIZE = 500;                  // Trim feed to last 500 items per user
const ACTIVE_USER_DAYS = 30;               // Consider users active within 30 days

export async function feedFanoutHandler(
  payload: Record<string, unknown>,
  ctx: WorkerContext,
): Promise<void> {
  const { postId, authorId, groupId, groupMemberCount, createdAt } = payload as {
    postId: string;
    authorId: string;
    groupId: string | null;
    groupMemberCount: number;
    createdAt: string;
  };

  if (!postId || !authorId) {
    ctx.logger.warn({ payload }, '[feed-fanout] Missing required fields');
    return;
  }

  const score = new Date(createdAt).getTime() / 1000;

  if (!groupId) {
    ctx.logger.debug({ postId }, '[feed-fanout] No group — skipping fanout');
    return;
  }

  const isLargeGroup = (groupMemberCount ?? 0) >= FANOUT_CEILING;

  if (isLargeGroup) {
    // Hybrid: only fan-out to recently-active members
    ctx.logger.info({ postId, groupId, groupMemberCount }, '[feed-fanout] Large group — hybrid fanout to active members only');
    await fanoutToActiveMembers(ctx, postId, groupId, authorId, score);
  } else {
    ctx.logger.info({ postId, groupId, groupMemberCount }, '[feed-fanout] Small group — full fanout');
    await fanoutToAllMembers(ctx, postId, groupId, authorId, score);
  }
}

async function fanoutToAllMembers(
  ctx: WorkerContext,
  postId: string,
  groupId: string,
  authorId: string,
  score: number,
): Promise<void> {
  const result = await ctx.db.query<{ user_id: string }>(
    `SELECT user_id FROM group_memberships WHERE group_id = $1 AND status = 'active' AND user_id != $2`,
    [groupId, authorId],
  );

  await writeFeedEntries(ctx, result.rows.map((r) => r.user_id), postId, score);
}

async function fanoutToActiveMembers(
  ctx: WorkerContext,
  postId: string,
  groupId: string,
  authorId: string,
  score: number,
): Promise<void> {
  const cutoff = new Date(Date.now() - ACTIVE_USER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await ctx.db.query<{ user_id: string }>(
    `SELECT gm.user_id
     FROM group_memberships gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1 AND gm.status = 'active' AND gm.user_id != $2
       AND u.last_login_at >= $3`,
    [groupId, authorId, cutoff],
  );

  await writeFeedEntries(ctx, result.rows.map((r) => r.user_id), postId, score);
}

async function writeFeedEntries(
  ctx: WorkerContext,
  userIds: string[],
  postId: string,
  score: number,
): Promise<void> {
  if (userIds.length === 0) return;

  // Batch Redis writes using pipelining (up to 200 at a time)
  const BATCH = 200;
  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH);
    const pipeline = ctx.redis.pipeline();
    for (const userId of batch) {
      const key = `feed:${userId}`;
      pipeline.zadd(key, score, postId);
      pipeline.zremrangebyrank(key, 0, -(FEED_MAX_SIZE + 1)); // trim oldest
      pipeline.expire(key, FEED_TTL_SECONDS);
    }
    await pipeline.exec();
  }

  ctx.logger.debug({ count: userIds.length, postId }, '[feed-fanout] Feed entries written');
}

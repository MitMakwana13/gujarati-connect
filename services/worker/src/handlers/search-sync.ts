/**
 * handlers/search-sync.ts — Search vector re-sync handler
 *
 * Used to force-refresh search_vector columns after bulk imports
 * or profile updates that bypass the trigger (e.g., admin bulk ops).
 * In most cases, the DB triggers on INSERT/UPDATE handle this automatically.
 */

import type { WorkerContext } from '../worker.js';

type SearchTargetType = 'post' | 'event' | 'resource' | 'profile';

export async function searchSyncHandler(
  payload: Record<string, unknown>,
  ctx: WorkerContext,
): Promise<void> {
  const { targetType, targetId } = payload as {
    targetType: SearchTargetType;
    targetId: string;
  };

  if (!targetType || !targetId) {
    ctx.logger.warn({ payload }, '[search-sync] Missing required fields');
    return;
  }

  const queryMap: Record<SearchTargetType, string> = {
    post: `UPDATE posts
           SET search_vector = to_tsvector('english', COALESCE(body, ''))
           WHERE id = $1`,
    event: `UPDATE events
            SET search_vector = to_tsvector('english',
              COALESCE(title, '') || ' ' ||
              COALESCE(description, '') || ' ' ||
              COALESCE(array_to_string(tags, ' '), ''))
            WHERE id = $1`,
    resource: `UPDATE resource_listings
               SET search_vector = to_tsvector('english',
                 COALESCE(title, '') || ' ' ||
                 COALESCE(description, ''))
               WHERE id = $1`,
    profile: `UPDATE profiles
              SET search_vector = to_tsvector('english',
                COALESCE(display_name, '') || ' ' ||
                COALESCE(bio, '') || ' ' ||
                COALESCE(university, '') || ' ' ||
                COALESCE(company, '') || ' ' ||
                COALESCE(array_to_string(interests, ' '), ''))
              WHERE user_id = $1`,
  };

  const sql = queryMap[targetType];
  if (!sql) {
    ctx.logger.warn({ targetType }, '[search-sync] Unknown target type');
    return;
  }

  await ctx.db.query(sql, [targetId]);
  ctx.logger.debug({ targetType, targetId }, '[search-sync] Search vector refreshed');
}

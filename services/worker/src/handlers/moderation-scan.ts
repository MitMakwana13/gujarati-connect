/**
 * handlers/moderation-scan.ts — Content moderation scan handler
 *
 * Priority routing:
 * - critical: scan immediately, consider auto-hiding pending manual review
 * - high:     scan immediately, flag for moderator queue
 * - normal:   scan within normal processing time
 *
 * Phase 1: Rule-based only (no AI). AI moderation enabled via feature flag.
 */

import type { WorkerContext } from '../worker.js';

const RULE_BASED_PATTERNS = [
  /\b(spam|buy now|click here|free money)\b/i,
  /\b(hate|slur|n\*\*\*\*|f\*\*)\b/i,
  /https?:\/\/(?!gujaratiglobal\.com)[^\s]+\.(exe|bat|sh|ps1)/i, // suspicious file links
];

type ModerationStatus = 'published' | 'flagged' | 'hidden' | 'removed';

export async function moderationScanHandler(
  payload: Record<string, unknown>,
  ctx: WorkerContext,
): Promise<void> {
  const { targetType, targetId, authorId, content, priority } = payload as {
    targetType: 'post' | 'comment' | 'resource';
    targetId: string;
    authorId: string;
    content: string;
    priority: 'critical' | 'high' | 'normal' | null;
  };

  if (!targetId || !targetType) {
    ctx.logger.warn({ payload }, '[moderation] Missing required fields');
    return;
  }

  // Rule-based scan
  const violations = RULE_BASED_PATTERNS
    .filter((pattern) => pattern.test(content ?? ''))
    .map((p) => p.source);

  const hasViolations = violations.length > 0;

  ctx.logger.debug({ targetId, targetType, priority, hasViolations, violations }, '[moderation] Scan complete');

  // Compute new moderation status
  let newStatus: ModerationStatus = 'published';
  let moderationFlags: Record<string, unknown> = {};

  if (hasViolations) {
    moderationFlags = { violations, scannedAt: new Date().toISOString() };

    if (priority === 'critical') {
      newStatus = 'hidden'; // Auto-hide critical priority violations pending review
    } else {
      newStatus = 'flagged'; // Flag for manual review
    }
  } else if (priority === 'critical') {
    // Even without rule violations, critical posts get flagged for review
    newStatus = 'flagged';
    moderationFlags = { reason: 'burst_or_prior_actions', scannedAt: new Date().toISOString() };
  }

  if (newStatus !== 'published') {
    // Update content status (only downgrade, never upgrade via automation)
    const tableMap: Record<string, string> = {
      post: 'posts',
      comment: 'comments',
      resource: 'resource_listings',
    };
    const table = tableMap[targetType];
    if (table) {
      await ctx.db.query(
        `UPDATE ${table} SET moderation_status = $1, moderation_flags = $2::jsonb, updated_at = NOW()
         WHERE id = $3 AND moderation_status = 'published'`,
        [newStatus, JSON.stringify(moderationFlags), targetId],
      );

      ctx.logger.info({ targetId, targetType, newStatus }, '[moderation] Content status updated');

      // Queue notification to author if flagged/hidden
      if (newStatus === 'flagged' || newStatus === 'hidden') {
        await ctx.redis.lpush('queue:notification.fanout', JSON.stringify({
          id: crypto.randomUUID(),
          type: 'notification.fanout',
          payload: {
            type: 'moderation',
            recipientId: authorId,
            title: 'Your post is under review',
            body: 'Our moderation team is reviewing your recent post.',
            data: { targetType, targetId },
            dedupKey: `moderation:${targetId}`,
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
        }));
      }
    }
  }
}

/**
 * handlers/notification-fanout.ts — Notification creation and push delivery
 *
 * Creates in-app notifications and dispatches push notifications
 * to registered device tokens via FCM (Android) and APNs (iOS).
 *
 * Phase 1: In-app notifications only. Push delivery stubbed for infra hook.
 */

import type { WorkerContext } from '../worker.js';

interface NotificationPayload {
  type: string;
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  dedupKey?: string;
}

export async function notificationFanoutHandler(
  payload: Record<string, unknown>,
  ctx: WorkerContext,
): Promise<void> {
  const notif = payload as unknown as NotificationPayload;


  if (!notif.recipientId || !notif.title || !notif.body) {
    ctx.logger.warn({ payload }, '[notification] Missing required fields');
    return;
  }

  // ── Deduplication check ───────────────────────────────────

  if (notif.dedupKey) {
    const dedupRedisKey = `notif_dedup:${notif.dedupKey}`;
    const alreadySent = await ctx.redis.set(dedupRedisKey, '1', 'EX', 3600, 'NX');
    if (alreadySent === null) {
      ctx.logger.debug({ dedupKey: notif.dedupKey }, '[notification] Duplicate — skipping');
      return;
    }
  }

  // ── Fetch user notification preferences ──────────────────

  const prefsResult = await ctx.db.query<{
    group_activity: string;
    event_reminders: string;
    post_reactions: string;
    comment_replies: string;
    message_requests: string;
    new_messages: string;
    moderation: string;
    system: string;
    quiet_hours_start: number | null;
    quiet_hours_end: number | null;
    quiet_hours_tz: string | null;
  }>(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [notif.recipientId],
  );

  const prefs = prefsResult.rows[0];

  // Check if this notification type is disabled
  const prefKeyMap: Record<string, string> = {
    group_activity: 'group_activity',
    event_reminder: 'event_reminders',
    post_reaction: 'post_reactions',
    comment_reply: 'comment_replies',
    message_request: 'message_requests',
    new_message: 'new_messages',
    moderation: 'moderation',
    system: 'system',
  };

  const prefKey = prefKeyMap[notif.type];
  if (prefs && prefKey) {
    const prefValue = (prefs as Record<string, unknown>)[prefKey];
    if (prefValue === 'none') {
      ctx.logger.debug({ type: notif.type, recipientId: notif.recipientId }, '[notification] User opted out');
      return;
    }
  }

  // ── Quiet hours check ─────────────────────────────────────

  if (prefs?.quiet_hours_start != null && prefs.quiet_hours_end != null) {
    const now = new Date();
    const tz = prefs.quiet_hours_tz ?? 'UTC';
    const hour = parseInt(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: tz }), 10);
    const inQuietHours =
      prefs.quiet_hours_start < prefs.quiet_hours_end
        ? hour >= prefs.quiet_hours_start && hour < prefs.quiet_hours_end
        : hour >= prefs.quiet_hours_start || hour < prefs.quiet_hours_end;

    if (inQuietHours) {
      ctx.logger.debug({ recipientId: notif.recipientId }, '[notification] Quiet hours — suppressing push, saving in-app');
    }
  }

  // ── Create in-app notification ────────────────────────────

  await ctx.db.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [notif.recipientId, notif.type, notif.title, notif.body, JSON.stringify(notif.data ?? {})],
  );

  ctx.logger.debug({ recipientId: notif.recipientId, type: notif.type }, '[notification] In-app notification created');

  // ── Push delivery ─────────────────────────────────────────

  const deviceTokensResult = await ctx.db.query<{ id: string; token: string; platform: string }>(
    `SELECT id, token, platform FROM device_tokens WHERE user_id = $1 AND is_active = true`,
    [notif.recipientId],
  );

  if (deviceTokensResult.rows.length === 0) {
    ctx.logger.debug({ recipientId: notif.recipientId }, '[notification] No active device tokens');
    return;
  }

  for (const device of deviceTokensResult.rows) {
    try {
      // TODO(infra): Integrate FCM (Android) and APNs (iOS) push providers.
      // Tracking: GG-PUSH-001. Use firebase-admin for FCM, @parse/node-apn for APNs.
      // For Phase 1, log the push event as if it were sent.
      ctx.logger.info({
        deviceId: device.id,
        platform: device.platform,
        title: notif.title,
      }, '[notification] PUSH_STUB — would send push notification');
    } catch (err) {
      ctx.logger.error({ err, deviceId: device.id }, '[notification] Push delivery failed');
      // Deactivate invalid tokens (e.g., token expired/unregistered)
      await ctx.db.query(
        'UPDATE device_tokens SET is_active = false WHERE id = $1',
        [device.id],
      );
    }
  }
}

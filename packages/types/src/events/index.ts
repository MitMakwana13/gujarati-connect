// Queue event schemas — typed payloads for all background job messages

// ============================================================
// FEED
// ============================================================

export interface FeedFanoutEvent {
  type: 'feed.fanout';
  postId: string;
  authorId: string;
  groupId: string | null;
  communityId: string | null;
  groupMemberCount: number;
  createdAt: string;
  /** Dedup key: postId */
  dedupKey: string;
}

export interface FeedRefreshEvent {
  type: 'feed.refresh';
  userId: string;
  reason: 'login' | 'stale' | 'manual';
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface NotificationPushEvent {
  type: 'notification.push';
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  /** Dedup key: notificationId */
  dedupKey: string;
}

export interface NotificationDigestEvent {
  type: 'notification.digest';
  userId: string;
  frequency: 'daily' | 'weekly';
  scheduledFor: string;
  /** Dedup key: userId + scheduledFor */
  dedupKey: string;
}

// ============================================================
// MODERATION
// ============================================================

export interface ModerationScanEvent {
  type: 'moderation.scan';
  targetType: 'post' | 'comment' | 'resource';
  targetId: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  priority: 'critical' | 'high' | 'normal';
  /** Dedup key: targetId */
  dedupKey: string;
}

// ============================================================
// MEDIA
// ============================================================

export interface MediaProcessEvent {
  type: 'media.process';
  assetId: string;
  originalUrl: string;
  mediaType: 'image' | 'video' | 'document';
  uploadedBy: string;
  /** Dedup key: assetId */
  dedupKey: string;
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchIndexSyncEvent {
  type: 'search.index_sync';
  targetType: 'post' | 'event' | 'resource' | 'group' | 'profile';
  targetId: string;
  operation: 'upsert' | 'delete';
  /** Dedup key: targetType + targetId + operation */
  dedupKey: string;
}

// ============================================================
// EVENT REMINDERS
// ============================================================

export interface EventReminderEvent {
  type: 'event.reminder';
  eventId: string;
  userId: string;
  rsvpStatus: 'going' | 'interested';
  startsAt: string;
  reminderType: '24h' | '1h';
  /** Dedup key: eventId + userId + reminderType */
  dedupKey: string;
}

// ============================================================
// MAINTENANCE
// ============================================================

export interface TokenCleanupEvent {
  type: 'maintenance.token_cleanup';
  scheduledAt: string;
}

export interface StaleFeedPruneEvent {
  type: 'maintenance.stale_feed_prune';
  cutoffDays: number;
  scheduledAt: string;
}

// ============================================================
// UNION TYPE
// ============================================================

export type QueueEvent =
  | FeedFanoutEvent
  | FeedRefreshEvent
  | NotificationPushEvent
  | NotificationDigestEvent
  | ModerationScanEvent
  | MediaProcessEvent
  | SearchIndexSyncEvent
  | EventReminderEvent
  | TokenCleanupEvent
  | StaleFeedPruneEvent;

export type QueueEventType = QueueEvent['type'];

// ============================================================
// ENUMS — Single source of truth for all domain values
// ============================================================

export enum UserRole {
  User = 'user',
  Moderator = 'moderator',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}
/** String union alias — use this when working with DB result strings */
export type UserRoleLiteral = 'user' | 'moderator' | 'admin' | 'super_admin';

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
  Deactivated = 'deactivated',
}

export enum AuthProvider {
  Email = 'email',
  Google = 'google',
  Apple = 'apple',
}

export enum UserType {
  Student = 'student',
  Professional = 'professional',
  Entrepreneur = 'entrepreneur',
  Family = 'family',
  Organizer = 'organizer',
}

export enum ProfileVisibility {
  Public = 'public',
  Community = 'community',
  ConnectionsOnly = 'connections_only',
}

export enum GroupVisibility {
  Public = 'public',
  Private = 'private',
  Hidden = 'hidden',
}

export enum GroupJoinPolicy {
  Open = 'open',
  Approval = 'approval',
  InviteOnly = 'invite_only',
}

export enum MembershipRole {
  Member = 'member',
  Moderator = 'moderator',
  Admin = 'admin',
  Owner = 'owner',
}

export enum MembershipStatus {
  Active = 'active',
  Pending = 'pending',
  Banned = 'banned',
}

export enum GroupStatus {
  Active = 'active',
  Archived = 'archived',
  Suspended = 'suspended',
}

export enum ContentType {
  Text = 'text',
  Image = 'image',
  Link = 'link',
  Poll = 'poll',
}

export enum ModerationStatus {
  Published = 'published',
  UnderReview = 'under_review',
  Hidden = 'hidden',
  Removed = 'removed',
}

export enum ModerationPriority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
}

export enum ReactionType {
  Like = 'like',
  Support = 'support',
  Celebrate = 'celebrate',
}

export enum TargetType {
  User = 'user',
  Post = 'post',
  Comment = 'comment',
  Group = 'group',
  Event = 'event',
  Resource = 'resource',
  Message = 'message',
}
/** String union alias */
export type TargetTypeLiteral = 'user' | 'post' | 'comment' | 'group' | 'event' | 'resource' | 'message';

export enum EventType {
  Garba = 'garba',
  Meetup = 'meetup',
  Career = 'career',
  Cricket = 'cricket',
  Volunteering = 'volunteering',
  Housing = 'housing',
  Cultural = 'cultural',
  Religious = 'religious',
  Social = 'social',
  Other = 'other',
}

export enum EventStatus {
  Draft = 'draft',
  Upcoming = 'upcoming',
  Live = 'live',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum EventVisibility {
  Public = 'public',
  GroupOnly = 'group_only',
  InviteOnly = 'invite_only',
}

export enum AttendeeVisibility {
  Public = 'public',
  RsvpOnly = 'rsvp_only',
  OrganizerOnly = 'organizer_only',
}

export enum RsvpStatus {
  Going = 'going',
  Interested = 'interested',
  Waitlisted = 'waitlisted',
  Declined = 'declined',
}

export enum ResourceCategory {
  Housing = 'housing',
  Roommate = 'roommate',
  AirportPickup = 'airport_pickup',
  UsedItems = 'used_items',
  Referral = 'referral',
  StudentHelp = 'student_help',
  H1bHelp = 'h1b_help',
  LocalService = 'local_service',
  Other = 'other',
}

export enum ContactMethod {
  InApp = 'in_app',
  Email = 'email',
  Phone = 'phone',
}

export enum ConversationStatus {
  Active = 'active',
  Archived = 'archived',
  Deleted = 'deleted',
}

export enum MessageRequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  Blocked = 'blocked',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  System = 'system',
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  Document = 'document',
}

export enum MediaProcessingStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum ReportReason {
  Spam = 'spam',
  Harassment = 'harassment',
  HateSpeech = 'hate_speech',
  Inappropriate = 'inappropriate',
  Impersonation = 'impersonation',
  Scam = 'scam',
  Other = 'other',
}

export enum ReportStatus {
  Open = 'open',
  UnderReview = 'under_review',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

export enum ModerationAction {
  Hide = 'hide',
  Restore = 'restore',
  Delete = 'delete',
  Warn = 'warn',
  Suspend = 'suspend',
  Ban = 'ban',
  Unban = 'unban',
}

export enum NotificationPreferenceLevel {
  All = 'all',
  PushOnly = 'push_only',
  InAppOnly = 'in_app_only',
  None = 'none',
}

export enum DigestFrequency {
  Realtime = 'realtime',
  Daily = 'daily',
  Weekly = 'weekly',
  None = 'none',
}

export enum DevicePlatform {
  Ios = 'ios',
  Android = 'android',
  Web = 'web',
}

export enum PushDeliveryStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Failed = 'failed',
  Skipped = 'skipped',
}

export enum JobStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  DeadLetter = 'dead_letter',
}

export enum NotificationType {
  GroupActivity = 'group_activity',
  EventReminder = 'event_reminder',
  PostReaction = 'post_reaction',
  CommentReply = 'comment_reply',
  MessageRequest = 'message_request',
  NewMessage = 'new_message',
  Moderation = 'moderation',
  System = 'system',
}

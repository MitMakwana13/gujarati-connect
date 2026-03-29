import { z } from 'zod';

// ============================================================
// SHARED PRIMITIVES
// ============================================================

export const uuidSchema = z.string().uuid();
export const cursorSchema = z.string().optional();
export const limitSchema = z.coerce.number().int().min(1).max(50).default(20);
export const isoDateSchema = z.string().datetime();

export const paginationQuerySchema = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
});

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number',
    ),
  displayName: z.string().min(2).max(60).trim(),
  authProvider: z.enum(['email', 'google', 'apple']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const otpVerifySchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).trim().optional(),
  fullName: z.string().max(120).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  coverPhotoUrl: z.string().url().max(2048).optional(),
  currentCity: z.string().max(100).trim().optional(),
  currentCountry: z.string().max(100).trim().optional(),
  homeCityIndia: z.string().max(100).trim().optional(),
  homeStateIndia: z.string().max(100).trim().optional(),
  userType: z.enum(['student', 'professional', 'entrepreneur', 'family', 'organizer']).optional(),
  university: z.string().max(200).trim().optional(),
  company: z.string().max(200).trim().optional(),
  graduationYear: z.number().int().min(1980).max(2040).optional(),
  profession: z.string().max(200).trim().optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  languages: z.array(z.string().max(50)).max(10).optional(),
  isDiscoverable: z.boolean().optional(),
  discoveryRadiusKm: z.number().int().min(1).max(500).optional(),
  showOnlineStatus: z.boolean().optional(),
});

export const updatePrivacySchema = z.object({
  showEmail: z.boolean().optional(),
  showFullName: z.boolean().optional(),
  showUniversity: z.boolean().optional(),
  showCompany: z.boolean().optional(),
  allowMessageRequests: z.boolean().optional(),
  showInNearby: z.boolean().optional(),
  profileVisibility: z.enum(['public', 'community', 'connections_only']).optional(),
});

export const discoverUsersQuerySchema = z.object({
  cityId: uuidSchema.optional(),
  userType: z.enum(['student', 'professional', 'entrepreneur', 'family', 'organizer']).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

// ============================================================
// GROUP SCHEMAS
// ============================================================

const groupSlugRegex = /^[a-z0-9-]+$/;

export const createGroupSchema = z.object({
  communityId: uuidSchema.optional(),
  name: z.string().min(3).max(100).trim(),
  slug: z.string().min(3).max(100).regex(groupSlugRegex, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  description: z.string().max(1000).trim().optional(),
  visibility: z.enum(['public', 'private', 'hidden']),
  joinPolicy: z.enum(['open', 'approval', 'invite_only']),
  maxMembers: z.number().int().min(2).max(1_000_000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  coverImageUrl: z.string().url().max(2048).optional(),
  visibility: z.enum(['public', 'private', 'hidden']).optional(),
  joinPolicy: z.enum(['open', 'approval', 'invite_only']).optional(),
  maxMembers: z.number().int().min(2).max(1_000_000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const groupListQuerySchema = z.object({
  communityId: uuidSchema.optional(),
  cityId: uuidSchema.optional(),
  tag: z.string().max(50).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

// ============================================================
// POST SCHEMAS
// ============================================================

export const createPostSchema = z
  .object({
    groupId: uuidSchema.optional(),
    communityId: uuidSchema.optional(),
    contentType: z.enum(['text', 'image', 'link', 'poll']),
    body: z.string().min(1).max(10_000).trim().optional(),
    mediaUrls: z.array(z.string().url().max(2048)).max(10).optional(),
    linkUrl: z.string().url().max(2048).optional(),
  })
  .refine((d) => d.groupId ?? d.communityId, {
    message: 'Post must belong to a group or community',
  })
  .refine((d) => d.body ?? (d.mediaUrls && d.mediaUrls.length > 0) ?? d.linkUrl, {
    message: 'Post must have body, media, or link',
  });

export const updatePostSchema = z.object({
  body: z.string().min(1).max(10_000).trim().optional(),
  mediaUrls: z.array(z.string().url().max(2048)).max(10).optional(),
});

export const postListQuerySchema = z.object({
  groupId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  authorId: uuidSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const reactToPostSchema = z.object({
  reaction: z.enum(['like', 'support', 'celebrate']),
});

// ============================================================
// COMMENT SCHEMAS
// ============================================================

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
  parentId: uuidSchema.optional(),
});

// ============================================================
// EVENT SCHEMAS
// ============================================================

export const createEventSchema = z.object({
  groupId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(5000).trim().optional(),
  eventType: z
    .enum(['garba', 'meetup', 'career', 'cricket', 'volunteering', 'housing', 'cultural', 'religious', 'social', 'other'])
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  venueName: z.string().max(200).trim().optional(),
  venueAddress: z.string().max(500).trim().optional(),
  cityId: uuidSchema.optional(),
  startsAt: isoDateSchema,
  endsAt: isoDateSchema.optional(),
  timezone: z.string().max(100),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().max(500).optional(),
  maxAttendees: z.number().int().min(1).max(100_000).optional(),
  waitlistEnabled: z.boolean().default(false),
  visibility: z.enum(['public', 'group_only', 'invite_only']).default('public'),
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  coverImageUrl: z.string().url().max(2048).optional(),
  venueName: z.string().max(200).trim().optional(),
  venueAddress: z.string().max(500).trim().optional(),
  startsAt: isoDateSchema.optional(),
  endsAt: isoDateSchema.optional(),
  maxAttendees: z.number().int().min(1).max(100_000).optional(),
  visibility: z.enum(['public', 'group_only', 'invite_only']).optional(),
  status: z.enum(['upcoming', 'cancelled']).optional(),
});

export const eventListQuerySchema = z.object({
  groupId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  cityId: uuidSchema.optional(),
  eventType: z
    .enum(['garba', 'meetup', 'career', 'cricket', 'volunteering', 'housing', 'cultural', 'religious', 'social', 'other'])
    .optional(),
  startsAfter: isoDateSchema.optional(),
  startsBefore: isoDateSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const rsvpSchema = z.object({
  status: z.enum(['going', 'interested', 'declined']),
});

// ============================================================
// RESOURCE SCHEMAS
// ============================================================

export const createResourceSchema = z.object({
  cityId: uuidSchema.optional(),
  category: z.enum([
    'housing', 'roommate', 'airport_pickup', 'used_items',
    'referral', 'student_help', 'h1b_help', 'local_service', 'other',
  ]),
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  mediaUrls: z.array(z.string().url().max(2048)).max(5).optional(),
  contactMethod: z.enum(['in_app', 'email', 'phone']).default('in_app'),
  contactDetail: z.string().max(500).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  currency: z.string().length(3).toUpperCase().default('USD'),
  expiresAt: isoDateSchema.optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().min(10).max(5000).trim().optional(),
  mediaUrls: z.array(z.string().url().max(2048)).max(5).optional(),
  isActive: z.boolean().optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  expiresAt: isoDateSchema.optional(),
});

export const resourceListQuerySchema = z.object({
  cityId: uuidSchema.optional(),
  category: z
    .enum(['housing', 'roommate', 'airport_pickup', 'used_items', 'referral', 'student_help', 'h1b_help', 'local_service', 'other'])
    .optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

// ============================================================
// MESSAGING SCHEMAS
// ============================================================

export const sendMessageRequestSchema = z.object({
  toUserId: uuidSchema,
  messagePreview: z.string().min(1).max(500).trim(),
});

export const respondMessageRequestSchema = z.object({
  status: z.enum(['accepted', 'declined', 'blocked']),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(10_000).trim().optional(),
  mediaUrls: z.array(z.string().url().max(2048)).max(5).optional(),
  messageType: z.enum(['text', 'image']).default('text'),
}).refine((d) => d.body ?? (d.mediaUrls && d.mediaUrls.length > 0), {
  message: 'Message must have body or media',
});

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

const prefLevel = z.enum(['all', 'push_only', 'in_app_only', 'none']);

export const updateNotificationPreferencesSchema = z.object({
  groupActivity: prefLevel.optional(),
  eventReminders: prefLevel.optional(),
  postReactions: prefLevel.optional(),
  commentReplies: prefLevel.optional(),
  messageRequests: prefLevel.optional(),
  newMessages: prefLevel.optional(),
  moderation: prefLevel.optional(),
  system: prefLevel.optional(),
  digestFrequency: z.enum(['realtime', 'daily', 'weekly', 'none']).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursTz: z.string().max(100).optional(),
});

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(1).max(1024),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().max(256).optional(),
});

// ============================================================
// SEARCH SCHEMAS
// ============================================================

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).trim(),
  type: z.enum(['users', 'groups', 'events', 'posts', 'resources', 'all']).default('all'),
  cityId: uuidSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

// ============================================================
// MEDIA SCHEMAS
// ============================================================

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf'] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// ============================================================
// REPORT SCHEMAS
// ============================================================

export const createReportSchema = z.object({
  targetType: z.enum(['user', 'post', 'comment', 'group', 'event', 'resource', 'message']),
  targetId: uuidSchema,
  reason: z.enum(['spam', 'harassment', 'hate_speech', 'inappropriate', 'impersonation', 'scam', 'other']),
  description: z.string().max(2000).trim().optional(),
});

// ============================================================
// ADMIN SCHEMAS
// ============================================================

export const moderationActionSchema = z.object({
  action: z.enum(['hide', 'restore', 'delete', 'warn', 'suspend', 'ban', 'unban']),
  reason: z.string().min(5).max(1000).trim(),
  reportId: uuidSchema.optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(['open', 'under_review', 'resolved', 'dismissed']),
  assignedTo: uuidSchema.optional(),
  resolution: z
    .enum(['content_removed', 'user_warned', 'user_suspended', 'user_banned', 'no_action', 'false_report'])
    .optional(),
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned', 'deactivated']),
  reason: z.string().min(5).max(1000).trim(),
});

export const adminUserQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.enum(['user', 'moderator', 'admin']).optional(),
  q: z.string().max(200).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const moderationQueueQuerySchema = z.object({
  priority: z.enum(['critical', 'high', 'normal']).optional(),
  status: z.enum(['under_review', 'hidden']).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const auditLogQuerySchema = z.object({
  actorId: uuidSchema.optional(),
  targetType: z
    .enum(['user', 'post', 'comment', 'group', 'event', 'resource', 'message'])
    .optional(),
  targetId: uuidSchema.optional(),
  action: z.string().max(100).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
});

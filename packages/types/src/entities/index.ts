import type {
  AuthProvider,
  DevicePlatform,
  DigestFrequency,
  GroupJoinPolicy,
  GroupStatus,
  GroupVisibility,
  JobStatus,
  MediaProcessingStatus,
  MediaType,
  MembershipRole,
  MembershipStatus,
  ModerationPriority,
  ModerationStatus,
  NotificationPreferenceLevel,
  NotificationType,
  ProfileVisibility,
  PushDeliveryStatus,
  ReactionType,
  ResourceCategory,
  RsvpStatus,
  TargetType,
  UserRole,
  UserStatus,
  UserType,
  ContentType,
  EventStatus,
  EventType,
  EventVisibility,
  AttendeeVisibility,
  ConversationStatus,
  MessageType,
  MessageRequestStatus,
  ContactMethod,
  ReportReason,
  ReportStatus,
  ModerationAction,
} from '../enums/index.js';

// ============================================================
// BASE ENTITY
// ============================================================

export interface BaseEntity {
  id: string; // UUID
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================
// USERS AND IDENTITY
// ============================================================

export interface User extends BaseEntity {
  email: string;
  emailVerified: boolean;
  authProvider: AuthProvider | null;
  authProviderId: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
}

/** Subset of User returned to authenticated clients (no PII fields like password_hash) */
export interface UserPublic {
  id: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UserWithProfile extends UserPublic {
  profile: Profile | null;
}

export interface Profile extends BaseEntity {
  userId: string;
  displayName: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  homeCityIndia: string | null;
  homeStateIndia: string | null;
  userType: UserType | null;
  university: string | null;
  company: string | null;
  graduationYear: number | null;
  profession: string | null;
  interests: string[];
  languages: string[];
  isDiscoverable: boolean;
  discoveryRadiusKm: number | null;
  showOnlineStatus: boolean;
}

export interface PrivacySettings extends BaseEntity {
  userId: string;
  showEmail: boolean;
  showFullName: boolean;
  showUniversity: boolean;
  showCompany: boolean;
  allowMessageRequests: boolean;
  showInNearby: boolean;
  profileVisibility: ProfileVisibility;
}

// ============================================================
// GEOGRAPHY
// ============================================================

export interface City extends BaseEntity {
  name: string;
  stateProvince: string | null;
  country: string;
  countryCode: string;
  /** Never exposed publicly — internal only */
  latitude: number | null;
  /** Never exposed publicly — internal only */
  longitude: number | null;
  timezone: string | null;
  population: number | null;
  isActive: boolean;
}

/** Public representation of a city — no exact coordinates */
export interface CityPublic {
  id: string;
  name: string;
  stateProvince: string | null;
  country: string;
  countryCode: string;
  timezone: string | null;
}

// ============================================================
// COMMUNITIES AND GROUPS
// ============================================================

export interface Community extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  cityId: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  isOfficial: boolean;
  status: GroupStatus;
  createdBy: string;
}

export interface Group extends BaseEntity {
  communityId: string | null;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  visibility: GroupVisibility;
  joinPolicy: GroupJoinPolicy;
  memberCount: number;
  maxMembers: number | null;
  tags: string[];
  status: GroupStatus;
  createdBy: string;
}

export interface GroupMembership extends BaseEntity {
  groupId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
}

// ============================================================
// POSTS AND INTERACTIONS
// ============================================================

export interface Post extends BaseEntity {
  authorId: string;
  groupId: string | null;
  communityId: string | null;
  contentType: ContentType;
  body: string | null;
  mediaUrls: string[];
  linkUrl: string | null;
  linkPreview: LinkPreview | null;
  moderationStatus: ModerationStatus;
  moderationPriority: ModerationPriority | null;
  moderationFlags: ModerationFlags | null;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  isPinned: boolean;
  deletedAt: string | null;
}

export interface LinkPreview {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export interface ModerationFlags {
  textRiskScore: number | null;
  imageRiskScore: number | null;
  linkRiskScore: number | null;
  isNewAccount: boolean;
  isFirstPost: boolean;
  hasPriorReports: boolean;
  hasPriorActions: boolean;
  postBurstDetected: boolean;
}

export interface Comment extends BaseEntity {
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  likeCount: number;
  moderationStatus: ModerationStatus;
  deletedAt: string | null;
}

export interface Reaction extends BaseEntity {
  userId: string;
  targetType: TargetType;
  targetId: string;
  reaction: ReactionType;
}

// ============================================================
// EVENTS
// ============================================================

export interface Event extends BaseEntity {
  groupId: string | null;
  communityId: string | null;
  organizerId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  eventType: EventType | null;
  tags: string[];
  venueName: string | null;
  venueAddress: string | null;
  cityId: string | null;
  /** Only exposed to confirmed RSVPs */
  latitude: number | null;
  /** Only exposed to confirmed RSVPs */
  longitude: number | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  maxAttendees: number | null;
  rsvpCount: number;
  waitlistEnabled: boolean;
  visibility: EventVisibility;
  attendeeVisibility: AttendeeVisibility;
  status: EventStatus;
  deletedAt: string | null;
}

export interface EventRsvp extends BaseEntity {
  eventId: string;
  userId: string;
  status: RsvpStatus;
}

// ============================================================
// RESOURCE BOARD
// ============================================================

export interface ResourceListing extends BaseEntity {
  authorId: string;
  cityId: string | null;
  category: ResourceCategory;
  title: string;
  description: string;
  mediaUrls: string[];
  contactMethod: ContactMethod;
  /**
   * Only shown to logged-in community members.
   * Never expose to unauthenticated requests.
   */
  contactDetail: string | null;
  price: number | null;
  currency: string | null;
  isActive: boolean;
  expiresAt: string | null;
  moderationStatus: ModerationStatus;
  deletedAt: string | null;
}

// ============================================================
// MESSAGING
// ============================================================

export interface Conversation extends BaseEntity {
  participantCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  status: ConversationStatus;
}

export interface ConversationParticipant extends BaseEntity {
  conversationId: string;
  userId: string;
  role: 'participant' | 'admin';
  status: 'active' | 'left' | 'removed';
  lastReadAt: string | null;
  mutedUntil: string | null;
  joinedAt: string;
}

export interface MessageRequest extends BaseEntity {
  fromUserId: string;
  toUserId: string;
  conversationId: string | null;
  status: MessageRequestStatus;
  messagePreview: string | null;
  respondedAt: string | null;
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  body: string | null;
  mediaUrls: string[];
  messageType: MessageType;
  isEdited: boolean;
  deletedAt: string | null;
}

// ============================================================
// MEDIA
// ============================================================

export interface MediaAsset {
  id: string;
  uploadedBy: string;
  originalUrl: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  mediaType: MediaType;
  mimeType: string;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  processingStatus: MediaProcessingStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================
// MODERATION AND TRUST
// ============================================================

export interface Report extends BaseEntity {
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface ModerationActionRecord extends BaseEntity {
  moderatorId: string;
  targetType: TargetType;
  targetId: string;
  action: ModerationAction;
  reason: string;
  reportId: string | null;
  isReversible: boolean;
  reversedAt: string | null;
  reversedBy: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface NotificationPreferences extends BaseEntity {
  userId: string;
  groupActivity: NotificationPreferenceLevel;
  eventReminders: NotificationPreferenceLevel;
  postReactions: NotificationPreferenceLevel;
  commentReplies: NotificationPreferenceLevel;
  messageRequests: NotificationPreferenceLevel;
  newMessages: NotificationPreferenceLevel;
  moderation: NotificationPreferenceLevel;
  system: NotificationPreferenceLevel;
  digestFrequency: DigestFrequency;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTz: string | null;
}

export interface DeviceToken extends BaseEntity {
  userId: string;
  token: string;
  platform: DevicePlatform;
  deviceId: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  pushSent: boolean;
  pushSentAt: string | null;
  pushDeliveryStatus: PushDeliveryStatus | null;
  createdAt: string;
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorRole: UserRole;
  action: string;
  targetType: TargetType | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  /** Never expose raw IP addresses in public API responses */
  ipAddress: string | null;
  createdAt: string;
}

// ============================================================
// BACKGROUND JOBS
// ============================================================

export interface JobLogEntry {
  id: string;
  jobType: string;
  jobId: string;
  status: JobStatus;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

import type {
  City,
  CityPublic,
  Comment,
  Community,
  Event,
  EventRsvp,
  Group,
  GroupMembership,
  MediaAsset,
  Message,
  MessageRequest,
  ModerationActionRecord,
  Notification,
  NotificationPreferences,
  Post,
  PrivacySettings,
  Profile,
  Report,
  ResourceListing,
  UserWithProfile,
  Conversation,
  ConversationParticipant,
  DeviceToken,
  AuditLogEntry,
} from '../entities/index.js';
import type {
  AuthProvider,
  ContentType,
  DevicePlatform,
  DigestFrequency,
  EventType,
  EventVisibility,
  GroupJoinPolicy,
  GroupVisibility,
  ModerationAction,
  NotificationPreferenceLevel,
  ReactionType,
  ReportReason,
  ResourceCategory,
  RsvpStatus,
  TargetType,
  UserType,
  ModerationPriority,
  ModerationStatus,
  ReportStatus,
  AttendeeVisibility,
  ContactMethod,
} from '../enums/index.js';

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  errors: ApiError[];
}

// ============================================================
// AUTH DTOs
// ============================================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  authProvider?: AuthProvider;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthResponse {
  user: UserWithProfile;
  tokens: AuthTokens;
}

// ============================================================
// USER / PROFILE DTOs
// ============================================================

export interface UpdateProfileRequest {
  displayName?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  currentCity?: string;
  currentCountry?: string;
  homeCityIndia?: string;
  homeStateIndia?: string;
  userType?: UserType;
  university?: string;
  company?: string;
  graduationYear?: number;
  profession?: string;
  interests?: string[];
  languages?: string[];
  isDiscoverable?: boolean;
  discoveryRadiusKm?: number;
  showOnlineStatus?: boolean;
}

export interface UpdatePrivacyRequest {
  showEmail?: boolean;
  showFullName?: boolean;
  showUniversity?: boolean;
  showCompany?: boolean;
  allowMessageRequests?: boolean;
  showInNearby?: boolean;
  profileVisibility?: 'public' | 'community' | 'connections_only';
}

export interface DiscoverUsersQuery {
  cityId?: string;
  userType?: UserType;
  cursor?: string;
  limit?: number;
}

export interface ProfileResponse {
  user: UserWithProfile;
  privacy: PrivacySettings;
}

// ============================================================
// COMMUNITY DTOs
// ============================================================

export interface CommunityListQuery {
  cityId?: string;
  cursor?: string;
  limit?: number;
}

export interface CommunityWithCity extends Community {
  city: CityPublic | null;
}

// ============================================================
// GROUP DTOs
// ============================================================

export interface CreateGroupRequest {
  communityId?: string;
  name: string;
  description?: string;
  visibility: GroupVisibility;
  joinPolicy: GroupJoinPolicy;
  maxMembers?: number;
  tags?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  visibility?: GroupVisibility;
  joinPolicy?: GroupJoinPolicy;
  maxMembers?: number;
  tags?: string[];
}

export interface GroupListQuery {
  communityId?: string;
  cityId?: string;
  tag?: string;
  cursor?: string;
  limit?: number;
}

export interface GroupWithMembership extends Group {
  myMembership: GroupMembership | null;
}

export interface GroupMembersQuery {
  cursor?: string;
  limit?: number;
}

// ============================================================
// POST DTOs
// ============================================================

export interface CreatePostRequest {
  groupId?: string;
  communityId?: string;
  contentType: ContentType;
  body?: string;
  mediaUrls?: string[];
  linkUrl?: string;
}

export interface UpdatePostRequest {
  body?: string;
  mediaUrls?: string[];
}

export interface PostListQuery {
  groupId?: string;
  communityId?: string;
  authorId?: string;
  cursor?: string;
  limit?: number;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  myReaction: ReactionType | null;
}

export interface ReactToPostRequest {
  reaction: ReactionType;
}

// ============================================================
// COMMENT DTOs
// ============================================================

export interface CreateCommentRequest {
  body: string;
  parentId?: string;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ============================================================
// EVENT DTOs
// ============================================================

export interface CreateEventRequest {
  groupId?: string;
  communityId?: string;
  title: string;
  description?: string;
  eventType?: EventType;
  tags?: string[];
  venueName?: string;
  venueAddress?: string;
  cityId?: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  maxAttendees?: number;
  waitlistEnabled?: boolean;
  visibility?: EventVisibility;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  venueName?: string;
  venueAddress?: string;
  startsAt?: string;
  endsAt?: string;
  maxAttendees?: number;
  visibility?: EventVisibility;
  status?: 'upcoming' | 'cancelled';
}

export interface EventListQuery {
  groupId?: string;
  communityId?: string;
  cityId?: string;
  eventType?: EventType;
  startsAfter?: string;
  startsBefore?: string;
  cursor?: string;
  limit?: number;
}

export interface RsvpRequest {
  status: RsvpStatus;
}

export interface EventWithRsvp extends Event {
  myRsvp: EventRsvp | null;
  city: CityPublic | null;
}

// ============================================================
// RESOURCE DTOs
// ============================================================

export interface CreateResourceRequest {
  cityId?: string;
  category: ResourceCategory;
  title: string;
  description: string;
  mediaUrls?: string[];
  contactMethod?: ContactMethod;
  contactDetail?: string;
  price?: number;
  currency?: string;
  expiresAt?: string;
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  mediaUrls?: string[];
  isActive?: boolean;
  price?: number;
  expiresAt?: string;
}

export interface ResourceListQuery {
  cityId?: string;
  category?: ResourceCategory;
  cursor?: string;
  limit?: number;
}

// ============================================================
// MESSAGING DTOs
// ============================================================

export interface SendMessageRequestDto {
  toUserId: string;
  messagePreview: string;
}

export interface RespondMessageRequestDto {
  status: 'accepted' | 'declined' | 'blocked';
}

export interface SendMessageDto {
  body?: string;
  mediaUrls?: string[];
  messageType?: 'text' | 'image';
}

export interface ConversationWithParticipants extends Conversation {
  participants: ConversationParticipant[];
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ============================================================
// NOTIFICATION DTOs
// ============================================================

export interface UpdateNotificationPreferencesRequest {
  groupActivity?: NotificationPreferenceLevel;
  eventReminders?: NotificationPreferenceLevel;
  postReactions?: NotificationPreferenceLevel;
  commentReplies?: NotificationPreferenceLevel;
  messageRequests?: NotificationPreferenceLevel;
  newMessages?: NotificationPreferenceLevel;
  moderation?: NotificationPreferenceLevel;
  system?: NotificationPreferenceLevel;
  digestFrequency?: DigestFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTz?: string;
}

export interface RegisterDeviceTokenRequest {
  token: string;
  platform: DevicePlatform;
  deviceId?: string;
}

// ============================================================
// SEARCH DTOs
// ============================================================

export interface SearchQuery {
  q: string;
  type?: 'users' | 'groups' | 'events' | 'posts' | 'resources' | 'all';
  cityId?: string;
  cursor?: string;
  limit?: number;
}

export interface SearchResults {
  users: Profile[];
  groups: Group[];
  events: Event[];
  posts: Post[];
  resources: ResourceListing[];
  meta: PaginationMeta;
}

// ============================================================
// MEDIA DTOs
// ============================================================

export interface MediaUploadResponse {
  asset: MediaAsset;
  uploadUrl?: string; // presigned URL for client-side upload
}

// ============================================================
// REPORT DTOs
// ============================================================

export interface CreateReportRequest {
  targetType: TargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

// ============================================================
// ADMIN DTOs
// ============================================================

export interface ModerationQueueItem {
  post: Post;
  author: {
    id: string;
    displayName: string;
    email: string;
    createdAt: string;
  };
  report?: Report;
  age: number; // seconds since created
}

export interface ModerationQueueQuery {
  priority?: ModerationPriority;
  status?: ModerationStatus;
  cursor?: string;
  limit?: number;
}

export interface ModerationActionRequest {
  action: ModerationAction;
  reason: string;
  reportId?: string;
}

export interface AdminUserManagementQuery {
  status?: 'active' | 'suspended' | 'banned';
  role?: 'user' | 'moderator' | 'admin';
  cursor?: string;
  limit?: number;
  q?: string;
}

export interface AdminUpdateUserStatusRequest {
  status: 'active' | 'suspended' | 'banned' | 'deactivated';
  reason: string;
}

export interface AdminUpdateReportRequest {
  status: ReportStatus;
  assignedTo?: string;
  resolution?: string;
}

export interface AuditLogQuery {
  actorId?: string;
  targetType?: TargetType;
  targetId?: string;
  action?: string;
  cursor?: string;
  limit?: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers24h: number;
  totalPosts: number;
  postsToday: number;
  openReports: number;
  criticalModerationItems: number;
  totalGroups: number;
  totalEvents: number;
  dlqDepth: number;
}

// Re-export entity and city types for convenience in API layer
export type {
  City,
  CityPublic,
  Comment,
  Community,
  Event,
  EventRsvp,
  Group,
  GroupMembership,
  MediaAsset,
  Message,
  MessageRequest,
  ModerationActionRecord,
  Notification,
  NotificationPreferences,
  Post,
  PrivacySettings,
  Profile,
  Report,
  ResourceListing,
  UserWithProfile,
  Conversation,
  ConversationParticipant,
  DeviceToken,
  AuditLogEntry,
};

-- ============================================================
-- Migration 001: Initial Schema
-- Gujarati Global Platform
-- Created: 2026-03-26
-- ============================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for trigram similarity search

-- ============================================================
-- ENUMS (use CHECK constraints inline for portability)
-- ============================================================

-- ============================================================
-- USERS AND IDENTITY
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   TEXT,
    auth_provider   TEXT CHECK (auth_provider IN ('email', 'google', 'apple')),
    auth_provider_id TEXT,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deactivated')),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auth_provider UNIQUE (auth_provider, auth_provider_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'active';
CREATE INDEX idx_users_role ON users(role) WHERE role != 'user';
CREATE INDEX idx_users_created_at ON users(created_at DESC);

COMMENT ON TABLE users IS 'Core identity table. password_hash is NULL for social-only auth. Coordinates never stored here.';
COMMENT ON COLUMN users.status IS 'active = normal, suspended = temporary, banned = permanent, deactivated = user-requested';

CREATE TABLE profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name        TEXT NOT NULL CHECK (LENGTH(display_name) BETWEEN 2 AND 60),
    full_name           TEXT,
    bio                 TEXT CHECK (LENGTH(bio) <= 500),
    avatar_url          TEXT,
    cover_photo_url     TEXT,

    -- Location: city-level only. NEVER store exact coordinates in profile.
    current_city        TEXT,
    current_country     TEXT,
    home_city_india     TEXT,
    home_state_india    TEXT,

    -- Identity
    user_type           TEXT CHECK (user_type IN ('student', 'professional', 'entrepreneur', 'family', 'organizer')),
    university          TEXT,
    company             TEXT,
    graduation_year     INTEGER CHECK (graduation_year BETWEEN 1980 AND 2040),
    profession          TEXT,

    -- Discovery
    interests           TEXT[] NOT NULL DEFAULT '{}',
    languages           TEXT[] NOT NULL DEFAULT '{}',
    is_discoverable     BOOLEAN NOT NULL DEFAULT TRUE,
    discovery_radius_km INTEGER CHECK (discovery_radius_km > 0 AND discovery_radius_km <= 500),
    show_online_status  BOOLEAN NOT NULL DEFAULT FALSE,

    -- Search
    search_vector       TSVECTOR,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_search ON profiles USING GIN(search_vector);
CREATE INDEX idx_profiles_discoverable ON profiles(is_discoverable, user_type) WHERE is_discoverable = TRUE;
CREATE INDEX idx_profiles_city ON profiles(current_city, current_country);

COMMENT ON COLUMN profiles.discovery_radius_km IS 'NULL = city-level only discovery, value = radius in km for nearby';

CREATE TABLE privacy_settings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_email              BOOLEAN NOT NULL DEFAULT FALSE,
    show_full_name          BOOLEAN NOT NULL DEFAULT TRUE,
    show_university         BOOLEAN NOT NULL DEFAULT TRUE,
    show_company            BOOLEAN NOT NULL DEFAULT TRUE,
    allow_message_requests  BOOLEAN NOT NULL DEFAULT TRUE,
    show_in_nearby          BOOLEAN NOT NULL DEFAULT FALSE,  -- explicit opt-in only
    profile_visibility      TEXT NOT NULL DEFAULT 'community' CHECK (profile_visibility IN ('public', 'community', 'connections_only')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN privacy_settings.show_in_nearby IS 'Explicit opt-in. Default FALSE. Never expose location without user consent.';

-- ============================================================
-- GEOGRAPHY
-- ============================================================

CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    state_province  TEXT,
    country         TEXT NOT NULL,
    country_code    CHAR(2) NOT NULL,
    -- Internal use only. Never expose in API responses.
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    timezone        TEXT,
    population      INTEGER,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, state_province, country_code)
);

CREATE INDEX idx_cities_country ON cities(country_code, is_active);
CREATE INDEX idx_cities_name ON cities USING GIN(to_tsvector('english', name));

COMMENT ON COLUMN cities.latitude IS 'Internal use only. Never expose in public API responses.';
COMMENT ON COLUMN cities.longitude IS 'Internal use only. Never expose in public API responses.';

-- ============================================================
-- COMMUNITIES AND GROUPS
-- ============================================================

CREATE TABLE communities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (LENGTH(name) BETWEEN 3 AND 100),
    slug            TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description     TEXT CHECK (LENGTH(description) <= 2000),
    city_id         UUID REFERENCES cities(id),
    cover_image_url TEXT,
    member_count    INTEGER NOT NULL DEFAULT 0 CHECK (member_count >= 0),
    is_official     BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communities_city ON communities(city_id) WHERE status = 'active';
CREATE INDEX idx_communities_slug ON communities(slug);

CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id    UUID REFERENCES communities(id),
    name            TEXT NOT NULL CHECK (LENGTH(name) BETWEEN 3 AND 100),
    slug            TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description     TEXT CHECK (LENGTH(description) <= 2000),
    cover_image_url TEXT,
    visibility      TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
    join_policy     TEXT NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open', 'approval', 'invite_only')),
    member_count    INTEGER NOT NULL DEFAULT 0 CHECK (member_count >= 0),
    max_members     INTEGER CHECK (max_members > 0),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_community ON groups(community_id) WHERE status = 'active';
CREATE INDEX idx_groups_slug ON groups(slug);
CREATE INDEX idx_groups_visibility ON groups(visibility, status) WHERE visibility != 'hidden';
CREATE INDEX idx_groups_member_count ON groups(member_count DESC) WHERE status = 'active';
CREATE INDEX idx_groups_tags ON groups USING GIN(tags);

CREATE TABLE group_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_memberships_user ON group_memberships(user_id, status) WHERE status = 'active';
CREATE INDEX idx_memberships_group ON group_memberships(group_id, role) WHERE status = 'active';

-- ============================================================
-- POSTS AND INTERACTIONS
-- ============================================================

CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id),
    group_id        UUID REFERENCES groups(id),
    community_id    UUID REFERENCES communities(id),

    content_type    TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'link', 'poll')),
    body            TEXT,
    media_urls      TEXT[] NOT NULL DEFAULT '{}',
    link_url        TEXT,
    link_preview    JSONB,

    -- Optimistic publish. Async moderation reviews after publication.
    moderation_status TEXT NOT NULL DEFAULT 'published' CHECK (moderation_status IN ('published', 'under_review', 'hidden', 'removed')),
    moderation_priority TEXT CHECK (moderation_priority IN ('critical', 'high', 'normal')),
    moderation_flags  JSONB,

    -- Denormalized counters. Updated by worker or trigger.
    like_count      INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    comment_count   INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
    save_count      INTEGER NOT NULL DEFAULT 0 CHECK (save_count >= 0),
    share_count     INTEGER NOT NULL DEFAULT 0 CHECK (share_count >= 0),

    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    search_vector   TSVECTOR,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT posts_must_have_context CHECK (group_id IS NOT NULL OR community_id IS NOT NULL),
    CONSTRAINT posts_must_have_content CHECK (body IS NOT NULL OR array_length(media_urls, 1) > 0 OR link_url IS NOT NULL)
);

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_group ON posts(group_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_community ON posts(community_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_moderation ON posts(moderation_status, moderation_priority, created_at DESC) WHERE moderation_status != 'published';
CREATE INDEX idx_posts_pinned ON posts(group_id, is_pinned) WHERE is_pinned = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_posts_moderation_flags ON posts USING GIN(moderation_flags) WHERE moderation_flags IS NOT NULL;

COMMENT ON COLUMN posts.moderation_status IS 'published = live. Optimistic publishing — async moderation reviews after go-live.';
COMMENT ON COLUMN posts.deleted_at IS 'Soft-delete. Hard-delete only for illegal content by super_admin.';

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    parent_id       UUID REFERENCES comments(id),  -- NULL = top-level, value = nested reply
    body            TEXT NOT NULL CHECK (LENGTH(body) BETWEEN 1 AND 5000),
    like_count      INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    moderation_status TEXT NOT NULL DEFAULT 'published' CHECK (moderation_status IN ('published', 'under_review', 'hidden', 'removed')),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE reactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id   UUID NOT NULL,
    reaction    TEXT NOT NULL DEFAULT 'like' CHECK (reaction IN ('like', 'support', 'celebrate')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id            UUID REFERENCES groups(id),
    community_id        UUID REFERENCES communities(id),
    organizer_id        UUID NOT NULL REFERENCES users(id),
    title               TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 3 AND 200),
    description         TEXT CHECK (LENGTH(description) <= 5000),
    cover_image_url     TEXT,

    event_type          TEXT CHECK (event_type IN ('garba', 'meetup', 'career', 'cricket', 'volunteering', 'housing', 'cultural', 'religious', 'social', 'other')),
    tags                TEXT[] NOT NULL DEFAULT '{}',

    -- Public: venue name and city only
    venue_name          TEXT,
    venue_address       TEXT,
    city_id             UUID REFERENCES cities(id),
    -- Exact coordinates ONLY for confirmed RSVPs. Never return publicly.
    latitude            DECIMAL(9,6),
    longitude           DECIMAL(9,6),

    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ,
    timezone            TEXT NOT NULL,
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule     TEXT,  -- iCal RRULE format

    max_attendees       INTEGER CHECK (max_attendees > 0),
    rsvp_count          INTEGER NOT NULL DEFAULT 0 CHECK (rsvp_count >= 0),
    waitlist_enabled    BOOLEAN NOT NULL DEFAULT FALSE,

    visibility          TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'group_only', 'invite_only')),
    attendee_visibility TEXT NOT NULL DEFAULT 'rsvp_only' CHECK (attendee_visibility IN ('public', 'rsvp_only', 'organizer_only')),

    status              TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'live', 'completed', 'cancelled')),
    search_vector       TSVECTOR,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT events_ends_after_starts CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_events_search ON events USING GIN(search_vector);
CREATE INDEX idx_events_upcoming ON events(city_id, starts_at ASC)
    WHERE status IN ('upcoming', 'live') AND deleted_at IS NULL AND visibility = 'public';
CREATE INDEX idx_events_group ON events(group_id, starts_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_type ON events(event_type) WHERE deleted_at IS NULL;

COMMENT ON COLUMN events.latitude IS 'Exact coordinates. ONLY returned to users with confirmed RSVP status = going. Never public.';
COMMENT ON COLUMN events.longitude IS 'Exact coordinates. ONLY returned to users with confirmed RSVP status = going. Never public.';

CREATE TABLE event_rsvps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'waitlisted', 'declined')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON event_rsvps(event_id, status);
CREATE INDEX idx_rsvps_user ON event_rsvps(user_id, status);

-- ============================================================
-- RESOURCE BOARD
-- ============================================================

CREATE TABLE resource_listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id),
    city_id         UUID REFERENCES cities(id),
    category        TEXT NOT NULL CHECK (category IN ('housing', 'roommate', 'airport_pickup', 'used_items', 'referral', 'student_help', 'h1b_help', 'local_service', 'other')),
    title           TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 3 AND 200),
    description     TEXT NOT NULL CHECK (LENGTH(description) BETWEEN 10 AND 5000),
    media_urls      TEXT[] NOT NULL DEFAULT '{}',
    contact_method  TEXT NOT NULL DEFAULT 'in_app' CHECK (contact_method IN ('in_app', 'email', 'phone')),
    -- contact_detail: NEVER return to unauthenticated users
    contact_detail  TEXT,
    price           DECIMAL(10,2) CHECK (price >= 0),
    currency        CHAR(3) DEFAULT 'USD',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    moderation_status TEXT NOT NULL DEFAULT 'published' CHECK (moderation_status IN ('published', 'under_review', 'hidden', 'removed')),
    search_vector   TSVECTOR,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_search ON resource_listings USING GIN(search_vector);
CREATE INDEX idx_resources_city_category ON resource_listings(city_id, category, created_at DESC)
    WHERE is_active = TRUE AND deleted_at IS NULL AND moderation_status = 'published';
CREATE INDEX idx_resources_author ON resource_listings(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_resources_expiry ON resource_listings(expires_at) WHERE is_active = TRUE AND expires_at IS NOT NULL;

COMMENT ON COLUMN resource_listings.contact_detail IS 'NEVER return to unauthenticated users. NEVER expose to non-community members.';

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_count   INTEGER NOT NULL DEFAULT 2 CHECK (participant_count >= 2),
    last_message_at     TIMESTAMPTZ,
    last_message_preview TEXT CHECK (LENGTH(last_message_preview) <= 200),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
    last_read_at    TIMESTAMPTZ,
    muted_until     TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_user ON conversation_participants(user_id, status) WHERE status = 'active';

CREATE TABLE message_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id    UUID NOT NULL REFERENCES users(id),
    to_user_id      UUID NOT NULL REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    message_preview TEXT CHECK (LENGTH(message_preview) <= 500),
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id),
    CONSTRAINT no_self_request CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_message_requests_to ON message_requests(to_user_id, status) WHERE status = 'pending';

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    body            TEXT CHECK (LENGTH(body) <= 10000),
    media_urls      TEXT[] NOT NULL DEFAULT '{}',
    message_type    TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT messages_must_have_content CHECK (body IS NOT NULL OR array_length(media_urls, 1) > 0)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- MEDIA
-- ============================================================

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    original_url    TEXT NOT NULL,
    cdn_url         TEXT,  -- populated after CDN processing
    thumbnail_url   TEXT,
    media_type      TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    mime_type       TEXT NOT NULL,
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    width           INTEGER CHECK (width > 0),
    height          INTEGER CHECK (height > 0),
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_uploader ON media_assets(uploaded_by, created_at DESC);
CREATE INDEX idx_media_processing ON media_assets(processing_status) WHERE processing_status != 'completed';

-- ============================================================
-- MODERATION AND TRUST
-- ============================================================

CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    target_type     TEXT NOT NULL CHECK (target_type IN ('user', 'post', 'comment', 'group', 'event', 'resource', 'message')),
    target_id       UUID NOT NULL,
    reason          TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate', 'impersonation', 'scam', 'other')),
    description     TEXT CHECK (LENGTH(description) <= 2000),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
    assigned_to     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolution      TEXT CHECK (resolution IN ('content_removed', 'user_warned', 'user_suspended', 'user_banned', 'no_action', 'false_report')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC) WHERE status IN ('open', 'under_review');
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_assignee ON reports(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE TABLE moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id    UUID NOT NULL REFERENCES users(id),
    target_type     TEXT NOT NULL CHECK (target_type IN ('user', 'post', 'comment', 'group', 'event', 'resource', 'message')),
    target_id       UUID NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('hide', 'restore', 'delete', 'warn', 'suspend', 'ban', 'unban')),
    reason          TEXT NOT NULL CHECK (LENGTH(reason) >= 5),
    report_id       UUID REFERENCES reports(id),
    is_reversible   BOOLEAN NOT NULL DEFAULT TRUE,
    reversed_at     TIMESTAMPTZ,
    reversed_by     UUID REFERENCES users(id),
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_target ON moderation_actions(target_type, target_id, created_at DESC);
CREATE INDEX idx_mod_actions_moderator ON moderation_actions(moderator_id, created_at DESC);

COMMENT ON TABLE moderation_actions IS 'Every action is permanent. reversed_at tracks reversals but original action stays.';

CREATE TABLE user_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_activity  TEXT NOT NULL DEFAULT 'all' CHECK (group_activity IN ('all', 'push_only', 'in_app_only', 'none')),
    event_reminders TEXT NOT NULL DEFAULT 'all' CHECK (event_reminders IN ('all', 'push_only', 'in_app_only', 'none')),
    post_reactions  TEXT NOT NULL DEFAULT 'push_only' CHECK (post_reactions IN ('all', 'push_only', 'in_app_only', 'none')),
    comment_replies TEXT NOT NULL DEFAULT 'all' CHECK (comment_replies IN ('all', 'push_only', 'in_app_only', 'none')),
    message_requests TEXT NOT NULL DEFAULT 'all' CHECK (message_requests IN ('all', 'push_only', 'in_app_only', 'none')),
    new_messages    TEXT NOT NULL DEFAULT 'all' CHECK (new_messages IN ('all', 'push_only', 'in_app_only', 'none')),
    moderation      TEXT NOT NULL DEFAULT 'all' CHECK (moderation IN ('all', 'push_only', 'in_app_only', 'none')),
    system          TEXT NOT NULL DEFAULT 'in_app_only' CHECK (system IN ('all', 'push_only', 'in_app_only', 'none')),
    digest_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'daily', 'weekly', 'none')),
    quiet_hours_start TIME,
    quiet_hours_end   TIME,
    quiet_hours_tz    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE device_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_id       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_tokens_platform ON device_tokens(platform, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_device_tokens_stale ON device_tokens(last_used_at) WHERE is_active = TRUE;

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('group_activity', 'event_reminder', 'post_reaction', 'comment_reply', 'message_request', 'new_message', 'moderation', 'system')),
    title           TEXT NOT NULL CHECK (LENGTH(title) <= 200),
    body            TEXT NOT NULL CHECK (LENGTH(body) <= 500),
    data            JSONB,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    push_sent       BOOLEAN NOT NULL DEFAULT FALSE,
    push_sent_at    TIMESTAMPTZ,
    push_delivery_status TEXT CHECK (push_delivery_status IN ('sent', 'delivered', 'failed', 'skipped')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID REFERENCES users(id),
    actor_role      TEXT NOT NULL,
    action          TEXT NOT NULL,
    target_type     TEXT CHECK (target_type IN ('user', 'post', 'comment', 'group', 'event', 'resource', 'message')),
    target_id       UUID,
    metadata        JSONB,
    ip_address      INET,  -- Never expose in API responses. Internal audit only.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);

COMMENT ON COLUMN audit_log.ip_address IS 'Internal audit only. NEVER expose in API responses.';
COMMENT ON TABLE audit_log IS 'Immutable. No UPDATE or DELETE permissions granted to application role.';

-- ============================================================
-- BACKGROUND JOBS
-- ============================================================

CREATE TABLE job_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        TEXT NOT NULL,
    job_id          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    payload         JSONB,
    result          JSONB,
    error           TEXT,
    attempts        INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_type, job_id)
);

CREATE INDEX idx_job_log_status ON job_log(status, job_type, created_at DESC) WHERE status IN ('pending', 'processing', 'failed', 'dead_letter');
CREATE INDEX idx_job_log_type ON job_log(job_type, created_at DESC);

COMMIT;

-- ============================================================
-- Migration 002: Search Vectors, Triggers, and Updated_At hooks
-- ============================================================

BEGIN;

-- ============================================================
-- updated_at trigger function (shared)
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all mutable tables
CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_profiles_updated_at        BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_privacy_updated_at         BEFORE UPDATE ON privacy_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_communities_updated_at     BEFORE UPDATE ON communities     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_groups_updated_at          BEFORE UPDATE ON groups          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_posts_updated_at           BEFORE UPDATE ON posts           FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_comments_updated_at        BEFORE UPDATE ON comments        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_events_updated_at          BEFORE UPDATE ON events          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_event_rsvps_updated_at     BEFORE UPDATE ON event_rsvps     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_resources_updated_at       BEFORE UPDATE ON resource_listings FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_conversations_updated_at   BEFORE UPDATE ON conversations   FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_reports_updated_at         BEFORE UPDATE ON reports         FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_notif_prefs_updated_at     BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_device_tokens_updated_at   BEFORE UPDATE ON device_tokens   FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- SEARCH VECTOR TRIGGERS
-- ============================================================

-- Posts: index on body text
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.body, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_search
    BEFORE INSERT OR UPDATE OF body ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Events: index on title + description
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_search
    BEFORE INSERT OR UPDATE OF title, description, tags ON events
    FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

-- Resource listings: index on title + description
CREATE OR REPLACE FUNCTION update_resource_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resources_search
    BEFORE INSERT OR UPDATE OF title, description ON resource_listings
    FOR EACH ROW EXECUTE FUNCTION update_resource_search_vector();

-- Profiles: index on display_name + bio + interests
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.display_name, '') || ' ' ||
        COALESCE(NEW.bio, '') || ' ' ||
        COALESCE(NEW.university, '') || ' ' ||
        COALESCE(NEW.company, '') || ' ' ||
        COALESCE(array_to_string(NEW.interests, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_search
    BEFORE INSERT OR UPDATE OF display_name, bio, university, company, interests ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

-- ============================================================
-- COUNTER DENORMALIZATION TRIGGERS
-- ============================================================

-- group_memberships → groups.member_count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_member_count
    AFTER INSERT OR UPDATE OR DELETE ON group_memberships
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- event_rsvps → events.rsvp_count (count only 'going' status)
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
        UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
        UPDATE events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'going' AND NEW.status = 'going' THEN
            UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
        ELSIF OLD.status = 'going' AND NEW.status != 'going' THEN
            UPDATE events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = NEW.event_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_rsvp_count
    AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
    FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- reactions → posts.like_count / comments.like_count
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'post' THEN
            UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'comment' THEN
            UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'post' THEN
            UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
        ELSIF OLD.target_type = 'comment' THEN
            UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reaction_counts
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();

-- comments → posts.comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_comment_count
    AFTER INSERT OR UPDATE OF deleted_at ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ============================================================
-- NOTIFICATION READ TRACKING
-- ============================================================

CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_read_at
    BEFORE UPDATE OF is_read ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_notification_read_at();

-- ============================================================
-- AUTO-CREATE PROFILE AND PRIVACY SETTINGS ON USER INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a blank profile (displayName is required, rest filled during onboarding)
    INSERT INTO profiles (user_id, display_name)
    VALUES (NEW.id, split_part(NEW.email, '@', 1))
    ON CONFLICT DO NOTHING;

    -- Insert default privacy settings
    INSERT INTO privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;

    -- Insert default notification preferences
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_defaults
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_defaults();

COMMIT;

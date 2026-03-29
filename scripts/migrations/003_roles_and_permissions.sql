-- ============================================================
-- Migration 003: App-Level DB Role and Permissions
-- Principle of least privilege for the application DB user
-- ============================================================

BEGIN;

-- Create app role (if running as superuser in dev)
-- In production, this role is pre-created by Terraform
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gg_app') THEN
        CREATE ROLE gg_app LOGIN PASSWORD 'change_in_production';
    END IF;
END;
$$;

-- Grant connect
GRANT CONNECT ON DATABASE gujarati_global TO gg_app;
GRANT USAGE ON SCHEMA public TO gg_app;

-- Grant select/insert/update/delete on all application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gg_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gg_app;

-- RESTRICT: audit_log is INSERT-only for app role. No UPDATE or DELETE.
REVOKE UPDATE, DELETE ON audit_log FROM gg_app;

-- RESTRICT: moderation_actions is INSERT-only. Actions are permanent.
REVOKE UPDATE, DELETE ON moderation_actions FROM gg_app;

-- Ensure future tables also get the grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gg_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO gg_app;

COMMIT;

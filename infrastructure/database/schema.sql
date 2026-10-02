-- =============================================================================
-- MIVO COLLAB — PostgreSQL Relational Database Schema
-- Connect • Collaborate • Communicate
-- Built for HyperDevelopers SaaS Platform
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(64) DEFAULT 'UTC',
    role VARCHAR(32) DEFAULT 'individual', -- 'individual', 'host', 'org_admin', 'enterprise_admin'
    preferences JSONB DEFAULT '{"theme":"dark","defaultMicMuted":false,"defaultCamMuted":false,"noiseSuppression":true,"echoCancellation":true,"hdVideo":true,"emailNotifications":true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logo_url TEXT,
    plan VARCHAR(32) DEFAULT 'free', -- 'free', 'pro', 'business', 'enterprise'
    subscription_status VARCHAR(32) DEFAULT 'active',
    max_members INT DEFAULT 10,
    settings JSONB DEFAULT '{"allowGuestInvites":true,"requireWaitingRoom":false,"recordingsEnabled":false,"aiFeaturesEnabled":true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- 3. Organization Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) DEFAULT 'member', -- 'owner', 'admin', 'member', 'guest'
    status VARCHAR(32) DEFAULT 'active', -- 'active', 'invited', 'suspended'
    invited_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_org ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(64) PRIMARY KEY,
    public_meeting_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    host_id VARCHAR(64) NOT NULL REFERENCES users(id),
    host_name VARCHAR(100) NOT NULL,
    host_avatar TEXT,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    type VARCHAR(32) DEFAULT 'instant', -- 'instant', 'scheduled', 'recurring', 'persistent_room'
    status VARCHAR(32) DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'cancelled'
    scheduled_start_time TIMESTAMPTZ,
    scheduled_end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    duration_seconds INT,
    configuration JSONB DEFAULT '{"waitingRoom":false,"allowScreenShare":true,"allowChat":true,"muteOnEntry":false,"videoOnEntry":true,"recordingEnabled":false,"aiTranscription":true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_public_id ON meetings(public_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- 6. Meeting Participants Table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id VARCHAR(64) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(32) DEFAULT 'participant', -- 'host', 'co_host', 'participant', 'guest'
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_participants_meeting ON meeting_participants(meeting_id);

-- 7. Meeting Sessions (Quality & Telemetry)
CREATE TABLE IF NOT EXISTS meeting_sessions (
    id VARCHAR(64) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_id VARCHAR(64) NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    device_information JSONB,
    network_information JSONB,
    connection_quality VARCHAR(32) DEFAULT 'excellent',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Messages (Chat) Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_avatar TEXT,
    recipient_id VARCHAR(64),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_meeting ON messages(meeting_id);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- 10. Subscriptions & Billing Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL, -- 'stripe', 'razorpay'
    provider_subscription_id VARCHAR(120) NOT NULL,
    plan VARCHAR(32) NOT NULL, -- 'free', 'pro', 'business', 'enterprise'
    status VARCHAR(32) DEFAULT 'active', -- 'trialing', 'active', 'past_due', 'canceled', 'expired'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    renewal_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'USD',
    status VARCHAR(32) DEFAULT 'paid',
    invoice_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs Table (Immutable security ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

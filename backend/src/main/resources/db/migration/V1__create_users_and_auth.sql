-- V1: Users, Roles, Refresh Tokens, Email Verifications

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles
CREATE TABLE roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES ('ROLE_CANDIDATE'), ('ROLE_ADMIN');

-- Users
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 VARCHAR(255) UNIQUE NOT NULL,
    password_hash         VARCHAR(255),
    first_name            VARCHAR(100),
    last_name             VARCHAR(100),
    avatar_url            VARCHAR(500),
    google_id             VARCHAR(255) UNIQUE,
    role_id               INTEGER NOT NULL DEFAULT 1 REFERENCES roles(id),
    is_email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role_id ON users(role_id);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       VARCHAR(512) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       VARCHAR(512) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       VARCHAR(512) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

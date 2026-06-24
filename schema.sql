-- TravelMate — PostgreSQL schema
-- See docs/03-database-schema.md for rationale.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ============================ ENUM TYPES ============================
CREATE TYPE trip_type         AS ENUM ('flight', 'car', 'train', 'bus', 'other');
CREATE TYPE trip_status       AS ENUM ('planning', 'active', 'finished');
CREATE TYPE member_role       AS ENUM ('owner', 'admin', 'member');
CREATE TYPE activity_status   AS ENUM ('proposed', 'confirmed', 'completed', 'cancelled');
CREATE TYPE vote_value        AS ENUM ('going', 'not_going');
CREATE TYPE expense_category  AS ENUM ('activity', 'restaurant', 'transport', 'fuel',
                                       'parking', 'toll', 'accommodation', 'shopping', 'other');
CREATE TYPE split_mode        AS ENUM ('equal', 'passengers_only', 'manual');
CREATE TYPE settlement_status AS ENUM ('pending', 'settled');
CREATE TYPE memory_phase      AS ENUM ('before_activity', 'during_activity', 'after_activity',
                                       'before_trip', 'after_trip');
CREATE TYPE receipt_ocr_status AS ENUM ('pending', 'processing', 'done', 'failed');

-- ============================ CORE ============================
-- Авторизация — только через Telegram (Mini App): регистрация не требуется,
-- данные берутся из initData. Поддержка входа по номеру телефона (отдельное
-- мобильное приложение) появится позже — тогда telegram_id станет nullable и
-- добавится phone. Сейчас Telegram-идентичность обязательна.
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id           BIGINT UNIQUE NOT NULL,
    username              VARCHAR(64),
    first_name            VARCHAR(128),
    avatar_url            TEXT,
    payment_details       TEXT,
    theme                 VARCHAR(16) NOT NULL DEFAULT 'sunset', -- sunset|neon|pastel|acid|auto
    notification_settings JSONB NOT NULL DEFAULT '{}',
    health_settings       JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trips (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    trip_type     trip_type,
    status        trip_status NOT NULL DEFAULT 'planning',
    base_currency CHAR(3) NOT NULL,
    start_date    DATE,
    end_date      DATE,
    owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trip_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id   UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, user_id)
);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);

CREATE TABLE trip_invites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    token      VARCHAR(64) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    max_uses   INTEGER,
    uses       INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================ ACTIVITIES ============================
CREATE TABLE activities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    creator_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    activity_url TEXT,
    price        NUMERIC(14,2),
    currency     CHAR(3),
    start_time   TIMESTAMPTZ,
    end_time     TIMESTAMPTZ,
    status       activity_status NOT NULL DEFAULT 'proposed',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_trip_start ON activities(trip_id, start_time);

CREATE TABLE activity_participants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (activity_id, user_id)
);

CREATE TABLE activity_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote        vote_value NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (activity_id, user_id)
);

CREATE TABLE activity_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================ EXPENSES ============================
CREATE TABLE expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    payer_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title           VARCHAR(255),
    amount          NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency        CHAR(3) NOT NULL,
    exchange_rate   NUMERIC(18,8),
    category        expense_category,
    split_mode      split_mode NOT NULL DEFAULT 'equal',
    idempotency_key VARCHAR(128),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (payer_id, idempotency_key)
);
CREATE INDEX idx_expenses_trip_created ON expenses(trip_id, created_at);

CREATE TABLE expense_participants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount     NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    status     settlement_status NOT NULL DEFAULT 'pending',
    settled_at TIMESTAMPTZ,
    UNIQUE (expense_id, user_id)
);
CREATE INDEX idx_expense_participants_user_status ON expense_participants(user_id, status);

CREATE TABLE receipts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    file_url   TEXT,
    ocr_status receipt_ocr_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE receipt_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    name       VARCHAR(255),
    quantity   INTEGER,
    price      NUMERIC(14,2)
);

-- ============================ MEMORIES ============================
CREATE TABLE memories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    activity_id  UUID REFERENCES activities(id) ON DELETE SET NULL,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    photo_url    TEXT NOT NULL,
    memory_phase memory_phase,
    taken_at     TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memories_trip_taken ON memories(trip_id, taken_at);

-- ============================ SETTLEMENTS / NOTIFICATIONS / SUMMARY ============================
CREATE TABLE settlements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    from_user  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    to_user    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount     NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    status     settlement_status NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_settlements_trip ON settlements(trip_id);

CREATE TABLE notifications (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type    VARCHAR(64),
    payload JSONB,
    sent_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user_sent ON notifications(user_id, sent_at);

CREATE TABLE summaries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    summary_json JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HIRNAO MVP V1 — PostgreSQL + pgvector schema
-- Spec reference: §17 Modèle de données principal

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE privacy_level AS ENUM (
  'public', 'matchable', 'agent_to_agent',
  'after_connection', 'private', 'ephemeral'
);

CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'admin');
CREATE TYPE locale_code AS ENUM ('fr', 'en');
CREATE TYPE card_context_type AS ENUM ('global', 'event', 'venue');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'ended', 'archived');
CREATE TYPE participant_status AS ENUM ('invited', 'registered', 'checked_in', 'left');
CREATE TYPE zone_type AS ENUM ('nearby', 'main_hall', 'bar', 'terrace', 'vip', 'custom');
CREATE TYPE agent_memory_type AS ENUM (
  'onboarding_exchange', 'preference', 'interaction', 'feedback', 'contextual'
);
CREATE TYPE recommendation_status AS ENUM (
  'pending', 'shown', 'interested', 'dismissed', 'expired'
);
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE consent_type AS ENUM (
  'terms_of_service', 'privacy_policy', 'geolocation', 'agent_negotiation', 'marketing'
);
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  locale        locale_code NOT NULL DEFAULT 'fr',
  role          user_role NOT NULL DEFAULT 'participant',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
  user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  geolocation_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  agent_auto_match        BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_consents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type  consent_type NOT NULL,
  granted       BOOLEAN NOT NULL,
  granted_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  UNIQUE (user_id, consent_type)
);

-- ─── Card ID ─────────────────────────────────────────────────────────────────

CREATE TABLE card_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_type      card_context_type NOT NULL DEFAULT 'global',
  context_id        UUID,
  headline          TEXT,
  bio               TEXT,
  activity          TEXT,
  photo_url         TEXT,
  interests         TEXT[] DEFAULT '{}',
  expertises        TEXT[] DEFAULT '{}',
  intentions        TEXT[] DEFAULT '{}',
  seeking           TEXT[] DEFAULT '{}',
  offering          TEXT[] DEFAULT '{}',
  preferences       JSONB DEFAULT '{}',
  constraints       JSONB DEFAULT '{}',
  contextual_info   JSONB DEFAULT '{}',
  completeness_score NUMERIC(3,2) DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, context_type, context_id)
);

CREATE TABLE card_field_permissions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id        UUID NOT NULL REFERENCES card_profiles(id) ON DELETE CASCADE,
  field_name     TEXT NOT NULL,
  privacy_level  privacy_level NOT NULL DEFAULT 'private',
  expires_at     TIMESTAMPTZ,
  UNIQUE (card_id, field_name)
);

CREATE TABLE card_embeddings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id        UUID NOT NULL REFERENCES card_profiles(id) ON DELETE CASCADE,
  embedding      vector(1536) NOT NULL,
  model_version  TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_embeddings_vector
  ON card_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Events ──────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  venue_name        TEXT,
  venue_address     TEXT,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  status            event_status NOT NULL DEFAULT 'draft',
  default_locale    locale_code NOT NULL DEFAULT 'fr',
  supported_locales locale_code[] DEFAULT '{fr,en}',
  qr_code_token     TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  access_url        TEXT,
  settings          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  zone_type   zone_type NOT NULL DEFAULT 'custom',
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE event_participants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id           UUID REFERENCES card_profiles(id) ON DELETE SET NULL,
  status            participant_status NOT NULL DEFAULT 'registered',
  visible_in_event  BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE participant_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id  UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  zone_id         UUID REFERENCES event_zones(id) ON DELETE SET NULL,
  zone_label      TEXT,
  visible         BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id)
);

-- ─── Agent memory ────────────────────────────────────────────────────────────

CREATE TABLE agent_memories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_type   card_context_type NOT NULL DEFAULT 'global',
  context_id     UUID,
  memory_type    agent_memory_type NOT NULL,
  content        TEXT NOT NULL,
  privacy_level  privacy_level NOT NULL DEFAULT 'private',
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_memories_user_context
  ON agent_memories(user_id, context_type, context_id);

-- ─── Matching pipeline ───────────────────────────────────────────────────────

CREATE TABLE recommendations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score               NUMERIC(5,4) NOT NULL,
  compatibility_pct   INT NOT NULL,
  explanation         JSONB NOT NULL DEFAULT '{}',
  suggested_opener    TEXT,
  agent_evaluation    JSONB,
  status              recommendation_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  UNIQUE (event_id, user_id, candidate_id)
);

CREATE INDEX idx_recommendations_user_event
  ON recommendations(user_id, event_id, status);

-- ─── Connections & messaging ─────────────────────────────────────────────────

CREATE TABLE connections (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID REFERENCES events(id) ON DELETE SET NULL,
  requester_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              connection_status NOT NULL DEFAULT 'pending',
  message             TEXT,
  recommendation_id   UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at        TIMESTAMPTZ,
  CHECK (requester_id != recipient_id)
);

CREATE UNIQUE INDEX idx_connections_pair
  ON connections(LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id), COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id   UUID UNIQUE NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ─── Meetings & feedback (KPI core) ──────────────────────────────────────────

CREATE TABLE meetings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID REFERENCES events(id) ON DELETE SET NULL,
  connection_id       UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  participant_a_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_b_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  met                 BOOLEAN,
  met_at              TIMESTAMPTZ,
  relevance_feedback  TEXT CHECK (relevance_feedback IN ('positive', 'negative')),
  feedback_note       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Moderation & audit ──────────────────────────────────────────────────────

CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id          UUID REFERENCES events(id) ON DELETE SET NULL,
  reason            TEXT NOT NULL,
  status            report_status NOT NULL DEFAULT 'open',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

-- ─── AI usage tracking (back-office §15) ─────────────────────────────────────

CREATE TABLE ai_usage_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  operation     TEXT NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd      NUMERIC(10,6),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER card_profiles_updated_at BEFORE UPDATE ON card_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security (§18) ────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS policies applied via application role; see packages/db/rls/001_policies.sql

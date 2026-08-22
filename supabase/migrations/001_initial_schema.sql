-- Hirnao initial schema

CREATE TYPE plan_status AS ENUM (
  'draft', 'collecting_availability', 'proposing',
  'awaiting_confirmation', 'confirmed', 'cancelled', 'expired'
);

CREATE TYPE invitee_status AS ENUM (
  'pending', 'invited', 'responded', 'confirmed', 'declined'
);

CREATE TYPE availability_status AS ENUM (
  'available', 'tentative', 'unavailable'
);

CREATE TYPE vote_type AS ENUM (
  'confirm', 'decline', 'suggest_alternative'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  preferred_areas TEXT[] DEFAULT '{}',
  social_preferences JSONB DEFAULT '{}',
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT NOT NULL DEFAULT 'ami',
  neighborhood TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity TEXT NOT NULL,
  description TEXT,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  location_area TEXT NOT NULL,
  venue_preference TEXT,
  min_participants INTEGER NOT NULL DEFAULT 2,
  status plan_status NOT NULL DEFAULT 'draft',
  confirmed_slot TIMESTAMPTZ,
  confirmed_venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plan_invitees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  status invitee_status NOT NULL DEFAULT 'pending',
  neighborhood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES plan_invitees(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  status availability_status NOT NULL,
  travel_minutes INTEGER,
  alternative_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (invitee_id, slot_date, slot_time)
);

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  venue TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  tentative_count INTEGER NOT NULL DEFAULT 0,
  average_travel_minutes NUMERIC NOT NULL DEFAULT 0,
  late_hour_penalty NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES plan_invitees(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  alternative_date DATE,
  alternative_time TIME,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (proposal_id, invitee_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_plans_creator ON plans(creator_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plan_invitees_plan ON plan_invitees(plan_id);
CREATE INDEX idx_availability_plan ON availability_responses(plan_id);
CREATE INDEX idx_proposals_plan ON proposals(plan_id);
CREATE INDEX idx_messages_plan ON messages(plan_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE plans;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_invitees;
ALTER PUBLICATION supabase_realtime ADD TABLE availability_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- RLS policies (permissive for demo)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_invitees ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON plans FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON plan_invitees FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON availability_responses FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON proposals FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON proposal_votes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON messages FOR ALL USING (true);

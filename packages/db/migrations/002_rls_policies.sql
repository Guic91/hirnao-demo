-- HIRNAO Row Level Security policies (§18)
-- Applied with SET app.current_user_id = '<uuid>' per request

-- Users: read own profile, organizers read participants in their events
CREATE POLICY users_select_own ON users
  FOR SELECT USING (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = current_setting('app.current_user_id', true)::uuid);

-- Card profiles: owner full access; public fields visible to event co-participants
CREATE POLICY card_profiles_owner ON card_profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY card_profiles_public_read ON card_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM card_field_permissions cfp
      WHERE cfp.card_id = card_profiles.id
        AND cfp.privacy_level = 'public'
        AND (cfp.expires_at IS NULL OR cfp.expires_at > NOW())
    )
  );

-- Agent memories: strictly private to owner
CREATE POLICY agent_memories_owner ON agent_memories
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Connections: visible to requester or recipient
CREATE POLICY connections_participant ON connections
  FOR SELECT USING (
    requester_id = current_setting('app.current_user_id', true)::uuid
    OR recipient_id = current_setting('app.current_user_id', true)::uuid
  );

CREATE POLICY connections_request ON connections
  FOR INSERT WITH CHECK (
    requester_id = current_setting('app.current_user_id', true)::uuid
  );

-- Messages: only conversation participants
CREATE POLICY messages_participant ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN connections conn ON conn.id = c.connection_id
      WHERE c.id = messages.conversation_id
        AND (
          conn.requester_id = current_setting('app.current_user_id', true)::uuid
          OR conn.recipient_id = current_setting('app.current_user_id', true)::uuid
        )
    )
  );

CREATE POLICY messages_send ON messages
  FOR INSERT WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)::uuid
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN connections conn ON conn.id = c.connection_id
      WHERE c.id = messages.conversation_id
        AND conn.status = 'accepted'
        AND (
          conn.requester_id = current_setting('app.current_user_id', true)::uuid
          OR conn.recipient_id = current_setting('app.current_user_id', true)::uuid
        )
    )
  );

-- Meetings: participants only
CREATE POLICY meetings_participant ON meetings
  FOR ALL USING (
    participant_a_id = current_setting('app.current_user_id', true)::uuid
    OR participant_b_id = current_setting('app.current_user_id', true)::uuid
  );

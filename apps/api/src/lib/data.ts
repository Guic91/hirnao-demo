import type { CardProfile, Recommendation, User } from "@hirnao/shared";
import { scoreMatch, toAgentContext } from "@hirnao/ai";
import { demoStore, isDemoMode } from "./db.js";
import * as pg from "./db-pg.js";
import { mapCard, mapEvent, mapRecommendation, mapUser } from "./mappers.js";
import { generateRecommendations as runMatching } from "./matching-service.js";
import { getAiRuntime } from "./ai-runtime.js";

export async function findUserById(id: string): Promise<User | null> {
  if (isDemoMode()) return demoStore.getUser(id);
  const row = await pg.queryOne(`SELECT * FROM users WHERE id = $1`, [id]);
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (isDemoMode()) return demoStore.getUserByEmail(email);
  const row = await pg.queryOne(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
  return row ? mapUser(row) : null;
}

export async function createUser(data: {
  email: string;
  display_name: string;
  locale: "fr" | "en";
}): Promise<User> {
  if (isDemoMode()) return demoStore.createUser(data);
  const row = await pg.queryOne(
    `INSERT INTO users (email, display_name, locale, email_verified) VALUES ($1, $2, $3, true) RETURNING *`,
    [data.email.toLowerCase(), data.display_name, data.locale],
  );
  if (!row) throw new Error("Failed to create user");
  await pg.query(`INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [row.id]);
  return mapUser(row);
}

export async function updateUser(
  id: string,
  data: { display_name?: string; locale?: "fr" | "en"; avatar_url?: string },
): Promise<User | null> {
  if (isDemoMode()) {
    const user = demoStore.getUser(id);
    if (!user) return null;
    if (data.display_name) user.display_name = data.display_name;
    if (data.locale) user.locale = data.locale;
    if (data.avatar_url) user.avatar_url = data.avatar_url;
    user.updated_at = new Date().toISOString();
    return user;
  }
  const row = await pg.queryOne(
    `UPDATE users SET display_name = COALESCE($2, display_name), locale = COALESCE($3, locale), avatar_url = COALESCE($4, avatar_url), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, data.display_name, data.locale, data.avatar_url],
  );
  return row ? mapUser(row) : null;
}

export async function findEventBySlug(slug: string) {
  if (isDemoMode()) {
    const e = demoStore.getEventBySlug(slug);
    return e;
  }
  const row = await pg.queryOne(`SELECT * FROM events WHERE slug = $1`, [slug]);
  return row ? mapEvent(row) : null;
}

export async function joinEvent(eventId: string, userId: string) {
  if (isDemoMode()) return demoStore.joinEvent(eventId, userId);
  return pg.queryOne(
    `INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, 'registered')
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'registered' RETURNING *`,
    [eventId, userId],
  );
}

export async function checkinEvent(eventId: string, userId: string) {
  if (isDemoMode()) return demoStore.checkin(eventId, userId);
  return pg.queryOne(
    `UPDATE event_participants SET status = 'checked_in', checked_in_at = NOW() WHERE event_id = $1 AND user_id = $2 RETURNING *`,
    [eventId, userId],
  );
}

export async function setVisibility(eventId: string, userId: string, visible: boolean) {
  if (isDemoMode()) return demoStore.setVisibility(eventId, userId, visible);
  return pg.queryOne(
    `UPDATE event_participants SET visible_in_event = $3 WHERE event_id = $1 AND user_id = $2 RETURNING *`,
    [eventId, userId, visible],
  );
}

export async function getEventZones(eventId: string) {
  if (isDemoMode()) {
    return [
      { id: "z1", name: "Salle principale", zone_type: "main_hall", sort_order: 1 },
      { id: "z2", name: "Bar", zone_type: "bar", sort_order: 2 },
      { id: "z3", name: "Terrasse", zone_type: "terrace", sort_order: 3 },
    ];
  }
  const result = await pg.query(
    `SELECT id, name, zone_type, sort_order FROM event_zones WHERE event_id = $1 ORDER BY sort_order`,
    [eventId],
  );
  return result.rows;
}

export async function getVisibleParticipants(eventId: string) {
  if (isDemoMode()) {
    return demoStore.getEventParticipants(eventId, true).map(({ user, card }) => ({
      id: user?.id,
      display_name: user?.display_name,
      avatar_url: user?.avatar_url,
      headline: card?.headline,
      activity: card?.activity,
      interests: card?.interests,
    }));
  }
  const result = await pg.query(
    `SELECT u.id, u.display_name, u.avatar_url, cp.headline, cp.activity, cp.interests
     FROM event_participants ep
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN card_profiles cp ON cp.id = ep.card_id
     WHERE ep.event_id = $1 AND ep.visible_in_event = true`,
    [eventId],
  );
  return result.rows;
}

export async function getCard(userId: string, eventId?: string): Promise<CardProfile | null> {
  if (isDemoMode()) return demoStore.getCard(userId, eventId);
  const row = eventId
    ? await pg.queryOne(
        `SELECT * FROM card_profiles WHERE user_id = $1 AND context_type = 'event' AND context_id = $2`,
        [userId, eventId],
      )
    : await pg.queryOne(`SELECT * FROM card_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
  return row ? mapCard(row) : null;
}

export async function upsertCard(
  userId: string,
  eventId: string | null,
  data: Partial<CardProfile> & { completeness_score?: number },
): Promise<CardProfile> {
  if (isDemoMode()) return demoStore.upsertCard(userId, eventId, data);
  const row = await pg.queryOne(
    `INSERT INTO card_profiles (
       user_id, context_type, context_id, headline, bio, activity,
       interests, expertises, intentions, seeking, offering,
       preferences, constraints, completeness_score
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (user_id, context_type, context_id)
     DO UPDATE SET headline = EXCLUDED.headline, bio = EXCLUDED.bio, activity = EXCLUDED.activity,
       interests = EXCLUDED.interests, expertises = EXCLUDED.expertises, intentions = EXCLUDED.intentions,
       seeking = EXCLUDED.seeking, offering = EXCLUDED.offering, preferences = EXCLUDED.preferences,
       constraints = EXCLUDED.constraints, completeness_score = EXCLUDED.completeness_score, updated_at = NOW()
     RETURNING *`,
    [
      userId,
      eventId ? "event" : "global",
      eventId,
      data.headline ?? null,
      data.bio ?? null,
      data.activity ?? null,
      data.interests ?? [],
      data.expertises ?? [],
      data.intentions ?? [],
      data.seeking ?? [],
      data.offering ?? [],
      JSON.stringify(data.preferences ?? {}),
      JSON.stringify(data.constraints ?? {}),
      data.completeness_score ?? 0,
    ],
  );
  if (!row) throw new Error("Failed to upsert card");
  if (eventId) {
    await pg.query(`UPDATE event_participants SET card_id = $3 WHERE event_id = $1 AND user_id = $2`, [
      eventId,
      userId,
      row.id,
    ]);
  }
  return mapCard(row);
}

export async function getRecommendations(userId: string, eventId: string) {
  if (isDemoMode()) {
    let recs = demoStore.getRecommendations(userId, eventId);
    if (recs.length === 0) {
      recs = await generateDemoRecommendations(userId, eventId);
    }
    return recs.map((r) => {
      const candidate = demoStore.getUser(r.candidate_id);
      const card = demoStore.getCard(r.candidate_id, eventId);
      return {
        ...r,
        candidate: {
          id: r.candidate_id,
          display_name: candidate?.display_name ?? "Unknown",
          headline: card?.headline,
          activity: card?.activity,
        },
      };
    });
  }

  let rows = await pg.query(
    `SELECT r.*, u.display_name as candidate_name, u.avatar_url as candidate_avatar,
            cp.headline as candidate_headline, cp.activity as candidate_activity
     FROM recommendations r
     JOIN users u ON u.id = r.candidate_id
     LEFT JOIN card_profiles cp ON cp.user_id = r.candidate_id AND cp.context_type = 'event' AND cp.context_id = r.event_id
     WHERE r.user_id = $1 AND r.event_id = $2 AND r.status NOT IN ('dismissed', 'expired')
     ORDER BY r.score DESC LIMIT 5`,
    [userId, eventId],
  );

  if (rows.rows.length === 0) {
    await runMatching(eventId, userId);
    rows = await pg.query(
      `SELECT r.*, u.display_name as candidate_name, u.avatar_url as candidate_avatar,
              cp.headline as candidate_headline, cp.activity as candidate_activity
       FROM recommendations r
       JOIN users u ON u.id = r.candidate_id
       LEFT JOIN card_profiles cp ON cp.user_id = r.candidate_id AND cp.context_type = 'event' AND cp.context_id = r.event_id
       WHERE r.user_id = $1 AND r.event_id = $2 AND r.status NOT IN ('dismissed', 'expired')
       ORDER BY r.score DESC LIMIT 5`,
      [userId, eventId],
    );
  }

  return rows.rows.map((row) => ({
    ...mapRecommendation(row),
    candidate: {
      id: row.candidate_id,
      display_name: row.candidate_name,
      avatar_url: row.candidate_avatar,
      headline: row.candidate_headline,
      activity: row.candidate_activity,
    },
  }));
}

export async function generateDemoRecommendationsWithAgents(
  userId: string,
  eventId: string,
): Promise<Recommendation[]> {
  const userCard = demoStore.getCard(userId, eventId);
  if (!userCard) return [];

  const user = demoStore.getUser(userId);
  const locale = user?.locale ?? "fr";
  const { agentService } = getAiRuntime(locale);

  const candidates = demoStore
    .getEventParticipants(eventId, true)
    .filter((p) => p.user?.id !== userId && p.card);

  const recs: Recommendation[] = [];

  for (const { user: candidate, card } of candidates) {
    if (!card || !candidate) continue;

    const scoring = scoreMatch({
      user_card: userCard,
      candidate_card: card,
      vector_similarity: 0.7,
      same_zone: false,
      both_available: true,
    });

    const negotiation = await agentService.negotiate({
      agent_a: toAgentContext(userCard),
      agent_b: toAgentContext(card),
      event_id: eventId,
    });

    if (!negotiation.compatible && negotiation.compatibility_pct < 30) continue;

    recs.push({
      id: crypto.randomUUID(),
      event_id: eventId,
      user_id: userId,
      candidate_id: candidate.id,
      score: Math.max(scoring.score, negotiation.evaluation.compatibility_score),
      compatibility_pct: negotiation.compatibility_pct,
      explanation: negotiation.explanation,
      suggested_opener: negotiation.suggested_opener,
      agent_evaluation: negotiation.evaluation,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  }

  recs.sort((a, b) => b.compatibility_pct - a.compatibility_pct);
  demoStore.setRecommendations(recs.slice(0, 5));
  return recs.slice(0, 5);
}

async function generateDemoRecommendations(userId: string, eventId: string): Promise<Recommendation[]> {
  return generateDemoRecommendationsWithAgents(userId, eventId);
}

export async function updateRecommendationStatus(id: string, userId: string, status: string) {
  if (isDemoMode()) {
    const rec = [...demoStore.recommendations.values()].find((r) => r.id === id && r.user_id === userId);
    if (rec) rec.status = status as Recommendation["status"];
    return rec ?? null;
  }
  const row = await pg.queryOne(`UPDATE recommendations SET status = $3 WHERE id = $1 AND user_id = $2 RETURNING *`, [
    id,
    userId,
    status,
  ]);
  return row ? mapRecommendation(row) : null;
}

export async function createConnection(data: {
  event_id: string | null;
  requester_id: string;
  recipient_id: string;
  message?: string;
  recommendation_id?: string;
}) {
  if (isDemoMode()) {
    return demoStore.addConnection({
      ...data,
      status: "pending",
      event_id: data.event_id ?? undefined,
    });
  }
  return pg.queryOne(
    `INSERT INTO connections (event_id, requester_id, recipient_id, message, recommendation_id, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [data.event_id, data.requester_id, data.recipient_id, data.message ?? null, data.recommendation_id ?? null],
  );
}

export async function getConnections(userId: string, eventId?: string) {
  if (isDemoMode()) return demoStore.getConnections(userId, eventId);
  const result = await pg.query(
    `SELECT c.*, ru.display_name as requester_name, su.display_name as recipient_name
     FROM connections c
     JOIN users ru ON ru.id = c.requester_id
     JOIN users su ON su.id = c.recipient_id
     WHERE (c.requester_id = $1 OR c.recipient_id = $1) AND ($2::uuid IS NULL OR c.event_id = $2)
     ORDER BY c.created_at DESC`,
    [userId, eventId ?? null],
  );
  return result.rows;
}

export async function saveAgentMemory(userId: string, eventId: string | null, message: string, metadata: unknown) {
  if (isDemoMode()) return;
  await pg.query(
    `INSERT INTO agent_memories (user_id, context_type, context_id, memory_type, content, privacy_level, metadata)
     VALUES ($1, $2, $3, 'onboarding_exchange', $4, 'private', $5)`,
    [userId, eventId ? "event" : "global", eventId, message, JSON.stringify(metadata)],
  );
}

export async function getAgentMemories(userId: string, eventId?: string) {
  if (isDemoMode()) return [];
  const result = await pg.query(
    `SELECT id, memory_type, content, created_at FROM agent_memories
     WHERE user_id = $1 AND ($2::uuid IS NULL OR context_id = $2) ORDER BY created_at DESC LIMIT 50`,
    [userId, eventId ?? null],
  );
  return result.rows;
}

export async function recordConsents(userId: string) {
  if (isDemoMode()) return;
  await pg.query(
    `INSERT INTO user_consents (user_id, consent_type, granted, granted_at)
     VALUES ($1, 'terms_of_service', true, NOW()), ($1, 'privacy_policy', true, NOW()), ($1, 'agent_negotiation', true, NOW())
     ON CONFLICT (user_id, consent_type) DO NOTHING`,
    [userId],
  );
}

export async function recordConsent(userId: string, consentType: string, granted: boolean) {
  if (isDemoMode()) return;
  await pg.query(
    `INSERT INTO user_consents (user_id, consent_type, granted, granted_at, revoked_at)
     VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END, CASE WHEN $3 THEN NULL ELSE NOW() END)
     ON CONFLICT (user_id, consent_type)
     DO UPDATE SET granted = $3, granted_at = CASE WHEN $3 THEN NOW() ELSE user_consents.granted_at END, revoked_at = CASE WHEN $3 THEN NULL ELSE NOW() END`,
    [userId, consentType, granted],
  );
}

export async function refreshRecommendations(eventId: string, userId: string) {
  if (isDemoMode()) {
    demoStore.recommendations.clear();
    await generateDemoRecommendations(userId, eventId);
    return;
  }
  await runMatching(eventId, userId);
}

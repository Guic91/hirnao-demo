import type { CardProfile } from "@hirnao/shared";
import { isDemoMode, isFirebaseMode } from "./db.js";

export { cardToEmbeddingText, toAgentContext } from "@hirnao/ai";

export async function upsertCardEmbedding(_cardId: string, _card: CardProfile) {
  // Vector embeddings are not persisted in Firebase mode (rule-based matching instead).
}

export async function generateRecommendations(eventId: string, userId: string) {
  if (isDemoMode() || isFirebaseMode()) {
    const { generateAgentRecommendations } = await import("./data.js");
    return generateAgentRecommendations(userId, eventId);
  }

  const { query, queryOne } = await import("./db-pg.js");
  const { mapCard } = await import("./mappers.js");
  const { cardToEmbeddingText, generateEmbedding, runFullMatchingPipeline } = await import("@hirnao/ai");
  const { getAiRuntime } = await import("./ai-runtime.js");

  const allCards = await query(
    `SELECT cp.* FROM card_profiles cp
     JOIN event_participants ep ON ep.user_id = cp.user_id AND ep.event_id = $1
     WHERE cp.context_type = 'event' AND cp.context_id = $1`,
    [eventId],
  );
  for (const row of allCards.rows) {
    const card = mapCard(row);
    await upsertCardEmbedding(card.id, card);
  }

  const participant = await queryOne(
    `SELECT ep.*, cp.id as card_id FROM event_participants ep
     LEFT JOIN card_profiles cp ON cp.id = ep.card_id
     WHERE ep.event_id = $1 AND ep.user_id = $2`,
    [eventId, userId],
  );
  if (!participant?.card_id) return [];

  const userCardRow = await queryOne(`SELECT * FROM card_profiles WHERE id = $1`, [participant.card_id]);
  if (!userCardRow) return [];

  const card = mapCard(userCardRow);
  await upsertCardEmbedding(card.id, card);
  const { embedding } = await generateEmbedding(cardToEmbeddingText(card));

  const user = await queryOne(`SELECT locale FROM users WHERE id = $1`, [userId]);
  const locale = (user?.locale as "fr" | "en") ?? "fr";
  const { agentService } = getAiRuntime(locale);

  const evaluated = await runFullMatchingPipeline({
    agentService,
    event_id: eventId,
    user_id: userId,
    user_card: card,
    user_card_id: card.id,
    user_embedding: embedding,
    locale,
    deps: {
      filterCandidates: async (criteria) => {
        const result = await query<{ user_id: string }>(
          `SELECT ep.user_id FROM event_participants ep
           JOIN card_profiles cp ON cp.user_id = ep.user_id AND cp.context_type = 'event' AND cp.context_id = $1
           WHERE ep.event_id = $1 AND ep.user_id != ALL($2::uuid[])
             AND ($3 = false OR ep.visible_in_event = true)`,
          [criteria.event_id, criteria.exclude_user_ids, criteria.require_visible],
        );
        return result.rows.map((r) => r.user_id);
      },
      vectorSearch: async (q) => {
        const vectorStr = `[${q.embedding.join(",")}]`;
        const result = await query<{ user_id: string; similarity: number }>(
          `SELECT cp.user_id, 1 - (ce.embedding <=> $1::vector) AS similarity
           FROM card_embeddings ce JOIN card_profiles cp ON cp.id = ce.card_id
           WHERE cp.context_type = 'event' AND cp.context_id = $2
           ORDER BY ce.embedding <=> $1::vector LIMIT $3`,
          [vectorStr, eventId, q.limit],
        );
        return result.rows.filter((r) => r.similarity >= q.min_similarity);
      },
      getCard: async (uid, eid) => {
        const row = await queryOne(
          `SELECT * FROM card_profiles WHERE user_id = $1 AND context_type = 'event' AND context_id = $2`,
          [uid, eid],
        );
        return row ? mapCard(row) : null;
      },
      isAvailable: async (uid, eid) => {
        const row = await queryOne(
          `SELECT ep.visible_in_event FROM event_participants ep WHERE ep.user_id = $1 AND ep.event_id = $2`,
          [uid, eid],
        );
        return Boolean(row?.visible_in_event);
      },
      sameZone: async (a, b, eid) => {
        const row = await queryOne(
          `SELECT pl_a.zone_id = pl_b.zone_id AS same_zone
           FROM event_participants ep_a JOIN event_participants ep_b ON ep_b.event_id = ep_a.event_id
           LEFT JOIN participant_locations pl_a ON pl_a.participant_id = ep_a.id
           LEFT JOIN participant_locations pl_b ON pl_b.participant_id = ep_b.id
           WHERE ep_a.user_id = $1 AND ep_b.user_id = $2 AND ep_a.event_id = $3`,
          [a, b, eid],
        );
        return Boolean(row?.same_zone);
      },
    },
  });

  const recommendations = [];
  for (const { match, negotiation } of evaluated) {
    const row = await queryOne(
      `INSERT INTO recommendations (
         event_id, user_id, candidate_id, score, compatibility_pct,
         explanation, suggested_opener, agent_evaluation, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       ON CONFLICT (event_id, user_id, candidate_id)
       DO UPDATE SET score = EXCLUDED.score, compatibility_pct = EXCLUDED.compatibility_pct,
         explanation = EXCLUDED.explanation, suggested_opener = EXCLUDED.suggested_opener,
         agent_evaluation = EXCLUDED.agent_evaluation,
         status = CASE WHEN recommendations.status = 'dismissed' THEN recommendations.status ELSE 'pending' END
       RETURNING *`,
      [
        eventId,
        userId,
        match.user_id,
        match.final_score,
        negotiation.compatibility_pct,
        JSON.stringify(negotiation.explanation),
        negotiation.suggested_opener,
        JSON.stringify(negotiation.evaluation),
      ],
    );
    if (row) recommendations.push(row);
  }

  return recommendations;
}

export function computeCompleteness(card: Partial<CardProfile>): number {
  const fields = [
    card.headline,
    card.bio,
    card.activity,
    card.interests?.length,
    card.expertises?.length,
    card.intentions?.length,
    card.seeking?.length,
    card.offering?.length,
  ];
  const filled = fields.filter((f) => (Array.isArray(f) ? f.length > 0 : Boolean(f))).length;
  return Math.round((filled / fields.length) * 100) / 100;
}

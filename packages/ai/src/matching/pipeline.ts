import type {
  FilterCriteria,
  ScoringInput,
  ScoringResult,
  Shortlist,
  VectorSearchQuery,
} from "../types.js";
import { MATCHING_PIPELINE } from "@hirnao/shared";

/**
 * HIRNAO Matching Pipeline — spec §5
 *
 * 1. Filter   → same event, consents, blocking, availability
 * 2. Vector   → pgvector cosine similarity on card embeddings
 * 3. Score    → intentions, interests, complementarity, proximity
 * 4. Shortlist → top N candidates for agent-to-agent evaluation
 */

export interface MatchingPipelineDeps {
  filterCandidates: (criteria: FilterCriteria) => Promise<string[]>;
  vectorSearch: (query: VectorSearchQuery) => Promise<{ user_id: string; similarity: number }[]>;
  getCard: (user_id: string, event_id: string) => Promise<import("@hirnao/shared").CardProfile | null>;
  isAvailable: (user_id: string, event_id: string) => Promise<boolean>;
  sameZone: (user_a: string, user_b: string, event_id: string) => Promise<boolean>;
}

export function scoreMatch(input: ScoringInput): ScoringResult {
  const intentionOverlap = jaccard(input.user_card.intentions, input.candidate_card.intentions);
  const interestOverlap = jaccard(input.user_card.interests, input.candidate_card.interests);
  const seekingOffering = matchSeekingOffering(
    input.user_card.seeking,
    input.candidate_card.offering,
  );
  const expertiseComplement = complementarity(
    input.user_card.expertises,
    input.candidate_card.expertises,
  );
  const proximityBonus = input.same_zone && input.both_available ? 0.1 : 0;

  const factors = {
    intention_overlap: intentionOverlap,
    interest_overlap: interestOverlap,
    seeking_offering_match: seekingOffering,
    expertise_complement: expertiseComplement,
    proximity_bonus: proximityBonus,
    vector_similarity: input.vector_similarity,
  };

  const score =
    factors.vector_similarity * 0.35 +
    factors.intention_overlap * 0.25 +
    factors.seeking_offering_match * 0.2 +
    factors.interest_overlap * 0.1 +
    factors.expertise_complement * 0.05 +
    factors.proximity_bonus;

  return {
    score: Math.min(1, score),
    compatibility_pct: Math.round(Math.min(1, score) * 100),
    factors,
  };
}

export async function runMatchingPipeline(
  deps: MatchingPipelineDeps,
  event_id: string,
  user_id: string,
  user_card_id: string,
  user_embedding: number[],
): Promise<Shortlist> {
  // Step 1: Filter
  const candidateIds = await deps.filterCandidates({
    event_id,
    exclude_user_ids: [user_id],
    require_visible: true,
    require_checked_in: false,
  });

  if (candidateIds.length === 0) return [];

  // Step 2: Vector search
  const vectorResults = await deps.vectorSearch({
    card_id: user_card_id,
    embedding: user_embedding,
    limit: MATCHING_PIPELINE.VECTOR_SEARCH_LIMIT,
    min_similarity: 0.5,
  });

  const userCard = await deps.getCard(user_id, event_id);
  if (!userCard) return [];

  // Step 3: Score
  const scored = await Promise.all(
    vectorResults
      .filter((r) => candidateIds.includes(r.user_id))
      .map(async (r) => {
        const candidateCard = await deps.getCard(r.user_id, event_id);
        if (!candidateCard) return null;

        const [bothAvailable, sameZone] = await Promise.all([
          deps.isAvailable(user_id, event_id).then(async (a) =>
            a ? deps.isAvailable(r.user_id, event_id) : false,
          ),
          deps.sameZone(user_id, r.user_id, event_id),
        ]);

        const scoring = scoreMatch({
          user_card: userCard,
          candidate_card: candidateCard,
          vector_similarity: r.similarity,
          same_zone: sameZone,
          both_available: bothAvailable,
        });

        return {
          user_id: r.user_id,
          card: candidateCard,
          vector_score: r.similarity,
          final_score: scoring.score,
        };
      }),
  );

  // Step 4: Shortlist
  return scored
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, MATCHING_PIPELINE.SHORTLIST_SIZE);
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function matchSeekingOffering(seeking: string[], offering: string[]): number {
  if (seeking.length === 0 || offering.length === 0) return 0;
  const seekSet = new Set(seeking.map((s) => s.toLowerCase()));
  const matches = offering.filter((o) =>
    [...seekSet].some((s) => o.toLowerCase().includes(s) || s.includes(o.toLowerCase())),
  );
  return matches.length / seeking.length;
}

function complementarity(a: string[], b: string[]): number {
  const overlap = jaccard(a, b);
  const combined = new Set([...a, ...b].map((s) => s.toLowerCase()));
  return combined.size > 0 ? (combined.size - overlap * combined.size) / combined.size : 0;
}

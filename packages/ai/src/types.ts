import type { CardProfile, AgentEvaluation, RecommendationExplanation } from "@hirnao/shared";

// ─── Matching pipeline (spec §5) ─────────────────────────────────────────────

export interface MatchCandidate {
  user_id: string;
  card: CardProfile;
  vector_score: number;
  final_score: number;
}

export interface MatchingContext {
  event_id: string;
  user_id: string;
  card: CardProfile;
  /** Other participants in same event */
  pool_size: number;
}

/** Step 1 — Hard filters (event, availability, consents, blocking) */
export interface FilterCriteria {
  event_id: string;
  exclude_user_ids: string[];
  require_visible: boolean;
  require_checked_in: boolean;
}

/** Step 2 — Vector search input */
export interface VectorSearchQuery {
  card_id: string;
  embedding: number[];
  limit: number;
  min_similarity: number;
}

/** Step 3 — Scoring factors */
export interface ScoringInput {
  user_card: CardProfile;
  candidate_card: CardProfile;
  vector_similarity: number;
  same_zone: boolean;
  both_available: boolean;
}

export interface ScoringResult {
  score: number;
  compatibility_pct: number;
  factors: {
    intention_overlap: number;
    interest_overlap: number;
    seeking_offering_match: number;
    expertise_complement: number;
    proximity_bonus: number;
    vector_similarity: number;
  };
}

/** Step 4 — Shortlist */
export type Shortlist = MatchCandidate[];

// ─── Agent ↔ Agent (spec §6) ────────────────────────────────────────────────

export interface AgentNegotiationInput {
  agent_a: AgentContext;
  agent_b: AgentContext;
  event_id: string;
}

export interface AgentContext {
  user_id: string;
  /** Only agent_to_agent + matchable fields — never private */
  shareable_profile: Partial<CardProfile>;
  intentions: string[];
  seeking: string[];
  offering: string[];
}

export interface AgentNegotiationResult {
  compatible: boolean;
  compatibility_pct: number;
  evaluation: AgentEvaluation;
  explanation: RecommendationExplanation;
  suggested_opener: string;
}

// ─── Personal agent (spec §4) ───────────────────────────────────────────────

export interface AgentSession {
  user_id: string;
  event_id?: string;
  locale: "fr" | "en";
  onboarding_complete: boolean;
}

export interface OnboardingExchange {
  role: "agent" | "user";
  content: string;
  timestamp: string;
}

export interface StructuredOnboardingResult {
  intentions: string[];
  seeking: string[];
  offering: string[];
  interests: string[];
  expertises: string[];
  preferences: Record<string, unknown>;
  constraints: Record<string, unknown>;
}

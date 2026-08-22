export const PRIVACY_LEVELS = [
  "public",
  "matchable",
  "agent_to_agent",
  "after_connection",
  "private",
  "ephemeral",
] as const;

export const LOCALES = ["fr", "en"] as const;

export const MATCHING_PIPELINE = {
  SHORTLIST_SIZE: 5,
  MIN_COMPATIBILITY_SCORE: 0.6,
  VECTOR_SEARCH_LIMIT: 50,
} as const;

export const AGENT_CONFIG = {
  MAX_NEGOTIATION_ROUNDS: 1,
  MODEL_VERSION: "gpt-4o-mini",
  EMBEDDING_MODEL: "text-embedding-3-small",
  EMBEDDING_DIMENSIONS: 1536,
} as const;

export const GEOLOCATION = {
  DEFAULT_VISIBILITY_TTL_HOURS: 4,
  ZONES: ["nearby", "main_hall", "bar", "terrace", "vip", "custom"] as const,
} as const;

export const CONNECTION_ACTIONS = [
  "accept",
  "decline",
  "block",
  "report",
] as const;

export const RECOMMENDATION_ACTIONS = [
  "connect",
  "later",
  "dismiss",
] as const;

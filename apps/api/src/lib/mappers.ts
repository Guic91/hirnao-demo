import type { CardProfile, Event, Recommendation, User } from "@hirnao/shared";

export function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    display_name: String(row.display_name),
    avatar_url: row.avatar_url ? String(row.avatar_url) : undefined,
    locale: row.locale as User["locale"],
    role: row.role as User["role"],
    email_verified: Boolean(row.email_verified),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: String(row.id),
    organizer_id: String(row.organizer_id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    venue_name: row.venue_name ? String(row.venue_name) : undefined,
    venue_address: row.venue_address ? String(row.venue_address) : undefined,
    starts_at: String(row.starts_at),
    ends_at: String(row.ends_at),
    status: row.status as Event["status"],
    default_locale: row.default_locale as Event["default_locale"],
    supported_locales: (row.supported_locales as Event["supported_locales"]) ?? ["fr", "en"],
    qr_code_token: String(row.qr_code_token),
    access_url: row.access_url ? String(row.access_url) : undefined,
    settings: (row.settings as Event["settings"]) ?? {
      require_approval: false,
      geolocation_zones_enabled: true,
      agent_matching_enabled: true,
      auto_expire_visibility: true,
    },
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapCard(row: Record<string, unknown>): CardProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    context_type: row.context_type as CardProfile["context_type"],
    context_id: row.context_id ? String(row.context_id) : undefined,
    headline: row.headline ? String(row.headline) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    activity: row.activity ? String(row.activity) : undefined,
    photo_url: row.photo_url ? String(row.photo_url) : undefined,
    interests: (row.interests as string[]) ?? [],
    expertises: (row.expertises as string[]) ?? [],
    intentions: (row.intentions as string[]) ?? [],
    seeking: (row.seeking as string[]) ?? [],
    offering: (row.offering as string[]) ?? [],
    preferences: (row.preferences as Record<string, unknown>) ?? {},
    constraints: (row.constraints as Record<string, unknown>) ?? {},
    contextual_info: (row.contextual_info as Record<string, unknown>) ?? {},
    completeness_score: Number(row.completeness_score ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapRecommendation(row: Record<string, unknown>): Recommendation {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    user_id: String(row.user_id),
    candidate_id: String(row.candidate_id),
    score: Number(row.score),
    compatibility_pct: Number(row.compatibility_pct),
    explanation: (row.explanation as Recommendation["explanation"]) ?? { reasons: [], common_interests: [], complementarity: [] },
    suggested_opener: row.suggested_opener ? String(row.suggested_opener) : undefined,
    status: row.status as Recommendation["status"],
    agent_evaluation: row.agent_evaluation as Recommendation["agent_evaluation"],
    created_at: String(row.created_at),
    expires_at: row.expires_at ? String(row.expires_at) : undefined,
  };
}

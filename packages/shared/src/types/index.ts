// ─── Privacy & visibility ───────────────────────────────────────────────────

/** Card ID field visibility levels (spec §3) */
export type PrivacyLevel =
  | "public"           // Visible by other participants
  | "matchable"        // Used by matching engine (embeddings)
  | "agent_to_agent"   // Only between authorized agents
  | "after_connection" // Unlocked after mutual acceptance
  | "private"          // User + their agent only
  | "ephemeral";       // Valid only for event/context

// ─── User & auth ────────────────────────────────────────────────────────────

export type Locale = "fr" | "en";

export type UserRole = "participant" | "organizer" | "admin";

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  locale: Locale;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  geolocation_enabled: boolean;
  agent_auto_match: boolean;
  updated_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  metadata?: Record<string, unknown>;
}

export type ConsentType =
  | "terms_of_service"
  | "privacy_policy"
  | "geolocation"
  | "agent_negotiation"
  | "marketing";

// ─── Card ID ────────────────────────────────────────────────────────────────

export interface CardProfile {
  id: string;
  user_id: string;
  /** Context-specific card (event, venue, global) */
  context_type: CardContextType;
  context_id?: string;
  headline?: string;
  bio?: string;
  activity?: string;
  photo_url?: string;
  interests: string[];
  expertises: string[];
  intentions: string[];
  seeking: string[];
  offering: string[];
  preferences: Record<string, unknown>;
  constraints: Record<string, unknown>;
  contextual_info: Record<string, unknown>;
  completeness_score: number;
  created_at: string;
  updated_at: string;
}

export type CardContextType = "global" | "event" | "venue";

export interface CardFieldPermission {
  id: string;
  card_id: string;
  field_name: string;
  privacy_level: PrivacyLevel;
  expires_at?: string;
}

export interface CardEmbedding {
  id: string;
  card_id: string;
  /** Composite embedding of matchable fields */
  embedding: number[];
  model_version: string;
  created_at: string;
}

// ─── Events & venues ────────────────────────────────────────────────────────

export type EventStatus = "draft" | "published" | "live" | "ended" | "archived";

export interface Event {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  description?: string;
  venue_name?: string;
  venue_address?: string;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  default_locale: Locale;
  supported_locales: Locale[];
  qr_code_token: string;
  access_url: string;
  settings: EventSettings;
  created_at: string;
  updated_at: string;
}

export interface EventSettings {
  max_participants?: number;
  require_approval: boolean;
  geolocation_zones_enabled: boolean;
  agent_matching_enabled: boolean;
  auto_expire_visibility: boolean;
}

export type ParticipantStatus = "invited" | "registered" | "checked_in" | "left";

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  card_id?: string;
  visible_in_event: boolean;
  checked_in_at?: string;
  created_at: string;
}

export type ZoneType =
  | "nearby"
  | "main_hall"
  | "bar"
  | "terrace"
  | "vip"
  | "custom";

export interface EventZone {
  id: string;
  event_id: string;
  name: string;
  zone_type: ZoneType;
  sort_order: number;
}

export interface ParticipantLocation {
  id: string;
  participant_id: string;
  zone_id?: string;
  zone_label?: string;
  visible: boolean;
  expires_at?: string;
  updated_at: string;
}

// ─── Agent memory ───────────────────────────────────────────────────────────

export interface AgentMemory {
  id: string;
  user_id: string;
  context_type: CardContextType;
  context_id?: string;
  memory_type: AgentMemoryType;
  content: string;
  privacy_level: PrivacyLevel;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type AgentMemoryType =
  | "onboarding_exchange"
  | "preference"
  | "interaction"
  | "feedback"
  | "contextual";

// ─── Matching pipeline ──────────────────────────────────────────────────────

export type RecommendationStatus =
  | "pending"
  | "shown"
  | "interested"
  | "dismissed"
  | "expired";

export interface Recommendation {
  id: string;
  event_id: string;
  user_id: string;
  candidate_id: string;
  score: number;
  compatibility_pct: number;
  explanation: RecommendationExplanation;
  suggested_opener?: string;
  status: RecommendationStatus;
  agent_evaluation?: AgentEvaluation;
  created_at: string;
  expires_at?: string;
}

export interface RecommendationExplanation {
  reasons: string[];
  common_interests: string[];
  complementarity: string[];
  why_now?: string;
  suggested_topic?: string;
}

export interface AgentEvaluation {
  compatibility_score: number;
  shared_intentions: string[];
  complementarity_notes: string[];
  conversation_topics: string[];
  constraints_checked: boolean;
  evaluated_at: string;
}

// ─── Connections & messaging ───────────────────────────────────────────────

export type ConnectionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "blocked";

export interface Connection {
  id: string;
  event_id?: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  message?: string;
  recommendation_id?: string;
  created_at: string;
  responded_at?: string;
}

export interface Conversation {
  id: string;
  connection_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
}

// ─── Meetings & feedback (KPI core) ─────────────────────────────────────────

export interface Meeting {
  id: string;
  event_id?: string;
  connection_id: string;
  participant_a_id: string;
  participant_b_id: string;
  met: boolean;
  met_at?: string;
  relevance_feedback?: "positive" | "negative";
  feedback_note?: string;
  created_at: string;
}

// ─── Organizer KPIs ─────────────────────────────────────────────────────────

export interface EventKPIs {
  event_id: string;
  participants: number;
  activation_rate: number;
  recommendations_generated: number;
  recommendations_opened: number;
  connections_sent: number;
  acceptance_rate: number;
  meeting_rate: number;
  relevance_positive_rate: number;
  return_rate: number;
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  event_id?: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

// ─── API contracts ──────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

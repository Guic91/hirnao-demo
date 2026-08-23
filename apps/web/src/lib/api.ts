import { demoApi, isClientDemoMode } from "./demo/client";
import { getStoredUser, setStoredUser, setToken, clearToken, getToken } from "./session";

export { getStoredUser, setStoredUser, setToken, clearToken, getToken };

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/v1`
  : "/api/v1";


export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}


async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.code ?? "error", data.message ?? "Request failed");
  }
  return data as T;
}

const liveApi = {
  getEvent: (slug: string) => request<{ event: EventData }>(`/events/${slug}`),

  register: (body: { email: string; display_name: string; locale: "fr" | "en" }) =>
    request<{ user: UserData; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (email: string) =>
    request<{ user: UserData; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  joinEvent: (slug: string, qr_token?: string) =>
    request(`/events/${slug}/join`, {
      method: "POST",
      body: JSON.stringify({ event_slug: slug, qr_token }),
    }),

  checkin: (slug: string) =>
    request(`/events/${slug}/checkin`, { method: "POST" }),

  setVisibility: (slug: string, visible: boolean) =>
    request(`/events/${slug}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visible }),
    }),

  sendAgentMessage: (message: string, event_id?: string) =>
    request<AgentResponse>("/agent/onboarding/message", {
      method: "POST",
      body: JSON.stringify({ message, event_id }),
    }),

  getOnboardingStatus: (event_id?: string) =>
    request<{ complete: boolean; step: number; has_card: boolean }>(
      `/agent/onboarding/status?${event_id ? `event_id=${event_id}` : ""}`,
    ),

  finalizeOnboarding: (event_id?: string) =>
    request("/agent/onboarding/finalize", {
      method: "POST",
      body: JSON.stringify({ event_id }),
    }),

  getMyCard: (event_id?: string) =>
    request<{ card: CardData | null }>(
      `/cards/me?${event_id ? `context=event&id=${event_id}` : ""}`,
    ),

  getRecommendations: (event_id: string) =>
    request<{ recommendations: RecommendationData[]; ai_mode: "llm" | "rule" }>(
      `/matching/recommendations?event_id=${event_id}`,
    ),

  getMatchingStatus: () =>
    request<{ ai_mode: "llm" | "rule"; pipeline: string }>("/matching/status"),

  recommendationAction: (id: string, action: "connect" | "later" | "dismiss") =>
    request(`/matching/recommendations/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  refreshRecommendations: (event_id: string) =>
    request("/matching/refresh", {
      method: "POST",
      body: JSON.stringify({ event_id }),
    }),

  sendConnection: (recipient_id: string, event_id: string, recommendation_id?: string, message?: string) =>
    request("/connections", {
      method: "POST",
      body: JSON.stringify({ recipient_id, event_id, recommendation_id, message }),
    }),

  getConnections: (event_id?: string) =>
    request<{ connections: ConnectionData[] }>(
      `/connections${event_id ? `?event_id=${event_id}` : ""}`,
    ),

  // Organizer
  organizerLogin: (email: string) =>
    request<{ user: UserData; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  listOrganizerEvents: () =>
    request<{ events: EventData[] }>("/organizer/events"),

  getEventKpis: (eventId: string) =>
    request<{ event: { id: string; title: string; status: string }; kpis: EventKPIs }>(
      `/organizer/events/${eventId}/kpis`,
    ),

  getEventQr: (eventId: string) =>
    request<{ access: { slug: string; qr_token: string; access_url: string; qr_url: string } }>(
      `/organizer/events/${eventId}/qr`,
    ),

  getOrganizerParticipants: (eventId: string) =>
    request<{ participants: OrganizerParticipant[] }>(`/organizer/events/${eventId}/participants`),

  createEvent: (body: CreateEventInput) =>
    request<{ event: EventData }>("/organizer/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Admin
  adminLogin: (email: string) =>
    request<{ user: UserData; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  getAdminStats: () =>
    request<{ stats: AdminStats }>("/admin/stats"),

  getAdminUsers: () =>
    request<{ users: UserData[]; total: number }>("/admin/users"),

  getAdminEvents: () =>
    request<{ events: AdminEventData[]; total: number }>("/admin/events"),

  getAdminReports: () =>
    request<{ reports: AdminReport[] }>("/admin/reports"),

  updateAdminReport: (id: string, status: string) =>
    request(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getAdminAiUsage: () =>
    request<AdminAiUsage>("/admin/ai-usage"),

  getAdminAuditLogs: () =>
    request<{ logs: AdminAuditLog[] }>("/admin/audit-logs"),
};

export const api = isClientDemoMode() ? demoApi : liveApi;

export interface UserData {
  id: string;
  email: string;
  display_name: string;
  locale: "fr" | "en";
  role?: "participant" | "organizer" | "admin";
}

export interface EventData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  venue_name?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  default_locale: "fr" | "en";
}

export interface CardData {
  id: string;
  headline?: string;
  bio?: string;
  activity?: string;
  interests: string[];
  expertises: string[];
  intentions: string[];
  seeking: string[];
  offering: string[];
  completeness_score: number;
}

export interface AgentResponse {
  reply: string;
  complete: boolean;
  exchanges: { role: "agent" | "user"; content: string; timestamp: string }[];
}

export interface RecommendationData {
  id: string;
  candidate_id: string;
  score: number;
  compatibility_pct: number;
  explanation: {
    reasons: string[];
    common_interests: string[];
    complementarity: string[];
    suggested_topic?: string;
  };
  suggested_opener?: string;
  status: string;
  agent_evaluation?: {
    compatibility_score: number;
    shared_intentions: string[];
    complementarity_notes: string[];
    conversation_topics: string[];
    constraints_checked: boolean;
    evaluated_at: string;
  };
  candidate: {
    id: string;
    display_name: string;
    headline?: string;
    activity?: string;
  };
}

export interface ConnectionData {
  id: string;
  status: string;
  requester_id: string;
  recipient_id: string;
  requester_name: string;
  recipient_name: string;
  message?: string;
}

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

export interface OrganizerParticipant {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: string;
  visible_in_event: boolean;
  headline?: string;
  activity?: string;
  completeness_score: number;
  recommendations_count: number;
  connections_count: number;
  checked_in_at?: string;
  created_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  venue_name?: string;
  starts_at: string;
  ends_at: string;
  default_locale?: "fr" | "en";
}

export interface AdminStats {
  users: number;
  events: number;
  participants: number;
  recommendations: number;
  connections: number;
  reports_open: number;
  ai_calls: number;
}

export interface AdminAiUsage {
  mode: string;
  total_calls: number;
  recent: {
    operation: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    created_at: string;
  }[];
}

export interface AdminEventData extends EventData {
  organizer_name?: string;
  participant_count?: number;
}

export interface AdminReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

export interface AdminAuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource: string;
  resource_id?: string;
  created_at: string;
  actor_name?: string;
}

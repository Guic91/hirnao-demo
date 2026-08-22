const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hirnao_token");
}

export function setToken(token: string) {
  localStorage.setItem("hirnao_token", token);
}

export function clearToken() {
  localStorage.removeItem("hirnao_token");
  localStorage.removeItem("hirnao_user");
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("hirnao_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem("hirnao_user", JSON.stringify(user));
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

export const api = {
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
};

export interface UserData {
  id: string;
  email: string;
  display_name: string;
  locale: "fr" | "en";
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

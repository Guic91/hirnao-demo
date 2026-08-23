"use client";

import type {
  AdminAiUsage,
  AdminAuditLog,
  AdminEventData,
  AdminReport,
  AdminStats,
  AgentResponse,
  CardData,
  ConnectionData,
  CreateEventInput,
  EventData,
  EventKPIs,
  OrganizerParticipant,
  RecommendationData,
  UserData,
} from "../api";
import { getStoredUser, setStoredUser, setToken } from "../session";
import {
  buildExplanation,
  buildOpener,
  createOnboardingState,
  processOnboardingMessage,
  type OnboardingState,
} from "./onboarding";
import {
  ADMIN_ID,
  DEMO_EVENT,
  EVENT_ID,
  ORGANIZER_ID,
  SEED_CARDS,
  SEED_USERS,
  type DemoCard,
} from "./seed";
import { scoreMatch } from "./scoring";

const STORAGE_KEY = "hirnao_demo_state_v1";

interface Participant {
  id: string;
  event_id: string;
  user_id: string;
  card_id?: string;
  status: string;
  visible_in_event: boolean;
  checked_in_at?: string;
}

interface PersistedState {
  users: UserData[];
  cards: DemoCard[];
  participants: Participant[];
  recommendations: RecommendationData[];
  connections: ConnectionData[];
  onboarding: Record<string, OnboardingState>;
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function defaultState(): PersistedState {
  const participants: Participant[] = SEED_CARDS.map((card) => ({
    id: `p-${card.user_id}`,
    event_id: EVENT_ID,
    user_id: card.user_id,
    card_id: card.id,
    status: "checked_in",
    visible_in_event: true,
    checked_in_at: new Date().toISOString(),
  }));

  return {
    users: [...SEED_USERS],
    cards: [...SEED_CARDS],
    participants,
    recommendations: [],
    connections: [],
    onboarding: {},
  };
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = defaultState();

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug).replace(/\/$/, "").trim();
}

function ensureClientState() {
  if (typeof window !== "undefined") {
    state = loadState();
  }
}

function persist() {
  saveState(state);
}

function currentUser(): UserData | null {
  return getStoredUser<UserData>();
}

function requireUser(): UserData {
  const user = currentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

function userByEmail(email: string) {
  return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function authResponse(user: UserData) {
  setToken(`demo-${user.id}`);
  setStoredUser(user);
  return { user, token: `demo-${user.id}` };
}

function toCardData(card: DemoCard): CardData {
  return {
    id: card.id,
    headline: card.headline,
    bio: card.bio,
    activity: card.activity,
    interests: card.interests,
    expertises: card.expertises,
    intentions: card.intentions,
    seeking: card.seeking,
    offering: card.offering,
    completeness_score: card.completeness_score,
  };
}

function getUserCard(userId: string, eventId: string) {
  return state.cards.find((c) => c.user_id === userId && c.context_id === eventId) ?? null;
}

function commonItems(a: string[], b: string[]) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

function generateRecommendations(userId: string, eventId: string): RecommendationData[] {
  const userCard = getUserCard(userId, eventId);
  if (!userCard) return [];

  const user = state.users.find((u) => u.id === userId);
  const locale = user?.locale ?? "fr";
  const candidates = state.participants
    .filter((p) => p.event_id === eventId && p.user_id !== userId && p.visible_in_event)
    .map((p) => {
      const card = state.cards.find((c) => c.id === p.card_id);
      const candidate = state.users.find((u) => u.id === p.user_id);
      return card && candidate ? { card, candidate } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const recs: RecommendationData[] = candidates.map(({ card, candidate }) => {
    const scoring = scoreMatch({
      user_card: userCard,
      candidate_card: card,
      vector_similarity: 0.72,
      same_zone: true,
      both_available: true,
    });
    const common = commonItems(userCard.interests, card.interests);
    const complementarity = [
      ...commonItems(userCard.seeking, card.offering),
      ...commonItems(card.seeking, userCard.offering),
    ];
  return {
      id: crypto.randomUUID(),
      candidate_id: candidate.id,
      score: scoring.score,
      compatibility_pct: scoring.compatibility_pct,
      explanation: buildExplanation(locale, common, complementarity),
      suggested_opener: buildOpener(locale, common[0] ?? complementarity[0]),
      status: "pending",
      agent_evaluation: {
        compatibility_score: scoring.score,
        shared_intentions: commonItems(userCard.intentions, card.intentions),
        complementarity_notes: complementarity,
        conversation_topics: common.slice(0, 2),
        constraints_checked: true,
        evaluated_at: new Date().toISOString(),
      },
      candidate: {
        id: candidate.id,
        display_name: candidate.display_name,
        headline: card.headline,
        activity: card.activity,
      },
    };
  });

  return recs.sort((a, b) => b.compatibility_pct - a.compatibility_pct).slice(0, 5);
}

function computeKpis(eventId: string): EventKPIs {
  const participants = state.participants.filter((p) => p.event_id === eventId);
  const activated = participants.filter((p) => p.card_id).length;
  const recs = state.recommendations;
  const conns = state.connections.filter((c) => c.status !== "declined");
  const accepted = state.connections.filter((c) => c.status === "accepted");

  return {
    event_id: eventId,
    participants: participants.length,
    activation_rate: participants.length ? activated / participants.length : 0,
    recommendations_generated: recs.length,
    recommendations_opened: recs.filter((r) => ["shown", "interested"].includes(r.status)).length,
    connections_sent: conns.length,
    acceptance_rate: conns.length ? accepted.length / conns.length : 0,
    meeting_rate: 0,
    relevance_positive_rate: 0,
    return_rate: 0,
  };
}

const DEMO_REPORTS: AdminReport[] = [
  {
    id: "r-demo-1",
    reporter_id: "00000000-0000-0000-0000-000000000002",
    reported_user_id: "00000000-0000-0000-0000-000000000004",
    reason: "Comportement inapproprié lors d'une connexion",
    status: "open",
    created_at: new Date().toISOString(),
    reporter_name: "Sophie Martin",
    reported_name: "Lucas Dubois",
  },
];

export const demoApi = {
  getEvent: async (slug: string) => {
    ensureClientState();
    const normalized = normalizeSlug(slug);
    if (normalized !== DEMO_EVENT.slug) {
      throw new Error(`Événement introuvable : ${normalized}`);
    }
    return { event: DEMO_EVENT as EventData };
  },

  register: async (body: { email: string; display_name: string; locale: "fr" | "en" }) => {
    ensureClientState();
    const existing = userByEmail(body.email);
    if (existing) return authResponse(existing);
    const user: UserData = {
      id: crypto.randomUUID(),
      email: body.email.toLowerCase(),
      display_name: body.display_name,
      locale: body.locale,
      role: "participant",
    };
    state.users.push(user);
    persist();
    return authResponse(user);
  },

  login: async (email: string) => {
    ensureClientState();
    const user = userByEmail(email);
    if (!user) throw new Error("User not found");
    return authResponse(user);
  },

  joinEvent: async (slug: string) => {
    ensureClientState();
    const user = requireUser();
    if (normalizeSlug(slug) !== DEMO_EVENT.slug) throw new Error("Event not found");
    const exists = state.participants.find((p) => p.event_id === EVENT_ID && p.user_id === user.id);
    if (!exists) {
      state.participants.push({
        id: crypto.randomUUID(),
        event_id: EVENT_ID,
        user_id: user.id,
        status: "registered",
        visible_in_event: true,
      });
      persist();
    }
    return { ok: true };
  },

  checkin: async (_slug: string) => {
    ensureClientState();
    const user = requireUser();
    const p = state.participants.find((x) => x.event_id === EVENT_ID && x.user_id === user.id);
    if (p) {
      p.status = "checked_in";
      p.checked_in_at = new Date().toISOString();
      persist();
    }
    return { ok: true };
  },

  setVisibility: async (_slug: string, visible: boolean) => {
    ensureClientState();
    const user = requireUser();
    const p = state.participants.find((x) => x.event_id === EVENT_ID && x.user_id === user.id);
    if (p) {
      p.visible_in_event = visible;
      persist();
    }
    return { ok: true };
  },

  sendAgentMessage: async (message: string, event_id?: string) => {
    ensureClientState();
    const user = requireUser();
    const key = `${user.id}:${event_id ?? EVENT_ID}`;
    let session = state.onboarding[key];
    if (!session) session = createOnboardingState(user.locale);
    const result = processOnboardingMessage(session, message, user.locale);
    state.onboarding[key] = result.state;
    persist();
    return {
      reply: result.reply,
      complete: result.complete,
      exchanges: result.state.exchanges,
    } as AgentResponse;
  },

  getOnboardingStatus: async (event_id?: string) => {
    ensureClientState();
    const user = requireUser();
    const key = `${user.id}:${event_id ?? EVENT_ID}`;
    const session = state.onboarding[key];
    const card = getUserCard(user.id, event_id ?? EVENT_ID);
    return {
      complete: Boolean(card) || (session?.step ?? 0) >= 6,
      step: session?.step ?? (card ? 6 : 0),
      has_card: Boolean(card),
    };
  },

  finalizeOnboarding: async (event_id?: string) => {
    ensureClientState();
    const user = requireUser();
    const eid = event_id ?? EVENT_ID;
    const key = `${user.id}:${eid}`;
    const session = state.onboarding[key];
    if (!session) throw new Error("No onboarding session");

    const collected = session.collected;
    const card: DemoCard = {
      id: crypto.randomUUID(),
      user_id: user.id,
      context_id: eid,
      headline: String(collected.headline ?? user.display_name),
      bio: String(collected.bio ?? ""),
      activity: String(collected.activity ?? "Professional"),
      interests: (collected.interests as string[]) ?? [],
      expertises: (collected.expertises as string[]) ?? [],
      intentions: (collected.intentions as string[]) ?? [],
      seeking: (collected.seeking as string[]) ?? [],
      offering: (collected.offering as string[]) ?? [],
      completeness_score: 0.85,
    };
    state.cards = state.cards.filter((c) => !(c.user_id === user.id && c.context_id === eid));
    state.cards.push(card);
    const p = state.participants.find((x) => x.event_id === eid && x.user_id === user.id);
    if (p) p.card_id = card.id;
    delete state.onboarding[key];
    state.recommendations = state.recommendations.filter((r) => r.candidate_id !== user.id);
    persist();
    return { card: toCardData(card), complete: true };
  },

  getMyCard: async (event_id?: string) => {
    ensureClientState();
    const user = requireUser();
    const card = getUserCard(user.id, event_id ?? EVENT_ID);
    return { card: card ? toCardData(card) : null };
  },

  getRecommendations: async (event_id: string) => {
    ensureClientState();
    const user = requireUser();
    let recs = state.recommendations.filter((r) => !["dismissed", "expired"].includes(r.status));
    if (recs.length === 0) {
      recs = generateRecommendations(user.id, event_id);
      state.recommendations = recs;
      persist();
    }
    return { recommendations: recs, ai_mode: "rule" as const };
  },

  getMatchingStatus: async () => ({
    ai_mode: "rule" as const,
    pipeline: "filter → vector → score → shortlist → agent↔agent",
  }),

  recommendationAction: async (id: string, action: "connect" | "later" | "dismiss") => {
    ensureClientState();
    const statusMap = { connect: "interested", later: "shown", dismiss: "dismissed" };
    const rec = state.recommendations.find((r) => r.id === id);
    if (rec) rec.status = statusMap[action];
    persist();
    return { ok: true };
  },

  refreshRecommendations: async (event_id: string) => {
    ensureClientState();
    const user = requireUser();
    state.recommendations = generateRecommendations(user.id, event_id);
    persist();
    return { ok: true };
  },

  sendConnection: async (recipient_id: string, event_id: string, recommendation_id?: string, message?: string) => {
    ensureClientState();
    const user = requireUser();
    const recipient = state.users.find((u) => u.id === recipient_id);
    const conn: ConnectionData = {
      id: crypto.randomUUID(),
      status: "pending",
      requester_id: user.id,
      recipient_id,
      requester_name: user.display_name,
      recipient_name: recipient?.display_name ?? "Participant",
      message,
    };
    state.connections.push(conn);
    if (recommendation_id) {
      const rec = state.recommendations.find((r) => r.id === recommendation_id);
      if (rec) rec.status = "interested";
    }
    persist();
    return { connection: conn };
  },

  getConnections: async (event_id?: string) => {
    ensureClientState();
    const user = requireUser();
    const connections = state.connections.filter(
      (c) => c.requester_id === user.id || c.recipient_id === user.id,
    );
    return { connections };
  },

  organizerLogin: async (email: string) => demoApi.login(email),
  listOrganizerEvents: async () => {
    ensureClientState();
    return { events: [DEMO_EVENT as EventData] };
  },
  getEventKpis: async (eventId: string) => ({
    event: { id: eventId, title: DEMO_EVENT.title, status: DEMO_EVENT.status },
    kpis: computeKpis(eventId),
  }),
  getEventQr: async (_eventId: string) => ({
    access: {
      slug: DEMO_EVENT.slug,
      qr_token: "demo-qr-ai-summit-2026",
      access_url: typeof window !== "undefined" ? `${window.location.origin}/e/${DEMO_EVENT.slug}/` : "",
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${DEMO_EVENT.slug}`,
    },
  }),
  getOrganizerParticipants: async (eventId: string) => {
    ensureClientState();
    const participants: OrganizerParticipant[] = state.participants
      .filter((p) => p.event_id === eventId)
      .map((p) => {
        const user = state.users.find((u) => u.id === p.user_id)!;
        const card = p.card_id ? state.cards.find((c) => c.id === p.card_id) : null;
        return {
          id: p.id,
          user_id: p.user_id,
          display_name: user.display_name,
          email: user.email,
          status: p.status,
          visible_in_event: p.visible_in_event,
          headline: card?.headline,
          activity: card?.activity,
          completeness_score: card?.completeness_score ?? 0,
          recommendations_count: state.recommendations.length,
          connections_count: state.connections.length,
          checked_in_at: p.checked_in_at,
          created_at: new Date().toISOString(),
        };
      });
    return { participants };
  },
  createEvent: async (body: CreateEventInput) => {
    ensureClientState();
    const event: EventData = {
      id: crypto.randomUUID(),
      slug: `event-${Date.now().toString(36)}`,
      title: body.title,
      description: body.description,
      venue_name: body.venue_name,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      status: "draft",
      default_locale: body.default_locale ?? "fr",
    };
    return { event };
  },

  adminLogin: async (email: string) => demoApi.login(email),
  getAdminStats: async (): Promise<{ stats: AdminStats }> => {
    ensureClientState();
    return {
      stats: {
        users: state.users.length,
        events: 1,
        participants: state.participants.length,
        recommendations: state.recommendations.length,
        connections: state.connections.length,
        reports_open: DEMO_REPORTS.filter((r) => r.status === "open").length,
        ai_calls: 0,
      },
    };
  },
  getAdminUsers: async () => ({ users: state.users, total: state.users.length }),
  getAdminEvents: async (): Promise<{ events: AdminEventData[]; total: number }> => ({
    events: [{ ...DEMO_EVENT, organizer_name: "Marie Organisatrice", participant_count: state.participants.length }],
    total: 1,
  }),
  getAdminReports: async () => ({ reports: DEMO_REPORTS }),
  updateAdminReport: async (id: string, status: string) => {
    const report = DEMO_REPORTS.find((r) => r.id === id);
    if (report) report.status = status;
    return { ok: true };
  },
  getAdminAiUsage: async (): Promise<AdminAiUsage> => ({
    mode: "rule",
    total_calls: 0,
    recent: [],
  }),
  getAdminAuditLogs: async (): Promise<{ logs: AdminAuditLog[] }> => ({
    logs: [
      {
        id: "log-1",
        actor_id: ADMIN_ID,
        action: "login",
        resource: "admin",
        created_at: new Date().toISOString(),
        actor_name: "Admin Hirnao",
      },
    ],
  }),
};

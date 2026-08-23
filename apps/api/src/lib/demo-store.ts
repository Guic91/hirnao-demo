import type { CardProfile, Connection, Recommendation, User } from "@hirnao/shared";

const EVENT_ID = "10000000-0000-0000-0000-000000000001";
const ORGANIZER_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = "00000000-0000-0000-0000-000000000099";

export const demoUsers: User[] = [
  {
    id: ADMIN_ID,
    email: "admin@hirnao.app",
    display_name: "Admin Hirnao",
    locale: "fr",
    role: "admin",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: ORGANIZER_ID,
    email: "organizer@hirnao.app",
    display_name: "Marie Organisatrice",
    locale: "fr",
    role: "organizer",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "sophie@demo.app",
    display_name: "Sophie Martin",
    locale: "fr",
    role: "participant",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "alex@demo.app",
    display_name: "Alex Chen",
    locale: "en",
    role: "participant",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "lucas@demo.app",
    display_name: "Lucas Dubois",
    locale: "fr",
    role: "participant",
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoEvent = {
  id: EVENT_ID,
  organizer_id: ORGANIZER_ID,
  slug: "ai-summit-paris-2026",
  title: "AI Summit Paris 2026",
  description: "Conférence sur l'IA appliquée à l'événementiel et au networking.",
  venue_name: "Station F",
  venue_address: null,
  starts_at: new Date(Date.now() + 86400000).toISOString(),
  ends_at: new Date(Date.now() + 86400000 + 28800000).toISOString(),
  status: "published",
  default_locale: "fr" as const,
  supported_locales: ["fr", "en"] as const,
  qr_code_token: "demo-qr-ai-summit-2026",
  access_url: null,
  settings: {
    require_approval: false,
    geolocation_zones_enabled: true,
    agent_matching_enabled: true,
    auto_expire_visibility: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoCards: CardProfile[] = [
  {
    id: "c0000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000002",
    context_type: "event",
    context_id: EVENT_ID,
    headline: "Product Manager IA",
    bio: "Passionnée par l'IA appliquée aux produits B2B.",
    activity: "Product Management",
    interests: ["IA", "SaaS", "UX"],
    expertises: ["Product strategy", "LLM integration"],
    intentions: ["Rencontrer des experts techniques"],
    seeking: ["Co-fondateur technique"],
    offering: ["Vision produit", "Go-to-market"],
    preferences: {},
    constraints: {},
    contextual_info: {},
    completeness_score: 0.88,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    user_id: "00000000-0000-0000-0000-000000000003",
    context_type: "event",
    context_id: EVENT_ID,
    headline: "ML Engineer",
    bio: "Building production ML systems.",
    activity: "Engineering",
    interests: ["ML", "NLP", "Startups"],
    expertises: ["Python", "Vector search", "LLM fine-tuning"],
    intentions: ["Find business partners"],
    seeking: ["Technical co-founder"],
    offering: ["ML architecture", "MLOps"],
    preferences: {},
    constraints: {},
    contextual_info: {},
    completeness_score: 0.88,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    user_id: "00000000-0000-0000-0000-000000000004",
    context_type: "event",
    context_id: EVENT_ID,
    headline: "Event Tech Founder",
    bio: "Je crée des outils pour l'événementiel.",
    activity: "Entrepreneur",
    interests: ["Événementiel", "IA", "Networking"],
    expertises: ["Event platforms", "Matchmaking"],
    intentions: ["Investisseurs", "Clients B2B"],
    seeking: ["Innovation événementielle"],
    offering: ["Démos", "Partenariats"],
    preferences: {},
    constraints: {},
    contextual_info: {},
    completeness_score: 0.88,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface Participant {
  id: string;
  event_id: string;
  user_id: string;
  card_id?: string;
  status: string;
  visible_in_event: boolean;
  checked_in_at?: string;
  created_at: string;
}

class DemoStore {
  users = new Map(demoUsers.map((u) => [u.id, { ...u }]));
  usersByEmail = new Map(demoUsers.map((u) => [u.email, u.id]));
  cards = new Map(demoCards.map((c) => [c.id, { ...c }]));
  events = new Map([[demoEvent.id, { ...demoEvent }]]);
  participants = new Map<string, Participant>();
  recommendations = new Map<string, Recommendation & { candidate_name?: string; candidate_headline?: string; candidate_activity?: string }>();
  connections = new Map<string, Connection & { requester_name?: string; recipient_name?: string }>();
  reports = new Map<string, { id: string; reporter_id: string; reported_user_id: string; event_id?: string; reason: string; status: string; created_at: string; reporter_name?: string; reported_name?: string }>();
  auditLogs: Array<{ id: string; actor_id: string | null; action: string; resource: string; resource_id?: string; metadata?: Record<string, unknown>; created_at: string; actor_name?: string }> = [];
  onboardingSessions = new Map<string, { step: number; exchanges: unknown[]; collected: Record<string, unknown> }>();

  constructor() {
    for (const card of demoCards) {
      const pid = `p-${card.user_id}`;
      this.participants.set(pid, {
        id: pid,
        event_id: EVENT_ID,
        user_id: card.user_id,
        card_id: card.id,
        status: "checked_in",
        visible_in_event: true,
        checked_in_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    this.reports.set("r-demo-1", {
      id: "r-demo-1",
      reporter_id: "00000000-0000-0000-0000-000000000002",
      reported_user_id: "00000000-0000-0000-0000-000000000004",
      event_id: EVENT_ID,
      reason: "Comportement inapproprié lors d'une connexion",
      status: "open",
      created_at: new Date().toISOString(),
      reporter_name: "Sophie Martin",
      reported_name: "Lucas Dubois",
    });

    this.addAuditLog({ actor_id: ADMIN_ID, action: "login", resource: "admin", metadata: { source: "demo" } });
  }

  nextId() {
    return crypto.randomUUID();
  }

  getUser(id: string) {
    return this.users.get(id) ?? null;
  }

  getUserByEmail(email: string) {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.users.get(id) ?? null : null;
  }

  createUser(data: { email: string; display_name: string; locale: "fr" | "en" }) {
    const id = this.nextId();
    const user: User = {
      id,
      email: data.email.toLowerCase(),
      display_name: data.display_name,
      locale: data.locale,
      role: "participant",
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, user);
    this.usersByEmail.set(user.email, id);
    return user;
  }

  getEventBySlug(slug: string) {
    return [...this.events.values()].find((e) => e.slug === slug) ?? null;
  }

  getEventById(id: string) {
    return this.events.get(id) ?? null;
  }

  listEventsByOrganizer(organizerId: string) {
    return [...this.events.values()].filter((e) => e.organizer_id === organizerId);
  }

  createEvent(
    organizerId: string,
    data: {
      title: string;
      description?: string;
      venue_name?: string;
      venue_address?: string;
      starts_at: string;
      ends_at: string;
      default_locale: "fr" | "en";
      supported_locales: ("fr" | "en")[];
      settings: Record<string, unknown>;
      slug: string;
      qr_code_token: string;
    },
  ) {
    const event = {
      id: this.nextId(),
      organizer_id: organizerId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      venue_name: data.venue_name,
      venue_address: data.venue_address ?? null,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      status: "draft" as const,
      default_locale: data.default_locale,
      supported_locales: data.supported_locales,
      qr_code_token: data.qr_code_token,
      access_url: null,
      settings: data.settings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.events.set(event.id, event);
    return event;
  }

  updateEvent(eventId: string, data: Record<string, unknown>) {
    const event = this.events.get(eventId);
    if (!event) return null;
    Object.assign(event, data, { updated_at: new Date().toISOString() });
    return event;
  }

  getKpiRawData(eventId: string) {
    const participants = [...this.participants.values()].filter((p) => p.event_id === eventId);
    const activated = participants.filter((p) => p.card_id).length;
    const recs = [...this.recommendations.values()].filter((r) => r.event_id === eventId);
    const conns = [...this.connections.values()].filter((c) => c.event_id === eventId);

    return {
      participants: participants.length,
      activated,
      recommendations_generated: recs.length,
      recommendations_opened: recs.filter((r) => ["shown", "interested"].includes(r.status)).length,
      connections_sent: conns.length,
      connections_accepted: conns.filter((c) => c.status === "accepted").length,
      meetings_met: 0,
      feedback_positive: 0,
      feedback_total: 0,
      returning_users: 0,
    };
  }

  getOrganizerParticipants(eventId: string) {
    return this.getEventParticipants(eventId).map(({ user, card, participant }) => ({
      id: participant.id,
      status: participant.status,
      visible_in_event: participant.visible_in_event,
      checked_in_at: participant.checked_in_at,
      created_at: participant.created_at,
      user_id: user?.id,
      display_name: user?.display_name,
      email: user?.email,
      headline: card?.headline,
      activity: card?.activity,
      completeness_score: card?.completeness_score ?? 0,
      recommendations_count: [...this.recommendations.values()].filter(
        (r) => r.event_id === eventId && r.user_id === user?.id,
      ).length,
      connections_count: [...this.connections.values()].filter(
        (c) => c.event_id === eventId && (c.requester_id === user?.id || c.recipient_id === user?.id),
      ).length,
    }));
  }

  joinEvent(eventId: string, userId: string) {
    const key = `${eventId}:${userId}`;
    let p = [...this.participants.values()].find((x) => x.event_id === eventId && x.user_id === userId);
    if (!p) {
      p = {
        id: this.nextId(),
        event_id: eventId,
        user_id: userId,
        status: "registered",
        visible_in_event: false,
        created_at: new Date().toISOString(),
      };
      this.participants.set(p.id, p);
    }
    return p;
  }

  checkin(eventId: string, userId: string) {
    const p = [...this.participants.values()].find((x) => x.event_id === eventId && x.user_id === userId);
    if (p) {
      p.status = "checked_in";
      p.checked_in_at = new Date().toISOString();
    }
    return p;
  }

  setVisibility(eventId: string, userId: string, visible: boolean) {
    const p = [...this.participants.values()].find((x) => x.event_id === eventId && x.user_id === userId);
    if (p) p.visible_in_event = visible;
    return p;
  }

  getCard(userId: string, eventId?: string) {
    return [...this.cards.values()].find(
      (c) => c.user_id === userId && (eventId ? c.context_id === eventId : true),
    ) ?? null;
  }

  upsertCard(userId: string, eventId: string | null, data: Partial<CardProfile>) {
    const existing = [...this.cards.values()].find(
      (c) => c.user_id === userId && c.context_type === (eventId ? "event" : "global") && c.context_id === (eventId ?? undefined),
    );
    if (existing) {
      Object.assign(existing, data, { updated_at: new Date().toISOString() });
      return existing;
    }
    const card: CardProfile = {
      id: this.nextId(),
      user_id: userId,
      context_type: eventId ? "event" : "global",
      context_id: eventId ?? undefined,
      interests: [],
      expertises: [],
      intentions: [],
      seeking: [],
      offering: [],
      preferences: {},
      constraints: {},
      contextual_info: {},
      completeness_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    this.cards.set(card.id, card);
    const p = [...this.participants.values()].find((x) => x.event_id === eventId && x.user_id === userId);
    if (p) p.card_id = card.id;
    return card;
  }

  getEventParticipants(eventId: string, visibleOnly = false) {
    return [...this.participants.values()]
      .filter((p) => p.event_id === eventId && (!visibleOnly || p.visible_in_event))
      .map((p) => {
        const user = this.users.get(p.user_id);
        const card = p.card_id ? this.cards.get(p.card_id) : null;
        return { user, card, participant: p };
      });
  }

  getRecommendations(userId: string, eventId: string) {
    return [...this.recommendations.values()].filter(
      (r) => r.user_id === userId && r.event_id === eventId && !["dismissed", "expired"].includes(r.status),
    );
  }

  setRecommendations(recs: (Recommendation & { candidate_name?: string; candidate_headline?: string })[]) {
    for (const r of recs) {
      this.recommendations.set(r.id, r);
    }
  }

  getConnections(userId: string, eventId?: string) {
    return [...this.connections.values()].filter(
      (c) =>
        (c.requester_id === userId || c.recipient_id === userId) &&
        (!eventId || c.event_id === eventId),
    );
  }

  addConnection(data: Omit<Connection, "id" | "created_at">) {
    const id = this.nextId();
    const requester = this.users.get(data.requester_id);
    const recipient = this.users.get(data.recipient_id);
    const conn = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      requester_name: requester?.display_name,
      recipient_name: recipient?.display_name,
    };
    this.connections.set(id, conn);
    return conn;
  }

  listAllUsers(limit: number, offset: number) {
    const users = [...this.users.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { users: users.slice(offset, offset + limit), total: users.length };
  }

  listAllEvents(limit: number, offset: number) {
    const events = [...this.events.values()]
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .slice(offset, offset + limit)
      .map((e) => ({
        ...e,
        organizer_name: this.users.get(e.organizer_id)?.display_name,
        participant_count: [...this.participants.values()].filter((p) => p.event_id === e.id).length,
      }));
    return { events, total: this.events.size };
  }

  listReports(status?: string) {
    return [...this.reports.values()].filter((r) => !status || r.status === status);
  }

  updateReport(id: string, status: string) {
    const report = this.reports.get(id);
    if (!report) return null;
    report.status = status;
    return report;
  }

  getAdminStats() {
    return {
      users: this.users.size,
      events: this.events.size,
      participants: this.participants.size,
      recommendations: this.recommendations.size,
      connections: this.connections.size,
      reports_open: [...this.reports.values()].filter((r) => r.status === "open").length,
      ai_calls: 0,
    };
  }

  addAuditLog(data: { actor_id: string | null; action: string; resource: string; resource_id?: string; metadata?: Record<string, unknown> }) {
    const log = {
      id: this.nextId(),
      ...data,
      created_at: new Date().toISOString(),
      actor_name: data.actor_id ? this.users.get(data.actor_id)?.display_name : undefined,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs(limit: number) {
    return this.auditLogs.slice(0, limit);
  }
}

export const demoStore = new DemoStore();

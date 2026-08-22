import type { CardProfile, Connection, Recommendation, User } from "@hirnao/shared";

const EVENT_ID = "10000000-0000-0000-0000-000000000001";
const ORGANIZER_ID = "00000000-0000-0000-0000-000000000001";

export const demoUsers: User[] = [
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
  participants = new Map<string, Participant>();
  recommendations = new Map<string, Recommendation & { candidate_name?: string; candidate_headline?: string; candidate_activity?: string }>();
  connections = new Map<string, Connection & { requester_name?: string; recipient_name?: string }>();
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
    return slug === demoEvent.slug ? demoEvent : null;
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
}

export const demoStore = new DemoStore();

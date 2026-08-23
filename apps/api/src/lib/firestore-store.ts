import type { CardProfile, Connection, Event, Recommendation, User } from "@hirnao/shared";
import { getFirestoreDb } from "./firebase.js";

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

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  event_id?: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
};

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  actor_name?: string;
};

class FirestoreStore {
  private db() {
    return getFirestoreDb();
  }

  nextId() {
    return crypto.randomUUID();
  }

  async getUser(id: string): Promise<User | null> {
    const doc = await this.db().collection("users").doc(id).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const snap = await this.db().collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as User);
  }

  async createUser(data: { email: string; display_name: string; locale: "fr" | "en" }): Promise<User> {
    const user: User = {
      id: this.nextId(),
      email: data.email.toLowerCase(),
      display_name: data.display_name,
      locale: data.locale,
      role: "participant",
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await this.db().collection("users").doc(user.id).set(user);
    return user;
  }

  async updateUser(
    id: string,
    data: { display_name?: string; locale?: "fr" | "en"; avatar_url?: string },
  ): Promise<User | null> {
    const ref = this.db().collection("users").doc(id);
    const existing = await ref.get();
    if (!existing.exists) return null;
    const user = existing.data() as User;
    const updated: User = {
      ...user,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await ref.set(updated);
    return updated;
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    const snap = await this.db().collection("events").where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Event);
  }

  async getEventById(id: string): Promise<Event | null> {
    const doc = await this.db().collection("events").doc(id).get();
    return doc.exists ? (doc.data() as Event) : null;
  }

  async listEventsByOrganizer(organizerId: string): Promise<Event[]> {
    const snap = await this.db().collection("events").where("organizer_id", "==", organizerId).get();
    return snap.docs.map((d) => d.data() as Event).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  }

  async createEvent(
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
  ): Promise<Event> {
    const event: Event = {
      id: this.nextId(),
      organizer_id: organizerId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      status: "draft",
      default_locale: data.default_locale,
      supported_locales: data.supported_locales,
      qr_code_token: data.qr_code_token,
      access_url: "",
      settings: {
        require_approval: false,
        geolocation_zones_enabled: true,
        agent_matching_enabled: true,
        auto_expire_visibility: true,
        ...(data.settings as Partial<Event["settings"]>),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await this.db().collection("events").doc(event.id).set(event);
    return event;
  }

  async updateEvent(eventId: string, data: Record<string, unknown>): Promise<Event | null> {
    const ref = this.db().collection("events").doc(eventId);
    const existing = await ref.get();
    if (!existing.exists) return null;
    const event = { ...(existing.data() as Event), ...data, updated_at: new Date().toISOString() };
    await ref.set(event);
    return event;
  }

  async getParticipant(eventId: string, userId: string): Promise<Participant | null> {
    const snap = await this.db()
      .collection("participants")
      .where("event_id", "==", eventId)
      .where("user_id", "==", userId)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as Participant);
  }

  async joinEvent(eventId: string, userId: string): Promise<Participant> {
    const existing = await this.getParticipant(eventId, userId);
    if (existing) {
      if (existing.status !== "registered") {
        const updated = { ...existing, status: "registered" };
        await this.db().collection("participants").doc(existing.id).set(updated);
        return updated;
      }
      return existing;
    }
    const participant: Participant = {
      id: this.nextId(),
      event_id: eventId,
      user_id: userId,
      status: "registered",
      visible_in_event: false,
      created_at: new Date().toISOString(),
    };
    await this.db().collection("participants").doc(participant.id).set(participant);
    return participant;
  }

  async checkin(eventId: string, userId: string): Promise<Participant | null> {
    const p = await this.getParticipant(eventId, userId);
    if (!p) return null;
    const updated = { ...p, status: "checked_in", checked_in_at: new Date().toISOString() };
    await this.db().collection("participants").doc(p.id).set(updated);
    return updated;
  }

  async setVisibility(eventId: string, userId: string, visible: boolean): Promise<Participant | null> {
    const p = await this.getParticipant(eventId, userId);
    if (!p) return null;
    const updated = { ...p, visible_in_event: visible };
    await this.db().collection("participants").doc(p.id).set(updated);
    return updated;
  }

  async getCard(userId: string, eventId?: string): Promise<CardProfile | null> {
    if (eventId) {
      const snap = await this.db()
        .collection("cards")
        .where("user_id", "==", userId)
        .where("context_type", "==", "event")
        .where("context_id", "==", eventId)
        .limit(1)
        .get();
      return snap.empty ? null : (snap.docs[0].data() as CardProfile);
    }

    const snap = await this.db().collection("cards").where("user_id", "==", userId).get();
    if (snap.empty) return null;
    const cards = snap.docs.map((d) => d.data() as CardProfile);
    cards.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return cards[0] ?? null;
  }

  async upsertCard(userId: string, eventId: string | null, data: Partial<CardProfile>): Promise<CardProfile> {
    const contextType = eventId ? "event" : "global";
    let snap;
    if (eventId) {
      snap = await this.db()
        .collection("cards")
        .where("user_id", "==", userId)
        .where("context_type", "==", "event")
        .where("context_id", "==", eventId)
        .limit(1)
        .get();
    } else {
      snap = await this.db()
        .collection("cards")
        .where("user_id", "==", userId)
        .where("context_type", "==", "global")
        .limit(1)
        .get();
    }

    if (!snap.empty) {
      const doc = snap.docs[0];
      const card = { ...(doc.data() as CardProfile), ...data, updated_at: new Date().toISOString() };
      await doc.ref.set(card);
      if (eventId) await this.linkCardToParticipant(eventId, userId, card.id);
      return card;
    }

    const card: CardProfile = {
      id: this.nextId(),
      user_id: userId,
      context_type: contextType,
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
    await this.db().collection("cards").doc(card.id).set(card);
    if (eventId) await this.linkCardToParticipant(eventId, userId, card.id);
    return card;
  }

  private async linkCardToParticipant(eventId: string, userId: string, cardId: string) {
    const p = await this.getParticipant(eventId, userId);
    if (p) {
      await this.db().collection("participants").doc(p.id).set({ ...p, card_id: cardId });
    }
  }

  async getEventParticipants(eventId: string, visibleOnly = false) {
    let query = this.db().collection("participants").where("event_id", "==", eventId);
    if (visibleOnly) query = query.where("visible_in_event", "==", true);
    const snap = await query.get();

    const results = [];
    for (const doc of snap.docs) {
      const participant = doc.data() as Participant;
      const user = await this.getUser(participant.user_id);
      const card = participant.card_id
        ? ((await this.db().collection("cards").doc(participant.card_id).get()).data() as CardProfile)
        : null;
      results.push({ user, card, participant });
    }
    return results;
  }

  async getRecommendations(userId: string, eventId: string) {
    const snap = await this.db()
      .collection("recommendations")
      .where("user_id", "==", userId)
      .where("event_id", "==", eventId)
      .get();
    return snap.docs
      .map((d) => d.data() as Recommendation)
      .filter((r) => !["dismissed", "expired"].includes(r.status))
      .sort((a, b) => b.score - a.score);
  }

  async setRecommendations(recs: Recommendation[]) {
    const batch = this.db().batch();
    for (const r of recs) {
      batch.set(this.db().collection("recommendations").doc(r.id), r);
    }
    await batch.commit();
  }

  async clearRecommendations(userId: string, eventId: string) {
    const snap = await this.db()
      .collection("recommendations")
      .where("user_id", "==", userId)
      .where("event_id", "==", eventId)
      .get();
    const batch = this.db().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async updateRecommendation(id: string, userId: string, status: string): Promise<Recommendation | null> {
    const ref = this.db().collection("recommendations").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const rec = doc.data() as Recommendation;
    if (rec.user_id !== userId) return null;
    const updated = { ...rec, status: status as Recommendation["status"] };
    await ref.set(updated);
    return updated;
  }

  async getConnections(userId: string, eventId?: string) {
    const [asRequester, asRecipient] = await Promise.all([
      this.db().collection("connections").where("requester_id", "==", userId).get(),
      this.db().collection("connections").where("recipient_id", "==", userId).get(),
    ]);
    const seen = new Set<string>();
    const connections: (Connection & { requester_name?: string; recipient_name?: string })[] = [];

    for (const snap of [asRequester, asRecipient]) {
      for (const doc of snap.docs) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const conn = doc.data() as Connection & { requester_name?: string; recipient_name?: string };
        if (eventId && conn.event_id !== eventId) continue;
        connections.push(conn);
      }
    }
    return connections.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async addConnection(data: Omit<Connection, "id" | "created_at">) {
    const requester = await this.getUser(data.requester_id);
    const recipient = await this.getUser(data.recipient_id);
    const conn = {
      ...data,
      id: this.nextId(),
      created_at: new Date().toISOString(),
      requester_name: requester?.display_name,
      recipient_name: recipient?.display_name,
    };
    await this.db().collection("connections").doc(conn.id).set(conn);
    return conn;
  }

  async getKpiRawData(eventId: string) {
    const [participants, recs, conns] = await Promise.all([
      this.db().collection("participants").where("event_id", "==", eventId).get(),
      this.db().collection("recommendations").where("event_id", "==", eventId).get(),
      this.db().collection("connections").where("event_id", "==", eventId).get(),
    ]);

    const participantDocs = participants.docs.map((d) => d.data() as Participant);
    const recDocs = recs.docs.map((d) => d.data() as Recommendation);
    const connDocs = conns.docs.map((d) => d.data() as Connection);

    return {
      participants: participantDocs.length,
      activated: participantDocs.filter((p) => p.card_id).length,
      recommendations_generated: recDocs.length,
      recommendations_opened: recDocs.filter((r) => ["shown", "interested"].includes(r.status)).length,
      connections_sent: connDocs.length,
      connections_accepted: connDocs.filter((c) => c.status === "accepted").length,
      meetings_met: 0,
      feedback_positive: 0,
      feedback_total: 0,
      returning_users: 0,
    };
  }

  async getOrganizerParticipants(eventId: string) {
    const participants = await this.getEventParticipants(eventId);
    const [recs, conns] = await Promise.all([
      this.db().collection("recommendations").where("event_id", "==", eventId).get(),
      this.db().collection("connections").where("event_id", "==", eventId).get(),
    ]);
    const recDocs = recs.docs.map((d) => d.data() as Recommendation);
    const connDocs = conns.docs.map((d) => d.data() as Connection);

    return participants.map(({ user, card, participant }) => ({
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
      recommendations_count: recDocs.filter((r) => r.user_id === user?.id).length,
      connections_count: connDocs.filter(
        (c) => c.requester_id === user?.id || c.recipient_id === user?.id,
      ).length,
    }));
  }

  async listAllUsers(limit: number, offset: number) {
    const snap = await this.db().collection("users").orderBy("created_at", "desc").get();
    const users = snap.docs.map((d) => d.data() as User);
    return { users: users.slice(offset, offset + limit), total: users.length };
  }

  async listAllEvents(limit: number, offset: number) {
    const snap = await this.db().collection("events").orderBy("starts_at", "desc").get();
    const all = await Promise.all(
      snap.docs.map(async (doc) => {
        const e = doc.data() as Event;
        const organizer = await this.getUser(e.organizer_id);
        const pSnap = await this.db().collection("participants").where("event_id", "==", e.id).get();
        return {
          ...e,
          organizer_name: organizer?.display_name,
          participant_count: pSnap.size,
        };
      }),
    );
    return { events: all.slice(offset, offset + limit), total: all.length };
  }

  async listReports(status?: string) {
    const snap = await this.db().collection("reports").orderBy("created_at", "desc").get();
    return snap.docs
      .map((d) => d.data() as Report)
      .filter((r) => !status || r.status === status);
  }

  async updateReport(id: string, status: string) {
    const ref = this.db().collection("reports").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const report = { ...(doc.data() as Report), status };
    await ref.set(report);
    return report;
  }

  async getAdminStats() {
    const [users, events, participants, recommendations, connections, reports] = await Promise.all([
      this.db().collection("users").count().get(),
      this.db().collection("events").count().get(),
      this.db().collection("participants").count().get(),
      this.db().collection("recommendations").count().get(),
      this.db().collection("connections").count().get(),
      this.db().collection("reports").where("status", "==", "open").count().get(),
    ]);
    return {
      users: users.data().count,
      events: events.data().count,
      participants: participants.data().count,
      recommendations: recommendations.data().count,
      connections: connections.data().count,
      reports_open: reports.data().count,
      ai_calls: 0,
    };
  }

  async addAuditLog(data: {
    actor_id: string | null;
    action: string;
    resource: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
  }) {
    const actor = data.actor_id ? await this.getUser(data.actor_id) : null;
    const log: AuditLog = {
      id: this.nextId(),
      ...data,
      created_at: new Date().toISOString(),
      actor_name: actor?.display_name,
    };
    await this.db().collection("audit_logs").doc(log.id).set(log);
    return log;
  }

  async getAuditLogs(limit: number) {
    const snap = await this.db().collection("audit_logs").orderBy("created_at", "desc").limit(limit).get();
    return snap.docs.map((d) => d.data() as AuditLog);
  }

  async saveAgentMemory(userId: string, eventId: string | null, message: string, metadata: unknown) {
    const id = this.nextId();
    await this.db()
      .collection("agent_memories")
      .doc(id)
      .set({
        id,
        user_id: userId,
        context_type: eventId ? "event" : "global",
        context_id: eventId,
        memory_type: "onboarding_exchange",
        content: message,
        privacy_level: "private",
        metadata,
        created_at: new Date().toISOString(),
      });
  }

  async getAgentMemories(userId: string, eventId?: string) {
    const snap = await this.db()
      .collection("agent_memories")
      .where("user_id", "==", userId)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
    return snap.docs
      .map((d) => d.data())
      .filter((m) => !eventId || m.context_id === eventId)
      .map((m) => ({
        id: m.id,
        memory_type: m.memory_type,
        content: m.content,
        created_at: m.created_at,
      }));
  }

  async recordConsents(userId: string) {
    const types = ["terms_of_service", "privacy_policy", "agent_negotiation"];
    const batch = this.db().batch();
    const now = new Date().toISOString();
    for (const consentType of types) {
      batch.set(this.db().collection("user_consents").doc(`${userId}_${consentType}`), {
        user_id: userId,
        consent_type: consentType,
        granted: true,
        granted_at: now,
      });
    }
    await batch.commit();
  }

  async recordConsent(userId: string, consentType: string, granted: boolean) {
    const now = new Date().toISOString();
    await this.db()
      .collection("user_consents")
      .doc(`${userId}_${consentType}`)
      .set({
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: granted ? now : null,
        revoked_at: granted ? null : now,
      });
  }

  async logAiUsage(usage: {
    operation: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    metadata?: Record<string, unknown>;
  }) {
    const id = this.nextId();
    await this.db()
      .collection("ai_usage_logs")
      .doc(id)
      .set({ id, ...usage, created_at: new Date().toISOString() });
  }

  async getAiUsageByOperation() {
    const snap = await this.db().collection("ai_usage_logs").get();
    const grouped = new Map<string, { operation: string; model: string; input_tokens: number; output_tokens: number; calls: number }>();
    for (const doc of snap.docs) {
      const row = doc.data();
      const key = `${row.operation}:${row.model}`;
      const existing = grouped.get(key) ?? {
        operation: row.operation,
        model: row.model,
        input_tokens: 0,
        output_tokens: 0,
        calls: 0,
      };
      existing.input_tokens += row.input_tokens ?? 0;
      existing.output_tokens += row.output_tokens ?? 0;
      existing.calls += 1;
      grouped.set(key, existing);
    }
    return [...grouped.values()].sort((a, b) => b.calls - a.calls);
  }

  async countAiUsage(): Promise<number> {
    const snap = await this.db().collection("ai_usage_logs").count().get();
    return snap.data().count;
  }
}

export const firestoreStore = new FirestoreStore();

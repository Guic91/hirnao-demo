import type { Event, EventKPIs } from "@hirnao/shared";
import { createEventSchema } from "@hirnao/shared";
import { z } from "zod";
import { demoStore } from "./demo-store.js";
import { isDemoMode } from "./db.js";
import * as pg from "./db-pg.js";
import { mapEvent } from "./mappers.js";
import { computeKpis, type KpiRawData } from "./kpis.js";

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["draft", "published", "live", "ended", "archived"]).optional(),
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function isEventOrganizer(eventId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === "admin") return true;
  if (isDemoMode()) {
    const event = demoStore.getEventById(eventId);
    return event?.organizer_id === userId;
  }
  const row = await pg.queryOne(`SELECT organizer_id FROM events WHERE id = $1`, [eventId]);
  return row?.organizer_id === userId;
}

export async function listOrganizerEvents(organizerId: string) {
  if (isDemoMode()) {
    return demoStore.listEventsByOrganizer(organizerId);
  }
  const result = await pg.query(`SELECT * FROM events WHERE organizer_id = $1 ORDER BY starts_at DESC`, [organizerId]);
  return result.rows.map(mapEvent);
}

export async function getEventById(eventId: string): Promise<Event | null> {
  if (isDemoMode()) return demoStore.getEventById(eventId);
  const row = await pg.queryOne(`SELECT * FROM events WHERE id = $1`, [eventId]);
  return row ? mapEvent(row) : null;
}

export async function createEvent(organizerId: string, input: z.infer<typeof createEventSchema>) {
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;
  const qrToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);

  if (isDemoMode()) {
    return demoStore.createEvent(organizerId, { ...input, slug, qr_code_token: qrToken });
  }

  const row = await pg.queryOne(
    `INSERT INTO events (organizer_id, slug, title, description, venue_name, venue_address,
       starts_at, ends_at, default_locale, supported_locales, status, qr_code_token, settings)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12)
     RETURNING *`,
    [
      organizerId,
      slug,
      input.title,
      input.description ?? null,
      input.venue_name ?? null,
      input.venue_address ?? null,
      input.starts_at,
      input.ends_at,
      input.default_locale,
      input.supported_locales,
      qrToken,
      JSON.stringify(input.settings),
    ],
  );
  return row ? mapEvent(row) : null;
}

export async function updateEvent(eventId: string, input: z.infer<typeof updateEventSchema>) {
  if (isDemoMode()) return demoStore.updateEvent(eventId, input);

  const row = await pg.queryOne(
    `UPDATE events SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       venue_name = COALESCE($4, venue_name),
       venue_address = COALESCE($5, venue_address),
       starts_at = COALESCE($6, starts_at),
       ends_at = COALESCE($7, ends_at),
       status = COALESCE($8, status),
       settings = COALESCE($9, settings),
       updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      eventId,
      input.title,
      input.description,
      input.venue_name,
      input.venue_address,
      input.starts_at,
      input.ends_at,
      input.status,
      input.settings ? JSON.stringify(input.settings) : null,
    ],
  );
  return row ? mapEvent(row) : null;
}

export async function getEventKpis(eventId: string): Promise<EventKPIs> {
  const raw = isDemoMode() ? demoStore.getKpiRawData(eventId) : await fetchPgKpiRawData(eventId);
  return computeKpis(eventId, raw);
}

async function fetchPgKpiRawData(eventId: string): Promise<KpiRawData> {
  const [participants, recs, conns, meetings] = await Promise.all([
    pg.queryOne<{ total: string; activated: string }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE card_id IS NOT NULL)::int AS activated
       FROM event_participants WHERE event_id = $1`,
      [eventId],
    ),
    pg.queryOne<{ generated: string; opened: string }>(
      `SELECT COUNT(*)::int AS generated,
              COUNT(*) FILTER (WHERE status IN ('shown', 'interested'))::int AS opened
       FROM recommendations WHERE event_id = $1`,
      [eventId],
    ),
    pg.queryOne<{ sent: string; accepted: string }>(
      `SELECT COUNT(*)::int AS sent,
              COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted
       FROM connections WHERE event_id = $1`,
      [eventId],
    ),
    pg.queryOne<{ met: string; positive: string; total: string }>(
      `SELECT COUNT(*) FILTER (WHERE met = true)::int AS met,
              COUNT(*) FILTER (WHERE relevance_feedback = 'positive')::int AS positive,
              COUNT(*) FILTER (WHERE relevance_feedback IS NOT NULL)::int AS total
       FROM meetings WHERE event_id = $1`,
      [eventId],
    ),
  ]);

  return {
    participants: Number(participants?.total ?? 0),
    activated: Number(participants?.activated ?? 0),
    recommendations_generated: Number(recs?.generated ?? 0),
    recommendations_opened: Number(recs?.opened ?? 0),
    connections_sent: Number(conns?.sent ?? 0),
    connections_accepted: Number(conns?.accepted ?? 0),
    meetings_met: Number(meetings?.met ?? 0),
    feedback_positive: Number(meetings?.positive ?? 0),
    feedback_total: Number(meetings?.total ?? 0),
    returning_users: 0,
  };
}

export async function getOrganizerParticipants(eventId: string) {
  if (isDemoMode()) return demoStore.getOrganizerParticipants(eventId);

  const result = await pg.query(
    `SELECT ep.id, ep.status, ep.visible_in_event, ep.checked_in_at, ep.created_at,
            u.id AS user_id, u.display_name, u.email,
            cp.headline, cp.activity, cp.completeness_score,
            (SELECT COUNT(*)::int FROM recommendations r WHERE r.event_id = ep.event_id AND r.user_id = ep.user_id) AS recommendations_count,
            (SELECT COUNT(*)::int FROM connections c WHERE c.event_id = ep.event_id AND (c.requester_id = ep.user_id OR c.recipient_id = ep.user_id)) AS connections_count
     FROM event_participants ep
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN card_profiles cp ON cp.id = ep.card_id
     WHERE ep.event_id = $1
     ORDER BY ep.created_at DESC`,
    [eventId],
  );
  return result.rows;
}

export function getEventAccessInfo(event: Event, baseUrl = process.env.WEB_URL ?? "http://localhost:3000") {
  return {
    slug: event.slug,
    qr_token: event.qr_code_token,
    access_url: `${baseUrl}/e/${event.slug}`,
    qr_url: `${baseUrl}/e/${event.slug}?qr=${event.qr_code_token}`,
  };
}

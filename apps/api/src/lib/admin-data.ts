import { isDemoMode, isFirebaseMode } from "./db.js";
import { demoStore } from "./demo-store.js";
import { firestoreStore } from "./firestore-store.js";
import * as pg from "./db-pg.js";
import { mapEvent, mapUser } from "./mappers.js";
import { getAiUsageStats } from "./ai-runtime.js";

export interface AdminStats {
  users: number;
  events: number;
  participants: number;
  recommendations: number;
  connections: number;
  reports_open: number;
  ai_calls: number;
}

export async function listAdminUsers(limit = 50, offset = 0) {
  if (isDemoMode()) return demoStore.listAllUsers(limit, offset);
  if (isFirebaseMode()) return firestoreStore.listAllUsers(limit, offset);
  const result = await pg.query(
    `SELECT id, email, display_name, locale, role, email_verified, created_at
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const count = await pg.queryOne<{ total: string }>(`SELECT COUNT(*)::int AS total FROM users`);
  return { users: result.rows.map(mapUser), total: Number(count?.total ?? 0) };
}

export async function listAdminEvents(limit = 50, offset = 0) {
  if (isDemoMode()) return demoStore.listAllEvents(limit, offset);
  if (isFirebaseMode()) return firestoreStore.listAllEvents(limit, offset);
  const result = await pg.query(
    `SELECT e.*, u.display_name AS organizer_name,
            (SELECT COUNT(*)::int FROM event_participants ep WHERE ep.event_id = e.id) AS participant_count
     FROM events e JOIN users u ON u.id = e.organizer_id
     ORDER BY e.starts_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const count = await pg.queryOne<{ total: string }>(`SELECT COUNT(*)::int AS total FROM events`);
  return {
    events: result.rows.map((r) => ({ ...mapEvent(r), organizer_name: r.organizer_name, participant_count: r.participant_count })),
    total: Number(count?.total ?? 0),
  };
}

export async function listReports(status?: string) {
  if (isDemoMode()) return { reports: demoStore.listReports(status) };
  if (isFirebaseMode()) return { reports: await firestoreStore.listReports(status) };
  const result = status
    ? await pg.query(`SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC`, [status])
    : await pg.query(`SELECT * FROM reports ORDER BY created_at DESC`);
  return { reports: result.rows };
}

export async function updateReportStatus(reportId: string, status: string) {
  if (isDemoMode()) return demoStore.updateReport(reportId, status);
  if (isFirebaseMode()) return firestoreStore.updateReport(reportId, status);
  return pg.queryOne(`UPDATE reports SET status = $2 WHERE id = $1 RETURNING *`, [reportId, status]);
}

export async function getAdminStats(): Promise<AdminStats> {
  if (isDemoMode()) {
    const stats = demoStore.getAdminStats();
    stats.ai_calls = getAiUsageStats().total_calls;
    return stats;
  }
  if (isFirebaseMode()) {
    const stats = await firestoreStore.getAdminStats();
    stats.ai_calls = getAiUsageStats().total_calls;
    return stats;
  }
  const [users, events, participants, recs, conns, reports, ai] = await Promise.all([
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM users`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM events`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM event_participants`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM recommendations`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM connections`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM reports WHERE status = 'open'`),
    pg.queryOne<{ c: string }>(`SELECT COUNT(*)::int AS c FROM ai_usage_logs`),
  ]);
  return {
    users: Number(users?.c ?? 0),
    events: Number(events?.c ?? 0),
    participants: Number(participants?.c ?? 0),
    recommendations: Number(recs?.c ?? 0),
    connections: Number(conns?.c ?? 0),
    reports_open: Number(reports?.c ?? 0),
    ai_calls: Number(ai?.c ?? 0),
  };
}

export async function getAdminAiUsage() {
  const stats = getAiUsageStats();
  if (isDemoMode()) return stats;
  if (isFirebaseMode()) {
    return { ...stats, by_operation: await firestoreStore.getAiUsageByOperation() };
  }
  const result = await pg.query(
    `SELECT operation, model, SUM(input_tokens)::int AS input_tokens, SUM(output_tokens)::int AS output_tokens, COUNT(*)::int AS calls
     FROM ai_usage_logs GROUP BY operation, model ORDER BY calls DESC`,
  );
  return { ...stats, by_operation: result.rows };
}

export async function getAuditLogs(limit = 50) {
  if (isDemoMode()) return { logs: demoStore.getAuditLogs(limit) };
  if (isFirebaseMode()) return { logs: await firestoreStore.getAuditLogs(limit) };
  const result = await pg.query(
    `SELECT al.*, u.display_name AS actor_name FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id ORDER BY al.created_at DESC LIMIT $1`,
    [limit],
  );
  return { logs: result.rows };
}

export async function logAudit(
  actorId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  if (isDemoMode()) {
    demoStore.addAuditLog({ actor_id: actorId, action, resource, resource_id: resourceId, metadata });
    return;
  }
  if (isFirebaseMode()) {
    await firestoreStore.addAuditLog({ actor_id: actorId, action, resource, resource_id: resourceId, metadata });
    return;
  }
  await pg.query(
    `INSERT INTO audit_logs (actor_id, action, resource, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, resource, resourceId ?? null, JSON.stringify(metadata ?? {})],
  );
}

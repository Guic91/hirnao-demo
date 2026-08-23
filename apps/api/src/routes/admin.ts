import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { badRequest, notFound } from "../lib/errors.js";
import {
  getAdminAiUsage,
  getAdminStats,
  getAuditLogs,
  listAdminEvents,
  listAdminUsers,
  listReports,
  logAudit,
  updateReportStatus,
} from "../lib/admin-data.js";

const reportUpdateSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
});

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireAdmin);

  app.get("/stats", async () => {
    const stats = await getAdminStats();
    return { stats };
  });

  app.get("/users", async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    return listAdminUsers(Number(limit ?? 50), Number(offset ?? 0));
  });

  app.get("/events", async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };
    return listAdminEvents(Number(limit ?? 50), Number(offset ?? 0));
  });

  app.get("/reports", async (request) => {
    const { status } = request.query as { status?: string };
    return listReports(status);
  });

  app.patch("/reports/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = reportUpdateSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid status");

    const report = await updateReportStatus(id, parsed.data.status);
    if (!report) return notFound(reply, "Report");

    await logAudit(request.userId, "update_report", "reports", id, { status: parsed.data.status });
    return { report };
  });

  app.get("/ai-usage", async () => getAdminAiUsage());

  app.get("/audit-logs", async (request) => {
    const { limit } = request.query as { limit?: string };
    return getAuditLogs(Number(limit ?? 50));
  });
};

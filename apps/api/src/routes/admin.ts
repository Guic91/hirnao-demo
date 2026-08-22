import type { FastifyPluginAsync } from "fastify";

/**
 * Back-office HIRNAO (§15) — admin role required
 *
 * GET  /v1/admin/users
 * GET  /v1/admin/events
 * GET  /v1/admin/reports
 * PATCH /v1/admin/reports/:id
 * GET  /v1/admin/stats
 * GET  /v1/admin/ai-usage
 * GET  /v1/admin/audit-logs
 */
export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/users", async () => ({ status: "not_implemented" }));
  app.get("/events", async () => ({ status: "not_implemented" }));
  app.get("/reports", async () => ({ status: "not_implemented" }));
  app.patch("/reports/:id", async () => ({ status: "not_implemented" }));
  app.get("/stats", async () => ({ status: "not_implemented" }));
  app.get("/ai-usage", async () => ({ status: "not_implemented" }));
  app.get("/audit-logs", async () => ({ status: "not_implemented" }));
};

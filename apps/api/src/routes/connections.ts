import type { FastifyPluginAsync } from "fastify";

/**
 * POST /v1/connections              — Send connection request
 * GET  /v1/connections              — List connections (pending + accepted)
 * POST /v1/connections/:id/respond  — accept | decline | block
 * POST /v1/connections/:id/report   — Report user
 */
export const connectionRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async () => ({ status: "not_implemented" }));
  app.get("/", async () => ({ status: "not_implemented" }));
  app.post("/:id/respond", async () => ({ status: "not_implemented" }));
  app.post("/:id/report", async () => ({ status: "not_implemented" }));
};

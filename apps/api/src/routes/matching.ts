import type { FastifyPluginAsync } from "fastify";

/**
 * GET  /v1/matching/recommendations       — Top recommendations for user in event
 * POST /v1/matching/recommendations/:id   — Action: connect | later | dismiss
 * POST /v1/matching/refresh               — Trigger re-matching (rate-limited)
 */
export const matchingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/recommendations", async () => ({ status: "not_implemented" }));
  app.post("/recommendations/:id", async () => ({ status: "not_implemented" }));
  app.post("/refresh", async () => ({ status: "not_implemented" }));
};

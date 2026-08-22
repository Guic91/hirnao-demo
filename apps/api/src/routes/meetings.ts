import type { FastifyPluginAsync } from "fastify";

/**
 * POST /v1/meetings/:connectionId/feedback  — "Vous êtes-vous rencontrés?" + 👍/👎
 * GET  /v1/meetings/pending                 — Connections awaiting meeting feedback
 */
export const meetingRoutes: FastifyPluginAsync = async (app) => {
  app.post("/:connectionId/feedback", async () => ({ status: "not_implemented" }));
  app.get("/pending", async () => ({ status: "not_implemented" }));
};

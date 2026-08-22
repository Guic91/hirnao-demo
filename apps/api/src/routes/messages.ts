import type { FastifyPluginAsync } from "fastify";

/**
 * GET  /v1/messages/conversations           — List conversations
 * GET  /v1/messages/conversations/:id       — Message history
 * POST /v1/messages/conversations/:id       — Send text message
 * WS   /v1/messages/ws                      — Real-time notifications
 */
export const messageRoutes: FastifyPluginAsync = async (app) => {
  app.get("/conversations", async () => ({ status: "not_implemented" }));
  app.get("/conversations/:id", async () => ({ status: "not_implemented" }));
  app.post("/conversations/:id", async () => ({ status: "not_implemented" }));
};

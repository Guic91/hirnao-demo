import type { FastifyPluginAsync } from "fastify";

/**
 * POST /v1/agent/onboarding/message  — Send message to personal agent
 * GET  /v1/agent/onboarding/status   — Onboarding completion status
 * POST /v1/agent/onboarding/finalize — Structure answers → Card ID
 * GET  /v1/agent/memory              — Agent memory (owner only)
 */
export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/onboarding/message", async () => ({ status: "not_implemented" }));
  app.get("/onboarding/status", async () => ({ status: "not_implemented" }));
  app.post("/onboarding/finalize", async () => ({ status: "not_implemented" }));
  app.get("/memory", async () => ({ status: "not_implemented" }));
};

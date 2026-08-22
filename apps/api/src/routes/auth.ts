import type { FastifyPluginAsync } from "fastify";

/**
 * POST /v1/auth/register     — Quick signup (email + name)
 * POST /v1/auth/login        — Login
 * POST /v1/auth/magic-link   — Passwordless login
 * GET  /v1/auth/me           — Current user
 * PATCH /v1/auth/me          — Update profile + locale
 * POST /v1/auth/consents     — Record consent grants/revocations
 */
export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async () => ({ status: "not_implemented" }));
  app.post("/login", async () => ({ status: "not_implemented" }));
  app.post("/magic-link", async () => ({ status: "not_implemented" }));
  app.get("/me", async () => ({ status: "not_implemented" }));
  app.patch("/me", async () => ({ status: "not_implemented" }));
  app.post("/consents", async () => ({ status: "not_implemented" }));
};

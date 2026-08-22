import type { FastifyPluginAsync } from "fastify";

/**
 * POST   /v1/organizer/events              — Create event
 * PATCH  /v1/organizer/events/:id          — Update event
 * GET    /v1/organizer/events/:id/kpis     — Dashboard KPIs (§14)
 * GET    /v1/organizer/events/:id/qr       — QR code + access link
 * GET    /v1/organizer/events/:id/participants — Participant list (no private data)
 */
export const organizerRoutes: FastifyPluginAsync = async (app) => {
  app.post("/events", async () => ({ status: "not_implemented" }));
  app.patch("/events/:id", async () => ({ status: "not_implemented" }));
  app.get("/events/:id/kpis", async () => ({ status: "not_implemented" }));
  app.get("/events/:id/qr", async () => ({ status: "not_implemented" }));
  app.get("/events/:id/participants", async () => ({ status: "not_implemented" }));
};

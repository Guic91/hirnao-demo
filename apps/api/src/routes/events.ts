import type { FastifyPluginAsync } from "fastify";

/**
 * GET    /v1/events/:slug           — Event details (public if published)
 * POST   /v1/events/:slug/join      — Join via QR token or slug
 * POST   /v1/events/:slug/checkin   — Check in to event
 * PATCH  /v1/events/:slug/visibility — Toggle "Me rendre visible"
 * GET    /v1/events/:slug/zones     — Available zones
 * GET    /v1/events/:slug/participants — Visible participants (public cards)
 */
export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:slug", async () => ({ status: "not_implemented" }));
  app.post("/:slug/join", async () => ({ status: "not_implemented" }));
  app.post("/:slug/checkin", async () => ({ status: "not_implemented" }));
  app.patch("/:slug/visibility", async () => ({ status: "not_implemented" }));
  app.get("/:slug/zones", async () => ({ status: "not_implemented" }));
  app.get("/:slug/participants", async () => ({ status: "not_implemented" }));
};

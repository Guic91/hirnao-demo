import type { FastifyPluginAsync } from "fastify";

/**
 * GET    /v1/cards/me                    — Own card(s)
 * GET    /v1/cards/me?context=event&id=  — Context-specific card
 * PUT    /v1/cards/me                    — Create/update card
 * PATCH  /v1/cards/:id/permissions       — Set field privacy levels
 * GET    /v1/cards/:userId/public        — Public card view (filtered by permissions)
 */
export const cardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", async () => ({ status: "not_implemented" }));
  app.put("/me", async () => ({ status: "not_implemented" }));
  app.patch("/:id/permissions", async () => ({ status: "not_implemented" }));
  app.get("/:userId/public", async () => ({ status: "not_implemented" }));
};

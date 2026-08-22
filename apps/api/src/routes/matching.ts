import type { FastifyPluginAsync } from "fastify";
import { recommendationActionSchema } from "@hirnao/shared";
import { badRequest, notFound } from "../lib/errors.js";
import { getAiRuntime } from "../lib/ai-runtime.js";
import * as data from "../lib/data.js";

export const matchingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/status", async () => {
    const { mode } = getAiRuntime();
    return { ai_mode: mode, pipeline: "filter → vector → score → shortlist → agent↔agent" };
  });

  app.get("/recommendations", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id } = request.query as { event_id?: string };
    if (!event_id) return badRequest(reply, "event_id is required");

    const recommendations = await data.getRecommendations(request.userId, event_id);
    const { mode } = getAiRuntime();
    return { recommendations, ai_mode: mode };
  });

  app.post("/recommendations/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = recommendationActionSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid action");

    const statusMap = { connect: "interested", later: "shown", dismiss: "dismissed" } as const;
    const recommendation = await data.updateRecommendationStatus(
      id,
      request.userId,
      statusMap[parsed.data.action],
    );
    if (!recommendation) return notFound(reply, "Recommendation");

    return { recommendation };
  });

  app.post("/refresh", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id } = request.body as { event_id?: string };
    if (!event_id) return badRequest(reply, "event_id is required");

    await data.refreshRecommendations(event_id, request.userId);
    return { ok: true };
  });
};

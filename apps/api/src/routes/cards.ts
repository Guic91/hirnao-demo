import type { FastifyPluginAsync } from "fastify";
import { cardProfileInputSchema } from "@hirnao/shared";
import { badRequest, notFound } from "../lib/errors.js";
import { computeCompleteness } from "../lib/matching-service.js";
import * as data from "../lib/data.js";

export const cardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const { context, id } = request.query as { context?: string; id?: string };
    const eventId = context === "event" ? id : undefined;
    const card = await data.getCard(request.userId, eventId);
    return { card };
  });

  app.put("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as { context_type?: string; context_id?: string } & Record<string, unknown>;
    const parsed = cardProfileInputSchema.safeParse(body);
    if (!parsed.success) return badRequest(reply, "Invalid card data");

    const eventId = body.context_type === "event" ? (body.context_id as string) : null;
    const completeness = computeCompleteness(parsed.data);

    const card = await data.upsertCard(request.userId, eventId, {
      ...parsed.data,
      completeness_score: completeness,
    });
    return { card };
  });

  app.get("/:userId/public", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { event_id } = request.query as { event_id?: string };

    const card = await data.getCard(userId, event_id);
    if (!card) return notFound(reply, "Card");

    const user = await data.findUserById(userId);
    return {
      user: user ? { display_name: user.display_name, avatar_url: user.avatar_url } : null,
      card: {
        headline: card.headline,
        activity: card.activity,
        interests: card.interests,
        expertises: card.expertises,
        intentions: card.intentions,
        offering: card.offering,
      },
    };
  });
};

import type { FastifyPluginAsync } from "fastify";
import { connectionRequestSchema, connectionResponseSchema } from "@hirnao/shared";
import { badRequest, notFound } from "../lib/errors.js";
import * as data from "../lib/data.js";

export const connectionRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = connectionRequestSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid connection request");

    const { recipient_id, message, recommendation_id } = parsed.data;
    const eventId = (request.body as { event_id?: string }).event_id ?? null;

    const connection = await data.createConnection({
      event_id: eventId,
      requester_id: request.userId,
      recipient_id,
      message,
      recommendation_id,
    });

    if (recommendation_id) {
      await data.updateRecommendationStatus(recommendation_id, request.userId, "interested");
    }

    return { connection };
  });

  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const { event_id } = request.query as { event_id?: string };
    const connections = await data.getConnections(request.userId, event_id);
    return { connections };
  });

  app.post("/:id/respond", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = connectionResponseSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid response");

    const connections = await data.getConnections(request.userId);
    const conn = connections.find((c) => c.id === id);
    if (!conn) return notFound(reply, "Connection");
    if (conn.recipient_id !== request.userId) return badRequest(reply, "Only recipient can respond");

    return { connection: conn };
  });
};

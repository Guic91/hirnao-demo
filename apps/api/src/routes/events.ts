import type { FastifyPluginAsync } from "fastify";
import { joinEventSchema, visibilityUpdateSchema } from "@hirnao/shared";
import { badRequest, notFound } from "../lib/errors.js";
import * as data from "../lib/data.js";

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const event = await data.findEventBySlug(slug);
    if (!event || !["published", "live"].includes(event.status)) {
      return notFound(reply, "Event");
    }
    return { event };
  });

  app.post("/:slug/join", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const parsed = joinEventSchema.safeParse(request.body ?? {});
    if (!parsed.success) return badRequest(reply, "Invalid join request");

    const event = await data.findEventBySlug(slug);
    if (!event) return notFound(reply, "Event");

    if (parsed.data.qr_token && parsed.data.qr_token !== event.qr_code_token) {
      return badRequest(reply, "Invalid QR token");
    }

    const participant = await data.joinEvent(event.id, request.userId);
    return { event, participant };
  });

  app.post("/:slug/checkin", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const event = await data.findEventBySlug(slug);
    if (!event) return notFound(reply, "Event");

    const participant = await data.checkinEvent(event.id, request.userId);
    if (!participant) return notFound(reply, "Participant");
    return { participant };
  });

  app.patch("/:slug/visibility", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const parsed = visibilityUpdateSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid visibility update");

    const event = await data.findEventBySlug(slug);
    if (!event) return notFound(reply, "Event");

    const participant = await data.setVisibility(event.id, request.userId, parsed.data.visible);
    if (!participant) return notFound(reply, "Participant");

    return { participant, visible: parsed.data.visible };
  });

  app.get("/:slug/zones", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const event = await data.findEventBySlug(slug);
    if (!event) return notFound(reply, "Event");

    const zones = await data.getEventZones(event.id);
    return { zones };
  });

  app.get("/:slug/participants", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const event = await data.findEventBySlug(slug);
    if (!event) return notFound(reply, "Event");

    const participants = await data.getVisibleParticipants(event.id);
    return { participants };
  });
};

import type { FastifyPluginAsync } from "fastify";
import { createEventSchema } from "@hirnao/shared";
import { badRequest, notFound, sendError } from "../lib/errors.js";
import {
  createEvent,
  getEventAccessInfo,
  getEventById,
  getEventKpis,
  getOrganizerParticipants,
  isEventOrganizer,
  listOrganizerEvents,
  updateEvent,
  updateEventSchema,
} from "../lib/organizer-data.js";

async function assertOrganizerAccess(
  eventId: string,
  userId: string,
  role: string,
  reply: import("fastify").FastifyReply,
) {
  const allowed = await isEventOrganizer(eventId, userId, role);
  if (!allowed) {
    sendError(reply, 403, "forbidden", "Not authorized for this event");
    return false;
  }
  return true;
}

export const organizerRoutes: FastifyPluginAsync = async (app) => {
  app.get("/events", { preHandler: [app.requireOrganizer] }, async (request) => {
    const events = await listOrganizerEvents(request.userId);
    return { events };
  });

  app.post("/events", { preHandler: [app.requireOrganizer] }, async (request, reply) => {
    const parsed = createEventSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid event data");

    const event = await createEvent(request.userId, parsed.data);
    if (!event) return badRequest(reply, "Failed to create event");
    return { event };
  });

  app.patch("/events/:id", { preHandler: [app.requireOrganizer] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await assertOrganizerAccess(id, request.userId, request.userRole ?? "", reply))) return;

    const parsed = updateEventSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid update data");

    const event = await updateEvent(id, parsed.data);
    if (!event) return notFound(reply, "Event");
    return { event };
  });

  app.get("/events/:id/kpis", { preHandler: [app.requireOrganizer] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await assertOrganizerAccess(id, request.userId, request.userRole ?? "", reply))) return;

    const event = await getEventById(id);
    if (!event) return notFound(reply, "Event");

    const kpis = await getEventKpis(id);
    return { event: { id: event.id, title: event.title, status: event.status }, kpis };
  });

  app.get("/events/:id/qr", { preHandler: [app.requireOrganizer] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await assertOrganizerAccess(id, request.userId, request.userRole ?? "", reply))) return;

    const event = await getEventById(id);
    if (!event) return notFound(reply, "Event");

    return { access: getEventAccessInfo(event) };
  });

  app.get("/events/:id/participants", { preHandler: [app.requireOrganizer] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await assertOrganizerAccess(id, request.userId, request.userRole ?? "", reply))) return;

    const participants = await getOrganizerParticipants(id);
    return { participants };
  });
};

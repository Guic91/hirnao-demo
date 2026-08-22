import type { FastifyReply } from "fastify";
import type { ApiError } from "@hirnao/shared";

export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const body: ApiError = { code, message, details };
  return reply.status(status).send(body);
}

export function notFound(reply: FastifyReply, resource = "Resource") {
  return sendError(reply, 404, "not_found", `${resource} not found`);
}

export function unauthorized(reply: FastifyReply) {
  return sendError(reply, 401, "unauthorized", "Authentication required");
}

export function badRequest(reply: FastifyReply, message: string, details?: Record<string, unknown>) {
  return sendError(reply, 400, "bad_request", message, details);
}

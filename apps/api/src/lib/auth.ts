import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { unauthorized } from "./errors.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireOrganizer: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    userId: string;
    userRole?: string;
  }
}

export function registerAuth(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<JwtPayload>();
      request.userId = payload.sub;
      request.userRole = payload.role;
    } catch {
      return unauthorized(reply);
    }
  });

  app.decorate("requireOrganizer", async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (!["organizer", "admin"].includes(request.userRole ?? "")) {
      return sendForbidden(reply, "Organizer access required");
    }
  });

  app.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (request.userRole !== "admin") {
      return sendForbidden(reply, "Admin access required");
    }
  });
}

function sendForbidden(reply: FastifyReply, message = "Forbidden") {
  return reply.status(403).send({ code: "forbidden", message });
}

export function signToken(app: FastifyInstance, user: { id: string; email: string; role: string }) {
  return app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
}

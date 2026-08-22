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
  }
  interface FastifyRequest {
    userId: string;
  }
}

export function registerAuth(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<JwtPayload>();
      request.userId = payload.sub;
    } catch {
      return unauthorized(reply);
    }
  });
}

export function signToken(app: FastifyInstance, user: { id: string; email: string; role: string }) {
  return app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
}

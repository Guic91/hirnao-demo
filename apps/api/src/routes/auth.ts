import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { signToken } from "../lib/auth.js";
import { badRequest, sendError } from "../lib/errors.js";
import * as data from "../lib/data.js";

const registerSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(2).max(100),
  locale: z.enum(["fr", "en"]).default("fr"),
});

const updateMeSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  locale: z.enum(["fr", "en"]).optional(),
  avatar_url: z.string().url().optional(),
});

const consentSchema = z.object({
  consent_type: z.enum([
    "terms_of_service",
    "privacy_policy",
    "geolocation",
    "agent_negotiation",
    "marketing",
  ]),
  granted: z.boolean(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid registration data");

    const { email, display_name, locale } = parsed.data;
    const existing = await data.findUserByEmail(email);
    if (existing) return sendError(reply, 409, "email_exists", "Email already registered");

    const user = await data.createUser({ email, display_name, locale });
    await data.recordConsents(user.id);

    const token = signToken(app, { id: user.id, email: user.email, role: user.role });
    return { user, token };
  });

  app.post("/login", async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid email");

    const user = await data.findUserByEmail(parsed.data.email);
    if (!user) return sendError(reply, 404, "user_not_found", "No account with this email");

    const token = signToken(app, { id: user.id, email: user.email, role: user.role });
    return { user, token };
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const user = await data.findUserById(request.userId);
    return { user };
  });

  app.patch("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = updateMeSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid update data");

    const user = await data.updateUser(request.userId, parsed.data);
    return { user };
  });

  app.post("/consents", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = consentSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid consent data");

    await data.recordConsent(request.userId, parsed.data.consent_type, parsed.data.granted);
    return { ok: true };
  });
};

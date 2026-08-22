import type { FastifyPluginAsync } from "fastify";
import { onboardingMessageSchema } from "@hirnao/shared";
import { badRequest, notFound } from "../lib/errors.js";
import {
  createOnboardingState,
  getOpeningMessage,
  processOnboardingMessage,
  toStructuredResult,
} from "../lib/demo-agent.js";
import { computeCompleteness } from "../lib/matching-service.js";
import * as data from "../lib/data.js";

const onboardingSessions = new Map<string, ReturnType<typeof createOnboardingState>>();

function sessionKey(userId: string, eventId?: string) {
  return `${userId}:${eventId ?? "global"}`;
}

export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/onboarding/message", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = onboardingMessageSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid message");

    const { message, event_id } = parsed.data;
    const user = await data.findUserById(request.userId);
    const locale = user?.locale ?? "fr";
    const key = sessionKey(request.userId, event_id);

    let state = onboardingSessions.get(key);
    if (!state) {
      state = createOnboardingState();
      state.exchanges.push({
        role: "agent",
        content: getOpeningMessage(locale),
        timestamp: new Date().toISOString(),
      });
    }

    const result = processOnboardingMessage(state, message, locale);
    onboardingSessions.set(key, result.state);

    await data.saveAgentMemory(request.userId, event_id ?? null, message, {
      step: result.state.step,
      complete: result.complete,
    });

    return {
      reply: result.reply,
      complete: result.complete,
      exchanges: result.state.exchanges,
      collected: result.state.collected,
    };
  });

  app.get("/onboarding/status", { preHandler: [app.authenticate] }, async (request) => {
    const eventId = (request.query as { event_id?: string }).event_id;
    const key = sessionKey(request.userId, eventId);
    const state = onboardingSessions.get(key);
    const card = await data.getCard(request.userId, eventId);

    return {
      complete: Boolean(card) || (state?.step ?? 0) >= 6,
      step: state?.step ?? (card ? 6 : 0),
      has_card: Boolean(card),
    };
  });

  app.post("/onboarding/finalize", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id } = (request.body ?? {}) as { event_id?: string };
    const key = sessionKey(request.userId, event_id);
    const state = onboardingSessions.get(key);
    if (!state) return badRequest(reply, "No onboarding session found");

    const structured = toStructuredResult(state.collected);
    const completeness = computeCompleteness(structured);

    const card = await data.upsertCard(request.userId, event_id ?? null, {
      headline: structured.headline,
      bio: structured.bio,
      activity: structured.activity,
      interests: structured.interests,
      expertises: structured.expertises,
      intentions: structured.intentions,
      seeking: structured.seeking,
      offering: structured.offering,
      preferences: structured.preferences,
      constraints: structured.constraints,
      completeness_score: completeness,
    });

    onboardingSessions.delete(key);
    return { card, complete: true };
  });

  app.get("/memory", { preHandler: [app.authenticate] }, async (request) => {
    const eventId = (request.query as { event_id?: string }).event_id;
    const memories = await data.getAgentMemories(request.userId, eventId);
    return { memories };
  });
};

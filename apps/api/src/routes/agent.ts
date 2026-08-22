import type { FastifyPluginAsync } from "fastify";
import { onboardingMessageSchema } from "@hirnao/shared";
import {
  createRuleOnboardingState,
  getRuleOpeningMessage,
  processRuleOnboardingMessage,
  type ExtendedAgentService,
} from "@hirnao/ai";
import { badRequest } from "../lib/errors.js";
import { toStructuredResult } from "../lib/demo-agent.js";
import { computeCompleteness } from "../lib/matching-service.js";
import { getAiRuntime } from "../lib/ai-runtime.js";
import * as data from "../lib/data.js";

const onboardingSessions = new Map<string, ReturnType<typeof createRuleOnboardingState>>();

function sessionKey(userId: string, eventId?: string) {
  return `${userId}:${eventId ?? "global"}`;
}

export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/status", async () => {
    const { mode } = getAiRuntime();
    return { ai_mode: mode, llm_available: mode === "llm" };
  });

  app.post("/onboarding/message", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = onboardingMessageSchema.safeParse(request.body);
    if (!parsed.success) return badRequest(reply, "Invalid message");

    const { message, event_id } = parsed.data;
    const user = await data.findUserById(request.userId);
    const locale = user?.locale ?? "fr";
    const key = sessionKey(request.userId, event_id);
    const { agentService, mode } = getAiRuntime(locale);

    let state = onboardingSessions.get(key);
    if (!state) {
      state = createRuleOnboardingState();
      state.exchanges.push({
        role: "agent",
        content: getRuleOpeningMessage(locale),
        timestamp: new Date().toISOString(),
      });
    }

    let replyText: string;
    let complete: boolean;

    if (mode === "llm" && "chatOnboarding" in agentService) {
      const llmAgent = agentService as ExtendedAgentService;
      replyText = await llmAgent.chatOnboarding!(state.exchanges, message, locale);
      complete = /finalis|finalize|card id|terminé|complete/i.test(replyText);
      state = {
        ...state,
        step: state.step + 1,
        exchanges: [
          ...state.exchanges,
          { role: "user", content: message, timestamp: new Date().toISOString() },
          { role: "agent", content: replyText, timestamp: new Date().toISOString() },
        ],
        collected: { ...state.collected },
      };
      if (complete) state.step = 6;
    } else {
      const result = processRuleOnboardingMessage(state, message, locale);
      state = result.state;
      replyText = result.reply;
      complete = result.complete;
    }

    onboardingSessions.set(key, state);

    await data.saveAgentMemory(request.userId, event_id ?? null, message, {
      step: state.step,
      complete,
      ai_mode: mode,
    });

    return {
      reply: replyText,
      complete,
      exchanges: state.exchanges,
      collected: state.collected,
      ai_mode: mode,
    };
  });

  app.get("/onboarding/status", { preHandler: [app.authenticate] }, async (request) => {
    const eventId = (request.query as { event_id?: string }).event_id;
    const key = sessionKey(request.userId, eventId);
    const state = onboardingSessions.get(key);
    const card = await data.getCard(request.userId, eventId);
    const { mode } = getAiRuntime();

    return {
      complete: Boolean(card) || (state?.step ?? 0) >= 6,
      step: state?.step ?? (card ? 6 : 0),
      has_card: Boolean(card),
      ai_mode: mode,
    };
  });

  app.post("/onboarding/finalize", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id } = (request.body ?? {}) as { event_id?: string };
    const key = sessionKey(request.userId, event_id);
    const state = onboardingSessions.get(key);
    if (!state) return badRequest(reply, "No onboarding session found");

    const user = await data.findUserById(request.userId);
    const locale = user?.locale ?? "fr";
    const { agentService, mode } = getAiRuntime(locale);

    let structured;
    if (mode === "llm") {
      structured = await agentService.processOnboarding(state.exchanges, locale);
    } else {
      structured = toStructuredResult(state.collected);
    }

    const completeness = computeCompleteness(structured);

    const card = await data.upsertCard(request.userId, event_id ?? null, {
      headline: (structured as { headline?: string }).headline,
      bio: (structured as { bio?: string }).bio,
      activity: (structured as { activity?: string }).activity,
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
    return { card, complete: true, ai_mode: mode };
  });

  app.get("/memory", { preHandler: [app.authenticate] }, async (request) => {
    const eventId = (request.query as { event_id?: string }).event_id;
    const memories = await data.getAgentMemories(request.userId, eventId);
    return { memories };
  });
};

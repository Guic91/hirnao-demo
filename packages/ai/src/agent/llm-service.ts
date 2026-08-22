import type {
  AgentNegotiationInput,
  AgentNegotiationResult,
  OnboardingExchange,
  StructuredOnboardingResult,
} from "../types.js";
import type { AgentService } from "./service.js";
import { chatCompletion } from "../llm/client.js";
import { createRuleAgentService } from "./rule-service.js";

const ONBOARDING_SYSTEM_FR = `Tu es l'agent personnel Hirnao. Tu aides l'utilisateur à créer sa Card ID pour un événement de networking.
Pose des questions naturelles pour comprendre : intentions, ce qu'il recherche, ce qu'il apporte, intérêts, expertises, présentation.
Sois concis (2-3 phrases max). Réponds en français.
Quand tu as assez d'informations (6 dimensions couvertes), dis-le clairement et propose de finaliser la Card ID.`;

const ONBOARDING_SYSTEM_EN = `You are the Hirnao personal agent. You help the user create their Card ID for a networking event.
Ask natural questions to understand: intentions, what they seek, what they offer, interests, expertise, self-introduction.
Be concise (2-3 sentences max). Respond in English.
When you have enough information (6 dimensions covered), say so clearly and offer to finalize the Card ID.`;

const STRUCTURE_PROMPT = `Extract structured Card ID fields from this onboarding conversation.
Return JSON only with keys: intentions, seeking, offering, interests, expertises, headline, bio, activity (all string arrays except headline/bio/activity).
Use empty arrays if unknown.`;

const NEGOTIATION_SYSTEM = `You are a Hirnao agent-to-agent compatibility evaluator.
You receive ONLY shareable profile fields (never private data).
Evaluate if two participants should meet at this event.
Return JSON: {
  "compatible": boolean,
  "compatibility_pct": number (0-100),
  "evaluation": {
    "compatibility_score": number (0-1),
    "shared_intentions": string[],
    "complementarity_notes": string[],
    "conversation_topics": string[],
    "constraints_checked": true
  },
  "explanation": {
    "reasons": string[] (2-3 human-readable reasons in user's locale),
    "common_interests": string[],
    "complementarity": string[],
    "suggested_topic": string
  },
  "suggested_opener": string (friendly first message suggestion)
}`;

export interface LlmUsageCallback {
  (usage: {
    operation: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    metadata?: Record<string, unknown>;
  }): void | Promise<void>;
}

export function createLlmAgentService(
  locale: "fr" | "en",
  onUsage?: LlmUsageCallback,
): AgentService {
  const fallback = createRuleAgentService(locale);

  async function track(operation: string, model: string, input: number, output: number, metadata?: Record<string, unknown>) {
    await onUsage?.({ operation, model, input_tokens: input, output_tokens: output, metadata });
  }

  return {
    async processOnboarding(exchanges: OnboardingExchange[], loc: "fr" | "en"): Promise<StructuredOnboardingResult> {
      const system = loc === "fr" ? ONBOARDING_SYSTEM_FR : ONBOARDING_SYSTEM_EN;
      const history = exchanges.map((e) => ({
        role: e.role === "agent" ? ("assistant" as const) : ("user" as const),
        content: e.content,
      }));

      const result = await chatCompletion(
        [{ role: "system", content: system }, ...history],
        { temperature: 0.7 },
      );
      await track("onboarding_chat", result.model, result.input_tokens, result.output_tokens);

      const structure = await chatCompletion(
        [
          { role: "system", content: STRUCTURE_PROMPT },
          { role: "user", content: JSON.stringify(exchanges) },
        ],
        { temperature: 0, json: true },
      );
      await track("onboarding_structure", structure.model, structure.input_tokens, structure.output_tokens);

      try {
        const parsed = JSON.parse(structure.content);
        return {
          intentions: parsed.intentions ?? [],
          seeking: parsed.seeking ?? [],
          offering: parsed.offering ?? [],
          interests: parsed.interests ?? [],
          expertises: parsed.expertises ?? [],
          preferences: parsed.preferences ?? {},
          constraints: parsed.constraints ?? {},
        };
      } catch {
        return fallback.processOnboarding(exchanges, loc);
      }
    },

    async negotiate(input: AgentNegotiationInput): Promise<AgentNegotiationResult> {
      const result = await chatCompletion(
        [
          { role: "system", content: NEGOTIATION_SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              locale,
              event_id: input.event_id,
              agent_a: input.agent_a,
              agent_b: input.agent_b,
            }),
          },
        ],
        { temperature: 0.3, json: true },
      );
      await track("agent_negotiation", result.model, result.input_tokens, result.output_tokens, {
        event_id: input.event_id,
      });

      try {
        const parsed = JSON.parse(result.content);
        return {
          compatible: Boolean(parsed.compatible),
          compatibility_pct: Number(parsed.compatibility_pct ?? 0),
          evaluation: {
            ...parsed.evaluation,
            evaluated_at: new Date().toISOString(),
          },
          explanation: parsed.explanation ?? { reasons: [], common_interests: [], complementarity: [] },
          suggested_opener: parsed.suggested_opener ?? "",
        };
      } catch {
        return fallback.negotiate(input);
      }
    },

    async explainMatch(agent_a, agent_b, loc) {
      return this.negotiate({ agent_a, agent_b, event_id: "" });
    },

    async chatOnboarding(exchanges: OnboardingExchange[], userMessage: string, loc: "fr" | "en"): Promise<string> {
      const system = loc === "fr" ? ONBOARDING_SYSTEM_FR : ONBOARDING_SYSTEM_EN;
      const history = [
        ...exchanges.map((e) => ({
          role: e.role === "agent" ? ("assistant" as const) : ("user" as const),
          content: e.content,
        })),
        { role: "user" as const, content: userMessage },
      ];

      const result = await chatCompletion([{ role: "system", content: system }, ...history], { temperature: 0.7 });
      await track("onboarding_chat", result.model, result.input_tokens, result.output_tokens);
      return result.content;
    },
  };
}

export interface ExtendedAgentService extends AgentService {
  chatOnboarding?(exchanges: OnboardingExchange[], userMessage: string, locale: "fr" | "en"): Promise<string>;
}

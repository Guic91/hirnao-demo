import type {
  AgentNegotiationInput,
  AgentNegotiationResult,
  OnboardingExchange,
  StructuredOnboardingResult,
} from "../types.js";
import type { AgentService } from "./service.js";
import { toAgentContext } from "./service.js";
import { scoreMatch } from "../matching/pipeline.js";

function parseList(input: string): string[] {
  return input.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
}

const ONBOARDING_STEPS = [
  { key: "intentions", fr: "Quelles sont vos intentions pour cet événement ?", en: "What are your intentions for this event?" },
  { key: "seeking", fr: "Que recherchez-vous concrètement ?", en: "What are you concretely looking for?" },
  { key: "offering", fr: "Que pouvez-vous apporter aux autres participants ?", en: "What can you offer to other participants?" },
  { key: "interests", fr: "Quels sont vos centres d'intérêt ? (virgules)", en: "What are your interests? (comma-separated)" },
  { key: "expertises", fr: "Quelles sont vos expertises clés ?", en: "What are your key areas of expertise?" },
  { key: "headline", fr: "En une phrase, comment vous présentez-vous ?", en: "In one sentence, how would you introduce yourself?" },
] as const;

export interface RuleOnboardingState {
  step: number;
  exchanges: OnboardingExchange[];
  collected: Partial<StructuredOnboardingResult & { headline: string; bio: string; activity: string }>;
}

export function createRuleOnboardingState(): RuleOnboardingState {
  return { step: 0, exchanges: [], collected: {} };
}

export function getRuleOpeningMessage(locale: "fr" | "en"): string {
  return locale === "fr"
    ? "Bonjour ! Je suis votre agent Hirnao. Je vais vous aider à créer votre Card ID pour cet événement. Commençons par vos intentions."
    : "Hello! I'm your Hirnao agent. I'll help you create your Card ID for this event. Let's start with your intentions.";
}

export function processRuleOnboardingMessage(
  state: RuleOnboardingState,
  message: string,
  locale: "fr" | "en",
): { state: RuleOnboardingState; reply: string; complete: boolean } {
  const exchanges = [
    ...state.exchanges,
    { role: "user" as const, content: message, timestamp: new Date().toISOString() },
  ];

  const currentStep = ONBOARDING_STEPS[state.step];
  if (!currentStep) {
    return {
      state: { ...state, exchanges },
      reply: locale === "fr" ? "Onboarding terminé." : "Onboarding complete.",
      complete: true,
    };
  }

  const collected = { ...state.collected };
  const values = parseList(message);

  switch (currentStep.key) {
    case "intentions": collected.intentions = values; break;
    case "seeking": collected.seeking = values; break;
    case "offering": collected.offering = values; break;
    case "interests": collected.interests = values; break;
    case "expertises": collected.expertises = values; break;
    case "headline":
      collected.headline = message.trim();
      collected.activity = message.trim().split(" ")[0] ?? "Professional";
      collected.bio = message.trim();
      break;
  }

  const nextStep = state.step + 1;
  const complete = nextStep >= ONBOARDING_STEPS.length;
  const reply = complete
    ? locale === "fr"
      ? "Parfait ! J'ai structuré votre Card ID. Vous pouvez la consulter et passer aux recommandations."
      : "Perfect! I've structured your Card ID. You can review it and move on to recommendations."
    : ONBOARDING_STEPS[nextStep][locale];

  return {
    state: {
      step: nextStep,
      exchanges: [...exchanges, { role: "agent", content: reply, timestamp: new Date().toISOString() }],
      collected,
    },
    reply,
    complete,
  };
}

function buildRuleNegotiation(
  input: AgentNegotiationInput,
  locale: "fr" | "en",
): AgentNegotiationResult {
  const cardA = input.agent_a.shareable_profile;
  const cardB = input.agent_b.shareable_profile;

  const interestsA = input.agent_a.shareable_profile.interests ?? [];
  const interestsB = input.agent_b.shareable_profile.interests ?? [];
  const commonInterests = interestsA.filter((i) =>
    interestsB.some((b) => b.toLowerCase() === i.toLowerCase()),
  );

  const complementarity = input.agent_b.offering.filter((o) =>
    input.agent_a.seeking.some((s) => o.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(o.toLowerCase())),
  );

  const scoring = scoreMatch({
    user_card: {
      id: "", user_id: input.agent_a.user_id, context_type: "event",
      interests: interestsA, expertises: input.agent_a.shareable_profile.expertises ?? [],
      intentions: input.agent_a.intentions, seeking: input.agent_a.seeking, offering: input.agent_a.offering,
      preferences: {}, constraints: {}, contextual_info: {}, completeness_score: 0,
      created_at: "", updated_at: "",
    },
    candidate_card: {
      id: "", user_id: input.agent_b.user_id, context_type: "event",
      interests: interestsB, expertises: input.agent_b.shareable_profile.expertises ?? [],
      intentions: input.agent_b.intentions, seeking: input.agent_b.seeking, offering: input.agent_b.offering,
      preferences: {}, constraints: {}, contextual_info: {}, completeness_score: 0,
      created_at: "", updated_at: "",
    },
    vector_similarity: 0.65,
    same_zone: false,
    both_available: true,
  });

  const topic = commonInterests[0] ?? complementarity[0];
  const reasons =
    locale === "fr"
      ? [
          commonInterests.length > 0 ? `Intérêts communs : ${commonInterests.slice(0, 3).join(", ")}` : "Profils complémentaires",
          complementarity.length > 0 ? `Complémentarité : ${complementarity.slice(0, 2).join(" · ")}` : "Potentiel de collaboration identifié",
        ]
      : [
          commonInterests.length > 0 ? `Shared interests: ${commonInterests.slice(0, 3).join(", ")}` : "Complementary profiles",
          complementarity.length > 0 ? `Complementarity: ${complementarity.slice(0, 2).join(" · ")}` : "Collaboration potential identified",
        ];

  return {
    compatible: scoring.score >= 0.5,
    compatibility_pct: scoring.compatibility_pct,
    evaluation: {
      compatibility_score: scoring.score,
      shared_intentions: input.agent_a.intentions.filter((i) =>
        input.agent_b.intentions.some((b) => b.toLowerCase() === i.toLowerCase()),
      ),
      complementarity_notes: complementarity,
      conversation_topics: commonInterests.slice(0, 3),
      constraints_checked: true,
      evaluated_at: new Date().toISOString(),
    },
    explanation: { reasons, common_interests: commonInterests, complementarity, suggested_topic: topic },
    suggested_opener:
      locale === "fr"
        ? topic
          ? `Bonjour ! Hirnao suggère qu'on échange sur ${topic}. Ça vous dit ?`
          : "Bonjour ! Hirnao pense qu'on pourrait avoir une conversation intéressante."
        : topic
          ? `Hi! Hirnao suggests we chat about ${topic}. Interested?`
          : "Hi! Hirnao thinks we could have an interesting conversation.",
  };
}

export function createRuleAgentService(locale: "fr" | "en" = "fr"): AgentService {
  return {
    async processOnboarding(exchanges: OnboardingExchange[], loc: "fr" | "en") {
      const state = createRuleOnboardingState();
      for (const ex of exchanges) {
        if (ex.role === "user") {
          const result = processRuleOnboardingMessage(state, ex.content, loc);
          Object.assign(state, result.state);
        }
      }
      return {
        intentions: state.collected.intentions ?? [],
        seeking: state.collected.seeking ?? [],
        offering: state.collected.offering ?? [],
        interests: state.collected.interests ?? [],
        expertises: state.collected.expertises ?? [],
        preferences: state.collected.preferences ?? {},
        constraints: state.collected.constraints ?? {},
      };
    },

    async negotiate(input: AgentNegotiationInput) {
      return buildRuleNegotiation(input, locale);
    },

    async explainMatch(agent_a, agent_b, loc) {
      return buildRuleNegotiation({ agent_a, agent_b, event_id: "" }, loc);
    },
  };
}

export { toAgentContext };

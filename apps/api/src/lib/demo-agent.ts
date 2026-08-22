import type { OnboardingExchange, StructuredOnboardingResult } from "@hirnao/ai";
import type { Locale } from "@hirnao/shared";

const ONBOARDING_STEPS = [
  {
    key: "intentions",
    fr: "Quelles sont vos intentions pour cet événement ? (ex: trouver un co-fondateur, investisseurs, clients…)",
    en: "What are your intentions for this event? (e.g. find a co-founder, investors, clients…)",
  },
  {
    key: "seeking",
    fr: "Que recherchez-vous concrètement ?",
    en: "What are you concretely looking for?",
  },
  {
    key: "offering",
    fr: "Que pouvez-vous apporter aux autres participants ?",
    en: "What can you offer to other participants?",
  },
  {
    key: "interests",
    fr: "Quels sont vos centres d'intérêt ? (séparez par des virgules)",
    en: "What are your interests? (comma-separated)",
  },
  {
    key: "expertises",
    fr: "Quelles sont vos expertises clés ?",
    en: "What are your key areas of expertise?",
  },
  {
    key: "headline",
    fr: "En une phrase, comment vous présentez-vous ?",
    en: "In one sentence, how would you introduce yourself?",
  },
] as const;

export interface OnboardingState {
  step: number;
  exchanges: OnboardingExchange[];
  collected: Partial<StructuredOnboardingResult & { headline: string; bio: string; activity: string }>;
}

export function createOnboardingState(): OnboardingState {
  return { step: 0, exchanges: [], collected: {} };
}

export function getOpeningMessage(locale: Locale): string {
  return locale === "fr"
    ? "Bonjour ! Je suis votre agent Hirnao. Je vais vous aider à créer votre Card ID pour cet événement. Commençons par vos intentions."
    : "Hello! I'm your Hirnao agent. I'll help you create your Card ID for this event. Let's start with your intentions.";
}

export function processOnboardingMessage(
  state: OnboardingState,
  message: string,
  locale: Locale,
): { state: OnboardingState; reply: string; complete: boolean } {
  const exchanges = [
    ...state.exchanges,
    { role: "user" as const, content: message, timestamp: new Date().toISOString() },
  ];

  const currentStep = ONBOARDING_STEPS[state.step];
  if (!currentStep) {
    return { state: { ...state, exchanges }, reply: locale === "fr" ? "Onboarding terminé." : "Onboarding complete.", complete: true };
  }

  const collected = { ...state.collected };
  const values = parseList(message);

  switch (currentStep.key) {
    case "intentions":
      collected.intentions = values;
      break;
    case "seeking":
      collected.seeking = values;
      break;
    case "offering":
      collected.offering = values;
      break;
    case "interests":
      collected.interests = values;
      break;
    case "expertises":
      collected.expertises = values;
      break;
    case "headline":
      collected.headline = message.trim();
      collected.activity = message.trim().split(" ")[0] ?? "Professional";
      collected.bio = message.trim();
      break;
  }

  const nextStep = state.step + 1;
  const complete = nextStep >= ONBOARDING_STEPS.length;

  let reply: string;
  if (complete) {
    reply =
      locale === "fr"
        ? "Parfait ! J'ai structuré votre Card ID. Vous pouvez la consulter et passer aux recommandations."
        : "Perfect! I've structured your Card ID. You can review it and move on to recommendations.";
  } else {
    reply = ONBOARDING_STEPS[nextStep][locale];
  }

  const updatedExchanges = [
    ...exchanges,
    { role: "agent" as const, content: reply, timestamp: new Date().toISOString() },
  ];

  return {
    state: { step: nextStep, exchanges: updatedExchanges, collected },
    reply,
    complete,
  };
}

function parseList(input: string): string[] {
  return input
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toStructuredResult(
  collected: OnboardingState["collected"],
): StructuredOnboardingResult & { headline?: string; bio?: string; activity?: string } {
  return {
    intentions: collected.intentions ?? [],
    seeking: collected.seeking ?? [],
    offering: collected.offering ?? [],
    interests: collected.interests ?? [],
    expertises: collected.expertises ?? [],
    preferences: collected.preferences ?? {},
    constraints: collected.constraints ?? {},
    headline: collected.headline,
    bio: collected.bio,
    activity: collected.activity,
  };
}

export function generateExplanation(
  locale: Locale,
  commonInterests: string[],
  complementarity: string[],
): { reasons: string[]; common_interests: string[]; complementarity: string[]; suggested_topic?: string } {
  const reasons =
    locale === "fr"
      ? [
          commonInterests.length > 0
            ? `Vous partagez des intérêts : ${commonInterests.slice(0, 3).join(", ")}`
            : "Profils complémentaires détectés",
          complementarity.length > 0
            ? `Complémentarité : ${complementarity.slice(0, 2).join(" · ")}`
            : "Potentiel de collaboration identifié par vos agents",
        ]
      : [
          commonInterests.length > 0
            ? `You share interests: ${commonInterests.slice(0, 3).join(", ")}`
            : "Complementary profiles detected",
          complementarity.length > 0
            ? `Complementarity: ${complementarity.slice(0, 2).join(" · ")}`
            : "Collaboration potential identified by your agents",
        ];

  return {
    reasons,
    common_interests: commonInterests,
    complementarity,
    suggested_topic: commonInterests[0] ?? complementarity[0],
  };
}

export function generateOpener(locale: Locale, topic?: string): string {
  if (locale === "fr") {
    return topic
      ? `Bonjour ! Hirnao suggère qu'on échange sur ${topic}. Ça vous dit ?`
      : "Bonjour ! Hirnao pense qu'on pourrait avoir une conversation intéressante. On se présente ?";
  }
  return topic
    ? `Hi! Hirnao suggests we chat about ${topic}. Interested?`
    : "Hi! Hirnao thinks we could have an interesting conversation. Want to connect?";
}

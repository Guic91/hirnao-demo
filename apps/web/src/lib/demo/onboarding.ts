import type { Locale } from "../i18n";

const ONBOARDING_STEPS = [
  { key: "intentions", fr: "Quelles sont vos intentions pour cet événement ?", en: "What are your intentions for this event?" },
  { key: "seeking", fr: "Que recherchez-vous concrètement ?", en: "What are you concretely looking for?" },
  { key: "offering", fr: "Que pouvez-vous apporter aux autres participants ?", en: "What can you offer to other participants?" },
  { key: "interests", fr: "Quels sont vos centres d'intérêt ? (séparez par des virgules)", en: "What are your interests? (comma-separated)" },
  { key: "expertises", fr: "Quelles sont vos expertises clés ?", en: "What are your key areas of expertise?" },
  { key: "headline", fr: "En une phrase, comment vous présentez-vous ?", en: "In one sentence, how would you introduce yourself?" },
] as const;

export interface OnboardingState {
  step: number;
  exchanges: { role: "agent" | "user"; content: string; timestamp: string }[];
  collected: Record<string, string[] | string | undefined>;
}

export function createOnboardingState(locale: Locale): OnboardingState {
  const opening =
    locale === "fr"
      ? "Bonjour ! Je suis votre agent Hirnao. Commençons par vos intentions."
      : "Hello! I'm your Hirnao agent. Let's start with your intentions.";
  return {
    step: 0,
    exchanges: [{ role: "agent", content: opening, timestamp: new Date().toISOString() }],
    collected: {},
  };
}

export function processOnboardingMessage(state: OnboardingState, message: string, locale: Locale) {
  const exchanges = [
    ...state.exchanges,
    { role: "user" as const, content: message, timestamp: new Date().toISOString() },
  ];
  const current = ONBOARDING_STEPS[state.step];
  const collected = { ...state.collected };
  const values = message.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);

  if (current) {
    if (current.key === "headline") {
      collected.headline = message.trim();
      collected.activity = message.trim().split(" ")[0] ?? "Professional";
      collected.bio = message.trim();
    } else {
      collected[current.key] = values;
    }
  }

  const nextStep = state.step + 1;
  const complete = nextStep >= ONBOARDING_STEPS.length;
  const reply = complete
    ? locale === "fr"
      ? "Parfait ! Votre Card ID est prête."
      : "Perfect! Your Card ID is ready."
    : ONBOARDING_STEPS[nextStep][locale];

  return {
    state: {
      step: nextStep,
      exchanges: [...exchanges, { role: "agent" as const, content: reply, timestamp: new Date().toISOString() }],
      collected,
    },
    reply,
    complete,
  };
}

export function buildExplanation(locale: Locale, common: string[], complementarity: string[]) {
  return {
    reasons:
      locale === "fr"
        ? [`Intérêts communs : ${common.slice(0, 2).join(", ") || "profils complémentaires"}`, "Compatibilité évaluée par vos agents"]
        : [`Shared interests: ${common.slice(0, 2).join(", ") || "complementary profiles"}`, "Compatibility evaluated by your agents"],
    common_interests: common,
    complementarity,
    suggested_topic: common[0] ?? complementarity[0],
  };
}

export function buildOpener(locale: Locale, topic?: string) {
  return locale === "fr"
    ? `Bonjour ! Hirnao suggère qu'on échange sur ${topic ?? "nos projets"}. Ça vous dit ?`
    : `Hi! Hirnao suggests we chat about ${topic ?? "our projects"}. Interested?`;
}

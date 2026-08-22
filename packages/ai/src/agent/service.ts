import type {
  AgentContext,
  AgentNegotiationInput,
  AgentNegotiationResult,
  OnboardingExchange,
  StructuredOnboardingResult,
} from "../types.js";

/**
 * Agent ↔ Agent negotiation interface (spec §6)
 * Implementation delegates to LLM API — only shareable fields passed.
 */
export interface AgentService {
  /** Onboarding conversation → structured Card ID fields */
  processOnboarding(
    exchanges: OnboardingExchange[],
    locale: "fr" | "en",
  ): Promise<StructuredOnboardingResult>;

  /** Agent-to-agent compatibility check on shortlist candidates */
  negotiate(input: AgentNegotiationInput): Promise<AgentNegotiationResult>;

  /** Generate human-readable recommendation explanation */
  explainMatch(
    agent_a: AgentContext,
    agent_b: AgentContext,
    locale: "fr" | "en",
  ): Promise<AgentNegotiationResult>;
}

/** Fields safe to share at agent_to_agent level */
export function toAgentContext(
  profile: import("@hirnao/shared").CardProfile,
): AgentContext {
  return {
    user_id: profile.user_id,
    shareable_profile: {
      headline: profile.headline,
      activity: profile.activity,
      interests: profile.interests,
      expertises: profile.expertises,
    },
    intentions: profile.intentions,
    seeking: profile.seeking,
    offering: profile.offering,
  };
}

import type { CardProfile, Locale } from "@hirnao/shared";
import type { AgentService } from "../agent/service.js";
import { toAgentContext } from "../agent/service.js";
import type { MatchCandidate, Shortlist } from "../types.js";
import { runMatchingPipeline, type MatchingPipelineDeps } from "./pipeline.js";

export interface EvaluatedMatch {
  match: MatchCandidate;
  negotiation: Awaited<ReturnType<AgentService["negotiate"]>>;
}

export interface FullMatchingInput {
  deps: MatchingPipelineDeps;
  agentService: AgentService;
  event_id: string;
  user_id: string;
  user_card: CardProfile;
  user_card_id: string;
  user_embedding: number[];
  locale: Locale;
}

export async function runFullMatchingPipeline(input: FullMatchingInput): Promise<EvaluatedMatch[]> {
  const shortlist: Shortlist = await runMatchingPipeline(
    input.deps,
    input.event_id,
    input.user_id,
    input.user_card_id,
    input.user_embedding,
  );

  const evaluated: EvaluatedMatch[] = [];

  for (const match of shortlist) {
    const negotiation = await input.agentService.negotiate({
      agent_a: toAgentContext(input.user_card),
      agent_b: toAgentContext(match.card),
      event_id: input.event_id,
    });

    if (!negotiation.compatible && negotiation.compatibility_pct < 40) continue;

    evaluated.push({
      match: {
        ...match,
        final_score: Math.max(match.final_score, negotiation.evaluation.compatibility_score),
      },
      negotiation,
    });
  }

  return evaluated
    .sort((a, b) => b.match.final_score - a.match.final_score)
    .slice(0, 5);
}

export function cardToEmbeddingText(card: CardProfile): string {
  return [
    card.headline,
    card.bio,
    card.activity,
    ...card.interests,
    ...card.expertises,
    ...card.intentions,
    ...card.seeking,
    ...card.offering,
  ]
    .filter(Boolean)
    .join(" ");
}

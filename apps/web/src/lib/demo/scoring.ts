interface CardLike {
  intentions: string[];
  interests: string[];
  seeking: string[];
  offering: string[];
  expertises: string[];
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function matchSeekingOffering(seeking: string[], offering: string[]): number {
  if (seeking.length === 0 || offering.length === 0) return 0;
  const seekSet = new Set(seeking.map((s) => s.toLowerCase()));
  const matches = offering.filter((o) =>
    [...seekSet].some((s) => o.toLowerCase().includes(s) || s.includes(o.toLowerCase())),
  );
  return matches.length / seeking.length;
}

function complementarity(a: string[], b: string[]): number {
  const overlap = jaccard(a, b);
  const combined = new Set([...a, ...b].map((s) => s.toLowerCase()));
  return combined.size > 0 ? (combined.size - overlap * combined.size) / combined.size : 0;
}

export function scoreMatch(input: {
  user_card: CardLike;
  candidate_card: CardLike;
  vector_similarity: number;
  same_zone: boolean;
  both_available: boolean;
}) {
  const intentionOverlap = jaccard(input.user_card.intentions, input.candidate_card.intentions);
  const interestOverlap = jaccard(input.user_card.interests, input.candidate_card.interests);
  const seekingOffering = matchSeekingOffering(input.user_card.seeking, input.candidate_card.offering);
  const expertiseComplement = complementarity(input.user_card.expertises, input.candidate_card.expertises);
  const proximityBonus = input.same_zone && input.both_available ? 0.1 : 0;

  const score = Math.min(
    1,
    input.vector_similarity * 0.35 +
      intentionOverlap * 0.25 +
      seekingOffering * 0.2 +
      interestOverlap * 0.1 +
      expertiseComplement * 0.05 +
      proximityBonus,
  );

  return { score, compatibility_pct: Math.round(score * 100) };
}

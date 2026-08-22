import { createHash } from "crypto";
import { AGENT_CONFIG } from "@hirnao/shared";
import { createEmbedding } from "./client.js";
import { isLlmAvailable } from "./config.js";

/** Deterministic pseudo-embedding when LLM unavailable */
export function hashEmbedding(text: string): number[] {
  const dim = AGENT_CONFIG.EMBEDDING_DIMENSIONS;
  const vector = new Array(dim).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();
    for (let i = 0; i < dim; i++) {
      vector[i] += (digest[i % digest.length] / 255 - 0.5) * 2;
    }
  }

  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export interface EmbeddingOutput {
  embedding: number[];
  model: string;
  source: "llm" | "hash";
  input_tokens?: number;
}

export async function generateEmbedding(text: string): Promise<EmbeddingOutput> {
  if (!isLlmAvailable() || !text.trim()) {
    return { embedding: hashEmbedding(text), model: "demo-hash-v1", source: "hash" };
  }

  try {
    const result = await createEmbedding(text);
    return {
      embedding: result.embedding,
      model: result.model,
      source: "llm",
      input_tokens: result.input_tokens,
    };
  } catch {
    return { embedding: hashEmbedding(text), model: "demo-hash-v1", source: "hash" };
  }
}

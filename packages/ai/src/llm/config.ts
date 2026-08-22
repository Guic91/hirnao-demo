import { AGENT_CONFIG } from "@hirnao/shared";

export interface LlmConfig {
  apiKey: string | undefined;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  embeddingDimensions: number;
}

export function getLlmConfig(): LlmConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    chatModel: process.env.OPENAI_CHAT_MODEL ?? AGENT_CONFIG.MODEL_VERSION,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? AGENT_CONFIG.EMBEDDING_MODEL,
    embeddingDimensions: AGENT_CONFIG.EMBEDDING_DIMENSIONS,
  };
}

export function isLlmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

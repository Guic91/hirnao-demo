import { getLlmConfig } from "./config.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  input_tokens: number;
  output_tokens: number;
  model: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  input_tokens: number;
}

export class LlmError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

async function llmFetch(path: string, body: unknown) {
  const config = getLlmConfig();
  if (!config.apiKey) throw new LlmError("OPENAI_API_KEY not configured");

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new LlmError(`LLM API error: ${res.status} ${text}`, res.status);
  }

  return res.json();
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; json?: boolean },
): Promise<ChatCompletionResult> {
  const config = getLlmConfig();
  const data = await llmFetch("/chat/completions", {
    model: config.chatModel,
    messages,
    temperature: options?.temperature ?? 0.7,
    response_format: options?.json ? { type: "json_object" } : undefined,
  });

  const choice = data.choices?.[0]?.message?.content ?? "";
  return {
    content: choice,
    input_tokens: data.usage?.prompt_tokens ?? 0,
    output_tokens: data.usage?.completion_tokens ?? 0,
    model: data.model ?? config.chatModel,
  };
}

export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  const config = getLlmConfig();
  const data = await llmFetch("/embeddings", {
    model: config.embeddingModel,
    input: text,
    dimensions: config.embeddingDimensions,
  });

  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new LlmError("Invalid embedding response");
  }

  return {
    embedding,
    model: data.model ?? config.embeddingModel,
    input_tokens: data.usage?.prompt_tokens ?? 0,
  };
}

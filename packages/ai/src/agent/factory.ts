import { isLlmAvailable } from "../llm/config.js";
import type { AgentService } from "./service.js";
import { createLlmAgentService, type LlmUsageCallback } from "./llm-service.js";
import { createRuleAgentService } from "./rule-service.js";

export function createAgentService(
  locale: "fr" | "en" = "fr",
  onUsage?: LlmUsageCallback,
): AgentService {
  if (isLlmAvailable()) {
    return createLlmAgentService(locale, onUsage);
  }
  return createRuleAgentService(locale);
}

export function getAiMode(): "llm" | "rule" {
  return isLlmAvailable() ? "llm" : "rule";
}

import { createAgentService, getAiMode, type LlmUsageCallback } from "@hirnao/ai";
import { isDemoMode, isFirebaseMode } from "./db.js";
import { firestoreStore } from "./firestore-store.js";
import * as pg from "./db-pg.js";

const usageLogs: Array<{
  operation: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}> = [];

export function getAiRuntime(locale: "fr" | "en" = "fr") {
  const onUsage: LlmUsageCallback = async (usage) => {
    usageLogs.push({ ...usage, created_at: new Date().toISOString() });

    if (isFirebaseMode()) {
      await firestoreStore.logAiUsage(usage);
    } else if (!isDemoMode()) {
      await pg.query(
        `INSERT INTO ai_usage_logs (operation, model, input_tokens, output_tokens, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [usage.operation, usage.model, usage.input_tokens, usage.output_tokens, JSON.stringify(usage.metadata ?? {})],
      );
    }
  };

  return {
    agentService: createAgentService(locale, onUsage),
    mode: getAiMode(),
  };
}

export function getAiUsageStats() {
  return {
    mode: getAiMode(),
    total_calls: usageLogs.length,
    recent: usageLogs.slice(-20),
  };
}

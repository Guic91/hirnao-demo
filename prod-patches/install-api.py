#!/usr/bin/env python3
"""Install Fish Audio voice routes into the running hirnao-api container."""
from pathlib import Path

ROOT = Path("/app")
AI = ROOT / "packages/ai/src/llm"
AGENT = ROOT / "apps/api/src/routes/agent.ts"
RULE = ROOT / "packages/ai/src/agent/rule-service.ts"

FISH = r'''/**
 * Fish Audio — voix d'onboarding (TTS + ASR).
 * Clé serveur uniquement : FISH_API_KEY (ou FISH_AUDIO_API_KEY).
 */

const FISH_API = "https://api.fish.audio";

export function fishApiKey(): string | undefined {
  return process.env.FISH_API_KEY || process.env.FISH_AUDIO_API_KEY || undefined;
}

export function isFishAvailable(): boolean {
  return Boolean(fishApiKey());
}

function fishModel(): string {
  return process.env.FISH_TTS_MODEL || "s2.1-pro-free";
}

export async function fishTts(text: string): Promise<Buffer> {
  const key = fishApiKey();
  if (!key) throw new Error("FISH_API_KEY missing");

  const body: Record<string, unknown> = {
    text: text.slice(0, 2000),
    format: "mp3",
    latency: "balanced",
    normalize: true,
    prosody: { speed: 1.02, volume: 0, normalize_loudness: true },
  };
  const voice = process.env.FISH_VOICE_ID;
  if (voice) body.reference_id = voice;

  const res = await fetch(`${FISH_API}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      model: fishModel(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Fish TTS ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function fishAsr(
  audio: Uint8Array,
  options?: { locale?: "fr" | "en"; filename?: string; mimeType?: string },
): Promise<{ text: string; provider: string; model: string }> {
  const key = fishApiKey();
  if (!key) throw new Error("FISH_API_KEY missing");

  const form = new FormData();
  const blob = new Blob([audio as unknown as BlobPart], {
    type: options?.mimeType ?? "audio/webm",
  });
  form.append("audio", blob, options?.filename ?? "turn.webm");
  if (options?.locale) form.append("language", options.locale);

  const res = await fetch(`${FISH_API}/v1/asr`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Fish ASR ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { text?: string };
  return { text: data.text?.trim() ?? "", provider: "fish", model: "asr" };
}
'''

TRANSCRIBE = r'''/**
 * Transcription (audio → texte) pour l'appel d'onboarding.
 */

import { fishApiKey, fishAsr } from "./fish-audio.js";

export interface TranscriptionResult {
  text: string;
  provider: string;
  model: string;
}

interface ProviderConfig {
  url: string;
  model: string;
  apiKey?: string;
  modelField: "model" | "model_id";
}

function preferFish(): boolean {
  const provider = (process.env.STT_PROVIDER ?? "").toLowerCase();
  return Boolean(fishApiKey()) && (provider === "fish" || provider === "" || provider === "auto");
}

function getProviderConfig(): ProviderConfig {
  const provider = (process.env.STT_PROVIDER ?? "groq").toLowerCase();
  switch (provider) {
    case "elevenlabs":
      return {
        url: "https://api.elevenlabs.io/v1/speech-to-text",
        model: process.env.STT_MODEL ?? "scribe_v1",
        apiKey: process.env.ELEVENLABS_API_KEY,
        modelField: "model_id",
      };
    case "openai":
      return {
        url: "https://api.openai.com/v1/audio/transcriptions",
        model: process.env.STT_MODEL ?? "whisper-1",
        apiKey: process.env.OPENAI_STT_API_KEY ?? process.env.OPENAI_API_KEY,
        modelField: "model",
      };
    default:
      return {
        url: "https://api.groq.com/openai/v1/audio/transcriptions",
        model: process.env.STT_MODEL ?? "whisper-large-v3-turbo",
        apiKey: process.env.GROQ_API_KEY,
        modelField: "model",
      };
  }
}

export function isTranscriptionAvailable(): boolean {
  return Boolean(fishApiKey() || getProviderConfig().apiKey);
}

export async function transcribeAudio(
  audio: Uint8Array,
  options?: { locale?: "fr" | "en"; filename?: string; mimeType?: string },
): Promise<TranscriptionResult> {
  if (preferFish() || (process.env.STT_PROVIDER ?? "").toLowerCase() === "fish") {
    return fishAsr(audio, options);
  }

  const config = getProviderConfig();
  if (!config.apiKey) {
    if (fishApiKey()) return fishAsr(audio, options);
    throw new Error("No speech-to-text API key configured");
  }

  const form = new FormData();
  const blob = new Blob([audio as unknown as BlobPart], {
    type: options?.mimeType ?? "audio/webm",
  });
  form.append("file", blob, options?.filename ?? "turn.webm");
  form.append(config.modelField, config.model);
  if (options?.locale) {
    form.append(config.modelField === "model_id" ? "language_code" : "language", options.locale);
  }

  const isElevenLabs = config.modelField === "model_id";
  const res = await fetch(config.url, {
    method: "POST",
    headers: isElevenLabs
      ? { "xi-api-key": config.apiKey }
      : { Authorization: `Bearer ${config.apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { text?: string };
  return {
    text: data.text?.trim() ?? "",
    provider: process.env.STT_PROVIDER ?? "groq",
    model: config.model,
  };
}
'''

TTS_ROUTE = '''
  app.post("/tts", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { text } = (request.body ?? {}) as { text?: string };
    if (!text?.trim()) return badRequest(reply, "Missing text");
    if (!isFishAvailable()) return badRequest(reply, "Fish Audio not configured");
    const buf = await fishTts(text.trim().slice(0, 2000));
    return reply.type("audio/mpeg").send(buf);
  });

'''


def main() -> None:
    (AI / "fish-audio.ts").write_text(FISH)
    (AI / "transcribe.ts").write_text(TRANSCRIBE)
    print("wrote fish-audio.ts transcribe.ts")

    idx = AI / "index.ts"
    text = idx.read_text()
    if "fish-audio" not in text:
        idx.write_text(text.rstrip() + '\nexport * from "./fish-audio.js";\n')
        print("patched llm/index.ts")

    src = AGENT.read_text()
    if "fishTts" not in src:
        src = src.replace(
            "  transcribeAudio,\n",
            "  transcribeAudio,\n  fishTts,\n  isFishAvailable,\n",
        )
        if 'app.post("/tts"' not in src:
            src = src.replace(
                '  app.post("/onboarding/message"',
                TTS_ROUTE + '  app.post("/onboarding/message"',
            )
        AGENT.write_text(src)
        print("patched agent.ts")
    else:
        print("agent.ts already patched")

    if RULE.exists():
        rule = RULE.read_text()
        old = """export function extractSignals(message: string): string[] {
  return parseList(message).slice(0, 4);
}"""
        new = """export function extractSignals(message: string): string[] {
  const listed = parseList(message).slice(0, 4);
  if (listed.length) return listed;
  return message
    .split(/[,;.!?\\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 3);
}"""
        if old in rule:
            RULE.write_text(rule.replace(old, new))
            print("patched extractSignals")

    print("API voice patch applied")


if __name__ == "__main__":
    main()

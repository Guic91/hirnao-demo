/**
 * Transcription (audio → texte) pour l'appel d'onboarding.
 * Privilégie Fish Audio via OpenRouter quand OPENROUTER_API_KEY est définie.
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
  return Boolean(fishApiKey()) && (provider === "fish" || provider === "openrouter" || provider === "" || provider === "auto");
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
  const forced = (process.env.STT_PROVIDER ?? "").toLowerCase();
  if (preferFish() || forced === "fish" || forced === "openrouter") {
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
  if (!res.ok) throw new Error(`Transcription failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { text?: string };
  return {
    text: data.text?.trim() ?? "",
    provider: process.env.STT_PROVIDER ?? "groq",
    model: config.model,
  };
}

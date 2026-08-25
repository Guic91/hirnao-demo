/**
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

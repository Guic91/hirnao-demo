import { readFileSync, writeFileSync, existsSync } from "fs";

const AI = "/app/packages/ai/src/llm";
const AGENT = "/app/apps/api/src/routes/agent.ts";
const IDX = `${AI}/index.ts`;

const FISH = `/**
 * Fish Audio via OpenRouter — voix d'onboarding (TTS + ASR).
 */
import { existsSync, readFileSync } from "fs";

const OPENROUTER_API = "https://openrouter.ai/api/v1";
const KEY_FILE = process.env.OPENROUTER_KEY_FILE || "/app/.openrouter-key";

function readKeyFile(): string | undefined {
  try {
    if (existsSync(KEY_FILE)) {
      const v = readFileSync(KEY_FILE, "utf8").trim();
      return v || undefined;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export function fishApiKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.FISH_API_KEY ||
    process.env.FISH_AUDIO_API_KEY ||
    readKeyFile() ||
    undefined
  );
}

export function isFishAvailable(): boolean {
  return Boolean(fishApiKey());
}

function ttsModel(): string {
  return (
    process.env.OPENROUTER_TTS_MODEL ||
    process.env.FISH_TTS_MODEL ||
    "fish-audio/s2.1-pro-free:free"
  );
}

function sttModel(): string {
  return process.env.OPENROUTER_STT_MODEL || "fish-audio/transcribe-1";
}

function orHeaders(key: string): Record<string, string> {
  return {
    Authorization: \`Bearer \${key}\`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.WEB_URL || "https://hirnao.com",
    "X-Title": "HIRNAO",
  };
}

export async function fishTts(text: string): Promise<Buffer> {
  const key = fishApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY missing");
  const body: Record<string, unknown> = {
    model: ttsModel(),
    input: text.slice(0, 2000),
    response_format: "mp3",
  };
  const voice = process.env.FISH_VOICE_ID || process.env.OPENROUTER_TTS_VOICE;
  if (voice) body.voice = voice;
  const res = await fetch(\`\${OPENROUTER_API}/audio/speech\`, {
    method: "POST",
    headers: orHeaders(key),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(\`OpenRouter Fish TTS \${res.status}: \${await res.text()}\`);
  return Buffer.from(await res.arrayBuffer());
}

function audioFormat(mimeType?: string, filename?: string): string {
  const hint = \`\${mimeType ?? ""} \${filename ?? ""}\`.toLowerCase();
  if (hint.includes("wav")) return "wav";
  if (hint.includes("mp3") || hint.includes("mpeg")) return "mp3";
  if (hint.includes("ogg")) return "ogg";
  if (hint.includes("m4a") || hint.includes("mp4")) return "m4a";
  if (hint.includes("flac")) return "flac";
  if (hint.includes("aac")) return "aac";
  return "webm";
}

export async function fishAsr(
  audio: Uint8Array,
  options?: { locale?: "fr" | "en"; filename?: string; mimeType?: string },
): Promise<{ text: string; provider: string; model: string }> {
  const key = fishApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY missing");
  const model = sttModel();
  const format = audioFormat(options?.mimeType, options?.filename);
  const body: Record<string, unknown> = {
    model,
    input_audio: {
      data: Buffer.from(audio).toString("base64"),
      format,
    },
  };
  if (options?.locale) body.language = options.locale;
  const res = await fetch(\`\${OPENROUTER_API}/audio/transcriptions\`, {
    method: "POST",
    headers: orHeaders(key),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(\`OpenRouter Fish ASR \${res.status}: \${await res.text()}\`);
  const data = (await res.json()) as { text?: string };
  return { text: data.text?.trim() ?? "", provider: "openrouter-fish", model };
}
`;

writeFileSync(`${AI}/fish-audio.ts`, FISH);
console.log("wrote fish-audio.ts");

const TRANS_URL = "https://raw.githubusercontent.com/Guic91/hirnao-demo/main/prod-patches/transcribe.ts";
const trans = await fetch(TRANS_URL).then((r) => {
  if (!r.ok) throw new Error(`transcribe.ts ${r.status}`);
  return r.text();
});
writeFileSync(`${AI}/transcribe.ts`, trans);
console.log("wrote transcribe.ts");

if (existsSync(IDX)) {
  let idx = readFileSync(IDX, "utf8");
  if (!idx.includes("fish-audio")) {
    idx += '\nexport * from "./fish-audio.js";\n';
    writeFileSync(IDX, idx);
    console.log("exported fish-audio");
  }
}

if (existsSync(AGENT)) {
  let agent = readFileSync(AGENT, "utf8");
  const before = agent;
  agent = agent.replaceAll("Fish Audio not configured", "OpenRouter (Fish Audio) not configured");
  agent = agent.replaceAll("FISH_API_KEY missing", "OPENROUTER_API_KEY missing");
  if (agent !== before) {
    writeFileSync(AGENT, agent);
    console.log("patched agent.ts messages");
  } else {
    console.log("agent.ts already ok or strings not found");
  }
}

console.log("install-api done");

# Hirnao production voice patches

Fish Audio TTS + ASR via **OpenRouter** (`OPENROUTER_API_KEY`).
Button **Suivant** cuts audio, transcribes, posts `/agent/answer`.

Applied on running Coolify containers. An image redeploy wipes them unless rebuilt.

Env on `hirnao-api`:
- `OPENROUTER_API_KEY` (required)
- `OPENROUTER_TTS_MODEL` (default `fish-audio/s2.1-pro-free:free`)
- `OPENROUTER_STT_MODEL` (default `fish-audio/transcribe-1`)
- optional `FISH_VOICE_ID` / `OPENROUTER_TTS_VOICE`

#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
MODE="${1:-cloudflared}"

case "$MODE" in
  cloudflared)
    echo "Starting Cloudflare tunnel → http://localhost:${PORT}"
    exec cloudflared tunnel --url "http://localhost:${PORT}"
    ;;
  localtunnel)
    echo "Starting LocalTunnel → http://localhost:${PORT}"
    echo "Bypass reminder: curl -H 'bypass-tunnel-reminder: true' <url>"
    exec npx localtunnel --port "$PORT"
    ;;
  *)
    echo "Usage: $0 [cloudflared|localtunnel]"
    exit 1
    ;;
esac

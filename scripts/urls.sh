#!/usr/bin/env bash
# Prints current public URLs for Hirnao dev server
set -euo pipefail

echo "=== Hirnao — URLs publiques ==="
echo ""

if curl -s -o /dev/null -w "" --max-time 3 http://127.0.0.1:3000/ 2>/dev/null; then
  echo "✓ Dev server: http://127.0.0.1:3000"
else
  echo "✗ Dev server: OFFLINE — lancez 'npm run dev'"
fi

CF_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/hirnao-cloudflared.log 2>/dev/null | tail -1 || true)
if [ -n "$CF_URL" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$CF_URL/" 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "✓ Cloudflare (navigateur): $CF_URL"
  else
    echo "✗ Cloudflare: $CF_URL (HTTP $CODE)"
  fi
else
  echo "✗ Cloudflare: pas de tunnel actif"
fi

LT_URL=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' /tmp/hirnao-lt.log 2>/dev/null | tail -1 || true)
if [ -n "$LT_URL" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "bypass-tunnel-reminder: true" --max-time 10 "$LT_URL/" 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "✓ LocalTunnel (API): $LT_URL"
    echo "  Header requis navigateur: bypass-tunnel-reminder: true"
  else
    echo "✗ LocalTunnel: $LT_URL (HTTP $CODE)"
  fi
fi

echo ""
echo "Relancer les tunnels: npm run tunnel"

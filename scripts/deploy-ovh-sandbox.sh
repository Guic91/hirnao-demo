#!/usr/bin/env bash
# Déploiement sandbox HIRNAO sur un VPS OVH (Ubuntu/Debian)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Guic91/hirnao-demo.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/hirnao-sandbox}"
BRANCH="${BRANCH:-main}"

echo "==> HIRNAO sandbox OVH — install in ${INSTALL_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin required."
  exit 1
fi

mkdir -p "$(dirname "$INSTALL_DIR")"
if [ ! -d "$INSTALL_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
else
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
fi

cd "$INSTALL_DIR"

if [ ! -f .env.sandbox ]; then
  cp .env.sandbox.example .env.sandbox
  echo ""
  echo "⚠️  Édite ${INSTALL_DIR}/.env.sandbox :"
  echo "   - SANDBOX_DOMAIN (sous-domaine → IP du VPS)"
  echo "   - JWT_SECRET, OPENAI_API_KEY (optionnel)"
  echo "   - CORS_ORIGINS (URL Cloudflare Pages)"
  echo ""
  read -r -p "Appuyez sur Entrée après avoir édité .env.sandbox..." _
fi

set -a
# shellcheck disable=SC1091
source .env.sandbox
set +a

echo "==> Building & starting containers..."
docker compose -f docker/docker-compose.sandbox.yml --env-file .env.sandbox up -d --build

echo ""
echo "✅ Sandbox API démarrée"
echo "   Health: http://$(hostname -I | awk '{print $1}')/health"
if [ "${SANDBOX_DOMAIN:-localhost}" != "localhost" ]; then
  echo "   HTTPS:  https://${SANDBOX_DOMAIN}/health"
fi
echo ""
echo "Prochaine étape — connecter le frontend Cloudflare Pages :"
echo "   NEXT_PUBLIC_API_URL=https://${SANDBOX_DOMAIN:-VOTRE-DOMAINE}"
echo "   (GitHub secret SANDBOX_API_URL ou variable Cloudflare Pages)"

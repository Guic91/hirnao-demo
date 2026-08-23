# Sandbox OVH — API + back-office

Déployer l'API Fastify sur un VPS OVH pour activer le **back-office admin/organisateur** et le parcours participant avec données serveur (mode démo ou PostgreSQL).

## Architecture sandbox

```
Cloudflare Pages (PWA)          VPS OVH
hirnao-demo.pages.dev    →    api-hirnao.votredomaine.com
NEXT_PUBLIC_API_URL              Docker: API + Caddy (HTTPS)
```

## Prérequis OVH

- VPS Ubuntu 22.04+ (2 Go RAM minimum)
- Port **80** et **443** ouverts
- Sous-domaine DNS **A** → IP du VPS (ex: `api-hirnao.beemm.io`)

## Installation rapide

```bash
# Sur le VPS OVH (root ou sudo)
curl -fsSL https://raw.githubusercontent.com/Guic91/hirnao-demo/main/scripts/deploy-ovh-sandbox.sh | bash
```

Ou manuellement :

```bash
git clone https://github.com/Guic91/hirnao-demo.git /opt/hirnao-sandbox
cd /opt/hirnao-sandbox
cp .env.sandbox.example .env.sandbox
nano .env.sandbox   # SANDBOX_DOMAIN, JWT_SECRET, CORS_ORIGINS, OPENAI_API_KEY
docker compose -f docker/docker-compose.sandbox.yml --env-file .env.sandbox up -d --build
```

## Configuration `.env.sandbox`

| Variable | Description |
|----------|-------------|
| `SANDBOX_DOMAIN` | Sous-domaine API (ex: `api-hirnao.beemm.io`) |
| `WEB_URL` | URL frontend Cloudflare |
| `JWT_SECRET` | Secret JWT (`openssl rand -hex 32`) |
| `DEMO_MODE` | `true` = données mémoire (sandbox rapide) |
| `CORS_ORIGINS` | `https://hirnao-demo.pages.dev` |
| `OPENAI_API_KEY` | Optionnel — active l'agent LLM |

## Vérification

```bash
curl https://api-hirnao.VOTRE-DOMAINE/health
# → {"status":"ok","service":"hirnao-api","version":"0.1.0"}

curl https://api-hirnao.VOTRE-DOMAINE/v1/matching/status
```

## Connecter le frontend Cloudflare

1. GitHub → repo `hirnao-demo` → **Settings → Secrets → Actions**
2. Ajouter `SANDBOX_API_URL` = `https://api-hirnao.VOTRE-DOMAINE` (sans `/v1`)
3. Re-déployer Cloudflare Pages (push sur `main` ou workflow manuel)

Le frontend basculera automatiquement du mode démo navigateur vers l'API OVH.

## Comptes back-office (mode démo API)

| Rôle | Email | URL |
|------|-------|-----|
| Admin | `admin@hirnao.app` | `/admin` |
| Organisateur | `organizer@hirnao.app` | `/organizer` |
| Participant | inscription libre | `/e/ai-summit-paris-2026` |

## Commandes utiles

```bash
cd /opt/hirnao-sandbox
docker compose -f docker/docker-compose.sandbox.yml logs -f api
docker compose -f docker/docker-compose.sandbox.yml restart api
docker compose -f docker/docker-compose.sandbox.yml --env-file .env.sandbox up -d --build
```

## Passer en PostgreSQL (optionnel)

1. Décommenter `postgres` et `redis` dans `docker/docker-compose.sandbox.yml`
2. `.env.sandbox` : `DEMO_MODE=false`, `DATABASE_URL=postgresql://hirnao:...@postgres:5432/hirnao`
3. Exécuter migrations : `docker compose exec api npx tsx packages/db/scripts/migrate.js`

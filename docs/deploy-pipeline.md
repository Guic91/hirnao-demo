# Pipeline GitHub → Harbor → Coolify → OVH

Infrastructure cible HIRNAO (spec architecture §16).

```
┌──────────┐    build/push     ┌─────────┐    pull      ┌──────────┐    deploy    ┌─────┐
│  GitHub  │ ───────────────► │ Harbor  │ ───────────► │ Coolify  │ ──────────► │ OVH │
│ Actions  │   docker image   │ Registry│              │  (VPS)   │   containers │ VPS │
└──────────┘                  └─────────┘              └──────────┘              └─────┘
       │                                                      │
       │ webhook                                              │
       └──────────────────────────────────────────────────────┘

Frontend PWA (Cloudflare Pages) ──HTTPS──► API OVH (Coolify)
```

| Composant | Rôle |
|-----------|------|
| **GitHub** | Source code, CI/CD workflows |
| **Harbor** | Registry Docker privé (images versionnées) |
| **Coolify** | Orchestration sur VPS OVH (deploy, SSL, env) |
| **OVH** | VPS hébergeant Coolify + workloads |
| **Cloudflare Pages** | Frontend statique PWA |

---

## 1. Harbor — Registry Docker

### Créer le projet

1. Harbor UI → **Projects** → **New Project**
2. Nom : `hirnao`
3. Access : **Private**

### Robot account (CI)

1. Projet `hirnao` → **Robot Accounts** → **New**
2. Permissions : **Push** + **Pull** sur `hirnao/api`
3. Noter : `robot$hirnao+github` + token

### GitHub Secrets

| Secret | Exemple |
|--------|---------|
| `HARBOR_REGISTRY` | `harbor.beemm.io` |
| `HARBOR_PROJECT` | `hirnao` |
| `HARBOR_USERNAME` | `robot$hirnao+github` |
| `HARBOR_PASSWORD` | token robot Harbor |

Workflow : `.github/workflows/docker-harbor.yml`  
→ build `docker/Dockerfile.api` → push `harbor.beemm.io/hirnao/api:latest`

---

## 2. Coolify — Sur le VPS OVH

### Installation Coolify (une fois)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Accès : `https://IP-DU-VPS:8000` ou domaine `coolify.beemm.io`

### Connecter Harbor à Coolify

1. **Settings → Private Registries** → **Add**
2. URL : `https://harbor.beemm.io`
3. Username / Password : robot account Harbor (pull)

### Créer le service HIRNAO API

**Option A — Docker Compose (recommandé)**

1. **+ New Resource** → **Docker Compose**
2. Source : GitHub `Guic91/hirnao-demo`
3. Compose file : `docker/docker-compose.prod.yml`
4. Branch : `main`
5. Environment : copier `.env.prod.example` → variables Coolify
6. Domain : `api-hirnao.beemm.io` (proxy Coolify → service `api:3001`)

**Option B — Webhook deploy (image Harbor)**

1. **+ New Resource** → **Docker Image**
2. Image : `harbor.beemm.io/hirnao/api:latest`
3. Port : `3001`
4. Domain + env vars

### Webhook auto-deploy

1. Coolify → service HIRNAO → **Webhooks** → copier l'URL
2. GitHub Secrets :
   - `COOLIFY_WEBHOOK_URL` = URL webhook
   - `COOLIFY_TOKEN` = token Coolify (si requis)

Chaque push `main` sur l'API → Harbor → webhook Coolify → redeploy OVH.

---

## 3. OVH — VPS

### Prérequis

| Spec | Minimum |
|------|---------|
| VPS | 4 vCPU / 8 Go RAM (API + Postgres + Redis + Coolify) |
| OS | Ubuntu 22.04 LTS |
| Ports | 22, 80, 443, 8000 (Coolify admin) |

### DNS

```
api-hirnao.beemm.io     A    IP_VPS_OVH
coolify.beemm.io        A    IP_VPS_OVH
harbor.beemm.io         A    IP_HARBOR   (ou même VPS / autre serveur)
```

---

## 4. Frontend Cloudflare Pages

GitHub Secret :

| Secret | Valeur |
|--------|--------|
| `SANDBOX_API_URL` | `https://api-hirnao.beemm.io` |

→ Le build Cloudflare désactive le mode démo navigateur et appelle l'API OVH.

---

## 5. Migrations base (premier deploy)

```bash
# SSH sur le VPS ou Coolify terminal
docker exec -it hirnao-api npx tsx packages/db/scripts/migrate.js
docker exec -it hirnao-api npx tsx packages/db/scripts/seed.js
```

Ou activer `DEMO_MODE=true` temporairement sans Postgres.

---

## 6. Workflows GitHub

| Workflow | Déclencheur | Action |
|----------|-------------|--------|
| `docker-harbor.yml` | push `main` (api/packages) | Build → Harbor → webhook Coolify |
| `deploy-cloudflare-pages.yml` | push `main` | Build PWA → Cloudflare Pages |

---

## 7. Sandbox rapide (sans Harbor/Coolify)

Pour tester avant la pipeline complète :

```bash
# VPS OVH direct (Docker + Caddy)
./scripts/deploy-ovh-sandbox.sh
```

Voir [sandbox-ovh.md](./sandbox-ovh.md).

---

## Checklist mise en prod

- [ ] Harbor projet `hirnao` + robot account
- [ ] Secrets GitHub Harbor configurés
- [ ] Coolify installé sur VPS OVH
- [ ] Registry Harbor ajouté dans Coolify
- [ ] Service API déployé (`docker-compose.prod.yml`)
- [ ] DNS `api-hirnao.*` → VPS
- [ ] SSL Let's Encrypt (Coolify auto)
- [ ] `SANDBOX_API_URL` sur Cloudflare build
- [ ] Migrations PostgreSQL exécutées
- [ ] Test admin `admin@hirnao.app` + organisateur `organizer@hirnao.app`

# HIRNAO

Web app de mise en relation intelligente dans le monde réel.

Chaque participant dispose d'un **agent IA personnel** qui comprend qui il est, trouve les bonnes personnes, évalue la compatibilité, et facilite la rencontre réelle.

## Documentation

- [Architecture MVP V1](./docs/architecture.md) — Schéma complet, API, matching, sécurité

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js PWA, React, i18n FR/EN |
| Backend | Node.js, Fastify |
| Database | PostgreSQL + pgvector |
| IA | API LLM (agent + embeddings) |
| Cache | Redis |
| Infra | Docker → Harbor → Coolify → OVH |

## Structure

```
apps/web          → PWA participant + organisateur
apps/api          → API REST Fastify
packages/shared   → Types & schemas partagés
packages/db       → Migrations PostgreSQL
packages/ai       → Pipeline matching + agent
```

## Démarrage

```bash
npm install
npm run docker:up    # PostgreSQL + Redis (optionnel)
npm run db:migrate   # Migrations (si PostgreSQL)
npm run dev:api      # API sur :3001
npm run dev:web      # PWA sur :3000
```

Sans Docker, l'API démarre en **mode démo** (`DEMO_MODE=true`) avec données en mémoire.

### Espace organisateur (Step 4)

- Login : `organizer@hirnao.app` → `/organizer`
- Dashboard KPIs : participants, activation, recommandations, connexions, rencontres
- Liste participants (sans données privées)
- Lien d'accès + QR token pour l'événement

### Back-office admin (Step 5)

- Login : `admin@hirnao.app` → `/admin`
- Dashboard stats globales
- Gestion utilisateurs, événements, signalements
- Monitoring usage IA + audit logs

### Parcours participant (MVP)

1. Ouvrir `/e/ai-summit-paris-2026` — accès événement via QR/slug
2. Inscription rapide (email + nom)
3. Onboarding agent → Card ID structurée
4. Recommandations expliquées (top 5, sans swipe)
5. Connexion mutuelle + visibilité événement

### Moteur matching + LLM (Step 3)

Pipeline complet : **Filtre → Vector Search → Score → Shortlist → Agent↔Agent**

- Client LLM OpenAI-compatible (`OPENAI_API_KEY`)
- Embeddings réels (`text-embedding-3-small`) avec fallback hash
- Agent↔Agent sur shortlist : compatibilité, explication, opener
- Onboarding conversationnel LLM (fallback règles sans clé API)
- Logging usage IA (`ai_usage_logs`)
- Endpoints : `GET /v1/matching/status`, `GET /v1/agent/status`

## Boucle produit

```
QR → Agent → Card ID → Matching → Agent↔Agent → Recommandation
→ Connexion → Messagerie → Rencontre réelle → Feedback
```

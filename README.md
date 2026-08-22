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
npm run docker:up    # PostgreSQL + Redis
npm install
npm run dev:api      # API sur :3001
```

## Boucle produit

```
QR → Agent → Card ID → Matching → Agent↔Agent → Recommandation
→ Connexion → Messagerie → Rencontre réelle → Feedback
```

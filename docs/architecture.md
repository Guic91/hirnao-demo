# HIRNAO — Architecture MVP V1

> Web app de mise en relation intelligente dans le monde réel.
> Chaque participant dispose d'un agent IA personnel qui comprend qui il est,
> trouve les bonnes personnes, évalue la compatibilité, et facilite la rencontre réelle.

---

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB APP (PWA)                            │
│              Next.js · React · i18n FR/EN · Mobile-first        │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API (Fastify)                              │
│   Auth · Cards · Events · Agent · Matching · Connections · MSG  │
└──────────┬──────────────────────────────┬─────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────────────┐
│  PostgreSQL          │      │  LLM API (OpenAI / compatible)   │
│  + pgvector          │      │  · Agent personnel (onboarding)    │
│  · Users & Cards     │      │  · Agent ↔ Agent (négociation)   │
│  · Events & zones    │      │  · Embeddings (text-embedding)   │
│  · Matching results  │      └──────────────────────────────────┘
│  · Connections & MSG │
│  · Meetings & KPIs   │
│  · RLS par user      │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Redis (cache/queue) │
│  · Sessions          │
│  · Rate limiting     │
│  · Job queue matching│
└──────────────────────┘
```

### Infrastructure cible (spec §16)

```
GitHub → CI/CD → Runner → Docker Build → Harbor → Coolify → OVH
```

---

## 2. Structure monorepo

```
hirnao/
├── apps/
│   ├── web/                 # Next.js PWA (participant + organisateur)
│   └── api/                 # Fastify REST + WebSocket
├── packages/
│   ├── shared/              # Types, Zod schemas, constantes
│   ├── db/                  # Migrations SQL, scripts seed
│   └── ai/                  # Pipeline matching, interfaces agent
├── docker/
│   └── docker-compose.yml   # PostgreSQL + pgvector + Redis
└── docs/
    └── architecture.md
```

| Package | Rôle |
|---------|------|
| `@hirnao/shared` | Contrats TypeScript partagés front/back |
| `@hirnao/db` | Schéma PostgreSQL, migrations, seed |
| `@hirnao/ai` | Pipeline matching (§5) + interfaces agent (§4, §6) |
| `@hirnao/api` | Backend Fastify, routes REST |
| `@hirnao/web` | Frontend PWA (à implémenter — étape 2) |

---

## 3. Boucle produit (spec)

```
QR / Lieu
    ↓
Utilisateur s'inscrit
    ↓
Agent personnel (onboarding conversationnel)
    ↓
HIRNAO Card ID (structurée + permissions)
    ↓
Matching : Filtre → Vector Search → Score → Shortlist
    ↓
Agent ↔ Agent (top candidats uniquement)
    ↓
Recommandation expliquée
    ↓
Connexion mutuelle (pas de message non sollicité)
    ↓
Messagerie texte
    ↓
RENCONTRE RÉELLE ← KPI fondamental
    ↓
Feedback 👍/👎
    ↓
Amélioration du matching
```

---

## 4. Modèle de données

### Entités principales (spec §17)

```
USER
 ├── identité, langue, paramètres, consentements
CARD ID (card_profiles)
 ├── champs publics / matchables / privés
 ├── permissions par champ (privacy_level)
 └── embeddings (pgvector 1536d)
EVENT
 ├── organisateur, lieu, QR, zones
 ├── participants (statut, visibilité)
 └── participant_locations (zones, pas GPS exact)
AGENT MEMORY
 ├── mémoire privée par contexte événement
RECOMMENDATION
 ├── score, explication, évaluation agent
CONNECTION
 ├── demande → acceptation mutuelle
CONVERSATION → MESSAGES
MEETING
 ├── rencontre déclarée + feedback pertinence
```

### Niveaux de confidentialité Card ID (spec §3)

| Niveau | Accès |
|--------|-------|
| `public` | Visible par les autres participants |
| `matchable` | Exploité par le moteur de matching (embeddings) |
| `agent_to_agent` | Accessible uniquement aux agents autorisés |
| `after_connection` | Débloqué après acceptation mutuelle |
| `private` | Utilisateur + son agent uniquement |
| `ephemeral` | Valable uniquement pour un événement/contexte |

La Card ID est **contextuelle** : une même personne a des intentions différentes selon l'événement.

---

## 5. Pipeline de matching (spec §5)

Implémenté dans `packages/ai/src/matching/pipeline.ts` :

### Étape 1 — Filtrage
- Même événement
- Consentements valides
- Pas de blocage
- Visibilité activée (opt-in)

### Étape 2 — Vector Search
```sql
SELECT user_id, 1 - (embedding <=> $1) AS similarity
FROM card_embeddings
WHERE similarity > 0.5
ORDER BY embedding <=> $1
LIMIT 50;
```

### Étape 3 — Scoring
```
score = vector_similarity × 0.35
      + intention_overlap × 0.25
      + seeking_offering_match × 0.20
      + interest_overlap × 0.10
      + expertise_complement × 0.05
      + proximity_bonus × 0.10
```

### Étape 4 — Shortlist
Top 5 candidats → envoyés à l'évaluation Agent ↔ Agent.

### Étape 5 — Agent ↔ Agent (spec §6)
- Uniquement sur la shortlist
- Seuls les champs `agent_to_agent` + `matchable` sont partagés
- Jamais de données privées brutes
- Résultat : compatibilité %, explication, sujet suggéré

---

## 6. API REST — Routes V1

### Auth `/v1/auth`
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/register` | Inscription rapide |
| POST | `/login` | Connexion |
| POST | `/magic-link` | Connexion sans mot de passe |
| GET | `/me` | Profil courant |
| PATCH | `/me` | Mise à jour profil + locale |
| POST | `/consents` | Consentements RGPD |

### Card ID `/v1/cards`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/me` | Ma Card ID (par contexte) |
| PUT | `/me` | Créer/mettre à jour |
| PATCH | `/:id/permissions` | Niveaux de confidentialité par champ |
| GET | `/:userId/public` | Vue publique filtrée |

### Événements `/v1/events`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/:slug` | Détails événement |
| POST | `/:slug/join` | Rejoindre (QR ou lien) |
| POST | `/:slug/checkin` | Check-in |
| PATCH | `/:slug/visibility` | "Me rendre visible" |
| GET | `/:slug/zones` | Zones du lieu |
| GET | `/:slug/participants` | Participants visibles |

### Agent `/v1/agent`
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/onboarding/message` | Échange avec l'agent |
| GET | `/onboarding/status` | État onboarding |
| POST | `/onboarding/finalize` | Structurer → Card ID |
| GET | `/memory` | Mémoire agent (privée) |

### Matching `/v1/matching`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/recommendations` | Mes recommandations |
| POST | `/recommendations/:id` | connect / later / dismiss |
| POST | `/refresh` | Relancer matching |

### Connexions `/v1/connections`
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/` | Demande de connexion |
| GET | `/` | Mes connexions |
| POST | `/:id/respond` | accepter / refuser / bloquer |
| POST | `/:id/report` | Signaler |

### Messagerie `/v1/messages`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/conversations` | Liste |
| GET | `/conversations/:id` | Historique |
| POST | `/conversations/:id` | Envoyer message texte |
| WS | `/ws` | Notifications temps réel |

### Rencontres `/v1/meetings`
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/:connectionId/feedback` | Rencontré ? + pertinence |
| GET | `/pending` | Feedbacks en attente |

### Organisateur `/v1/organizer`
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/events` | Créer événement |
| PATCH | `/events/:id` | Modifier |
| GET | `/events/:id/kpis` | Dashboard KPIs |
| GET | `/events/:id/qr` | QR code + lien |
| GET | `/events/:id/participants` | Liste (sans données privées) |

### Admin `/v1/admin`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Gestion utilisateurs |
| GET | `/events` | Tous les événements |
| GET | `/reports` | Signalements |
| GET | `/stats` | Statistiques globales |
| GET | `/ai-usage` | Consommation IA |
| GET | `/audit-logs` | Logs d'audit |

---

## 7. KPIs organisateur (spec §14)

| KPI | Source |
|-----|--------|
| Participants | `event_participants` count |
| Activation | profils Card ID complétés / inscrits |
| Matching | `recommendations` générées |
| Intérêt | recommandations ouvertes (status=shown) |
| Connexions | `connections` envoyées |
| Acceptance Rate | acceptées / envoyées |
| Meeting Rate | `meetings.met = true` / connexions acceptées |
| Pertinence | feedback positif / total feedbacks |
| Récurrence | users revenant sur ≥2 événements |

---

## 8. Sécurité & RGPD (spec §18)

- **Row Level Security** sur users, cards, memories, connections, messages, meetings
- `SET app.current_user_id` par requête API
- Consentements explicites (`user_consents`)
- Géolocalisation opt-in, zones floues (pas de GPS exact)
- Visibilité expirable par contexte événement
- Audit logs sur actions sensibles
- Séparation stricte private / agent / matchable / public
- Suppression en cascade (ON DELETE CASCADE)

---

## 9. Multilingue (spec §12)

- i18n dès le frontend (`next-intl` ou `react-i18next`)
- V1 : `fr` + `en`
- Détection automatique + sélection manuelle
- L'agent répond dans la langue de l'utilisateur
- Architecture extensible pour nouvelles langues

---

## 10. Hors MVP (spec §19)

Non implémenté en V1 :
- Apps natives iOS/Android
- Audio / vidéo / appels
- Monnaie NAO, vouchers, paiement
- Marketplace, CRM, gamification
- Tracking GPS permanent
- Infrastructure distribuée (Kafka, K8s, Pinecone)

L'architecture permet leur ajout ultérieur sans refonte.

---

## 11. Démarrage local

```bash
# 1. Infrastructure
npm run docker:up

# 2. Dépendances
npm install

# 3. API
npm run dev:api    # http://localhost:3001

# 4. Web (étape 2)
npm run dev:web    # http://localhost:3000
```

Variables d'environnement :
```env
DATABASE_URL=postgresql://hirnao:hirnao_dev@localhost:5432/hirnao
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
OPENAI_API_KEY=sk-...
```

---

## 12. Prochaines étapes

| # | Étape | Priorité |
|---|-------|----------|
| 2 | Parcours participant (QR → agent → Card → reco) | Haute |
| 3 | Moteur matching complet + agent LLM | ✅ Fait |
| 4 | Espace organisateur + KPIs | Moyenne |
| 5 | Back-office admin | Basse |

# Firebase / Firestore — HIRNAO API

L'API utilise **Firebase Firestore** comme base de données principale (remplace PostgreSQL).

## Configuration

### 1. Créer un projet Firebase

1. [Console Firebase](https://console.firebase.google.com/) → Nouveau projet
2. Activer **Firestore** (mode production)
3. Paramètres → Comptes de service → Générer une nouvelle clé privée (JSON)

### 2. Variables d'environnement API

```bash
DB_BACKEND=firebase
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Alternative : monter le fichier JSON et définir `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`.

### 3. Déployer les règles et index

```bash
npm install -g firebase-tools
firebase login
firebase use votre-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

## Modes de fonctionnement

| Variable | Comportement |
|----------|--------------|
| `DEMO_MODE=true` | Mémoire locale (dev rapide, sans Firebase) |
| `DB_BACKEND=firebase` + credentials | Firestore (production) |
| Ni l'un ni l'autre | PostgreSQL legacy (déprécié) |

## Seed automatique

Au premier démarrage, si la collection `_meta/seed` n'existe pas, l'API injecte les données démo :

- Comptes : `admin@hirnao.app`, `organizer@hirnao.app`, participants démo
- Événement : `ai-summit-paris-2026`

## Matching

Sans pgvector, le matching Firebase utilise le pipeline agent + scoring rule-based (identique au mode démo enrichi par LLM).

## Docker / Coolify

`docker/docker-compose.prod.yml` ne contient plus PostgreSQL — uniquement l'image API avec variables Firebase.

Voir `.env.prod.example` pour la liste complète des variables.

# 🏉 RugbyClicker

Jeu web idle/clicker dans l'univers du rugby. Fais grandir ton club de la 3ème division au Stade de France — clique, investis, et deviens une légende.

## ✨ Fonctionnalités

- **Clicker** : Clique sur le ballon pour générer des revenus
- **Infrastructures** : 8 bâtiments à acheter et améliorer (terrain, stade, boutique, centre de formation...)
- **Améliorations** : 10 upgrades permanents (marketing, staff, TV, centre de recherche...)
- **Progression** : Système de niveaux basé sur l'argent total généré
- **Événements aléatoires** : Ballon d'Or, supporters, sponsors, étoiles filantes (dès le niveau 2)
- **Assistant IA** : Coach propulsé par Ollama (Gemma 3) qui analyse ton club et te conseille
- **Classement** : Top 20 des clubs par prestige
- **Mode hors-ligne** : Gains passifs accumulés pendant ton absence (pénalité 50%, max 24h)

## 🧱 Stack

| Couche | Technologie |
| --- | --- |
| Frontend | React 18 + Vite + React Router + Axios |
| Backend | Node.js + Express + JWT + bcrypt + Zod |
| Base de données | PostgreSQL |
| IA | Ollama (Gemma 3:1b) |
| Documentation API | Swagger (`/api-docs`) |

## 🏗️ Architecture

```
rugbyclicker/
├── frontend/           # React SPA (Vite)
│   ├── src/
│   │   ├── components/ # Composants React (dashboard, shop, ia, progression)
│   │   ├── context/    # AuthContext, GameContext
│   │   ├── hooks/      # useGame, useAuth, useInterval
│   │   ├── pages/      # Routes (Home, Login, Dashboard...)
│   │   ├── services/   # API calls (api.js, gameService, authService)
│   │   └── utils/      # format.js, costs.js
│   └── public/
│       └── images/     # Assets statiques (fond du stade)
├── backend/            # API REST
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── services/     # Logique métier
│       ├── middleware/    # Auth, validation, error handler
│       ├── validators/   # Schémas Zod
│       ├── routes/       # Définitions Express + Swagger
│       └── utils/        # JWT, Swagger config
└── database/           # Scripts SQL
    ├── init.sql        # Schéma (tables, contraintes, index)
    └── seeds.sql       # Données initiales (ressources, infrastructures, améliorations)
```

### Flux de données

```
Frontend (tick 1s)          Backend (sync 30s)
     │                           │
     ├── argent += pps ──────────┤ (local uniquement, écrasé par sync)
     │                           │
     ├── POST /sync ────────────→│ calcule gains hors-ligne
     │←── gains + état complet ──┤ met à jour stock, niveau, fans
     │                           │
     ├── POST /click ───────────→│ transaction atomique
     │←── gain ──────────────────┤
     │                           │
     ├── POST /coach ───────────→│ Ollama analyse l'état
     │←── {action, raison, impact}│ fallback algorithmique si offline
```

> **Note** : L'argent est incrémenté localement toutes les secondes pour la fluidité, mais le backend est la source de vérité. Un `GET /parties/:id` + `POST /sync` est appelé toutes les 30 secondes pour resynchroniser.

## 🚀 Démarrage

### Prérequis

- Node.js ≥ 18
- PostgreSQL ≥ 14
- [Ollama](https://ollama.com) (optionnel — pour l'assistant IA)

### 1. Base de données

```bash
psql -U postgres -c "CREATE DATABASE rugbyclicker;"
psql -U postgres -d rugbyclicker -f database/init.sql
psql -U postgres -d rugbyclicker -f database/seeds.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec DATABASE_URL et JWT_SECRET
npm run dev
```

Variables d'environnement :

| Variable | Description | Défaut |
| --- | --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | requis |
| `JWT_SECRET` | Clé de signature JWT | requis |
| `JWT_EXPIRES_IN` | Durée de validité du token | `1h` |
| `PORT` | Port du serveur | `3001` |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:5173` et communique avec le backend sur `http://localhost:3001`.

### 4. Ollama (optionnel)

```bash
ollama pull gemma3:1b
```

L'assistant coach fonctionne sans Ollama — un fallback algorithmique intelligent prend le relais.

## 🔌 API

Documentation Swagger disponible sur `http://localhost:3001/api-docs`.

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil connecté |
| GET | `/api/parties` | Lister ses parties |
| POST | `/api/parties` | Créer une partie |
| GET | `/api/parties/:id` | État complet |
| POST | `/api/parties/:id/click` | Clic manuel |
| POST | `/api/parties/:id/sync` | Sync hors-ligne |
| POST | `/api/parties/:id/coach` | Recommandation IA (ratelimited: 5/min) |
| POST | `/api/parties/:id/event` | Appliquer événement |
| POST | `/api/parties/:id/infrastructures/:infraId/acheter` | Acheter bâtiment |
| POST | `/api/parties/:id/infrastructures/:infraId/upgrader` | Améliorer bâtiment |
| POST | `/api/parties/:id/ameliorations/:amelId/acheter` | Acheter upgrade |
| GET | `/api/classement` | Top 20 clubs |

## 🎨 Design

- **Palette** : Vert rugby (`#1a3c34`) + Or (`#c9a84c`) + Crème (`#f5f0e8`)
- **Typographie** : Bebas Neue (titres) + Inter (corps)
- **Icônes** : SVG inline pour les éléments structurels, emojis pour le game feel
- **Accessibilité** : Support `prefers-reduced-motion`, `aria-label` sur les boutons, safe areas mobiles
- **Tokens** : Variables CSS pour les couleurs, durées d'animation, courbes d'easing, z-index

## 🧪 Qualité

- **Sécurité** : Toutes les routes de jeu vérifient `verifyOwnership` (le joueur est proprio de la partie), les inputs sont validés par Zod, et le niveau est lu depuis la DB (pas de confiance au client)
- **Intégrité** : Toutes les mutations utilisent des transactions SQL (`BEGIN/COMMIT/ROLLBACK`)
- **Requêtes paramétrées** : Aucune injection SQL possible
- **Rate limiting** : 5 req/min sur la route `/coach`

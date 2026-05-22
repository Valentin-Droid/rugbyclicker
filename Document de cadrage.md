# Document de cadrage — RugbyClicker (Idle Game Rugby)

- **Module :** Développement d'application front/back  
- **Projet :** Jeu vidéo web idle/clicker dans l'univers du rugby  
- **Nom produit (proposé) :** RugbyClicker  
- **Auteur :** Valentin  
- **Dépôt GitHub :** à renseigner (`frontend`, `backend`, ou monorepo)

---

## 1. Brief projet

### 1.1 Présentation générale

**Description courte**  
RugbyClicker est un jeu web de type idle game où le joueur incarne le manager d'un club de rugby. Il génère des ressources via des clics et de la production passive, puis investit dans des infrastructures et des améliorations pour accélérer sa progression. Le jeu repose sur des boucles courtes d'achat, d'optimisation et de montée en niveau. La progression est sauvegardée côté serveur pour garantir la continuité et limiter la triche.

**Problème résolu**  
Proposer une expérience de jeu de gestion simple à prendre en main, jouable par sessions courtes, avec une progression persistante.

**Public cible**
1. Joueurs casual attirés par les jeux idle/clicker.
2. Public sensible à l'univers sportif (rugby/management).
3. Utilisateurs web desktop et mobile.

### 1.2 Arborescence applicative (MVP)

```txt
Accueil
├── Connexion
├── Inscription
└── Dashboard de jeu
    ├── Bandeau ressources (argent, fans, prestige)
    ├── Actions manuelles (clic principal)
    ├── Infrastructures
    │   ├── Liste des infrastructures
    │   └── Achat / upgrade (niveau, quantité)
    ├── Améliorations
    │   ├── Liste des améliorations
    │   └── Achat
    ├── Progression club
    │   ├── Niveau actuel
    │   └── Objectifs du niveau
    └── Paramètres
        ├── Sauvegarde/chargement
        └── Déconnexion
```

### 1.3 Wireframes (description fonctionnelle)

**Écran Accueil / Landing**
- Hero "RugbyClicker", CTA "Jouer maintenant".
- Accès Connexion / Inscription.
- Bloc "Principe du jeu" en 3 étapes (produire, investir, progresser).

**Écran Connexion / Inscription**
- Formulaire email + mot de passe (pseudo en inscription).
- Message d'erreur explicite (identifiants invalides, email déjà pris).
- Redirection vers Dashboard après succès.

**Dashboard principal**
- Header: nom du club, niveau, bouton sauvegarde.
- Colonne gauche: ressources en temps réel.
- Colonne centrale: action principale de clic + statistiques de production.
- Colonne droite: boutique infrastructures / améliorations avec coûts et effets.

**Écran/zone d'achat**
- Cartes d'infrastructure avec:
  - coût actuel,
  - production par seconde,
  - quantité possédée,
  - niveau.
- Boutons "Acheter x1" et "Upgrade".

### 1.4 Liste des fonctionnalités (priorisées)

| Priorité | Fonctionnalité | Description | Rôle concerné |
|---|---|---|---|
| 🔴 Must have | Authentification | Inscription, connexion, déconnexion | Joueur |
| 🔴 Must have | Création/chargement de partie | Créer et reprendre une partie persistée | Joueur |
| 🔴 Must have | Ressources temps réel | Affichage + mise à jour ressources | Joueur |
| 🔴 Must have | Clic manuel | Génération active de ressources | Joueur |
| 🔴 Must have | Achat infrastructures | Production passive + progression | Joueur |
| 🔴 Must have | Achat améliorations | Modificateurs de coût/production | Joueur |
| 🔴 Must have | Sauvegarde côté serveur | État de partie fiable et anti-perte | Joueur |
| 🟡 Should have | Calcul hors-ligne | Gains calculés entre deux connexions | Joueur |
| 🟡 Should have | Équilibrage progression | Courbes de coûts/production paramétrables | Joueur/Admin |
| 🟡 Should have | Historique d'achats | Traçabilité des améliorations | Joueur |
| 🟢 Nice to have | Classement | Comparaison entre clubs | Joueur |
| 🟢 Nice to have | Événements temporaires | Bonus sur période donnée | Joueur |

---

## 2. Modélisation de la base de données

### 2.1 MCD — Modèle Conceptuel de Données

Le MCD existant est fourni dans **`MCD.svg`** (Mocodo).  
Entités principales identifiées :
- `JOUEUR`
- `PARTIE`
- `RESSOURCE`
- `INFRASTRUCTURE`
- `AMELIORATION`

Associations porteuses :
- `STOCKER` (`PARTIE` ↔ `RESSOURCE`, attribut `quantite`)
- `POSSEDER_INFRASTRUCTURE` (`PARTIE` ↔ `INFRASTRUCTURE`, attributs `quantite`, `niveau`)
- `ACHETER_AMELIORATION` (`PARTIE` ↔ `AMELIORATION`, attribut `date_achat`)
- `POSSEDER` (`PARTIE` ↔ `JOUEUR`)

### 2.2 MLD — Modèle Logique de Données

```txt
JOUEUR (id_joueur, pseudo, email, mot_de_passe, date_creation)
PARTIE (id_partie, nom_club, niveau, dernier_login, #id_joueur)
RESSOURCE (id_ressource, nom, description)
INFRASTRUCTURE (id_infrastructure, nom, cout_base, production_base, description)
AMELIORATION (id_amelioration, nom, cout, effet, type_cible)

STOCK_RESSOURCE (#id_partie, #id_ressource, quantite)
PK(id_partie, id_ressource)

POSSESSION_INFRASTRUCTURE (#id_partie, #id_infrastructure, quantite, niveau)
PK(id_partie, id_infrastructure)

ACHAT_AMELIORATION (#id_partie, #id_amelioration, date_achat)
PK(id_partie, id_amelioration)
```

### 2.3 MPD — Script SQL (PostgreSQL)

```sql
CREATE TABLE joueur (
    id_joueur SERIAL PRIMARY KEY,
    pseudo VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partie (
    id_partie SERIAL PRIMARY KEY,
    nom_club VARCHAR(100) NOT NULL,
    niveau INT NOT NULL DEFAULT 1,
    dernier_login TIMESTAMP,
    id_joueur INT NOT NULL,
    CONSTRAINT fk_partie_joueur
        FOREIGN KEY (id_joueur) REFERENCES joueur(id_joueur)
        ON DELETE CASCADE
);

CREATE TABLE ressource (
    id_ressource SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE infrastructure (
    id_infrastructure SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    cout_base NUMERIC(12,2) NOT NULL,
    production_base NUMERIC(12,2) NOT NULL,
    description TEXT
);

CREATE TABLE amelioration (
    id_amelioration SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    cout NUMERIC(12,2) NOT NULL,
    effet TEXT NOT NULL,
    type_cible VARCHAR(50) NOT NULL
);

CREATE TABLE stock_ressource (
    id_partie INT NOT NULL,
    id_ressource INT NOT NULL,
    quantite NUMERIC(14,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_partie, id_ressource),
    CONSTRAINT fk_stock_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_ressource
        FOREIGN KEY (id_ressource) REFERENCES ressource(id_ressource)
        ON DELETE CASCADE
);

CREATE TABLE possession_infrastructure (
    id_partie INT NOT NULL,
    id_infrastructure INT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    niveau INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_partie, id_infrastructure),
    CONSTRAINT fk_possession_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_possession_infrastructure
        FOREIGN KEY (id_infrastructure) REFERENCES infrastructure(id_infrastructure)
        ON DELETE CASCADE
);

CREATE TABLE achat_amelioration (
    id_partie INT NOT NULL,
    id_amelioration INT NOT NULL,
    date_achat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_partie, id_amelioration),
    CONSTRAINT fk_achat_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_achat_amelioration
        FOREIGN KEY (id_amelioration) REFERENCES amelioration(id_amelioration)
        ON DELETE CASCADE
);
```

---

## 3. Définition de la stack technique

### 3.1 Frontend

| Élément | Choix | Justification |
|---|---|---|
| Framework | React | UI dynamique, rendu par composants, cycle d'état adapté aux idle games |
| Langage | JavaScript (évolutif TypeScript) | Démarrage rapide puis montée en robustesse possible |
| Routage | React Router | Navigation claire (auth, dashboard, paramètres) |
| UI/CSS | CSS Modules ou Tailwind | Productivité UI + cohérence visuelle |
| Data fetching | Fetch API / Axios | Intégration simple avec API REST |

### 3.2 Backend

| Élément | Choix | Justification |
|---|---|---|
| Runtime/Framework | Node.js + Express | API REST rapide à mettre en place, écosystème riche |
| Authentification | JWT + hash mot de passe (bcrypt) | Sessions stateless + sécurité minimale requise |
| Validation | Schémas de validation (ex: Zod/Joi) | Contrôle strict des entrées API |
| Architecture | Contrôleurs + services + accès DB | Séparation des responsabilités |

### 3.3 Base de données

| Élément | Choix | Justification |
|---|---|---|
| SGBD | PostgreSQL | Solide en relationnel, intégrité référentielle, bon pour progression persistante |
| Hébergement | Local en dev, cloud en prod | Itération rapide puis déploiement |

### 3.4 Outils & infrastructure

| Élément | Choix |
|---|---|
| Versioning | Git + GitHub |
| Gestion projet | Notion ou GitHub Projects |
| API testing | Postman / Insomnia |
| Diagrammes | Mocodo + Mermaid |
| Déploiement (cible) | Front (Vercel) + API/DB (Railway/Render) |

---

## 4. Fonctionnalité IA (obligatoire)

### 4.1 Description
**Assistant de coaching de progression** intégré au dashboard.  
Le joueur peut demander "Quelle est la meilleure action maintenant ?".  
L'IA propose une recommandation priorisée (achat, upgrade, stratégie court terme), basée sur l'état courant de la partie.

### 4.2 Choix technique
- **Modèle :** GPT-4o-mini (ou équivalent à coût réduit).
- **Intégration :** appel API côté backend uniquement (clé jamais exposée au frontend).
- **Entrée :** ressources actuelles, productions/s, coûts des prochains achats, améliorations restantes.
- **Sortie :** recommandation structurée JSON:
  - action conseillée,
  - raison,
  - impact estimé à court terme.

### 4.3 Valeur utilisateur
- Réduit la friction pour les nouveaux joueurs.
- Aide à comprendre les mécaniques d'optimisation.
- Renforce l'engagement (feedback contextualisé).

---

## 5. Architecture macro (front/back)

1. Le client React déclenche les actions de jeu (clic, achat, chargement).
2. L'API Express valide l'action, applique la logique métier, persiste dans PostgreSQL.
3. L'état mis à jour est renvoyé au client pour rendu immédiat.
4. Pour l'assistant IA, le backend construit un prompt à partir de l'état de partie et renvoie une réponse exploitable au front.

**Endpoints MVP (exemple)**
- `POST /auth/register`
- `POST /auth/login`
- `GET /parties/:id`
- `PUT /parties/:id/click`
- `POST /parties/:id/infrastructures/:id/achat`
- `POST /parties/:id/ameliorations/:id/achat`
- `POST /parties/:id/assistant-ia/recommandation`

---

## 6. Risques et points de vigilance

1. **Équilibrage gameplay** : éviter la stagnation ou la progression explosive.
2. **Anti-triche** : ne jamais calculer les achats critiques uniquement côté client.
3. **Performance UI** : limiter les re-renders sur mises à jour fréquentes.
4. **Sécurité** : hash des mots de passe, validation stricte, gestion JWT.
5. **Coût IA** : quotas/requêtes à limiter par joueur et par minute.

---

## 7. Synthèse

Le projet est cadré autour d'un MVP clair: un idle game rugby web, persistant, avec architecture client/serveur, base relationnelle robuste et une première fonctionnalité IA à valeur directe pour le joueur. Le périmètre est compatible avec une réalisation front/back incrémentale en priorisant les fonctionnalités **Must have**.

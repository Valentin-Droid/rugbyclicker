# RugbyClicker

Jeu web idle/clicker dans l'univers du rugby.

## Stack
- Frontend : React (Vite) + React Router + Axios
- Backend : Node.js + Express + JWT + bcrypt + Zod
- Base de données : PostgreSQL

## Démarrage
### Backend
cd backend
npm install
cp .env.example .env   # Modifier les valeurs
npm run dev

### Frontend
cd frontend
npm install
cp .env.example .env
npm run dev

### Base de données
psql -U postgres -f database/init.sql
psql -U postgres -d rugbyclicker -f database/seeds.sql

# LLM Job Applier

> Votre assistant personnel pour trouver des offres d'emploi adaptées à votre profil.

Application web de gestion de profils professionnels, conçue pour centraliser vos expériences, formations, compétences et langues — en vue d'automatiser les candidatures avec l'aide d'un LLM (Claude).

## Fonctionnalités

- Création et gestion de plusieurs profils professionnels
- Saisie structurée : informations personnelles, résumé, compétences, langues, expériences, formations
- Activation d'un profil principal (un seul actif à la fois)
- API REST complète (Next.js App Router)
- Interface entièrement en français

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| ORM | Prisma 6 |
| Base de données | PostgreSQL 16 |
| Runtime | Node.js 20 |

---

## Installation locale

### Prérequis

- Node.js 20+
- PostgreSQL 16 (ou Docker)
- npm

### 1. Cloner le dépôt

```bash
git clone https://github.com/<votre-username>/LLM-Job-Applier.git
cd LLM-Job-Applier
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobapplier
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Initialiser la base de données

```bash
npm run db:migrate
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Setup Docker

La stack complète (app + PostgreSQL) se lance en une seule commande.

### Prérequis

- Docker Desktop (ou Docker + Docker Compose)

### Lancer avec Docker Compose

```bash
docker compose up -d --build
```

Cela démarre :
- **app** — Next.js sur le port `3000`, avec hot-reload et migration automatique au démarrage
- **postgres** — PostgreSQL 16 sur le port `5432`, avec volume persistant

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Variables d'environnement Docker

Copiez `.env.example` vers `.env.local` avant de lancer Docker :

```bash
cp .env.example .env.local
```

Le `docker-compose.yml` charge automatiquement `.env.local`.

### Commandes utiles

```bash
# Lancer en arrière-plan
docker compose up -d

# Voir les logs
docker compose logs -f app

# Arrêter
docker compose down

# Arrêter et supprimer les volumes (reset DB)
docker compose down -v
```

---

## Commandes du projet

```bash
# Développement
npm run dev          # Lancer le serveur de développement
npm run build        # Build de production
npm run start        # Lancer le build de production
npm run lint         # Linter ESLint

# Base de données
npm run db:migrate   # Appliquer les migrations Prisma
npm run db:studio    # Ouvrir Prisma Studio (UI visuelle de la DB)
```

---

## Commandes Claude Code

Ce projet utilise [Claude Code](https://claude.ai/code) pour le développement assisté par IA.

```bash
# Lancer Claude Code dans le répertoire du projet
claude

# Lancer avec un prompt initial
claude "explique la structure du projet"

# Mode non-interactif (CI / scripting)
claude -p "génère les tests pour ProfileForm"
```

### Agents BMAD disponibles

Le projet intègre le framework **BMad** pour orchestrer des agents spécialisés :

| Commande | Agent | Rôle |
|---|---|---|
| `/bmad-agent-dev` | Amélie | Implémentation de stories |
| `/bmad-agent-pm` | John | Création de PRD |
| `/bmad-agent-architect` | Winston | Architecture technique |
| `/bmad-agent-sm` | Bob | Planification de sprint |
| `/bmad-agent-qa` | Quinn | Tests et couverture |
| `/bmad-agent-ux-designer` | Sally | Design UX/UI |
| `/bmad-help` | — | Orientation dans le workflow |

---

## Structure du projet

```
src/
├── app/
│   ├── layout.tsx              # Layout racine avec navigation
│   ├── page.tsx                # Page d'accueil
│   ├── profiles/
│   │   ├── page.tsx            # Liste des profils
│   │   ├── new/page.tsx        # Création de profil
│   │   └── [id]/page.tsx       # Édition de profil
│   └── api/profiles/           # API REST
├── components/profile/         # Composants réutilisables
└── lib/prisma.ts               # Client Prisma (singleton)

prisma/
└── schema.prisma               # Schéma de base de données

docker-compose.yml              # Stack Docker complète
Dockerfile                      # Image de l'application
.env.example                    # Template des variables d'environnement
```

## API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/profiles` | Lister tous les profils |
| `POST` | `/api/profiles` | Créer un profil |
| `GET` | `/api/profiles/:id` | Récupérer un profil |
| `PUT` | `/api/profiles/:id` | Mettre à jour un profil |
| `DELETE` | `/api/profiles/:id` | Supprimer un profil |
| `PUT` | `/api/profiles/:id/activate` | Activer un profil |

---

## Roadmap

- [x] Gestion CRUD des profils professionnels
- [x] Multi-profils avec profil actif
- [ ] Recherche et analyse d'offres d'emploi
- [ ] Génération automatique de lettres de motivation via Claude
- [ ] Export CV (PDF)
- [ ] Suivi des candidatures

---

## Licence

MIT

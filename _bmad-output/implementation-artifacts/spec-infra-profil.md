---
title: 'Infrastructure & Gestion du Profil Utilisateur'
type: 'feature'
created: '2026-03-30'
status: 'done'
baseline_commit: 'c67e0cad13c31ad1bdb003906416ee2d11ce8565'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le projet n'a pas encore d'infrastructure. Il faut un socle technique (Next.js, Docker, PostgreSQL) et un système de gestion du profil professionnel de l'utilisateur, servant de base à toutes les fonctionnalités futures.

**Approach:** Scaffolding d'une application Next.js 15 (TypeScript + Tailwind) avec Docker Compose (app + PostgreSQL), schéma Prisma pour le profil, une commande Claude Code interactive pour importer PDF ou LinkedIn et sauvegarder en base, et une page UI de gestion du profil.

## Boundaries & Constraints

**Always:**
- Application mono-utilisateur, pas d'authentification
- Prisma ORM pour toutes les interactions base de données
- Variables d'environnement via `.env.local` (jamais hardcodées) ; `.env.example` fourni
- Profil unique en base (upsert — pas de multi-profil)
- Next.js App Router exclusivement (pas de Pages Router)
- L'import PDF/LinkedIn se fait via une commande Claude Code interactive (pas via l'interface web)

**Ask First:**
- Si la page LinkedIn est inaccessible (login requis, captcha), demander si l'utilisateur préfère fournir un autre format (export LinkedIn, texte collé)

**Never:**
- Pas d'endpoint d'import dans l'API Next.js (pas de parsing PDF côté serveur, pas de scraping côté serveur)
- Pas de `@anthropic-ai/sdk`, `pdf-parse`, `axios` ou `cheerio` dans les dépendances de l'app
- Pas d'authentification ni gestion multi-utilisateurs
- Pas de fonctionnalités de recherche d'emploi (objectif 2)
- Pas de `getServerSideProps` ni Pages Router

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Import PDF via commande | Chemin PDF passé à la commande `/import-profile` | Claude lit le PDF, extrait le profil, curl PUT /api/profile, confirmation dans le terminal | Erreur si fichier introuvable ou PDF non lisible |
| Import LinkedIn via commande | URL LinkedIn passée à la commande `/import-profile` | Claude visite l'URL, extrait le profil, curl PUT /api/profile, confirmation dans le terminal | Demander un format alternatif si page inaccessible |
| Sauvegarde manuelle | Formulaire profil soumis dans l'UI | Profil upsert en DB via PUT /api/profile, confirmation visuelle | Validation : champ `name` requis |
| Profil existant | Accès à /profile avec profil en DB | Formulaire pré-rempli avec toutes les données | — |

</frozen-after-approval>

## Code Map

- `docker-compose.yml` -- Orchestration services (app port 3000, postgres port 5432, volume persistant `pgdata`)
- `Dockerfile` -- Build multi-stage Next.js production
- `.env.example` -- Variables requises : `DATABASE_URL`, `ANTHROPIC_API_KEY` (pour les commandes Claude Code)
- `prisma/schema.prisma` -- Modèles Profile, Experience, Education
- `src/lib/prisma.ts` -- Singleton Prisma client (hot-reload safe)
- `src/app/api/profile/route.ts` -- GET profil / PUT upsert profil complet (utilisé par la commande et l'UI)
- `src/app/profile/page.tsx` -- Page profil : affichage + édition manuelle
- `src/components/profile/ProfileForm.tsx` -- Formulaire éditable (infos, expériences, formations)
- `.claude/commands/import-profile.md` -- Commande Claude Code interactive : lit PDF ou URL LinkedIn, extrait données, sauvegarde via curl PUT /api/profile

## Tasks & Acceptance

**Execution:**
- [x] `docker-compose.yml` + `Dockerfile` + `.env.example` -- Créer infrastructure Docker : service `app` (Next.js, port 3000, dépend de `postgres`) + service `postgres` (image postgres:16, port 5432, volume persistant `pgdata`), `.env.example` avec `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobapplier` et `ANTHROPIC_API_KEY=`
- [x] `package.json` + `next.config.ts` + `tsconfig.json` + `tailwind.config.ts` + `postcss.config.mjs` -- Scaffolding Next.js 15 App Router TypeScript + Tailwind CSS ; dépendances : `@prisma/client`, `prisma` (dev)
- [x] `prisma/schema.prisma` -- Modèles : `Profile` (id UUID PK, name String, email String?, phone String?, location String?, title String?, summary String?, skills String[], languages String[], linkedinUrl String?, createdAt DateTime, updatedAt DateTime) + `Experience` (id UUID PK, profileId FK→Profile, company String, role String, location String?, startDate String, endDate String?, description String?) + `Education` (id UUID PK, profileId FK→Profile, institution String, degree String?, field String?, startDate String, endDate String?, description String?) ; datasource postgres + generator client
- [x] `src/lib/prisma.ts` -- Singleton Prisma client avec pattern `global.__prisma` pour hot-reload Next.js
- [x] `src/app/api/profile/route.ts` -- GET : retourne `{ profile }` (premier profil avec `experiences` et `education` inclus, ou `null`) ; PUT : body JSON `{ name, email, phone, location, title, summary, skills, languages, linkedinUrl, experiences, education }`, upsert profil (create ou update le premier), deleteMany + createMany pour les relations imbriquées
- [x] `src/app/profile/page.tsx` + `src/components/profile/ProfileForm.tsx` -- Page `/profile` : fetch GET /api/profile côté serveur, affiche `ProfileForm` pré-rempli si profil existant ou vide sinon ; formulaire avec sections Infos personnelles (name, email, phone, location, title, summary), Compétences & Langues (chips éditables pour skills et languages), Expériences (liste ajout/suppression), Formations (liste ajout/suppression), bouton Sauvegarder qui appelle PUT /api/profile ; note UI indiquant d'utiliser `/import-profile` dans Claude Code pour importer depuis PDF/LinkedIn
- [x] `.claude/commands/import-profile.md` -- Commande Claude Code interactive : instructions pour lire le fichier PDF fourni en argument (ou visiter l'URL LinkedIn), extraire un objet JSON structuré `{ name, email, phone, location, title, summary, skills[], languages[], linkedinUrl, experiences[], education[] }`, puis exécuter `curl -X PUT http://localhost:3000/api/profile -H "Content-Type: application/json" -d '<json>'` pour sauvegarder ; afficher confirmation avec les données sauvegardées

**Acceptance Criteria:**
- Given `docker compose up --build`, when les services démarrent, then l'app est accessible sur http://localhost:3000 et PostgreSQL répond sur le port 5432
- Given un profil existant en DB, when l'utilisateur accède à /profile, then le formulaire est pré-rempli avec toutes les données (infos, expériences, formations)
- Given des modifications dans le formulaire, when Sauvegarder est cliqué, then PUT /api/profile persiste les changements et l'UI confirme la sauvegarde
- Given la commande `/import-profile` avec un chemin PDF valide, when Claude Code exécute la commande, then le profil extrait est sauvegardé en DB et confirmé dans le terminal
- Given la commande `/import-profile` avec une URL LinkedIn valide, when Claude Code exécute la commande, then le profil extrait est sauvegardé en DB et confirmé dans le terminal

## Design Notes

**Commande `/import-profile` :** Claude Code lit nativement les PDFs. La commande est un fichier markdown `.claude/commands/import-profile.md` qui donne des instructions à Claude : (1) lire le fichier ou l'URL fourni en `$ARGUMENTS`, (2) extraire le profil au format JSON selon le schéma défini, (3) appeler `curl -X PUT http://localhost:3000/api/profile` avec le JSON. L'app doit être en cours d'exécution pour que le curl fonctionne.

**Dates dans les expériences :** Stocker sous forme de `String` (ex: `"2022-03"`, `"Présent"`) plutôt que `DateTime` pour gérer les formats variés des CV (mois uniquement, "à ce jour", etc.).

## Verification

**Commands:**
- `docker compose up --build` -- expected: démarrage sans erreur, app sur :3000
- `npx prisma migrate dev --name init` -- expected: tables `Profile`, `Experience`, `Education` créées
- `curl http://localhost:3000/api/profile` -- expected: `{"profile": null}` ou JSON du profil

## Spec Change Log

- 2026-03-30 : Suppression des endpoints d'import PDF/LinkedIn côté serveur. L'extraction est déléguée à une commande Claude Code interactive (`.claude/commands/import-profile.md`) qui lit directement le PDF ou l'URL et sauvegarde via curl PUT /api/profile. Raison : approche plus simple, pas de dépendances d'extraction dans l'app, meilleure qualité d'extraction grâce aux capacités natives de Claude Code.

## Suggested Review Order

**Schéma & Couche données**

- Modèles Profile / Experience / Education avec cascade delete et arrays PostgreSQL.
  [`schema.prisma:1`](../../prisma/schema.prisma#L1)

- Singleton PrismaClient — global safe pour hot-reload Next.js.
  [`prisma.ts:7`](../../src/lib/prisma.ts#L7)

**API — Validation & Transaction**

- Point d'entrée principal : GET + PUT avec try/catch, validation `name.trim()`, arrays.
  [`route.ts:1`](../../src/app/api/profile/route.ts#L1)

- Transaction atomique delete+recreate relations pour éviter perte de données.
  [`route.ts:48`](../../src/app/api/profile/route.ts#L48)

**UI — Page profil**

- Server component : fetch Prisma direct, passe `initialData` au formulaire.
  [`page.tsx:1`](../../src/app/profile/page.tsx#L1)

- Initialisation du state avec `addId` — stable UUIDs pour éviter key-shift sur suppression.
  [`ProfileForm.tsx:46`](../../src/components/profile/ProfileForm.tsx#L46)

- `handleSubmit` : PUT /api/profile avec feedback succès/erreur.
  [`ProfileForm.tsx:104`](../../src/components/profile/ProfileForm.tsx#L104)

**Commande Claude Code**

- Import interactif PDF/LinkedIn → JSON → curl via fichier temp (évite injection shell).
  [`import-profile.md:1`](../../.claude/commands/import-profile.md#L1)

**Infrastructure**

- Docker Compose : healthcheck postgres, `condition: service_healthy`, DB URL override `postgres:5432`, `prisma db push` au démarrage.
  [`docker-compose.yml:1`](../../docker-compose.yml#L1)

- Scaffold Next.js 15 + Prisma 6 + Tailwind 4.
  [`package.json:1`](../../package.json#L1)

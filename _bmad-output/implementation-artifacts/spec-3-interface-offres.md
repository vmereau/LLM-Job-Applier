---
title: 'Interface offres d''emploi'
type: 'feature'
created: '2026-03-31'
status: 'done'
baseline_commit: '4e3238079e8c5dfbc562881f36eb6851d42e68c4'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les offres d'emploi sont stockées en base via `/search-jobs` mais aucune interface ne permet de les consulter, filtrer, ni de gérer leur suivi (statut, notes).

**Approach:** Ajouter un champ `notes` au modèle `JobOffer`, une API PATCH pour mettre à jour statut et notes, une page liste avec filtres, et une page détail avec toggle de réponse et espace de notes.

## Boundaries & Constraints

**Always:**
- Commandes Prisma via `docker compose exec app npx prisma ...`
- Stack existante : Next.js 15 App Router, Tailwind CSS, Prisma, PostgreSQL
- Cohérence visuelle avec les pages `/profiles` (cartes blanches, grille, Tailwind)
- La page liste filtre côté client (pas de pagination — volume prototype)

**Ask First:**
- Si le schéma nécessite une migration destructive (ex. renommage de colonne)

**Never:**
- SDK Anthropic dans l'application
- Nouveau système de design ou librairie UI externe
- Pagination ou appels API côté serveur pour les filtres

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Liste vide | Aucune offre en base | Message "Aucune offre trouvée" | N/A |
| Filtre statut | Sélection "répondu" | Seules les offres avec statut `repondu` affichées | N/A |
| Filtre profil | Sélection profil X | Seules les offres liées à ce profil affichées | N/A |
| Toggle répondu | Clic sur "J'ai répondu" sur offre `nouveau` | statut → `repondu`, bouton mis à jour | Afficher erreur inline si PATCH échoue |
| Sauvegarde notes | Saisie texte libre + blur/submit | PATCH note sauvegardée, confirmation visuelle | Afficher erreur inline si PATCH échoue |
| Offre inexistante | GET /job-offers/id-invalide | Redirection vers /job-offers | N/A |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- modèle JobOffer — ajout champ `notes`
- `prisma/migrations/` -- nouvelle migration pour `notes`
- `src/app/api/job-offers/route.ts` -- GET (ajout filtre ?profileId=)
- `src/app/api/job-offers/[id]/route.ts` -- PATCH statut + notes (à créer)
- `src/app/job-offers/page.tsx` -- page liste avec filtres (à créer)
- `src/app/job-offers/[id]/page.tsx` -- page détail (à créer)
- `src/components/job-offers/JobOfferList.tsx` -- composant liste client avec filtres (à créer)
- `src/components/job-offers/JobOfferDetail.tsx` -- composant détail client (à créer)
- `src/app/layout.tsx` -- navigation — ajout lien "Offres"

## Tasks & Acceptance

**Execution:**
- [x] `prisma/schema.prisma` -- ajouter `notes String?` au modèle `JobOffer` -- champ requis pour les notes libres
- [x] `prisma/migrations/` -- créer migration `add_notes_to_job_offer` via `docker compose exec app npx prisma migrate dev --name add_notes_to_job_offer` -- persister le schéma
- [x] `src/app/api/job-offers/route.ts` -- ajouter support query param `?profileId=` dans le GET (filtre Prisma `where: { profileId }` si présent) -- permettre filtrage par profil depuis la page liste
- [x] `src/app/api/job-offers/[id]/route.ts` -- créer route PATCH acceptant `{ statut?, notes? }` avec validation (statut ∈ StatutOffre) et GET pour récupérer une offre seule -- alimenter la page détail et les mises à jour
- [x] `src/components/job-offers/JobOfferList.tsx` -- composant client : liste de cartes d'offres, filtres (statut, profil, texte libre sur titre/entreprise/lieu/mots_cles) -- interface principale de consultation
- [x] `src/app/job-offers/page.tsx` -- Server Component : fetch `GET /api/job-offers` + `GET /api/profiles`, passe les données à `JobOfferList` -- page liste
- [x] `src/components/job-offers/JobOfferDetail.tsx` -- composant client : affichage complet de l'offre, profil associé, toggle "J'ai répondu" (PATCH statut `repondu`/`nouveau`), textarea notes avec sauvegarde -- page détail interactive
- [x] `src/app/job-offers/[id]/page.tsx` -- Server Component : fetch offre par id, 404 → redirect `/job-offers`, passe les données à `JobOfferDetail` -- page détail
- [x] `src/app/layout.tsx` -- ajouter lien "Offres" dans la navigation -- accès depuis toutes les pages

**Acceptance Criteria:**
- Given des offres en base, when je visite `/job-offers`, then je vois les cartes de toutes les offres triées par date décroissante
- Given la page liste, when je filtre par statut "répondu", then seules les offres `repondu` s'affichent sans rechargement
- Given la page liste, when je filtre par profil, then seules les offres de ce profil s'affichent
- Given la page liste, when je clique sur une offre, then je suis redirigé vers `/job-offers/[id]`
- Given la page détail, when je clique "J'ai répondu", then le statut passe à `repondu` et le bouton reflète l'état mis à jour
- Given la page détail avec statut `repondu`, when je clique à nouveau le toggle, then le statut repasse à `vu`
- Given la page détail, when je modifie le champ notes et le confirme, then les notes sont persistées en base
- Given un id inexistant, when je visite `/job-offers/[id]`, then je suis redirigé vers `/job-offers`

## Spec Change Log

## Verification

**Commands:**
- `docker compose exec app npx prisma migrate status` -- expected: toutes les migrations appliquées
- `docker compose exec app npx prisma generate` -- expected: client généré sans erreur

**Manual checks (if no CLI):**
- Visiter `/job-offers` : liste des offres visible avec filtres fonctionnels
- Visiter `/job-offers/[id]` d'une offre existante : détail, toggle statut, notes éditables

## Suggested Review Order

**Composant interactif principal (entrée)**

- Composant client : état local offer/notes, deux actions async indépendantes
  [`JobOfferDetail.tsx:39`](../../src/components/job-offers/JobOfferDetail.tsx#L39)

**Schéma & migration**

- Ajout `notes String?` — champ nullable, migration non destructive
  [`schema.prisma:50`](../../prisma/schema.prisma#L50)

**API — nouvelle route PATCH/GET par id**

- Validation statut ∈ enum, données partielles, P2025 → 404
  [`[id]/route.ts:1`](../../src/app/api/job-offers/[id]/route.ts#L1)

**API — filtre profileId sur la liste**

- Filtre optionnel via query param, `where` conditionnel
  [`route.ts:4`](../../src/app/api/job-offers/route.ts#L4)

**UI — Page liste**

- Filtres client-side (statut, profil, texte) sans rechargement
  [`JobOfferList.tsx:52`](../../src/components/job-offers/JobOfferList.tsx#L52)

- Server Component : fetch parallèle offres + profils
  [`job-offers/page.tsx:1`](../../src/app/job-offers/page.tsx#L1)

**UI — Page détail**

- Toggle repondu ↔ vu, feedback inline en cas d'erreur
  [`JobOfferDetail.tsx:63`](../../src/components/job-offers/JobOfferDetail.tsx#L63)

- Save notes avec confirmation visuelle 2.5 s
  [`JobOfferDetail.tsx:77`](../../src/components/job-offers/JobOfferDetail.tsx#L77)

- Server Component : redirect si offre introuvable
  [`[id]/page.tsx:1`](../../src/app/job-offers/[id]/page.tsx#L1)

**Navigation**

- Lien "Offres" ajouté dans le layout global
  [`layout.tsx:22`](../../src/app/layout.tsx#L22)

---
title: 'Favoris pour les offres d''emploi'
type: 'feature'
created: '2026-04-03'
status: 'done'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** Il est impossible de marquer une offre d'emploi comme favorite pour la retrouver facilement parmi une longue liste.

**Approche :** Ajouter un champ booléen `favori` au modèle `JobOffer`, exposer le toggle via l'API PATCH existante, puis afficher une étoile cliquable sur la page de détail et dans la liste, avec un filtre "Favoris seulement" sur la page liste.

## Boundaries & Constraints

**Always:**
- Le toggle favori utilise le endpoint PATCH `/api/job-offers/[id]` existant (pattern identique au toggle statut).
- La migration Prisma se fait via `docker compose exec app npx prisma migrate dev --name add-favori`.
- L'icône étoile est en Unicode (★/☆) ou via un className Tailwind existant, sans nouvelle dépendance.

**Ask First:**
- Si le filtre favoris doit être persisté en URL (searchParam) plutôt qu'en état local React — ne pas décider seul.

**Never:**
- Pas de nouvel endpoint API dédié aux favoris.
- Pas de page séparée pour les favoris.
- Pas d'animation ou librairie d'icônes externe.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toggle ON | `favori: false`, click étoile | PATCH `{ favori: true }`, étoile pleine affichée | Message d'erreur inline si PATCH échoue |
| Toggle OFF | `favori: true`, click étoile | PATCH `{ favori: false }`, étoile vide affichée | Message d'erreur inline si PATCH échoue |
| Filtre favoris actif | Liste avec favoris et non-favoris | Seules les offres `favori: true` sont affichées | — |
| Filtre favoris inactif | Liste mixte | Toutes les offres affichées normalement | — |
| Nouvelle offre | Création via POST | `favori` vaut `false` par défaut | — |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- modèle `JobOffer` : ajouter le champ `favori`
- `src/app/api/job-offers/[id]/route.ts` -- PATCH handler : autoriser le champ `favori`
- `src/components/job-offers/JobOfferDetail.tsx` -- bouton toggle étoile + état `favori`
- `src/components/job-offers/JobOfferList.tsx` -- badge étoile sur chaque carte + filtre "Favoris"

## Tasks & Acceptance

**Execution:**
- [x] `prisma/schema.prisma` -- ajouter `favori Boolean @default(false)` dans le modèle `JobOffer` -- rend le champ persistable
- [x] *(migration)* -- exécuter `docker compose exec app npx prisma migrate dev --name add-favori` -- applique le schéma en base
- [x] `src/app/api/job-offers/[id]/route.ts` -- dans le PATCH handler, inclure `favori` dans les champs autorisés (aux côtés de `statut`, `notes`, `lettreMotivation`) -- permet de persister le toggle
- [x] `src/components/job-offers/JobOfferDetail.tsx` -- ajouter un bouton étoile (★/☆) utilisant le même pattern que `handleToggleRepondu` : état local `favori`, appel `patch({ favori: !offer.favori })`, mise à jour de `offer` -- interface de toggle sur la page détail
- [x] `src/components/job-offers/JobOfferList.tsx` -- afficher une étoile ★ sur les cartes dont `favori === true` + ajouter un toggle "Favoris seulement" dans les filtres existants qui masque les offres non-favorites -- visibilité et filtrage dans la liste

**Acceptance Criteria:**
- Étant donné une offre non-favorite, quand l'utilisateur clique sur l'étoile (page détail), alors l'offre passe en favori, l'étoile devient pleine (★) et le changement est persisté en base.
- Étant donné une offre favorite, quand l'utilisateur clique sur l'étoile, alors le favori est retiré, l'étoile devient vide (☆) et le changement est persisté.
- Étant donné la page liste avec le filtre "Favoris seulement" activé, quand la page se charge, alors seules les offres avec `favori: true` sont visibles.
- Étant donné une erreur réseau lors du toggle, quand la requête échoue, alors un message d'erreur inline est affiché et l'état local n'est pas modifié.

## Spec Change Log

## Verification

**Commands:**
- `docker compose exec app npx prisma migrate status` -- expected: toutes les migrations appliquées, aucune en attente

**Manual checks (if no CLI) :**
- Sur la page détail d'une offre : cliquer l'étoile → rafraîchir la page → l'étoile reste dans l'état choisi (persistance confirmée).
- Sur la page liste : activer le filtre "Favoris" → seules les offres étoilées apparaissent.

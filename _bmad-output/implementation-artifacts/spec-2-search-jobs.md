---
title: 'Recherche d''emploi IA — skill /search-jobs'
type: 'feature'
created: '2026-03-31'
status: 'done'
baseline_commit: '1795cbfa221613c7cff449604c10d66e4a7bbefe'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** Il n'existe aucun moyen automatisé de trouver des offres d'emploi correspondant à un profil, et le modèle de données ne supporte pas encore les offres.

**Approach :** Ajouter un modèle `JobOffer` en DB, une route API REST pour le créer et le lister, et un skill Claude Code `/search-jobs` qui effectue la recherche web puis persiste les résultats via `POST /api/job-offers`.

## Boundaries & Constraints

**Always :**
- Insérer les offres via `POST /api/job-offers` (l'app doit tourner sur `localhost:3000`).
- Si `--profile <id>` n'est pas fourni, récupérer le profil actif via `GET /api/profiles` et filtrer sur `isActive: true`.
- Afficher en terminal : nombre total d'offres sauvegardées, et si ≤ 10 offres, un entête par offre (titre, entreprise, lieu).
- Le champ `statut` est initialisé à `nouveau` à la création.

**Ask First :**
- Aucun profil actif trouvé → HALT et demander à l'utilisateur de préciser un `--profile <id>`.
- L'app ne répond pas sur `localhost:3000` → HALT avec message explicite.

**Never :**
- Pas de SDK `@anthropic-ai/sdk` ni d'import Anthropic dans le code de l'app.
- Pas d'interface UI dans ce périmètre (c'est l'Objectif 3).
- Pas de déduplication d'offres (déjà noté dans deferred-work.md).
- Ne pas modifier les routes existantes (`/api/profiles/**`).

## I/O & Edge-Case Matrix

| Scénario | Input / État | Comportement attendu | Gestion d'erreur |
|---|---|---|---|
| Recherche nominale | profil actif + critères (lieu, salaire, mots-clés) | Offres trouvées → POST chacune → résumé terminal | N/A |
| Profil ciblé | `--profile <id>` valide + critères | Idem mais associé au profil ciblé | N/A |
| Profil inconnu | `--profile <id>` introuvable en DB | HALT — message "profil <id> introuvable" | Arrêt propre |
| Aucun profil actif | Pas de `--profile`, aucun `isActive=true` | HALT — demander de préciser l'id | Arrêt propre |
| App indisponible | `localhost:3000` ne répond pas | HALT — message "app non disponible, lancez `npm run dev`" | Arrêt propre |
| Aucune offre trouvée | Recherche sans résultat | Message "aucune offre trouvée pour ces critères" | N/A |
| > 10 offres | 11+ offres sauvegardées | Résumé avec count uniquement (pas d'entêtes individuels) | N/A |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` — ajouter modèle `JobOffer` et enum `StatutOffre`
- `prisma/migrations/` — nouvelle migration générée par `prisma migrate dev`
- `src/app/api/job-offers/route.ts` — route `GET` (liste toutes les offres) + `POST` (crée une offre)
- `.claude/skills/search-jobs/SKILL.md` — skill Claude Code `/search-jobs`

## Tasks & Acceptance

**Execution :**
- [x] `prisma/schema.prisma` -- ajouter enum `StatutOffre` (`nouveau`, `vu`, `repondu`, `ignore`) et modèle `JobOffer` (id UUID, profileId FK→Profile onDelete:Cascade, titre, entreprise, salaire_min Int?, salaire_max Int?, lieu, mots_cles String[], description, lien, date_trouvee DateTime @default(now()), statut StatutOffre @default(nouveau)) -- structure de données requise pour les offres
- [ ] Exécuter `npx prisma migrate dev --name add-job-offer` puis `npx prisma generate` -- appliquer le schéma en DB et regénérer le client (**à exécuter avec la DB disponible**)
- [x] `src/app/api/job-offers/route.ts` -- implémenter `GET` (retourne toutes les offres, triées par `date_trouvee` desc, inclut `profile { name }`) et `POST` (valide les champs requis : profileId, titre, entreprise, lieu, lien ; crée l'offre ; retourne 201) -- API REST nécessaire au skill et à l'Objectif 3
- [x] `.claude/skills/search-jobs/SKILL.md` -- écrire le skill : (1) parser `--profile <id>` et critères libres depuis les args, (2) si pas de `--profile` appeler `GET localhost:3000/api/profiles` et trouver le profil `isActive:true`, (3) utiliser `WebSearch` pour chercher des offres correspondant au profil + critères, (4) structurer chaque offre selon le modèle `JobOffer`, (5) `POST localhost:3000/api/job-offers` pour chaque offre, (6) afficher résumé terminal -- skill principal de la fonctionnalité

**Acceptance Criteria :**
- Given l'app tourne et un profil est actif, when `/search-jobs` est lancé avec des critères, then les offres trouvées sont sauvegardées en DB avec `statut=nouveau` et associées au bon profil
- Given plus de 10 offres sauvegardées, when le skill se termine, then seul le count est affiché (pas d'entêtes individuels)
- Given ≤ 10 offres sauvegardées, when le skill se termine, then le count + un entête par offre (titre, entreprise, lieu) sont affichés
- Given `--profile <id>` inconnu, when le skill est lancé, then il s'arrête avec un message d'erreur clair sans insérer en DB
- Given aucun profil actif et pas de `--profile`, when le skill est lancé, then il demande à l'utilisateur de préciser un id

## Design Notes

Le skill Claude Code reçoit les critères de recherche en langage naturel (ex : `/search-jobs développeur TypeScript Paris 50k`). Claude interprète librement les tokens comme lieu, salaire, mots-clés — pas de parsing strict nécessaire.

Pour la recherche web, Claude utilise son outil `WebSearch` natif — aucune dépendance externe.

Les champs `salaire_min` / `salaire_max` sont optionnels car toutes les annonces ne publient pas de fourchette salariale.

## Verification

**Commands :**
- `npx prisma migrate status` -- expected: toutes les migrations appliquées
- `npx prisma validate` -- expected: schéma valide sans erreur
- `npm run build` -- expected: compilation TypeScript sans erreur

**Manual checks :**
- `POST /api/job-offers` avec body valide → réponse 201 + objet créé
- `GET /api/job-offers` → liste les offres avec `profile.name`
- `POST /api/job-offers` sans `titre` → réponse 400

## Spec Change Log

## Suggested Review Order

**Schéma & données**

- Modèle central : enum `StatutOffre` et modèle `JobOffer` avec relation cascade vers `Profile`.
  [`schema.prisma:11`](../../prisma/schema.prisma#L11)

**API REST**

- Point d'entrée principal : validation des champs requis et création de l'offre en DB.
  [`route.ts:36`](../../src/app/api/job-offers/route.ts#L36)

- Filtre de type sur `mots_cles` (patch review) — seuls les strings passent.
  [`route.ts:56`](../../src/app/api/job-offers/route.ts#L56)

- Gestion P2003 : retourne 404 si le profil n'existe pas en DB.
  [`route.ts:66`](../../src/app/api/job-offers/route.ts#L66)

- GET : liste toutes les offres triées par date, incl. `profile.name` pour l'Objectif 3.
  [`route.ts:4`](../../src/app/api/job-offers/route.ts#L4)

**Skill Claude Code**

- Orchestration complète : résolution profil → recherche web → insertion → résumé.
  [`SKILL.md:1`](../../.claude/skills/search-jobs/SKILL.md#L1)

**Correctif types pré-existant**

- `_id` rendu optionnel et champs nullable alignés sur les retours Prisma.
  [`ProfileForm.tsx:6`](../../src/components/profile/ProfileForm.tsx#L6)

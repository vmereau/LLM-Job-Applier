---
title: 'Multi-profils'
type: 'feature'
created: '2026-03-30'
status: 'done'
baseline_commit: '815d2b279d27c0bc8df9b2ca5bc3c36ba69b041e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'application ne gère qu'un seul profil utilisateur (findFirst partout), ce qui empêche d'utiliser des profils distincts pour différents types de postes ciblés.

**Approach:** Ajouter un champ `isActive` au modèle `Profile`, créer de nouvelles routes `/api/profiles` et `/api/profiles/[id]`, une page liste `/profiles`, migrer la page d'édition vers `/profiles/[id]`, et mettre à jour la commande `/import-profile`.

## Boundaries & Constraints

**Always:**
- Un seul profil actif à la fois — l'activation d'un profil désactive tous les autres (transaction atomique)
- Prisma pour toutes les interactions DB ; Next.js App Router uniquement
- Le profil actif est déterminé par `isActive: true` en DB, pas en session/cookie
- La suppression d'un profil actif est autorisée ; aucun profil n'est alors actif
- L'ancien endpoint `/api/profile` est supprimé et remplacé par `/api/profiles`

**Ask First:**
- Si l'utilisateur veut garder `/api/profile` en parallèle pour compatibilité descendante

**Never:**
- Pas d'authentification ni multi-utilisateurs
- Pas de pagination sur la liste des profils (volume faible attendu)
- Pas de duplication de profil (clone)
- Pas de fonctionnalités liées à la recherche d'emploi (Objectif 2)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Liste profils | GET /api/profiles | Array de tous les profils avec `isActive` | 200 + `[]` si aucun |
| Créer profil | POST /api/profiles `{ name }` | Profil créé, `isActive: false` | 400 si `name` manquant |
| Activer profil | PUT /api/profiles/[id]/activate | `isActive: true` sur ce profil, `false` sur tous les autres | 404 si id inconnu |
| Supprimer profil actif | DELETE /api/profiles/[id] (actif) | Profil supprimé, aucun profil n'est actif | 404 si id inconnu |
| Import sans --profile | `/import-profile` sans arg | Nouveau profil créé via POST /api/profiles | Erreur si app inaccessible |
| Import avec --profile id | `/import-profile --profile <id>` | Profil existant mis à jour via PUT /api/profiles/<id> | Erreur si id inconnu |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- Modèle Profile : ajout `isActive Boolean @default(false)`
- `src/app/api/profile/route.ts` -- À supprimer (remplacé par /api/profiles)
- `src/app/api/profiles/route.ts` -- Nouveau : GET liste + POST créer
- `src/app/api/profiles/[id]/route.ts` -- Nouveau : GET détail + PUT update + DELETE
- `src/app/api/profiles/[id]/activate/route.ts` -- Nouveau : PUT activer profil
- `src/app/profile/page.tsx` -- À supprimer (remplacé par /profiles et /profiles/[id])
- `src/app/profiles/page.tsx` -- Nouveau : page liste des profils
- `src/app/profiles/[id]/page.tsx` -- Nouveau : page édition d'un profil
- `src/components/profile/ProfileForm.tsx` -- Mise à jour : prop `profileId`, cible PUT /api/profiles/[id]
- `src/app/layout.tsx` -- Ajout nav avec liens Profils + Accueil
- `src/app/page.tsx` -- Mise à jour lien vers /profiles
- `.claude/commands/import-profile.md` -- Mise à jour : support `--profile <id>`, POST vs PUT

## Tasks & Acceptance

**Execution:**
- [x] `prisma/schema.prisma` -- Ajouter `isActive Boolean @default(false)` au modèle Profile ; créer migration `npx prisma migrate dev --name add-profile-is-active`
- [x] `src/app/api/profile/route.ts` -- Supprimer le fichier (et son dossier `api/profile/`)
- [x] `src/app/api/profiles/route.ts` -- GET : retourne tous les profils (`findMany` avec experiences+education) ; POST : crée un profil avec `{ name, email?, ..., isActive: false }`, valide `name` requis
- [x] `src/app/api/profiles/[id]/route.ts` -- GET : findUnique par id avec relations ; PUT : update le profil (delete+recreate relations comme l'ancien PUT) ; DELETE : deleteUnique par id (cascade gère relations)
- [x] `src/app/api/profiles/[id]/activate/route.ts` -- PUT : transaction atomique — `updateMany({ isActive: false })` puis `update({ id, isActive: true })` ; retourne le profil activé
- [x] `src/app/profile/page.tsx` -- Supprimer le fichier (et son dossier `app/profile/`)
- [x] `src/app/profiles/page.tsx` -- Server component : fetch Prisma direct ; liste les profils sous forme de cartes (nom, titre, badge "Actif" si isActive) avec bouton "Modifier" (→ /profiles/[id]) et bouton "Activer" (appel PUT /api/profiles/[id]/activate côté client via ProfileList) ; bouton "Nouveau profil" redirige vers /profiles/new
- [x] `src/app/profiles/[id]/page.tsx` -- Server component : fetch Prisma direct ; affiche ProfileForm pré-rempli ; notFound() si profil introuvable
- [x] `src/app/profiles/new/page.tsx` -- Page création : affiche ProfileForm vide, soumission POST /api/profiles puis redirect vers /profiles
- [x] `src/components/profile/ProfileForm.tsx` -- Ajouter prop `profileId: string | null` ; si null → POST /api/profiles (création), sinon → PUT /api/profiles/[profileId] (update) ; après succès création, `router.push('/profiles')`
- [x] `src/components/profile/ProfileList.tsx` -- Nouveau composant client : liste les profils, gère activate (router.refresh()), lien Modifier
- [x] `src/app/layout.tsx` -- Ajouter une `<nav>` simple avec liens : "LLM Job Applier" (/) et "Profils" (/profiles)
- [x] `src/app/page.tsx` -- Mettre à jour le bouton/lien vers /profiles
- [x] `.claude/commands/import-profile.md` -- Parser `$ARGUMENTS` pour extraire `--profile <id>` ; si présent → PUT /api/profiles/<id> ; sinon → POST /api/profiles (crée un nouveau profil) ; afficher l'id du profil créé/mis à jour dans la confirmation

**Acceptance Criteria:**
- Given la page /profiles, when aucun profil n'existe, then la liste est vide et le bouton "Nouveau profil" est visible
- Given plusieurs profils, when "Activer" est cliqué sur un profil non-actif, then ce profil affiche le badge "Actif" et l'ancien profil actif ne l'affiche plus
- Given la page /profiles/[id], when le formulaire est modifié et sauvegardé, then PUT /api/profiles/[id] persiste les changements
- Given /profiles/new, when le formulaire est soumis, then un nouveau profil est créé et l'utilisateur est redirigé vers /profiles
- Given la commande /import-profile sans argument, when exécutée, then un nouveau profil est créé via POST /api/profiles
- Given la commande /import-profile --profile <id>, when exécutée, then le profil existant est mis à jour via PUT /api/profiles/<id>

## Spec Change Log

## Design Notes

**Activation atomique :** `prisma.$transaction([updateMany({ isActive: false }), update({ id, isActive: true })])` garantit qu'un seul profil est actif même en cas de requêtes concurrentes.

**ProfileForm création vs édition :** `profileId === null` → POST + redirect. `profileId !== null` → PUT in-place. Évite de dupliquer le composant formulaire.

## Verification

**Commands:**
- `npx prisma migrate dev --name add-profile-is-active` -- expected: migration appliquée sans erreur
- `curl http://localhost:3000/api/profiles` -- expected: `[]` ou array de profils JSON
- `curl -X POST http://localhost:3000/api/profiles -H "Content-Type: application/json" -d '{"name":"Test"}'` -- expected: profil créé avec `isActive: false`
- `curl -X PUT http://localhost:3000/api/profiles/<id>/activate` -- expected: profil avec `isActive: true`

## Suggested Review Order

**Schéma & Migration**

- Seul champ ajouté : `isActive Boolean @default(false)` — ancre du système multi-profils.
  [`schema.prisma:21`](../../prisma/schema.prisma#L21)

**Activation atomique**

- Transaction : updateMany sans where → false, puis update ciblé → true ; findUnique dans try/catch.
  [`activate/route.ts:1`](../../src/app/api/profiles/[id]/activate/route.ts#L1)

**API CRUD Profils**

- Routes GET/POST : liste paginée non requise + création avec isActive=false forcé.
  [`profiles/route.ts:1`](../../src/app/api/profiles/route.ts#L1)

- Routes GET/PUT/DELETE par id : findUnique dans try/catch pour éviter 500 non catchés.
  [`[id]/route.ts:23`](../../src/app/api/profiles/[id]/route.ts#L23)

**UI — Liste & Interaction**

- ProfileList client : activate vérifie response.ok, affiche erreur si échec, sinon router.refresh().
  [`ProfileList.tsx:24`](../../src/components/profile/ProfileList.tsx#L24)

- Page liste : server component Prisma direct, délègue interactions à ProfileList.
  [`profiles/page.tsx:1`](../../src/app/profiles/page.tsx#L1)

**UI — Formulaire unifié création/édition**

- ProfileForm : profileId null → POST + redirect /profiles ; non-null → PUT in-place.
  [`ProfileForm.tsx:132`](../../src/components/profile/ProfileForm.tsx#L132)

- Page édition : notFound() si profil introuvable ; passe profileId au formulaire.
  [`profiles/[id]/page.tsx:1`](../../src/app/profiles/[id]/page.tsx#L1)

- Page création : ProfileForm avec profileId={null}.
  [`profiles/new/page.tsx:1`](../../src/app/profiles/new/page.tsx#L1)

**Navigation & Commande**

- Layout : nav simple avec lien /profiles global.
  [`layout.tsx:10`](../../src/app/layout.tsx#L10)

- Import command : parse --profile <id>, POST si absent / PUT si présent.
  [`import-profile.md:1`](../../.claude/commands/import-profile.md#L1)

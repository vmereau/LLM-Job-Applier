---
title: 'Lettre de motivation IA'
type: 'feature'
created: '2026-03-31'
status: 'done'
baseline_commit: 'ddec0ed8abe28009e9d69a0a928bcf3dc9fe5c64'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les offres d'emploi n'ont aucun outil pour préparer une candidature — l'utilisateur doit rédiger sa lettre de motivation manuellement sans lien avec son profil.

**Approach:** Ajouter un champ `lettreMotivation` à `JobOffer`, un skill Claude `/generate-cover-letter` qui génère la lettre via l'IA en combinant l'offre et le profil complet, et une section dans la page détail pour afficher, éditer et télécharger la lettre en PDF.

## Boundaries & Constraints

**Always:**
- Commandes Prisma via `docker compose exec app npx prisma ...`
- Stack existante : Next.js 15 App Router, Tailwind CSS, Prisma, PostgreSQL
- Le skill Claude accède à l'app via `http://localhost:3000`
- La génération de PDF se fait côté client (browser) avec `jspdf`
- Cohérence visuelle avec les sections existantes de `JobOfferDetail.tsx` (cartes blanches, Tailwind)

**Ask First:**
- Si la migration est destructive (renommage ou suppression de colonne)

**Never:**
- SDK Anthropic embarqué dans l'application Next.js
- Génération PDF côté serveur
- Nouvel endpoint dédié — utiliser le PATCH existant `/api/job-offers/[id]`

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Génération skill — succès | Offer ID valide, profil existant | Lettre générée et sauvegardée via PATCH, visible dans l'UI | — |
| Génération skill — offre introuvable | Offer ID inexistant | Message d'erreur clair dans le terminal | Arrêter le skill |
| Édition manuelle | Utilisateur modifie le textarea | Bouton Sauvegarder actif ; PATCH déclenché au clic | Afficher erreur si PATCH échoue |
| Téléchargement PDF | Lettre non vide | Fichier PDF téléchargé : `lettre-{entreprise}.pdf` | Bouton désactivé si lettre vide |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- modèle `JobOffer` — ajouter `lettreMotivation String?`
- `prisma/migrations/` -- migration `add_lettre_motivation`
- `src/app/api/job-offers/[id]/route.ts` -- PATCH handler à étendre pour `lettreMotivation`
- `src/components/job-offers/JobOfferDetail.tsx` -- composant client principal (section lettre)
- `src/app/job-offers/[id]/page.tsx` -- server component (transfère `lettreMotivation` au composant)
- `.claude/skills/generate-cover-letter/SKILL.md` -- skill Claude de génération

## Tasks & Acceptance

**Execution:**
- [x] `prisma/schema.prisma` -- ajouter `lettreMotivation String?` au modèle `JobOffer`
- [x] migration -- exécuter `docker compose exec app npx prisma migrate dev --name add-lettre-motivation`
- [x] `src/app/api/job-offers/[id]/route.ts` -- étendre le PATCH pour accepter `lettreMotivation` (string ou null), même pattern que `notes`
- [x] installer jspdf -- `docker compose exec app npm install jspdf` + `docker compose exec app npm install --save-dev @types/jspdf` si nécessaire
- [x] `src/components/job-offers/JobOfferDetail.tsx` -- ajouter section "Lettre de motivation" : affichage de la lettre existante, textarea éditable, bouton Sauvegarder (PATCH), bouton "Télécharger PDF" (import dynamique jspdf, désactivé si lettre vide)
- [x] `.claude/skills/generate-cover-letter/SKILL.md` -- créer le skill : accepte `[offer-id]`, GET offre, GET profil complet, génère la lettre (texte brut, style formel français), PATCH pour sauvegarder, affiche confirmation

**Acceptance Criteria:**
- Given une offre existante, when `/generate-cover-letter [id]` est exécuté, then une lettre est générée et sauvegardée, visible dans la page détail de l'offre
- Given une offre introuvable, when `/generate-cover-letter [id-inexistant]` est exécuté, then le skill affiche une erreur claire et s'arrête
- Given une page détail d'offre, when la lettre est sauvegardée, then elle s'affiche dans la section dédiée au chargement de la page
- Given une lettre affichée, when l'utilisateur clique "Télécharger PDF", then un fichier `lettre-{entreprise}.pdf` est téléchargé avec le contenu complet
- Given une lettre modifiée dans le textarea, when l'utilisateur clique Sauvegarder, then la modification est persistée (confirmée par rechargement de page)

## Design Notes

**Format de la lettre générée :**
Texte brut (pas de markdown), structure classique : lieu/date en haut à droite, objet centré, introduction, corps (2–3 paragraphes reliant profil et offre), conclusion avec formule de politesse et signature (prénom + nom du profil). Les paragraphes séparés par une ligne vide.

**PDF côté client :**
Import dynamique dans le handler du bouton (`await import('jspdf')`). Texte multi-lignes via `doc.splitTextToSize(text, 170)`. Police : Helvetica 11pt. Marges 20mm. Nom fichier : `lettre-{entreprise.toLowerCase().replace(/\s+/g, '-')}.pdf`.

## Verification

**Commands:**
- `docker compose exec app npx tsc --noEmit` -- expected: aucune erreur TypeScript
- `docker compose exec app npx prisma migrate status` -- expected: toutes les migrations appliquées

**Manual checks:**
- Ouvrir une page détail → section "Lettre de motivation" présente (vide si non générée)
- Exécuter `/generate-cover-letter [id]` → lettre sauvegardée, section affiche la lettre sans action manuelle
- Cliquer "Télécharger PDF" → PDF correct téléchargé ; bouton inactif si lettre absente
- Modifier la lettre → Sauvegarder → F5 → modification persistée

## Suggested Review Order

**Schéma & persistance**

- Nouveau champ nullable — migration additive, aucun risque de régression.
  [`schema.prisma:47`](../../prisma/schema.prisma#L47)

- Migration SQL générée par Prisma.
  [`migration.sql:1`](../../prisma/migrations/20260331210512_add_lettre_motivation/migration.sql#L1)

**API**

- Extension du PATCH : `lettreMotivation` accepté, même pattern que `notes`.
  [`route.ts:38`](../../src/app/api/job-offers/%5Bid%5D/route.ts#L38)

**UI — logique principale**

- Section lettre : textarea, Sauvegarder, Télécharger PDF — point d'entrée de la feature côté client.
  [`JobOfferDetail.tsx:251`](../../src/components/job-offers/JobOfferDetail.tsx#L251)

- handleSaveLettre : PATCH + re-sync état local depuis la réponse serveur.
  [`JobOfferDetail.tsx:98`](../../src/components/job-offers/JobOfferDetail.tsx#L98)

- handleDownloadPdf : import dynamique jspdf, pagination, sanitisation du nom de fichier.
  [`JobOfferDetail.tsx:114`](../../src/components/job-offers/JobOfferDetail.tsx#L114)

**Skill Claude**

- Workflow complet de génération : fetch offre → fetch profil → génère lettre → PATCH → confirmation.
  [`SKILL.md:1`](../../.claude/skills/generate-cover-letter/SKILL.md#L1)

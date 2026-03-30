# Deferred Work — LLM-Job-Applier

_Généré le 2026-03-30. Ces objectifs seront traités dans des sprints ultérieurs._

---

## Findings de review — à traiter ultérieurement (prototype local)

- **Dockerfile dev CMD** : `CMD ["npm", "run", "dev"]` — acceptable pour prototype local, à remplacer par multi-stage build + `npm start` avant tout déploiement.
- **No non-root user** : le container tourne en root — acceptable pour dev local.
- **Source tree monté complet** : `./:/app` expose `.env.local` et `.git` dans le container — pattern dev uniquement.
- **Credentials postgres hardcodés** : `POSTGRES_PASSWORD: postgres` en clair dans `docker-compose.yml` — à externaliser avant tout déploiement.
- **Port postgres exposé sur toutes interfaces** : `5432:5432` → à restreindre (`127.0.0.1:5432:5432`) ou supprimer si l'accès direct depuis l'hôte n'est pas nécessaire.
- **Prisma direct dans page.tsx** : `prisma.profile.findFirst()` appelé directement dans le Server Component — duplication par rapport à l'API route, à refactoriser via une couche service si l'auth est ajoutée.
- **Déduplication skills/langues** : pas de vérification de doublon lors de l'ajout d'une compétence ou langue.

---

## Objectif 2 — Recherche d'emploi IA

**Description :** Commande Claude qui parcourt le web en fonction du profil utilisateur et de critères spécifiques (lieu, salaire, mots-clés). Trouve des offres d'emploi correspondantes et les enregistre en base de données PostgreSQL.

**Structure d'une offre d'emploi :**
- id (UUID)
- titre
- entreprise
- salaire (min/max)
- lieu
- mots_cles (array)
- description
- lien (URL de l'annonce)
- date_trouvee
- statut (nouveau, vu, répondu, ignoré)

**Dépendance :** Objectif 1 (infra + profil) complété.

---

## Objectif 3 — Interface offres d'emploi

**Description :** Page liste affichant les offres trouvées avec tri et filtre selon la structure définie (titre, entreprise, salaire, lieu, mots-clés, statut). Page détail par offre avec :
- Toggle "J'ai répondu à cette annonce"
- Espace de notes libres lié à l'annonce

**Dépendance :** Objectifs 1 et 2 complétés.

---

## Objectif 4 — Lettre de motivation IA

**Description :** Commande Claude qui récupère une offre spécifique en BDD et génère une lettre de motivation adaptée au profil utilisateur. La lettre s'affiche dans la page dédiée à l'annonce, est éditable dans l'interface, et téléchargeable au format PDF.

**Dépendance :** Objectifs 1, 2 et 3 complétés.

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

## Objectif 1b — Multi-profils

**Description :** Évolution de la gestion du profil vers un système multi-profils. L'utilisateur peut créer, nommer et gérer plusieurs profils distincts (ex : "Profil Dev Backend", "Profil Data Scientist"). Un sélecteur de profil actif est présent dans la navigation.

**Changements par rapport à l'Objectif 1 :**
- Schéma : `Profile` passe de mono à multi — supprimer la contrainte de profil unique, ajouter un champ `isActive Boolean @default(false)` ou gérer la sélection via une table de préférence utilisateur.
- API : `GET /api/profile` → `GET /api/profiles` (liste) + `GET /api/profiles/[id]` (détail) ; `PUT /api/profiles/[id]` ; `POST /api/profiles` (créer) ; `DELETE /api/profiles/[id]`.
- API : `PUT /api/profiles/[id]/activate` — marque un profil comme actif (un seul à la fois).
- UI : page `/profiles` liste tous les profils avec bouton "Activer" et bouton "Éditer" ; le profil actif est mis en évidence.
- Commande `/import-profile` : accepte un argument `--profile <id>` optionnel pour cibler un profil existant ; sans argument, crée un nouveau profil.
- Migration Prisma : `prisma migrate dev` pour passer du schéma mono au schéma multi.

**Dépendance :** Objectif 1 complété.

---

## Objectif 2 — Recherche d'emploi IA

**Description :** Commande Claude qui parcourt le web en fonction d'un profil sélectionné et de critères spécifiques (lieu, salaire, mots-clés). Trouve des offres d'emploi correspondantes et les enregistre en base de données PostgreSQL, associées au profil ayant lancé la recherche.

**Structure d'une offre d'emploi :**
- id (UUID)
- profileId (FK → Profile — profil ayant généré cette recherche)
- titre
- entreprise
- salaire (min/max)
- lieu
- mots_cles (array)
- description
- lien (URL de l'annonce)
- date_trouvee
- statut (nouveau, vu, répondu, ignoré)

**Commande `/search-jobs` :** accepte un argument `--profile <id>` (ou utilise le profil actif par défaut) + critères libres (lieu, salaire, mots-clés). Retourne les offres trouvées et les sauvegarde en DB liées au profil.

**Dépendance :** Objectifs 1 et 1b complétés.

---

## Objectif 3 — Interface offres d'emploi

**Description :** Page liste affichant les offres trouvées avec tri et filtre selon la structure définie (titre, entreprise, salaire, lieu, mots-clés, statut). Filtre supplémentaire par profil (afficher les offres d'un profil spécifique ou de tous les profils). Page détail par offre avec :
- Toggle "J'ai répondu à cette annonce"
- Espace de notes libres lié à l'annonce
- Indication du profil associé à l'offre

**Dépendance :** Objectifs 1, 1b et 2 complétés.

---

## Objectif 4 — Lettre de motivation IA

**Description :** Commande Claude qui récupère une offre spécifique en BDD et génère une lettre de motivation adaptée au profil associé à cette offre (ou au profil actif si différent). La lettre s'affiche dans la page dédiée à l'annonce, est éditable dans l'interface, et téléchargeable au format PDF.

**Dépendance :** Objectifs 1, 1b, 2 et 3 complétés.

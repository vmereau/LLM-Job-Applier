# Skill : /search-jobs

Recherche des offres d'emploi sur le web en fonction d'un profil utilisateur et de critères libres, puis les sauvegarde en base de données via l'API REST de l'application.

## Déclenchement

Ce skill est invoqué par la commande `/search-jobs` suivie de critères libres en langage naturel.

Exemples :
```
/search-jobs développeur TypeScript Paris 50k
/search-jobs --profile abc-123 data scientist remote 60k-80k
/search-jobs ingénieur backend Node.js Lyon CDI
```

## Étape 1 — Vérifier que l'app est disponible

Faire un `GET http://localhost:3000/api/profiles` (sans suivre de redirect).

- Si la requête échoue ou timeout → **HALT** : afficher "L'application n'est pas disponible sur localhost:3000. Lancez `npm run dev` ou `docker compose up -d` avant de relancer cette commande."
- Si succès → continuer.

## Étape 2 — Résoudre le profil cible

**Si `--profile <id>` est présent dans les arguments :**
- Faire `GET http://localhost:3000/api/profiles/<id>`.
- Si 404 ou erreur → **HALT** : afficher "Profil <id> introuvable."
- Sinon → utiliser ce profil.

**Sinon :**
- Utiliser la réponse de l'étape 1 (`GET /api/profiles`).
- Trouver le profil où `isActive === true`.
- Si aucun profil actif → **HALT** : afficher "Aucun profil actif trouvé. Activez un profil depuis /profiles ou précisez `--profile <id>`."
- Sinon → utiliser ce profil.

## Étape 3 — Extraire les critères de recherche

À partir des arguments passés au skill (hors `--profile <id>`), identifier librement :
- **Mots-clés / métier** (ex : "développeur TypeScript", "data scientist")
- **Lieu** (ex : "Paris", "Lyon", "remote", "télétravail")
- **Salaire** (ex : "50k", "60k-80k", "45000€")
- Tout autre critère pertinent

Pas de parsing strict — interpréter en langage naturel.

## Étape 4 — Recherche web

Objectif : collecter entre 5 et 15 offres pertinentes en deux phases ordonnées. Pour chaque offre, extraire :
- `titre` — intitulé du poste
- `entreprise` — nom de l'entreprise
- `lieu` — localisation
- `description` — résumé de l'annonce (2-4 phrases)
- `lien` — URL de l'annonce
- `mots_cles` — tableau de mots-clés pertinents extraits de l'annonce
- `salaire_min` / `salaire_max` — en euros annuels bruts (entiers), si mentionnés ; sinon omettre

### Phase 4a — Pages carrières des entreprises (priorité)

**4a.1 — Identifier les entreprises cibles**

Utiliser `WebSearch` pour identifier les entreprises connues pour recruter sur ce métier/secteur. Requête suggérée :
- `entreprises qui recrutent <métier> <lieu> <année courante>`
- `top entreprises <secteur> France recrutement <métier>`

Constituer une liste de 5 à 10 entreprises pertinentes.

**4a.2 — Chercher directement sur leurs pages carrières**

Pour chaque entreprise identifiée, chercher les offres sur leur site propre. Requêtes suggérées :
- `site:<domaine-entreprise> <métier> <lieu>` (ex: `site:datadog.com software engineer`)
- `<entreprise> careers <métier> <lieu>`
- `<entreprise> /jobs OR /careers OR /recrutement <métier>`

Utiliser `WebFetch` si une URL de page carrière est trouvée pour extraire les offres directement depuis la source.

Collecter toutes les offres trouvées sur les sites des entreprises.

### Phase 4b — Jobboards (complément)

Si le total d'offres collectées en phase 4a est inférieur à 5, compléter avec les jobboards. Requêtes suggérées :
- `offres emploi <métier> <lieu> site:welcometothejungle.com`
- `offres emploi <métier> <lieu> site:linkedin.com/jobs`
- `offres emploi <métier> <lieu> site:indeed.fr`
- `<métier> <lieu> CDI OR CDD recrutement <année courante>`

Éviter les doublons avec les offres déjà trouvées en phase 4a (même entreprise + même poste).

## Étape 4c — Normaliser le texte extrait

Avant de sauvegarder, corriger les problèmes d'encodage dus aux pages en ISO-8859-1 :

- Si du texte contient le caractère de remplacement Unicode `U+FFFD` (affiché `?` ou `<?>` ou `â€`) → reconstruire les mots corrects à partir du contexte français.
  - Exemples : `D<?>veloppeur` → `Développeur`, `ingâ€<?>nieur` → `ingénieur`, `rÃ©` → `ré`
- Appliquer cette correction à tous les champs : `titre`, `entreprise`, `lieu`, `description`, `mots_cles`.
- En cas de doute sur un caractère, préférer la version française la plus probable.

## Étape 5 — Sauvegarder les offres

Pour chaque offre collectée, faire :

```
POST http://localhost:3000/api/job-offers
Content-Type: application/json

{
  "profileId": "<id du profil résolu à l'étape 2>",
  "titre": "...",
  "entreprise": "...",
  "lieu": "...",
  "description": "...",
  "lien": "...",
  "mots_cles": [...],
  "salaire_min": 50000,   // optionnel
  "salaire_max": 65000    // optionnel
}
```

Si une requête POST échoue (status != 201), noter l'erreur mais continuer avec les offres suivantes.

## Étape 6 — Afficher le résumé

Calculer `n` = nombre d'offres sauvegardées avec succès.

**Si n = 0 :**
```
Aucune offre trouvée pour ces critères.
```

**Si 1 ≤ n ≤ 10 :**
```
<n> offre(s) sauvegardée(s) pour le profil "<nom du profil>".

1. <titre> — <entreprise> (<lieu>)
2. <titre> — <entreprise> (<lieu>)
...
```

**Si n > 10 :**
```
<n> offres sauvegardées pour le profil "<nom du profil>".
```

Si des erreurs d'insertion se sont produites, les mentionner brièvement à la fin.

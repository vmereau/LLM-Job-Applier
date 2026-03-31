# Skill : /generate-cover-letter

Génère une lettre de motivation en français à partir d'une offre d'emploi et du profil associé, puis la sauvegarde via l'API de l'application.

## Déclenchement

Ce skill est invoqué par la commande `/generate-cover-letter` suivie de l'identifiant de l'offre.

Exemples :
```
/generate-cover-letter abc-123
/generate-cover-letter 550e8400-e29b-41d4-a716-446655440000
```

## Étape 1 — Récupérer l'offre d'emploi

Faire un `GET http://localhost:3000/api/job-offers/{id}` où `{id}` est l'argument passé au skill.

- Si la réponse est 404 ou une erreur → **HALT** : afficher "Offre `{id}` introuvable. Vérifiez l'identifiant et réessayez."
- Si succès → extraire `jobOffer` de la réponse (contient `titre`, `entreprise`, `lieu`, `description`, `mots_cles`, `salaire_min`, `salaire_max`, et `profile.id` / `profile.name`).

## Étape 2 — Récupérer le profil complet

Faire un `GET http://localhost:3000/api/profiles/{profileId}` où `{profileId}` est `jobOffer.profile.id`.

- Si erreur → **HALT** : afficher "Impossible de récupérer le profil associé à l'offre."
- Si succès → extraire `profile` de la réponse (contient `name`, `title`, `email`, `phone`, `location`, `summary`, `skills`, `languages`, `experiences`, `education`).

## Étape 3 — Générer la lettre de motivation

Générer une lettre de motivation en **texte brut** (pas de markdown, pas de `**`, pas de `#`), style formel français, en combinant les données de l'offre et du profil.

### Structure obligatoire :

```
{profile.location ou 'France'}, le {date du jour en format "D MMMM YYYY" français, ex: "31 mars 2026"}

{profile.name}
{profile.title ou ''}
{profile.email ou ''}
{profile.phone ou ''}


Objet : Candidature au poste de {titre} — {entreprise}


Madame, Monsieur,

[Paragraphe d'introduction : exprimer l'intérêt pour le poste et l'entreprise, en s'appuyant sur le résumé du profil (profile.summary) et le contexte de l'offre (entreprise, lieu, secteur)]

[Paragraphe 1 : relier les compétences clés du profil (profile.skills) aux exigences de l'offre (mots_cles, description)]

[Paragraphe 2 : mettre en valeur une ou deux expériences pertinentes (profile.experiences) en lien avec le poste]

[Paragraphe de conclusion : exprimer la motivation à rejoindre l'équipe, disponibilité pour un entretien]

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{profile.name}
```

### Règles de génération :
- Paragraphes séparés par une ligne vide
- Ton formel, à la première personne du singulier
- Adapter le contenu au secteur et au type de poste de l'offre
- Si une information du profil est absente (ex: pas de title, pas de phone), l'omettre silencieusement
- Longueur : environ 300–450 mots

## Étape 4 — Sauvegarder la lettre

Faire un PATCH pour persister la lettre générée :

```
PATCH http://localhost:3000/api/job-offers/{id}
Content-Type: application/json

{ "lettreMotivation": "..." }
```

- Si la requête échoue → afficher "Erreur lors de la sauvegarde : {message d'erreur}" mais continuer.
- Si succès → continuer.

## Étape 5 — Afficher la confirmation

```
✓ Lettre générée et sauvegardée pour l'offre {titre} — {entreprise}
```

Puis afficher les 3 premières lignes de la lettre générée comme aperçu, suivies de "…".

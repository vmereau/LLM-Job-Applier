# Commande : Import Profil

Importe un profil professionnel depuis un fichier PDF ou une URL LinkedIn et le sauvegarde en base de données.

## Arguments

`$ARGUMENTS` peut contenir :
- Un chemin vers un fichier PDF (ex: `./mon-cv.pdf` ou `/Users/.../cv.pdf`)
- Une URL LinkedIn (ex: `https://www.linkedin.com/in/prenom-nom/`)
- Un flag `--profile <id>` optionnel pour cibler un profil existant

### Exemples

```
/import-profile ./cv.pdf
/import-profile https://www.linkedin.com/in/prenom-nom/
/import-profile ./cv.pdf --profile abc123
```

## Instructions

1. **Parse les arguments** depuis `$ARGUMENTS` :
   - Cherche `--profile <id>` dans les arguments. Si présent, extrais l'id et retire cette partie de la chaîne pour obtenir la source.
   - La source est soit un chemin PDF, soit une URL LinkedIn.
   - `profileId` = l'id extrait (ou `null` si absent).

2. **Détermine le type d'entrée** à partir de la source :
   - Si c'est un chemin de fichier PDF → lis le fichier avec l'outil Read
   - Si c'est une URL LinkedIn → utilise WebFetch pour récupérer le contenu de la page

3. **Extrais les informations professionnelles** du contenu obtenu. Construis un objet JSON avec exactement cette structure (utilise `null` ou omets les champs optionnels absents, utilise `[]` pour les tableaux vides) :

```json
{
  "name": "Prénom Nom",
  "email": "email@example.com",
  "phone": "+33 6 00 00 00 00",
  "location": "Paris, France",
  "title": "Développeur Full Stack",
  "summary": "Résumé du profil professionnel...",
  "skills": ["JavaScript", "React", "Node.js"],
  "languages": ["Français (natif)", "Anglais (C1)"],
  "linkedinUrl": "https://www.linkedin.com/in/prenom-nom/",
  "experiences": [
    {
      "company": "Nom de l'entreprise",
      "role": "Titre du poste",
      "location": "Paris",
      "startDate": "2022-03",
      "endDate": "Présent",
      "description": "Description des responsabilités..."
    }
  ],
  "education": [
    {
      "institution": "Nom de l'établissement",
      "degree": "Master",
      "field": "Informatique",
      "startDate": "2018",
      "endDate": "2020",
      "description": ""
    }
  ]
}
```

4. **Sauvegarde en base de données** en écrivant d'abord le JSON dans un fichier temporaire, puis en l'envoyant via curl :

```bash
# Écrire le JSON dans un fichier temporaire
cat > /tmp/profile_import.json << 'EOF'
<JSON_EXTRAIT>
EOF
```

- **Si `--profile <id>` était présent** (mise à jour d'un profil existant) :
```bash
curl -s -X PUT http://localhost:3000/api/profiles/<id> \
  -H "Content-Type: application/json" \
  -d @/tmp/profile_import.json
```

- **Sans `--profile`** (création d'un nouveau profil) :
```bash
curl -s -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d @/tmp/profile_import.json
```

Remplace `<JSON_EXTRAIT>` et `<id>` par les valeurs appropriées.

5. **Confirme** en affichant un résumé des données sauvegardées :
   - Nom, titre, email
   - Nombre de compétences, expériences, formations importées
   - Id du profil créé ou mis à jour
   - Message de succès ou d'erreur selon la réponse du curl

## En cas d'échec

- Si le fichier PDF n'existe pas : indique le chemin problématique et demande à l'utilisateur de vérifier
- Si l'URL LinkedIn est inaccessible (login requis, page vide) : demande si l'utilisateur préfère fournir un export LinkedIn (CSV/JSON) ou coller manuellement le texte de son profil
- Si le curl échoue avec une erreur 404 et que `--profile` était spécifié : l'id du profil est introuvable, lister les profils disponibles avec `curl http://localhost:3000/api/profiles`
- Si le curl échoue (app non démarrée) : rappelle de lancer `docker compose up` ou `npm run dev` avant

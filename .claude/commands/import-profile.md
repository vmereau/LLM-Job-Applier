# Commande : Import Profil

Importe un profil professionnel depuis un fichier PDF ou une URL LinkedIn et le sauvegarde en base de données.

## Argument

`$ARGUMENTS` contient soit :
- Un chemin vers un fichier PDF (ex: `./mon-cv.pdf` ou `/Users/.../cv.pdf`)
- Une URL LinkedIn (ex: `https://www.linkedin.com/in/prenom-nom/`)

## Instructions

1. **Détermine le type d'entrée** à partir de `$ARGUMENTS` :
   - Si c'est un chemin de fichier PDF → lis le fichier avec l'outil Read
   - Si c'est une URL LinkedIn → utilise WebFetch pour récupérer le contenu de la page

2. **Extrais les informations professionnelles** du contenu obtenu. Construis un objet JSON avec exactement cette structure (utilise `null` ou omets les champs optionnels absents, utilise `[]` pour les tableaux vides) :

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

3. **Sauvegarde en base de données** en écrivant d'abord le JSON dans un fichier temporaire, puis en l'envoyant via curl (évite les problèmes d'échappement bash) :

```bash
# Écrire le JSON dans un fichier temporaire
cat > /tmp/profile_import.json << 'EOF'
<JSON_EXTRAIT>
EOF

# Envoyer à l'API
curl -s -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d @/tmp/profile_import.json
```

Remplace `<JSON_EXTRAIT>` par le JSON complet que tu as construit (sur plusieurs lignes, entre les marqueurs EOF).

4. **Confirme** en affichant un résumé des données sauvegardées :
   - Nom, titre, email
   - Nombre de compétences, expériences, formations importées
   - Message de succès ou d'erreur selon la réponse du curl

## En cas d'échec

- Si le fichier PDF n'existe pas : indique le chemin problématique et demande à l'utilisateur de vérifier
- Si l'URL LinkedIn est inaccessible (login requis, page vide) : demande si l'utilisateur préfère fournir un export LinkedIn (CSV/JSON) ou coller manuellement le texte de son profil
- Si le curl échoue (app non démarrée) : rappelle de lancer `docker compose up` ou `npm run dev` avant

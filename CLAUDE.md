# CLAUDE.md

## Déploiement

Ce projet tourne entièrement dans **Docker**. Ne jamais exécuter de commandes directement sur la machine hôte.

### Démarrage

```bash
docker compose up
```

### Commandes projet (Prisma, migrations, etc.)

Toujours passer par le conteneur `app` :

```bash
# Pousser le schéma Prisma
docker compose exec app npx prisma db push

# Générer le client Prisma
docker compose exec app npx prisma generate

# Créer une migration
docker compose exec app npx prisma migrate dev --name <nom>

# Appliquer les migrations en prod
docker compose exec app npx prisma migrate deploy

# Ouvrir Prisma Studio
docker compose exec app npx prisma studio

# Installer des dépendances npm
docker compose exec app npm install <package>

# Lancer un script npm
docker compose exec app npm run <script>
```

> **Règle** : toute opération relative au projet (Prisma, npm, scripts) doit être exécutée via `docker compose exec app <commande>`, jamais directement sur l'hôte.

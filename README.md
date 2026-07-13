# Retro Coop

Application Next.js consacrée à 371 jeux Mega Drive / Genesis multijoueurs vérifiés. Le frontend, les routes API et l’authentification sont servis par la même application. Les comptes, les sessions de jeu et leurs participants sont persistés exclusivement dans PostgreSQL via Prisma ; les jaquettes, captures et métadonnées publiques du catalogue sont des fichiers statiques versionnés.

## Démarrage local

Prérequis : Node.js 22, Docker et npm.

```powershell
Copy-Item .env.example .env
docker compose up -d db
npm ci
npx prisma generate
npm run db:deploy
npm run db:seed
npm run dev
```

La base locale écoute sur `localhost:5434`. `DATABASE_URL` et `DIRECT_URL` utilisent la même URL locale. Remplacer `AUTH_SECRET` par une valeur longue et aléatoire. Le seed catalogue fait des `upsert` et ne vide ni les utilisateurs ni les sessions ; il ne doit pas être lancé automatiquement à chaque déploiement.

En production, le cookie de connexion est `httpOnly`, `Secure` et `SameSite=Lax`. En HTTP local, seul `Secure` est désactivé. Le frontend et les API restent same-origin, sans CORS global.

## Validation locale

```powershell
docker compose up -d db
npx prisma generate
npm run db:deploy
npm run db:seed
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

`GET /api/health` exécute une requête PostgreSQL et renvoie `200` avec `{"status":"ok","database":"connected"}` si la base répond. Il ne révèle aucune chaîne de connexion.

## Médias et métadonnées

Les jaquettes sont dans `public/covers/` et les captures dans `public/gameplay/`. Elles ne sont jamais téléchargées au runtime et reçoivent un cache navigateur immutable d’un an. Les commandes de métadonnées ne récupèrent et ne génèrent plus de descriptions de jeux ; la colonne SQL facultative est temporairement conservée pour éviter une migration destructive.

```powershell
npm run covers:report
npm run media:validate-images
npm run media:final-report
npm run metadata:audit
```

## Publier Retro Coop gratuitement avec Render et Neon

### A. Créer la base Neon

1. Créer un compte et un projet PostgreSQL gratuit sur Neon, dans une région proche de Frankfurt.
2. Dans le tableau de bord Neon, copier la chaîne poolée (nom d’hôte contenant généralement `-pooler`) dans `DATABASE_URL`.
3. Copier la chaîne directe, sans pooler, dans `DIRECT_URL`. Prisma l’utilise pour les migrations.
4. Conserver ces deux URL comme secrets. Ne jamais les écrire dans Git, `render.yaml` ou une capture publique.
5. Conserver le mode SSL demandé par Neon, généralement `sslmode=require` ou la valeur fournie telle quelle.

### B. Tester Neon depuis la machine locale

Créer un fichier `.env.neon` non versionné ou remplacer temporairement les valeurs de `.env` :

```env
DATABASE_URL="postgresql://...pooler.../neondb?sslmode=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require"
AUTH_SECRET="une-valeur-longue-et-aleatoire"
APP_URL="http://localhost:3000"
```

Dans un nouveau terminal chargé avec ces variables :

```powershell
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Créer un compte, se reconnecter, publier une session, vérifier son apparition dans `/sessions`, actualiser, puis se déconnecter et se reconnecter. Pour un contrôle sans modifier les données :

```powershell
npx prisma migrate status
curl.exe -i http://localhost:3000/api/health
```

Ne jamais utiliser `prisma migrate dev`, `prisma db push --force-reset` ou un reset sur Neon en production.

### C. Pousser le dépôt sur GitHub

Ce dossier doit d’abord être un dépôt Git. S’il ne l’est pas encore : `git init`, créer le dépôt distant, puis l’ajouter avec `git remote add origin ...`. Contrôler impérativement que `.env*` sensibles sont ignorés avant de publier.

```powershell
git status
git add .
git commit -m "Prepare Retro Coop deployment"
git branch -M main
git push -u origin main
```

### D. Créer le Web Service Render

1. Dans Render, choisir **New > Blueprint** et sélectionner le dépôt GitHub. `render.yaml` crée un seul Web Service Node gratuit en région Frankfurt.
2. La commande de build est `npm ci && npm run build`. `npm run build` génère le client Prisma puis compile Next.js.
3. La commande de démarrage est `npm run start:render`. Elle exécute `prisma migrate deploy`, puis `next start` sur `process.env.PORT`.
4. Le healthcheck est `/api/health`.
5. Aucun disque Render n’est requis : les données utilisateurs ne sont jamais écrites dans son système de fichiers.

Si la configuration est faite manuellement, reprendre exactement ces valeurs. Le plan gratuit peut s’endormir et provoquer un premier chargement plus lent.

### E. Variables Render obligatoires

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | URL Neon poolée |
| `DIRECT_URL` | URL Neon directe |
| `AUTH_SECRET` | secret aléatoire long, généré une seule fois |
| `APP_URL` | URL publique Render, par exemple `https://retrocoop.onrender.com` |
| `NODE_ENV` | `production` |

`NODE_VERSION=22.18.0` est déjà défini dans `render.yaml`. N’ajouter les identifiants IGDB que si les commandes éditoriales doivent être exécutées hors production.

### F. Migrations et catalogue initial

Chaque démarrage Render applique uniquement les migrations non encore exécutées avec :

```bash
npx prisma migrate deploy
```

Cette commande ne réinitialise pas la base. Après le premier déploiement seulement, ouvrir le Shell Render et exécuter `npm run db:seed` pour importer le catalogue. Les déploiements suivants ne relancent pas le seed.

### G. Contrôle final sur Render

1. Ouvrir l’URL Render et vérifier `/api/health`.
2. Créer un compte et vérifier que le pseudo apparaît dans l’en-tête après actualisation.
3. Publier une session et vérifier sa présence immédiate dans `/sessions`.
4. Actualiser, se déconnecter, se reconnecter et vérifier que la session existe toujours.
5. Ouvrir une fiche depuis un catalogue filtré ; tester les boutons précédent/suivant et les touches gauche/droite.
6. Ouvrir directement une URL de fiche et vérifier le parcours circulaire alphabétique.

Voir aussi [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md), [docs/ACCOUNTS_AND_DATABASE.md](docs/ACCOUNTS_AND_DATABASE.md) et [docs/MEDIA_PIPELINE.md](docs/MEDIA_PIPELINE.md).

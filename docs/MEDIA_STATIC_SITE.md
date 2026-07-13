# Static Site média Render

Les comptes, l’authentification, les sessions et PostgreSQL restent sur le Web Service RetroCoop. Le Static Site ne publie que les jaquettes et captures WebP déjà préparées.

## Construction locale

```bash
npm ci
npm run build:media
```

La commande lit le catalogue éditorial versionné et copie uniquement les 742 médias référencés dans `dist-media/covers/` et `dist-media/gameplay/`. Le fichier `dist-media/_headers` applique un cache d’un an `immutable`. Avant de publier une nouvelle version d’un média source, exécuter `npm run media:version` afin que son hash de contenu fasse partie du nom.

## Création dans Render

Créer un **Static Site** depuis le même dépôt avec :

```text
Build Command: npm ci && npm run build:media
Publish Directory: dist-media
```

Après le premier déploiement, définir sur le Web Service principal :

```env
NEXT_PUBLIC_MEDIA_BASE_URL=https://retrocoop-media.onrender.com
```

Puis redéployer le Web Service, car cette variable publique est intégrée au bundle lors du build. La laisser vide en local conserve les URL `/covers/...` et `/gameplay/...`.

Contrôles attendus : une URL média renvoie `Cache-Control: public, max-age=31536000, immutable`, les noms se terminent par `-<hash>.webp`, et le Static Site ne contient aucun fichier d’authentification ni aucune donnée de session.

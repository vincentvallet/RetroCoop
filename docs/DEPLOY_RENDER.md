# Déploiement Render + Neon

La configuration de référence se trouve dans `render.yaml`. Elle crée un Web Service Node gratuit, sans base ni disque Render. La production utilise Neon PostgreSQL avec `DATABASE_URL` poolée pour l’application et `DIRECT_URL` directe pour `prisma migrate deploy`.

Le build exécute `npm ci && npm run build`. Le démarrage `npm run start:render` applique les migrations non destructives puis lance Next.js sur `PORT`. Le catalogue est importé une seule fois manuellement avec `npm run db:seed` après le premier déploiement.

Variables requises : `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `APP_URL`, `NODE_ENV=production`. Healthcheck : `/api/health`. Pour les étapes détaillées, les tests Neon locaux et le contrôle final, suivre la section « Publier Retro Coop gratuitement avec Render et Neon » du README.

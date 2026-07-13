# Enrichissement du catalogue avec IGDB

IGDB a été retenu car il fournit une API officielle et documentée avec jeux, dates, résumés et jaquettes. L’intégration est un script serveur : aucun secret ni appel IGDB n’est envoyé au navigateur.

## Obtenir les identifiants

1. Créer un compte Twitch et activer l’authentification à deux facteurs.
2. Enregistrer une application confidentielle dans la console Twitch Developer.
3. Copier l’identifiant client et générer un secret.
4. Renseigner `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` dans `.env`, jamais dans Git. `GAME_METADATA_PROVIDER=igdb` documente le fournisseur actif.

## Commandes

```bash
npm run games:enrich -- --dry-run
npm run games:enrich -- --limit=20
npm run games:enrich -- --force
npm run games:enrich -- --game="Streets of Rage 3"
```

Le script ignore les jeux déjà complets sauf avec `--force`, limite les recherches à la plateforme Mega Drive/Genesis, calcule un score, refuse les correspondances faibles ou trop proches et écrit `data/reports/metadata-report.json`. Le mode `--dry-run` ne modifie jamais le catalogue. Sans identifiants, il produit tout de même un état exact des champs manquants sans appeler le réseau.

## Conditions et limites

Au 13 juillet 2026, la documentation officielle IGDB indique une limite de 4 requêtes par seconde, 8 requêtes simultanées et un usage gratuit non commercial soumis au Twitch Developer Service Agreement. Retro Coop cadence les appels à moins de 4/s. Le projet doit relire l’accord avant une mise en production ou un usage commercial. Les URL de jaquette sont conservées avec leur source et attribution ; valider l’autorisation de diffusion avant de lancer un import destiné au public. Le script n’écrase pas une description existante.

Sources officielles : https://api-docs.igdb.com/ et https://dev.twitch.tv/docs/authentication


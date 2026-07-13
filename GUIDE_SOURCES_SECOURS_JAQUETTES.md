# Sources facultatives de secours

Le pipeline principal Libretro ne demande ni compte ni clé. Les fournisseurs ci-dessous ne doivent être utilisés qu’après examen des rapports `reports/covers/`, pour les jeux manquants ou ambigus.

## IGDB

Créer une application Twitch confidentielle, puis renseigner `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` dans `.env`. La commande `npm run games:enrich` reste exécutée côté serveur. Consulter `docs/IGDB_SETUP.md` et les conditions Twitch/IGDB avant réutilisation des médias.

## ScreenScraper

ScreenScraper peut compléter des médias `box-2D` manquants ou certaines variantes régionales. Créer soi-même le compte requis, respecter les quotas et placer les identifiants uniquement dans `.env`. Aucun compte, CAPTCHA ou validation email ne doit être automatisé par Retro Coop.

Ne jamais remplacer automatiquement une jaquette manuelle ou éditoriale et ne jamais exposer un secret dans le frontend.


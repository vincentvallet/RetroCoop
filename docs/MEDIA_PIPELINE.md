# Pipeline médias Mega Drive

Le pipeline ne télécharge aucune ROM. Il utilise le dépôt public Libretro Thumbnails en sparse checkout (`Named_Boxarts` et `Named_Snaps`), conservé dans `.cache/`.

1. `npm run media:sync-sources` met à jour les sources.
2. `npm run media:dry-run` calcule les correspondances sans écrire le catalogue.
3. `npm run media:import-covers` et `npm run media:import-gameplay` importent les WebP locaux.
4. `npm run media:validate-images` détecte fichiers absents, corrompus, transparents, noirs ou presque noirs.
5. `npm run media:report` régénère les rapports dans `reports/media/`.

Les captures sont limitées à trois par jeu, 720 px de large sans agrandissement et 220 Kio. Le SHA-256 et un dHash permettent de repérer doublons et ressemblances anormales avec la jaquette. Les overrides explicites sont dans `config/megadrive-gameplay-image-overrides.json` et `config/megadrive-cover-overrides.json`.

Le manifeste servi est `public/media/megadrive-media-manifest.json`. La revue humaine se fait via `reports/media/gameplay-images-review.html` et `reports/media/problematic-covers-review.html`.

# Métadonnées du catalogue

`npm run metadata:audit`, `metadata:dry-run`, `metadata:sync`, `metadata:validate` et `metadata:report` utilisent `scripts/metadata/sync-megadrive-metadata.ts`.

Les descriptions françaises de 45 à 100 mots et les tags contrôlés sont dérivés uniquement des informations structurées déjà présentes (titre, genre, joueurs, coopération, versus et déroulement). Une année ou une note externe n’est jamais inventée. Sans identifiants IGDB, la valeur reste `null` et apparaît dans `reports/catalogue/metadata-missing.json`.

Les rapports détaillent correspondances, ambiguïtés, conflits, qualité des descriptions, joueurs, années, tags, notes externes et synthèse. `reports/catalogue/review.html` offre une revue lisible.

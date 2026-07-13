# Import

`npm run catalog:import` détecte le séparateur, retire le BOM, mappe les colonnes, normalise seulement les clés de rapprochement, exclut les entrées explicitement solo, déduplique par titre exact normalisé et produit les rapports sous `data/reports`. Un rapprochement ambigu n'est jamais fusionné automatiquement. L'import est déterministe et idempotent.

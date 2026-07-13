# Audit des données sources

- `jeux_megadrive_liste1.csv` : 146 418 octets, UTF-8 avec BOM, séparateur point-virgule, en-tête de 18 colonnes, données tabulaires.
- `jeux_megadrive_liste2.txt` : 41 869 octets, UTF-8 sans BOM, 1 134 lignes, essai narratif avec listes, titres et citations semi-structurées.
- Sources préservées sans modification. Le CSV fait autorité pour l'import structuré; le TXT est lu, compté et conservé comme source de vérification, mais ses affirmations narratives ne sont pas fusionnées automatiquement.
- Anomalies observées : années non numériques (`Jun1`, `Aug `), champs inconnus explicites, valeurs multiformes. Elles restent nulles ou à vérifier.

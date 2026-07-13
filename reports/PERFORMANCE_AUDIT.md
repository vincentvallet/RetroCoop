# Audit de performance — catalogue RetroCoop

Audit réalisé le 13 juillet 2026 sur le catalogue Mega Drive réellement normalisé dans le dépôt : **371 jeux**, soit 742 médias WebP (371 jaquettes et 371 captures de gameplay) pour 28 455 906 octets. Le nombre de 386 indiqué dans la demande ne correspond pas au jeu de données actuellement servi ; aucun des 371 jeux présents n'a été retiré.

## Méthode

La comparaison avant/après utilise deux builds de production locaux, l'ancien commit `76b26d7` et la version optimisée, dans le même environnement. Le cache du navigateur est désactivé, la page est mesurée après 3 secondes de stabilisation, et le serveur est chaud. Une tentative de mesure publique à froid sur Render Free a dépassé 120 secondes : ce délai d'endormissement de l'instance ne peut pas être corrigé par le code de la page et n'est donc pas mélangé à la comparaison applicative.

| Mesure catalogue | Avant | Après | Évolution |
| --- | ---: | ---: | ---: |
| TTFB | 35,7 ms | 11,5 ms | -67,8 % |
| FCP | 144 ms | 96 ms | -33,3 % |
| LCP | 144 ms | 96 ms | -33,3 % |
| DOMContentLoaded | 220,6 ms | 95,8 ms | -56,6 % |
| `load` | 327,1 ms | 131,4 ms | -59,8 % |
| Requêtes observées | 77 | 79 | +2 |
| Requêtes image initiales | 43 | 19 | -55,8 % |
| Médias préparés via `/_next/image` | 42 | 0 | -100 % |
| Octets transférés | 1 734 134 | 1 592 515 | -8,2 % |
| HTML | 72 698 octets | 75 009 octets | +3,2 % |

Le total des requêtes gagne deux appels parce que la page statique charge maintenant ses données RSC et l'indicateur de compte via `/api/auth/me`. Cet échange permet en contrepartie de sortir le catalogue du chemin dynamique et de ne plus attendre PostgreSQL pour afficher la page. Le seul usage restant de `/_next/image` concerne le petit logo du site, pas les jaquettes ni les captures.

## Architecture obtenue

- `/`, `/catalogue` et les pages éditoriales sont statiques.
- Les 371 fiches `/jeux/megadrive/...` sont générées statiquement au build.
- Le catalogue et les fiches lisent exclusivement le JSON versionné : **zéro requête PostgreSQL** pour leur contenu.
- L'état de connexion est récupéré après affichage par `/api/auth/me`. Un visiteur anonyme ne déclenche aucune requête utilisateur ; une session authentifiée effectue au plus une recherche utilisateur, hors chemin critique du HTML.
- Les routes de création, consultation et administration des sessions restent dynamiques et utilisent PostgreSQL, comme attendu.
- Six jaquettes sont prioritaires ; les 365 suivantes sont natives `loading="lazy"`. `content-visibility`, `contain` et une hauteur intrinsèque réduisent le coût de rendu hors écran.
- La recherche utilise une valeur différée et un index normalisé mémorisé. Le changement de fiche précharge uniquement le voisin précédent et le voisin suivant. Un benchmark de 50 changements de fiche passe de 6,028 ms à 5,736 ms en moyenne.

## Médias et cache

Les 742 fichiers ont reçu un suffixe de contenu SHA-256 court, par exemple `sonic-the-hedgehog-xxxxxxxx.webp`. Next.js envoie `Cache-Control: public, max-age=31536000, immutable` pour les jaquettes et captures versionnées. `npm run media:version` versionne les sources et met à jour les manifestes ; `npm run build:media` produit `dist-media/covers`, `dist-media/gameplay` et son fichier `_headers` pour un Render Static Site séparé.

La variable `NEXT_PUBLIC_MEDIA_BASE_URL` reste facultative : vide, les médias sont servis par l'application ; renseignée avec l'URL du Static Site, elle déporte les 28,5 Mo de médias sans modifier le code. La procédure Render exacte est décrite dans `docs/MEDIA_STATIC_SITE.md`.

## Validation

- lint, vérification TypeScript, tests unitaires et build de production ;
- génération statique des 371 fiches vérifiée dans la sortie du build ;
- tests Chromium et WebKit du catalogue, du défilement paresseux, des en-têtes immuables, de la navigation et des parcours de session ;
- 371 cartes et 371 images conservées, chemins de médias tous versionnés ;
- aucune jaquette ni capture ne passe par l'optimiseur d'images Next.js.

Le réveil à froid de Render Free et la latence réseau vers Neon restent des contraintes de plateforme. Elles touchent encore les API et les pages de sessions, mais plus le premier rendu du catalogue ni des fiches statiques.

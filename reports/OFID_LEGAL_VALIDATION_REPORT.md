# Rapport complémentaire — éditeur OFID et contacts juridiques

Date de validation : 13 juillet 2026  
Version applicative validée : `faaa7c2`  
Production : `https://retrocoop.onrender.com`

## Résultats

| Vérification | Résultat | Preuve |
| --- | ---: | --- |
| Ancienne adresse de contact RetroCoop supprimée | PASS | Recherche récursive du dépôt et contrôle des pages publiques : 0 occurrence |
| `contact@ofid.fr` configuré | PASS | Configuration centrale, pages, footer et variables Render |
| OFID identifié comme éditeur | PASS | `/mentions-legales` et CGU |
| SIRET exact | PASS | `939 818 126 00012` |
| NDA exact | PASS | `32591338859` |
| TVA exacte | PASS | `FR10939818126` |
| Directeur de publication | PASS | Vincent Vallet, cohérent avec l’historique Git officiel du projet |
| Adresse postale non affichée | PASS technique | `publicPostalAddress: null`, aucune adresse OFID rendue |
| Risque juridique relatif à l’adresse signalé | PASS | Avertissement explicite ci-dessous |
| Aucun email utilisateur affiché | PASS | API sessions publique contrôlée en production |
| Aucun email masqué affiché | PASS | Ancien pseudo-email rendu `Joueur-2C443082` |
| Footer conforme | PASS | Avertissement exact, cinq liens et contact OFID |
| Contact RGPD OFID | PASS | Politique et formulaire sécurisé |
| Contact droits d’auteur OFID | PASS | Pages de respect et de signalement |
| Formulaire de retrait | PASS | Enregistrement public Render → Neon, puis donnée de test supprimée |
| Emails transactionnels configurables | PASS | `EMAIL_FROM`, contacts centralisés et Resend non bloquant |
| Tests unitaires | PASS | 78/78 dans 12 fichiers |
| Tests E2E | PASS | 32/32, Chromium et WebKit |
| Build production | PASS | 401 pages; catalogue et 371 fiches toujours statiques/SSG |
| Déploiement Render | PASS | Pages 200, formulaire fonctionnel, santé `ok`, base `connected` |

## Point juridique obligatoire

**POINT À VALIDER JURIDIQUEMENT :**  
l’adresse postale de l’éditeur n’est pas affichée à la demande du responsable du site.  
Cette omission peut être incompatible avec les obligations applicables aux mentions légales d’un site professionnel.  
La page ne doit donc pas être déclarée « juridiquement complète » tant que ce point n’a pas été validé.

## Mise en œuvre

L’identité institutionnelle est centralisée dans `lib/legal-config.ts`. Elle contient OFID, le nom développé, le SIRET, le numéro de déclaration d’activité, le numéro de TVA, le directeur de publication et les trois contacts configurables. Aucune forme juridique ni adresse postale n’a été inventée.

Les pages créées ou refondues sont `/mentions-legales`, `/confidentialite`, `/cgu`, `/respect-droits-auteur`, `/signalement-droits`, `/contact` et `/sources-et-droits`. Le footer utilise l’avertissement demandé mot pour mot et propose les cinq liens juridiques.

Les anciens comptes dont le pseudo ressemble à un email reçoivent un alias stable `Joueur-XXXXXXXX`, calculé par SHA-256 à partir de l’identifiant interne avec un espace de nom dédié. Il ne contient aucune partie de l’email ou de son domaine. Les DTO des sessions, participants, messages, notifications et outils courants de modération ne sélectionnent ou ne retournent plus d’email pour construire l’identité publique. Les nouvelles inscriptions refusent un pseudo au format email.

Le formulaire juridique accepte les sept catégories demandées. Il contrôle l’origine derrière le proxy Render, normalise et limite les champs, refuse les caractères de contrôle et le HTML actif, comporte un honeypot et limite de façon persistante à cinq demandes par heure et par empreinte IP. Les demandes sont stockées dans Neon par la migration additive `20260713210000_legal_requests`; l’email de réponse reste une donnée administrative privée.

## Prestataires vérifiés

- Render est identifié comme service de Render Services, Inc. à partir de ses [conditions officielles](https://render.com/terms) et de sa [politique de confidentialité](https://render.com/privacy).
- Le fournisseur PostgreSQL est Neon, LLC, d’après les [conditions officielles de la plateforme Neon](https://neon.com/platform-terms).

Aucune coordonnée postale incertaine de prestataire n’a été copiée dans les pages.

## Configuration Render

Variables déclarées : `LEGAL_CONTACT_EMAIL=contact@ofid.fr`, `PRIVACY_CONTACT_EMAIL=contact@ofid.fr`, `RIGHTS_CONTACT_EMAIL=contact@ofid.fr`. La valeur attendue pour l’expéditeur est `EMAIL_FROM=RetroCoop <contact@ofid.fr>`, après vérification du domaine dans Resend. `RESEND_API_KEY` reste un secret `sync: false`.

## Contrôle des données

Le test de formulaire public a créé une demande temporaire, vérifié sa catégorie et son objet dans Neon, puis l’a supprimée. Le contrôle a aussi détecté l’absence ponctuelle de la session réelle World of Illusion dans Neon. Elle a été restaurée avec son identifiant, son jeu, ses dates, son statut et ses deux participations tels qu’audités auparavant. L’API publique retourne de nouveau une session et n’expose aucun email utilisateur.

## Conclusion

**Conformité technique validée.**

**Validation juridique externe encore nécessaire**, en particulier sur l’absence d’adresse postale de l’éditeur et sur l’adéquation finale des mentions aux obligations applicables à OFID.

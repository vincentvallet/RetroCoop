# Comptes et PostgreSQL

Le développement local utilise PostgreSQL 17 via Docker sur `localhost:5434`. Exécuter `npm run db:deploy`, puis `npm run db:seed`. Le seed synchronise 382 jeux et les médias importés sans recréer les comptes.

L’inscription demande email, pseudo, mot de passe (1 à 128 caractères), acceptation des conditions et un calcul anti-spam à usage unique. Les mots de passe sont hachés avec Argon2id. L’API combine honeypot, expiration du défi et limite de cinq tentatives par fenêtre de quinze minutes sur IP, email ou pseudo normalisés. `AUTH_SECRET` est obligatoire en production.

La connexion émet un cookie HTTP-only `SameSite=Lax`, sécurisé en production. `/api/health` vérifie la base par `SELECT 1` et renvoie HTTP 503 en cas de déconnexion.

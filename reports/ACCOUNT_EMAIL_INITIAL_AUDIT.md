# Audit initial — gestion du compte et emails transactionnels

```json
{
  "accountPageExists": true,
  "usernameUpdateExists": false,
  "passwordUpdateExists": false,
  "accountDeletionExists": false,
  "welcomeEmailExists": false,
  "joinEmailExists": true,
  "leaveEmailExists": false,
  "deletionConfirmationEmailExists": false,
  "emailPreferencesExist": true,
  "emailDeliveryTrackingExists": false,
  "emailIdempotenceExists": false
}
```

La page `/compte` est protégée mais ne contient initialement que le pseudo, la préférence email de join et un lien vers les demandes juridiques. L’authentification repose sur un cookie signé stateless de sept jours sans version de session. Le mot de passe est haché avec Argon2id. `usernameNormalized` fournit déjà une contrainte d’unicité insensible à la casse.

L’email de join est envoyé côté serveur après la transaction et son échec ne bloque pas le join, mais le suivi repose uniquement sur `Notification.emailStatus`; il n’existe pas de journal d’envoi générique ni de clé d’idempotence persistante. Le départ volontaire met uniquement la participation à `LEFT` et ne crée ni notification ni email. L’inscription ne déclenche pas de welcome email. Aucune suppression de compte applicative n’existe.

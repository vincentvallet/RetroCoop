# Audit initial — médias, confidentialité, chat et notifications

```json
{"sessionCardCoverWorks":false,"sessionDetailCoverWorks":false,"oldSessionsResolveHashedMedia":false,"publicApiExposesEmail":true,"chatRestrictedToParticipants":false,"chatShowsUsername":false,"chatRateLimitExists":false,"adminModerationExists":false,"inAppNotificationsExist":false,"emailNotificationsExist":false}
```

Les sessions conservent une relation stable `gameId`, mais leur DTO recopiait `Game.coverUrl` depuis PostgreSQL. Ces valeurs n'ont pas été réécrites lors du renommage haché des médias et pointent vers des fichiers désormais absents. Le catalogue JSON contient les chemins hachés actuels et doit rester la source de vérité au moment de la lecture.

L'API publique n'expose pas de propriété nommée `email`, mais certains anciens comptes utilisent une adresse complète comme pseudo. Cette valeur est envoyée sous `creator.username` et `participants[].username`, ce qui constitue une exposition publique d'email.

Le schéma initial ne contient ni message de session, ni notification, ni signalement, ni suspension de chat. Le rôle `ADMIN` existe déjà, sans interface de modération associée.

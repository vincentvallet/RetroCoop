# Chat, modération et notifications

Le chat d'une session est chargé uniquement sur sa fiche et pour l'organisateur ou un participant au statut `JOINED`. Une personne anonyme reçoit `401`; une personne connectée non participante, ayant quitté ou ayant été retirée reçoit `403` pour la lecture comme pour l'écriture.

Les sessions `OPEN`, `FULL` et `CLOSED` autorisent lecture et écriture. Les sessions `CANCELLED` ou `COMPLETED` restent lisibles par leurs participants actifs mais sont en lecture seule.

Les messages sont du texte brut de 1 à 500 caractères. Le serveur refuse HTML, caractères de contrôle, répétitions anormales, plus de deux liens et doublons pendant 60 secondes. Les seuils persistants PostgreSQL sont de 3 messages sur 5 secondes, 10 sur 60 secondes par utilisateur et session, ainsi que 30 événements par minute et adresse IP hachée. Les identifiants client rendent les répétitions de requête idempotentes.

Les rôles `ADMIN` et `MODERATOR` accèdent à `/admin/moderation/chat`. Ils peuvent supprimer un message, consulter les signalements et liens suspects, suspendre un utilisateur du chat et le réactiver. Chaque action est inscrite dans `ModerationLog`.

Une participation réellement créée génère une notification interne pour l'organisateur. Si `RESEND_API_KEY`, `EMAIL_FROM` et `APP_URL` sont configurés et que la préférence du compte est active, un email est tenté après validation de la transaction. Son échec ne modifie jamais la participation. Un même participant ne génère au maximum qu'un email par session sur 30 minutes.

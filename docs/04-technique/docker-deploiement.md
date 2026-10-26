# Déploiement

Le déploiement visé reste simple :

- un conteneur pour l’application ;
- un conteneur PostgreSQL ;
- un accès HTTPS ;
- des volumes persistants pour la base et, si nécessaire, les FIT.

Docker Compose pourra être utilisé sur le serveur personnel.

Une sauvegarde régulière de PostgreSQL et une vérification occasionnelle de la restauration suffisent pour démarrer. Les détails de rétention et de dimensionnement seront choisis au moment du déploiement.

# Déploiement

Le déploiement visé reste simple :

- un conteneur pour l’application ;
- un conteneur PostgreSQL ;
- un accès HTTPS ;
- des volumes persistants pour la base et, si nécessaire, les FIT.

Docker Compose reste utilisé pour le développement local. Sur l’infrastructure IHME, seule l’image de l’application est publiée : PostgreSQL est fourni séparément par le serveur.

Une sauvegarde régulière de PostgreSQL et une vérification occasionnelle de la restauration suffisent pour démarrer. Les détails de rétention et de dimensionnement seront choisis au moment du déploiement.

Le conteneur de production écoute sur le port 3000 avec l’UID/GID 1000, accepte un système de fichiers en lecture seule et utilise au maximum quatre connexions PostgreSQL. Le chemin public est compilé dans le frontend avec `BASE_PATH`.

La procédure complète de publication GHCR et de déploiement est dans [deploiement-ihme.md](deploiement-ihme.md).

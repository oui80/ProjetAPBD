# Connexion Intervals.icu

## Objectif

Le bouton « Synchroniser Intervals.icu » récupère les activités de l’utilisateur et télécharge leurs fichiers pour les importer dans l’application.

## Authentification

Pour plusieurs utilisateurs, l’application utilise OAuth 2.0 avec la portée minimale `ACTIVITY:READ`. L’application OAuth doit être enregistrée et approuvée par Intervals.icu.

Le jeton reste côté serveur. L’utilisateur peut déconnecter le service ; le backend révoque alors l’accès.

## Synchronisation

1. Demander les activités sur la période à synchroniser.
2. Comparer leur identifiant externe avec les activités déjà importées.
3. Télécharger le fichier original compressé avec l’endpoint de fichier d’activité.
4. Si l’original n’est pas un FIT, télécharger le FIT généré par Intervals.icu.
5. Passer le fichier dans le pipeline d’import FIT existant.
6. Enregistrer l’identifiant externe, le type du fichier et sa provenance.

La synchronisation est incrémentale. Une erreur sur une activité ne bloque pas les autres. Certaines activités provenant de services tiers peuvent ne pas être accessibles selon leurs propres conditions.

## Endpoints externes utiles

- Liste des activités : `/api/v1/athlete/0/activities`.
- Fichier original compressé : `/api/v1/activity/{id}/file`.
- FIT généré : `/api/v1/activity/{id}/fit-file`.
- Déconnexion de l’application : `/api/v1/disconnect-app`.

## Limites

Le backend respecte les quotas indiqués dans les en-têtes de réponse et traite correctement les réponses `429`. L’import manuel reste disponible lorsque le service est indisponible.

## Sources

- [Présentation de l’API ouverte](https://www.intervals.icu/features/open-api/)
- [Guide d’intégration API](https://forum.intervals.icu/t/intervals-icu-api-integration-cookbook/80090)
- [Documentation OAuth](https://forum.intervals.icu/t/intervals-icu-oauth-support/2759)

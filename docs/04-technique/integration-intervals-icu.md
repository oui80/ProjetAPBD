# Import depuis Intervals.icu

## Objectif

Le bouton « Synchroniser Intervals.icu » importe simplement les activités de l’utilisateur sous forme de fichiers FIT.

## Connexion

L’application utilise OAuth 2.0 avec la permission `ACTIVITY:READ`. Pour plusieurs utilisateurs, l’application OAuth doit être enregistrée et approuvée par Intervals.icu.

Le jeton reste protégé côté serveur et peut être révoqué lorsque l’utilisateur déconnecte son compte.

## Synchronisation

1. Récupérer la liste des activités sur la période utile.
2. Ignorer les identifiants déjà importés.
3. Télécharger le FIT avec `/api/v1/activity/{id}/fit-file`.
4. Envoyer ce FIT dans le pipeline d’import normal.
5. Afficher un bilan : importées, déjà présentes, ignorées ou en erreur.

La synchronisation est incrémentale. Une activité en erreur ne bloque pas les autres. L’origine précédente des données dans Intervals.icu n’est pas un sujet fonctionnel de l’application.

## Limites simples

- Respecter les quotas renvoyés par l’API et les réponses `429`.
- Continuer à permettre l’import manuel si le service est indisponible.
- Conserver l’identifiant Intervals.icu uniquement pour éviter les doublons.

## Sources

- [Présentation de l’API ouverte](https://www.intervals.icu/features/open-api/)
- [Guide d’intégration API](https://forum.intervals.icu/t/intervals-icu-api-integration-cookbook/80090)
- [Documentation OAuth](https://forum.intervals.icu/t/intervals-icu-oauth-support/2759)

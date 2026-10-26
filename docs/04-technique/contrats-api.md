# Contrats API conceptuels

Les chemins sont proposés et pourront être ajustés pendant l’implémentation.

## Authentification

- `POST /auth/register` : créer librement un compte.
- `POST /auth/login` : ouvrir une session.
- `POST /auth/logout` : fermer la session.
- `GET /auth/session` : connaître l’utilisateur connecté.
- Routes OAuth Intervals.icu : démarrer et terminer la connexion.

## Imports

- `POST /imports/fit` : envoyer un ou plusieurs FIT.
- `GET /imports/{id}` : consulter le résultat d’un import.
- `POST /sync/intervals-icu` : lancer la synchronisation.
- `GET /sync/intervals-icu/{id}` : consulter son résultat.

## Activités

- `GET /activities` : historique filtré et paginé.
- `GET /activities/{id}` : détail simple d’une activité.

## Règles

- Toutes les ressources sont limitées à l’utilisateur connecté.
- Les dates utilisent un format standard et les unités sont explicites.
- Une donnée optionnelle absente n’est pas renvoyée comme zéro.
- Les erreurs possèdent un code simple et un message compréhensible.

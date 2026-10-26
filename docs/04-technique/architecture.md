# Architecture

## Principe

Une application simple, sans microservices :

- React pour l’interface.
- Node.js et Express pour l’API, l’authentification et l’import FIT.
- PostgreSQL pour les utilisateurs, activités et mesures.
- Docker pour lancer l’ensemble sur un petit serveur.

## Backend

Le backend est organisé en modules : authentification, utilisateurs, imports FIT, activités et Intervals.icu. Les futures analyses utiliseront un module séparé afin d’ajouter des tuiles sans modifier l’import.

## Import

Les petits fichiers peuvent être traités directement. Si les imports deviennent trop longs, un traitement en arrière-plan simple pourra être ajouté sans introduire de nouvelle infrastructure.

## Données

Les activités sont toujours recherchées avec l’identifiant de leur propriétaire. Les listes sont paginées et les échantillons sont chargés uniquement lorsque nécessaire.

## Priorité

Ne pas optimiser avant d’avoir mesuré un problème réel. Pour environ 20 utilisateurs, PostgreSQL et un seul backend sont suffisants.

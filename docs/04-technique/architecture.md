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

Une heure enregistrée à 1 Hz représente environ 3 600 échantillons. Avec 20 utilisateurs et plusieurs centaines d’activités chacun, PostgreSQL peut contenir plusieurs millions de points. Des requêtes limitées à une activité, des index adaptés et des courbes simplifiées pour l’affichage suffisent sans infrastructure distribuée.

Les futurs calculs d’analyse conserveront une version de leur méthode afin qu’un résultat reste compréhensible après une évolution de l’algorithme.

## Priorité

Ne pas optimiser avant d’avoir mesuré un problème réel. Pour environ 20 utilisateurs, PostgreSQL et un seul backend sont suffisants.

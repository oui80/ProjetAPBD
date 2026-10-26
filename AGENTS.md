# Instructions aux futurs agents

## Objectif

Construire une petite application web d’import et de consultation d’activités sportives.

## Phase actuelle

Implémentation du MVP autorisée. La première tranche couvre l’infrastructure, l’authentification locale et l’historique vide. Ne pas anticiper l’import FIT, OAuth Intervals.icu, les graphiques ou les analyses sans nouvelle demande.

## Stack imposée

- React.js
- Node.js avec Express
- PostgreSQL
- Docker

## Priorités

1. Compte utilisateur et connexion.
2. Import FIT fiable.
3. Historique personnel des activités.
4. Détail simple d’une activité.
5. Plus tard, ajout progressif de tuiles d’analyse indépendantes.

## Règles

- Lire `README.md`, le périmètre MVP et les décisions avant toute modification.
- Ne pas implémenter une fonctionnalité marquée **HORS MVP** ou **BLOQUÉE**.
- Ne jamais inventer une donnée absente d’un fichier FIT.
- Isoler strictement les données de chaque utilisateur.
- Maintenir la documentation avec les décisions fonctionnelles.
- La connexion Intervals.icu et la synchronisation FIT suivent `docs/04-technique/integration-intervals-icu.md`.
- Utiliser les sessions opaques stockées en PostgreSQL ; ne pas remplacer ce choix par des JWT sans décision explicite.
- Protéger toutes les ressources privées côté backend, même si le frontend masque déjà la route.
- Utiliser Yarn et conserver `yarn.lock` à jour.
- Exécuter `yarn lint`, `yarn test` et `yarn build` après une modification applicative.
- Les migrations SQL versionnées sont dans `database/migrations/` et s’exécutent au démarrage.

## Structure

- `frontend/` : React, Vite et TypeScript.
- `backend/` : Express, TypeScript, API et accès PostgreSQL.
- `database/migrations/` : migrations SQL versionnées.
- `docs/` : décisions fonctionnelles et techniques.

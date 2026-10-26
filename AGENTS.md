# Instructions aux futurs agents

## Objectif

Construire une petite application web d’import et de consultation d’activités sportives.

## Phase actuelle

Documentation uniquement. Ne pas créer de code, SQL, tests exécutables ou configuration Docker sans autorisation explicite.

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

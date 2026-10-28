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
- Appliquer une validation proportionnelle aux fichiers modifiés :
  - CSS ou modification visuelle : aucun build ou test complet ; contrôle visuel ponctuel seulement si utile.
  - React/TypeScript frontend : lint ciblé, puis typecheck ou test frontend concerné si nécessaire.
  - Backend : lint, typecheck et tests ciblés du comportement modifié ; aucune compilation frontend inutile.
  - Documentation : vérification légère du diff uniquement.
  - Modification critique ou préparation au déploiement : lint, tests complets, build production, base path `/projet-apbd/` et Docker si pertinent.
- Ne jamais considérer un contrôle non exécuté comme réussi ; réutiliser un résultat tant que ses fichiers d’entrée n’ont pas changé.
- Exécuter les tâches lourdes séquentiellement et arrêter tout serveur ou navigateur temporaire après usage.
- Les migrations SQL versionnées sont dans `database/migrations/` et s’exécutent au démarrage.

## Structure

- `frontend/` : React, Vite et TypeScript.
- `backend/` : Express, TypeScript, API et accès PostgreSQL.
- `database/migrations/` : migrations SQL versionnées.
- `docs/` : décisions fonctionnelles et techniques.

## Sobriété des validations

- Ne pas lancer automatiquement une batterie complète après une petite modification.
- Ne pas construire Docker pour une modification CSS ou React isolée.
- Privilégier les scripts ciblés (`lint:frontend`, `lint:backend`, `test:frontend`, `test:backend`, `typecheck:*`).
- Éviter les installations de dépendances et les captures navigateur répétées.
- Ne pas exécuter plusieurs compilations, suites de tests, Vite ou navigateurs headless simultanément.
- Les tâches coûteuses peuvent utiliser `NODE_OPTIONS=--max-old-space-size=1024`; cette limite reste configurable et ne doit pas provoquer d’échec mémoire.
- Expliquer brièvement les contrôles exécutés et ceux volontairement évités dans chaque intervention.

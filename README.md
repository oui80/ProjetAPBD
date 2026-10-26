# Application d’analyse sportive

Petit projet web personnel permettant à une vingtaine d’utilisateurs d’importer leurs fichiers FIT et de retrouver leur historique sportif.

## État de l’implémentation

La première tranche verticale est disponible :

- inscription et connexion locales ;
- sessions persistantes en PostgreSQL ;
- route privée `/activities` ;
- historique vide responsive ;
- déconnexion ;
- migrations, tests et exécution Docker.

L’import FIT et la connexion Intervals.icu ne sont pas encore implémentés.

Le MVP doit avant tout fonctionner simplement et correctement. Les analyses avancées seront ajoutées plus tard sous forme de tuiles indépendantes.

## MVP validé

- Inscription libre avec email et mot de passe.
- Connexion locale et connexion avec Intervals.icu.
- Bouton de synchronisation Intervals.icu pour récupérer les fichiers FIT.
- Import manuel de fichiers FIT.
- Historique personnel des activités.
- Consultation des informations principales d’une activité.
- Interface responsive, moderne et sobre.

Le bouton de synchronisation récupère la liste des activités, télécharge un fichier FIT pour chacune d’elles puis utilise le même traitement que l’import manuel.

## Direction graphique

- Fond blanc.
- Texte noir.
- Bleu clair pour les informations et courbes principales.
- Rouge pour les informations et courbes secondaires.
- Style moderne, doux et ergonomique.
- La lisibilité et le fonctionnement priment sur la direction artistique.

La direction de travail est nommée **Precision Sport / Soft Lab**. Le nom d’application provisoire **PACE / LAB** reste une proposition.

## Documentation

1. [Vision et MVP](docs/00-projet/vision.md)
2. [Fonctionnalités](docs/01-fonctionnel/fonctionnalites.md)
3. [Authentification](docs/02-interfaces/01-authentification.md)
4. [Historique](docs/02-interfaces/02-historique.md)
5. [Futur écran d’analyse](docs/02-interfaces/03-analyse-activite.md)
6. [Import FIT](docs/03-donnees/import-fit.md)
7. [Architecture](docs/04-technique/architecture.md)
8. [Connexion Intervals.icu](docs/04-technique/integration-intervals-icu.md)
9. [Décisions et roadmap](docs/05-pilotage/decisions.md)

## Statuts

- **VALIDÉ** : demandé ou confirmé.
- **PROPOSÉ** : solution recommandée.
- **À DÉFINIR** : choix utile mais non bloquant.
- **BLOQUÉ** : dépend d’une validation externe.
- **HORS MVP** : prévu plus tard.

## Démarrage avec Docker

Prérequis : Docker avec Compose.

1. Copier `.env.example` vers `.env` si des valeurs locales personnalisées sont nécessaires.
2. Lancer `docker compose up --build`.
3. Ouvrir `http://localhost:3000`.

PostgreSQL utilise un volume persistant. Les migrations de `database/migrations/` sont exécutées automatiquement avant le démarrage du serveur.

## Développement local

Prérequis : Node.js 20+, Yarn 1 et Docker pour PostgreSQL.

1. Installer les dépendances avec `yarn install`.
2. Démarrer la base avec `docker compose up db -d`.
3. Copier `.env.example` vers `.env`, puis exporter ses variables pour le backend.
4. Lancer `yarn dev:backend` dans un terminal.
5. Lancer `yarn dev:frontend` dans un second terminal.
6. Ouvrir `http://localhost:5173`.

Vite transmet les requêtes `/api` au backend sur le port 3000.

## Commandes de vérification

- `yarn lint` : analyse statique.
- `yarn test` : tests de l’API d’authentification.
- `yarn build` : compilation backend et frontend.

## Variables d’environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL. |
| `PORT` | Port HTTP du backend. |
| `APP_ORIGIN` | Origine autorisée pour les requêtes sensibles. |
| `SESSION_TTL_HOURS` | Durée d’une session. |
| `COOKIE_SECURE` | `true` uniquement lorsque l’application est servie en HTTPS. |
| `NODE_ENV` | `development`, `test` ou `production`. |

Ne jamais stocker de secret réel dans le dépôt.

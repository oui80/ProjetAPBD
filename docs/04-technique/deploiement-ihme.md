# Déploiement IHME

## Prérequis

- Le dépôt GitHub est `oui80/ProjetAPBD` et sa branche principale est `master`.
- L’enseignant a autorisé exactement l’image `ghcr.io/oui80/projetapbd`.
- Docker, Node.js 20+ et Yarn 1 sont disponibles pour les vérifications locales.
- L’enseignant a autorisé le projet `p14`, l’image et le chemin public indiqués ci-dessous.

Ne jamais utiliser de données personnelles ni versionner les paramètres privés.

## Fichiers de déploiement

- `Dockerfile` construit le backend et le frontend avec `BASE_PATH`, puis exécute Node avec l’utilisateur 1000.
- `.dockerignore` exclut les secrets, sauvegardes et fichiers locaux.
- `.github/workflows/publish.yml` publie l’image `linux/amd64` dans GHCR.
- `deploy/request.py` demande le déploiement d’un digest précis sans journaliser les jetons.

L’application accepte `DATABASE_URL`, `PUBLIC_ORIGIN`, `BASE_PATH`, `PORT` et `NODE_ENV`. En local, `APP_ORIGIN` et `COOKIE_SECURE` restent disponibles.

## Paramètres GitHub

Dans **Settings → Secrets and variables → Actions**, configurer uniquement les valeurs remises pour ce projet :

| Type | Nom | Contenu |
|---|---|---|
| Secret | `IHME_DEPLOY_TOKEN` | Jeton personnel fourni par l’enseignant. |
| Variable | `IHME_DEPLOY_URL` | `https://node219697-ihme26.jcloud.ik-server.com/__deploy/p14` |
| Variable | `IHME_BASE_PATH` | `/projet-apbd/` |

Ne pas inventer ces valeurs et ne pas rendre le jeton visible dans les logs.

## Développement local

```bash
yarn install --frozen-lockfile
docker compose up --build
```

L’application est disponible sur `http://localhost:3000`. Pour travailler avec Vite, démarrer PostgreSQL puis `yarn dev:backend` et `yarn dev:frontend` dans deux terminaux.

Avant publication :

```bash
yarn lint
yarn test
yarn build
docker buildx build --platform linux/amd64 --build-arg BASE_PATH=/projet-apbd/ -t projetapbd:ihme-test --load .
```

## Publication et déploiement automatiques

Un push sur `master` lance automatiquement la chaîne suivante :

1. installation figée par `yarn.lock` ;
2. lint, tests backend et frontend, puis compilation ;
3. construction `linux/amd64` avec `/projet-apbd/` ;
4. publication de `ghcr.io/oui80/projetapbd:<sha-du-commit>` ;
5. déploiement du digest SHA-256 sur `p14` ;
6. confirmation de santé par le serveur puis contrôle de l’URL publique.

La publication et le déploiement sont bloqués si un contrôle échoue. Le groupe de concurrence GitHub sérialise les exécutions et une temporisation de 65 secondes précède chaque demande de déploiement afin de respecter la limite IHME.

## Déploiement manuel de secours

Pour déployer une version :

1. Ouvrir **Actions → Tester, publier et déployer**.
2. Choisir **Run workflow** sur `master`.
3. Cocher **Déployer cette version après construction**.
4. Lancer le workflow et attendre la confirmation de santé.

Cette procédure reconstruit et republie la version choisie avant son déploiement. Le serveur reçoit le digest `sha256:…` et un jeton GHCR temporaire. Le tag `latest` n’est pas utilisé.

## Vérifications après déploiement

- Ouvrir l’URL publique attribuée et recharger directement `/activities` sous son préfixe.
- Créer un compte fictif, se connecter puis se déconnecter.
- Vérifier que les ressources CSS et JavaScript utilisent le préfixe public.
- Vérifier `https://node219697-ihme26.jcloud.ik-server.com/projet-apbd/api/health` : HTTP 200 et `{ "status": "ok" }`.
- Contrôler les logs et l’absence de redémarrage ou d’erreur mémoire.

## Diagnostic

- **404 sur les ressources ou l’API** : vérifier `IHME_BASE_PATH`, avec slash initial et final, puis reconstruire l’image.
- **403 sur une requête POST** : vérifier `PUBLIC_ORIGIN`, qui doit contenir uniquement l’origine HTTPS.
- **503 sur `/api/health`** : vérifier `DATABASE_URL`, la disponibilité PostgreSQL et les migrations.
- **Image refusée** : confirmer le dépôt GHCR autorisé et utiliser le digest, pas un tag.
- **Déploiement refusé** : vérifier `IHME_DEPLOY_URL` et `IHME_DEPLOY_TOKEN` sans les afficher.
- **Conteneur non sain** : consulter les logs pour une migration en échec ou une limite mémoire. Les opérations Argon2id sont sérialisées pour limiter leur mémoire native sans réduire leur robustesse.

Toute modification du dépôt d’image autorisé, du chemin public ou des ressources doit être validée avec l’enseignant.

Les migrations restent additives et idempotentes. Le rollback IHME restaure l’image précédente, mais ne restaure pas automatiquement la base ; toute future migration doit donc rester compatible avec la version applicative précédente.

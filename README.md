# Application d’analyse sportive

Petit projet web personnel permettant à une vingtaine d’utilisateurs d’importer leurs fichiers FIT et de retrouver leur historique sportif.

Le MVP doit avant tout fonctionner simplement et correctement. Les analyses avancées seront ajoutées plus tard sous forme de tuiles indépendantes.

## MVP validé

- Inscription libre avec email et mot de passe.
- Connexion locale et connexion avec Intervals.icu.
- Bouton de synchronisation Intervals.icu pour récupérer les fichiers FIT.
- Import manuel de fichiers FIT.
- Historique personnel des activités.
- Consultation des informations principales d’une activité.
- Interface responsive, moderne et sobre.

Le bouton de synchronisation récupère la liste des activités puis télécharge leur fichier d’origine lorsque l’API le permet. Un fichier FIT généré par Intervals.icu peut servir de solution de repli lorsque l’original n’est pas au format FIT.

## Direction graphique

- Fond blanc.
- Texte noir.
- Bleu clair pour les informations et courbes principales.
- Rouge pour les informations et courbes secondaires.
- Style moderne, doux et ergonomique.
- La lisibilité et le fonctionnement priment sur la direction artistique.

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

La phase actuelle reste documentaire : aucun code ne doit encore être produit.

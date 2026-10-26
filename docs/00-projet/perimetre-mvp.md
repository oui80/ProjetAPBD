# Périmètre MVP

## Inclus

- `AUTH-001` — inscription libre par email et mot de passe.
- `AUTH-002` — connexion locale.
- `AUTH-003` — connexion avec Intervals.icu.
- `ICU-001` — synchronisation des fichiers FIT depuis Intervals.icu.
- `IMP-001` — import d’un ou plusieurs fichiers FIT.
- `ACT-001` — historique personnel.
- `ACT-002` — recherche, filtre simple et tri.
- `ACT-003` — détail simple d’une activité.

Le détail présente uniquement les données disponibles : date, sport, durée, distance, allure ou vitesse, dénivelé, fréquence cardiaque, puissance et source.

## Hors MVP

- Analyses sportives avancées.
- Graphiques complexes et comparaison d’intervalles.
- Comparaison entre activités.
- Coaching, recommandations ou fonctions sociales.

La future page d’analyse doit accepter de nouvelles tuiles sans modifier toute l’application.

## Intervals.icu

La connexion utilise OAuth 2.0 avec la permission de lecture des activités. Le bouton de synchronisation récupère les activités nouvelles ou modifiées, puis télécharge leur fichier d’origine compressé.

Si l’original est un FIT, il passe dans le pipeline d’import normal. Sinon, l’application peut demander le FIT généré par Intervals.icu. Certaines activités issues de services tiers peuvent ne pas être exposées par l’API.

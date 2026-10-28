# Page 3 — Détail et analyses

## Contenu

La route privée `/activities/:id` affiche uniquement une activité appartenant à l’utilisateur connecté :

- retour vers l’historique ;
- nom, date et sport ;
- distance, durée, allure ou vitesse ;
- dénivelé, fréquence cardiaque et puissance si disponibles ;
- carte OpenStreetMap si une trace GPS existe ;
- graphiques synchronisés de FC, altitude, allure ou vitesse, cadence et puissance ;
- axe temps ou distance lorsque celui-ci est disponible ;
- tours enregistrés dans le FIT ;
- analyses indépendantes adaptées à la course, au trail ou au vélo.

Une tuile doit pouvoir être ajoutée ou retirée sans modifier les autres. Elle présente le résultat, une explication courte, la qualité des données et la méthode employée. Si ses données sont absentes, elle explique pourquoi elle n’est pas calculable.

## Analyses

- Course : relation vitesse/FC, estimation à 150 bpm sans extrapolation, dérive à vitesse comparable et évolution de cadence.
- Trail : détection de montée après lissage de l’altitude, dénivelé, temps, VAM et FC réellement disponible.
- Vélo : travail mécanique intégré, puissance moyenne, dérive FC/puissance à puissance comparable et cadence.

Chaque bloc indique « non calculable » quand ses données minimales manquent. Les pauses et intervalles temporels invalides sont exclus ; relief, vent, température et qualité des capteurs restent des limites explicites.

## Direction visuelle

Les graphiques suivent la palette éditoriale existante et restent utilisables au clavier et au toucher. Le texte reste noir sur fond blanc.

## Critères d’acceptation

- Les informations principales sont lisibles sur desktop et mobile.
- Les champs absents ne sont pas inventés.
- Le retour vers l’historique conserve les filtres précédents.
- La carte et les graphiques utilisent uniquement les échantillons réellement importés.
- Un utilisateur ne peut pas consulter l’activité d’un autre utilisateur.

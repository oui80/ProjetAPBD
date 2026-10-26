# Premières analyses futures

Les analyses sont **HORS MVP**. Elles seront ajoutées sous forme de tuiles indépendantes et resteront descriptives, jamais médicales.

## ANA-RUN-001 — Dérive cardiaque à effort comparable

**Question :** la fréquence cardiaque augmente-t-elle au fil du temps pour un effort externe similaire ?

- Données : temps, fréquence cardiaque et vitesse, distance ou puissance.
- Méthode : comparer des portions stables du début et de la fin après exclusion des pauses et variations fortes.
- Résultat : différence en bpm et en pourcentage, avec quantité de données utilisée.
- Limites : relief, chaleur, fatigue, retard cardiaque et qualité du capteur.
- Priorité proposée : première tuile après le MVP.

La tuile affiche « non calculable » lorsque l’effort n’est pas assez stable ou que les données sont insuffisantes.

## ANA-RUN-002 — Écart au profil personnel selon le terrain

**Question :** sur quelles portions l’utilisateur est-il plus rapide ou plus lent que son comportement habituel sur un terrain comparable ?

- Données : temps, distance, GPS, vitesse, altitude et historique suffisant.
- Méthode : découper le parcours en portions, les classer par pente et comparer avec une référence personnelle explicite.
- Résultat : portions au-dessus ou en dessous du comportement habituel.
- Limites : terrain, vent, boue, virages, stratégie volontaire et qualité GPS.
- Priorité proposée : après constitution d’un historique suffisant.

Sans historique, afficher seulement le profil descriptif sans inventer de référence.

## ANA-RUN-003 — Évolution de la mécanique de course

**Question :** la cadence ou les paramètres de foulée changent-ils entre le début et la fin à allure et pente comparables ?

- Données minimales : temps, vitesse et cadence.
- Données optionnelles : pente, temps de contact au sol et oscillation verticale.
- Méthode : comparer des fenêtres équivalentes après exclusion des pauses et transitions.
- Résultat : variation de cadence et des mesures réellement enregistrées.
- Limites : capteur, GPS, terrain, chaussures et faible nombre de portions comparables.
- Priorité proposée : après la dérive cardiaque.

## Règles communes

- Une tuile fonctionne sans dépendre des autres.
- Elle indique les données utilisées et leurs limites.
- L’absence de mesure n’est jamais remplacée par zéro.
- Le bleu clair représente l’information principale et le rouge une comparaison secondaire.
- Les seuils précis seront définis lors de l’implémentation de chaque tuile sur des FIT réels.

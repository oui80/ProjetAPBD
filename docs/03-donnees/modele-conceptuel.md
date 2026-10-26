# Modèle conceptuel

## Utilisateur

Email, mot de passe protégé, date de création et éventuelle connexion Intervals.icu.

## Activité

Propriétaire, nom, sport, date, durée, distance, données principales et source.

## Import ou synchronisation

Utilisateur, type de source, état du traitement et erreur éventuelle. Un import FIT conserve une empreinte du fichier ; une synchronisation Intervals.icu conserve l’identifiant externe de l’activité.

## Échantillon

Activité, instant, position GPS et mesures disponibles comme vitesse, altitude, fréquence cardiaque, cadence ou puissance.

## Tuile d’analyse

Après le MVP, une tuile utilise les données d’une activité et produit un résultat indépendant des autres tuiles.

## Relations essentielles

- Un utilisateur possède plusieurs activités.
- Une activité appartient à un seul utilisateur.
- Une activité peut posséder plusieurs échantillons.
- Une activité provient d’un import local ou d’un fichier téléchargé depuis Intervals.icu.
- La provenance indique si le fichier est original ou généré par Intervals.icu.

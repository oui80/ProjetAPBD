# Modèle conceptuel

## Utilisateur

Email, mot de passe protégé, date de création et éventuelle connexion Intervals.icu.

## Activité

Propriétaire, nom, sport, date, durée, distance et données principales.

## Import ou synchronisation

Utilisateur, état du traitement et erreur éventuelle. Un import conserve une empreinte du FIT ; une synchronisation conserve aussi l’identifiant Intervals.icu afin d’éviter les doublons.

## Échantillon

Activité, instant, position GPS et mesures disponibles comme vitesse, altitude, fréquence cardiaque, cadence ou puissance.

## Tuile d’analyse

Après le MVP, une tuile utilise les données d’une activité et produit un résultat indépendant des autres tuiles.

## Relations essentielles

- Un utilisateur possède plusieurs activités.
- Une activité appartient à un seul utilisateur.
- Une activité peut posséder plusieurs échantillons.
- Une activité peut être créée par import manuel ou synchronisation Intervals.icu.
- Cette différence reste technique et n’a pas besoin d’être mise en avant dans l’interface.

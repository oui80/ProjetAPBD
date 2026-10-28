# Page 2 — Historique

## Objectif

Afficher les activités de l’utilisateur et permettre l’import de fichiers FIT.

## En-tête

- Nom ou logo de l’application.
- Bouton « Importer des fichiers FIT ».
- Bouton « Synchroniser Intervals.icu » lorsque le compte est connecté.
- Accès au compte et à la déconnexion.

## Tableau de bord

La période 7, 30, 90 jours ou tout l’historique pilote les totaux. La synthèse montre le nombre d’activités, la distance, la durée, le dénivelé, la répartition des sports et le volume hebdomadaire lorsque ces données existent.

La forme est une estimation fondée sur Edwards TRIMP avec une FC maximale renseignée par l’utilisateur. ATL et CTL utilisent respectivement des moyennes exponentielles sur 7 et 42 jours ; la fraîcheur estimée vaut CTL − ATL. Avant 42 jours de données exploitables, la tuile indique que les données sont insuffisantes.

## Contenu

Les activités sont présentées dans une grille paginée. Chaque carte contient, lorsqu’elles existent :

- nom ;
- date ;
- sport ;
- distance ;
- durée ;
- allure ou vitesse ;
- dénivelé ;
- fréquence cardiaque moyenne ;
- puissance moyenne ;

L’utilisateur peut rechercher une activité, filtrer par sport, choisir la période et trier par date. Les filtres sont conservés dans l’URL et au retour du détail.

Le bouton Intervals.icu récupère les nouvelles activités et télécharge leurs FIT. Il affiche la dernière synchronisation et un bilan simple : importées, déjà présentes, ignorées ou en erreur.

## États

- Historique vide : expliquer comment importer un premier FIT.
- Chargement : afficher des cartes temporaires simples.
- Erreur : afficher un message et un bouton pour réessayer.
- Import terminé : indiquer les réussites, erreurs et doublons.

## Responsive

Les cartes utilisent plusieurs colonnes sur grand écran et une seule colonne sur mobile.

## Critères d’acceptation

- Seules les activités de l’utilisateur connecté sont visibles.
- Les données principales sont faciles à lire.
- Une donnée absente ne laisse pas croire qu’elle vaut zéro.
- Un clic sur une carte ouvre son détail.

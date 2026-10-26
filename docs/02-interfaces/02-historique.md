# Page 2 — Historique

## Objectif

Afficher les activités de l’utilisateur et permettre l’import de fichiers FIT.

## En-tête

- Nom ou logo de l’application.
- Bouton « Importer des fichiers FIT ».
- Bouton « Synchroniser Intervals.icu » lorsque le compte est connecté.
- Accès au compte et à la déconnexion.

## Contenu

Les activités sont présentées dans une liste compacte. Chaque carte contient, lorsqu’elles existent :

- nom ;
- date ;
- sport ;
- distance ;
- durée ;
- allure ou vitesse ;
- dénivelé ;
- fréquence cardiaque moyenne ;
- puissance moyenne ;

L’utilisateur peut rechercher une activité, filtrer par sport et trier par date.

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

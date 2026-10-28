# Fonctionnalités

Ce document est la source de vérité fonctionnelle.

## MVP

| ID | Fonctionnalité | Statut |
|---|---|---|
| AUTH-001 | Inscription libre par email et mot de passe | **VALIDÉ** |
| AUTH-002 | Connexion et déconnexion locales | **VALIDÉ** |
| AUTH-003 | Connexion OAuth avec Intervals.icu | **VALIDÉ** |
| AUTH-004 | Session utilisateur | **VALIDÉ** |
| IMP-001 | Import d’un ou plusieurs fichiers FIT | **VALIDÉ** |
| IMP-002 | Refus des fichiers invalides | **VALIDÉ** |
| IMP-003 | Détection des doublons exacts | **VALIDÉ** |
| ACT-001 | Historique des activités de l’utilisateur | **VALIDÉ** |
| ACT-002 | Recherche, filtre par sport et tri par date | **VALIDÉ** |
| ACT-003 | Affichage des informations principales | **VALIDÉ** |
| SEC-001 | Isolation des données par utilisateur | **VALIDÉ** |

## Historique et analyse

| ID | Fonctionnalité | Statut |
|---|---|---|
| ANA-001 | Page composée de tuiles d’analyse indépendantes | **VALIDÉ** |
| ANA-002 | Graphiques interactifs synchronisés | **VALIDÉ** |
| ANA-003 | Carte GPS | **VALIDÉ** |
| ANA-004 | Consultation des tours enregistrés | **VALIDÉ** |
| ANA-005 | Charge Edwards TRIMP, ATL, CTL et fraîcheur estimée | **VALIDÉ** |
| ANA-006 | Efficacité descriptive course, trail et vélo | **VALIDÉ** |
| ICU-001 | Synchronisation des activités Intervals.icu | **VALIDÉ** |
| ICU-002 | Téléchargement des FIT depuis l’API | **VALIDÉ** |

## Règles

- Une métrique absente reste absente.
- Chaque analyse est indépendante et expose sa méthode et ses limites.
- Les indicateurs de charge ne sont pas des mesures médicales de récupération.
- Le fonctionnement FIT reste utilisable sans Intervals.icu.

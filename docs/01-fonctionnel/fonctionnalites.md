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

## Après le MVP

| ID | Fonctionnalité | Statut |
|---|---|---|
| ANA-001 | Page composée de tuiles d’analyse indépendantes | **HORS MVP** |
| ANA-002 | Graphiques interactifs | **HORS MVP** |
| ANA-003 | Carte GPS | **HORS MVP** |
| ANA-004 | Comparaison de tours ou intervalles | **HORS MVP** |
| ICU-001 | Synchronisation des activités Intervals.icu | **VALIDÉ** |
| ICU-002 | Téléchargement du fichier original ou du FIT généré | **VALIDÉ** |

## Règles

- Une métrique absente reste absente.
- La source de chaque activité est affichée.
- L’ajout futur d’une analyse ne doit pas modifier l’import ou l’historique.
- Le fonctionnement FIT reste utilisable sans Intervals.icu.
- La provenance distingue un FIT original d’un FIT généré par Intervals.icu.

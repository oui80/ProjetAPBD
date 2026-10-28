# Décisions

| Décision | Statut |
|---|---|
| L’inscription est libre. | **VALIDÉ** |
| Le MVP couvre surtout l’import FIT et l’historique. | **VALIDÉ** |
| Le détail d’une activité reste simple au MVP. | **VALIDÉ** |
| Les analyses avancées sont ajoutées plus tard par tuiles indépendantes. | **VALIDÉ** |
| L’interface suit la direction « Sport Editorial — Performance Lab » : papier, noir, orange ponctuel et photographie sportive. | **VALIDÉ** |
| La direction artistique reste compatible avec la lisibilité, l’accessibilité et les usages fonctionnels. | **VALIDÉ** |
| Intervals.icu est le service de synchronisation. | **VALIDÉ** |
| Le bouton importe directement les FIT fournis par l’API. | **VALIDÉ** |
| L’import FIT manuel utilise le SDK Garmin, une empreinte SHA-256 par utilisateur et une transaction par fichier. | **VALIDÉ** |
| L’architecture reste un monolithe React, Express et PostgreSQL. | **PROPOSÉ** |
| Les primitives visuelles et tokens sont mutualisés sans introduire de framework CSS. | **VALIDÉ** |
| « PACE / LAB » est le nom de travail. | **PROPOSÉ** |
| La dérive cardiaque comparable est la première analyse envisagée. | **PROPOSÉ** |
| Le tableau de bord utilise Edwards TRIMP et des moyennes exponentielles ATL 7 j / CTL 42 j avec une FC maximale configurable. | **VALIDÉ** |
| Le détail combine carte OpenStreetMap, séries FIT synchronisées, tours et analyses indépendantes par sport. | **VALIDÉ** |
| Un push sur `master` teste, publie dans GHCR et déploie automatiquement `p14` par digest. | **VALIDÉ** |
| Le lancement manuel GitHub Actions reste disponible comme procédure de secours. | **VALIDÉ** |

Les choix secondaires concernant les FIT, l’altitude, les sauvegardes ou le serveur seront pris simplement pendant l’implémentation lorsqu’ils deviennent nécessaires.

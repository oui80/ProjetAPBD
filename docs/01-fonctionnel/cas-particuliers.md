# Cas particuliers

| Cas | Comportement attendu |
|---|---|
| Fichier invalide | Refuser le fichier et afficher une erreur simple. |
| Lot partiellement invalide | Importer les fichiers valides et signaler les autres. |
| Doublon exact | Ne pas créer une seconde activité. |
| Donnée absente | Ne pas afficher de valeur inventée. |
| Pas de GPS | L’activité reste consultable sans carte. |
| Mauvais sport dans le fichier | Afficher le sport fourni ; la correction manuelle viendra plus tard. |
| Plusieurs sessions dans un FIT | Importer la première session exploitable au MVP et signaler la limitation. |
| Connexion Intervals.icu refusée | Revenir au compte sans enregistrer de connexion incomplète. |
| Synchronisation indisponible | L’import FIT manuel continue de fonctionner normalement. |
| Original non FIT | Télécharger le FIT généré par Intervals.icu si disponible. |
| Activité non exposée par l’API | La signaler comme ignorée sans bloquer le reste. |

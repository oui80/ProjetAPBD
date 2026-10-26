# Import FIT

## Parcours

1. L’utilisateur sélectionne un ou plusieurs fichiers FIT.
2. Le serveur vérifie le format et détecte les doublons exacts.
3. Les fichiers valides sont décodés.
4. Les activités et leurs mesures sont enregistrées.
5. Un résultat est affiché pour chaque fichier.

## Données utiles

- Date et sport.
- Durée et distance.
- Allure ou vitesse.
- GPS et altitude.
- Fréquence cardiaque.
- Cadence et puissance.
- Tours lorsqu’ils existent.

Une donnée manquante reste absente. Le MVP ne cherche pas à corriger ou reconstruire les mesures.

## Règles simples

- Un fichier invalide est refusé.
- Un fichier déjà importé par le même utilisateur est ignoré.
- Dans un lot, l’échec d’un fichier ne bloque pas les autres.
- Pour un FIT multisession, seule la première session exploitable est importée au MVP.
- Le fichier original peut être conservé ou supprimé selon la solution la plus simple lors de l’implémentation.

Le SDK JavaScript officiel Garmin est le candidat privilégié pour décoder le format : [Garmin FIT SDK](https://developer.garmin.com/fit/get-the-sdk/).

## Synchronisation Intervals.icu

La synchronisation récupère d’abord la liste des activités, puis télécharge le fichier original compressé. Si ce fichier n’est pas un FIT, elle peut demander un FIT généré par Intervals.icu. Le fichier obtenu passe ensuite dans le même pipeline que l’import manuel.

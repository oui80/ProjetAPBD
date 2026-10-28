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

## Décisions d’implémentation

- Le backend utilise le SDK officiel `@garmin/fitsdk` et exige un FIT dont l’intégrité CRC est valide.
- L’upload manuel accepte au maximum 10 fichiers de 20 Mo chacun en mémoire ; le fichier original n’est pas conservé.
- L’empreinte SHA-256 est unique par utilisateur. Un même fichier peut donc appartenir à deux utilisateurs différents.
- Chaque fichier est enregistré dans sa propre transaction PostgreSQL avec ses tours et ses échantillons.
- L’allure moyenne est calculée uniquement lorsqu’une vitesse moyenne FIT strictement positive existe ; toutes les autres mesures absentes restent `NULL`.

Le SDK JavaScript officiel Garmin est le candidat privilégié pour décoder le format : [Garmin FIT SDK](https://developer.garmin.com/fit/get-the-sdk/).

## Synchronisation Intervals.icu

La synchronisation récupère la liste des activités, télécharge leur FIT puis utilise exactement le même pipeline que l’import manuel. L’application ne cherche pas à expliquer d’où Intervals.icu avait lui-même obtenu l’activité.

# Parcours utilisateur

## Parcours principal

1. L’utilisateur crée librement son compte ou se connecte.
2. Il arrive sur son historique.
3. Si l’historique est vide, l’interface lui propose d’importer un FIT.
4. Il importe un ou plusieurs fichiers.
5. Les activités valides apparaissent dans son historique.
6. Il ouvre une activité pour consulter ses informations principales.

## Connexion Intervals.icu

L’utilisateur choisit « Connecter Intervals.icu » depuis son compte. Cette connexion sert uniquement à importer ses activités ; elle ne remplace pas la connexion à l’application.

Le bouton « Synchroniser Intervals.icu » récupère les activités nouvelles ou modifiées, télécharge leurs FIT et les fait passer dans le même pipeline que les imports manuels.

Le résultat indique simplement les activités ajoutées, déjà présentes ou en erreur.

## Erreurs simples

- Un fichier invalide affiche un message compréhensible.
- Un doublon exact n’est pas importé une seconde fois.
- Une donnée absente n’est ni affichée ni remplacée par zéro.
- Un utilisateur ne peut jamais consulter les activités d’un autre.

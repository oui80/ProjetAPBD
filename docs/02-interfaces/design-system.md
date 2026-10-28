# Direction graphique — Sport Editorial / Performance Lab

## Intention

PACE / LAB adopte une identité éditoriale sportive : typographie condensée monumentale,
photographie en mouvement, grilles asymétriques et microtypographie précise. Le système doit
rester fonctionnel, rapide et accessible. L’orange guide le regard ; il ne devient jamais une
couleur décorative omniprésente.

Cette direction remplace **Precision Sport / Soft Lab**.

## Tokens

Les variables partagées vivent dans `frontend/src/styles/tokens.css`.

| Token | Valeur | Usage |
|---|---:|---|
| `--color-ink` | `#111111` | Texte, actions principales, lignes fortes |
| `--color-paper` | `#F7F6F2` | Fond général |
| `--color-surface` | `#FFFFFF` | Zone de formulaire et surfaces utiles |
| `--color-accent` | `#F05A36` | Accent éditorial, sélection, interaction ponctuelle |
| `--color-sage` | `#76837B` | Ton photographique et soutien |
| `--color-fog` | `#D8DBD6` | Repères discrets |
| `--color-muted` | `#646866` | Texte secondaire accessible |
| `--color-border` | `#DEDEDA` | Séparateurs fins |

Les espacements suivent une échelle de `0.25rem` à `6rem`. Les marges de page sont fluides via
`--page-gutter`, avec une largeur maximale de `100rem`.

## Typographie

- **Display** : pile sans-serif condensée système (`Arial Narrow`, `Liberation Sans Narrow`,
  puis alternatives Helvetica/Arial), en graisse forte et avec un interlettrage resserré.
- **Interface** : Inter lorsqu’elle est présente, puis Helvetica Neue/Arial.
- Les grands titres utilisent `clamp()` et une casse capitale pour rester expressifs de 320 à
  1440 px et au-delà.
- Les labels utilisent une petite taille, une graisse forte et un interlettrage ample.
- Les futures métriques utiliseront des chiffres tabulaires et sépareront visuellement valeur et
  unité. Aucune métrique fictive n’est affichée dans la tranche actuelle.

Ce choix de piles système évite une requête réseau et une licence de police supplémentaire. Une
police locale dédiée pourra être ajoutée plus tard si son gain visuel justifie son poids.

## Composition

- Grille précise, grandes zones négatives et séparateurs d’un pixel.
- Peu de rayons, aucune ombre de carte lourde et pas de glassmorphism.
- L’accueil articule un titre monumental, une photographie dominante et le formulaire.
- L’historique reprend le même langage avec un état vide structuré, sans fausse statistique.
- Sur mobile, la photographie précède le formulaire et les compositions passent sur une colonne
  sans conserver artificiellement les proportions desktop.

## Primitives réutilisables

`frontend/src/ui.tsx` contient uniquement les éléments actuellement partagés :

- `Brand` pour le mot-symbole et son descripteur ;
- `EditorialLabel` pour la microtypographie de section ;
- `Button` avec variantes principale, secondaire et texte.

Les champs, boutons, états et conteneurs utilisent les classes communes de
`styles/components.css`. Les styles propres aux écrans restent dans `auth.css` et
`activities.css`.

## Interactions et accessibilité

- Zones interactives d’au moins 44 px.
- Focus visible orange et contraste AA visé.
- Choix connexion/inscription réalisé avec deux boutons et `aria-pressed`, sans sémantique
  incomplète de tablist.
- États de chargement et erreurs annoncés par `role="status"` et `role="alert"`.
- Transitions courtes ; les mouvements sont neutralisés avec `prefers-reduced-motion`.
- L’image principale possède des dimensions réservées, une alternative descriptive et une
  priorité de chargement explicite.

## Photographie principale

Les fichiers `runner-editorial.webp` (1920 × 1080, environ 69 Ko) et
`runner-editorial-square.webp` (900 × 900, environ 35 Ko) sont importés par Vite afin de respecter
le chemin public local comme `/projet-apbd/`.

Le visuel est une création originale générée pour PACE / LAB le 28 octobre 2026 avec l’outil de
génération d’images OpenAI. Direction donnée : coureur adulte en mouvement, architecture béton,
traitement éditorial cinématique désaturé, cadrage à droite et absence de marque ou de texte. Il
ne provient pas d’une photothèque tierce et ne nécessite donc pas d’attribution Unsplash.

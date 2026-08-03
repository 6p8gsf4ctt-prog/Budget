# Diagnostic et refonte — Budget 3.0.0

## Structure analysée

La version 2.2.0 reposait sur sept éléments principaux : `index.html`, `style.css`, `app.js`, `storage.js`, `service-worker.js`, `manifest.webmanifest` et les icônes PWA. Les données étaient enregistrées dans IndexedDB (`mon-budget-secure-db`) et dans la clé miroir `mon-budget-data-v3`.

## Fonctions conservées

- espaces Personnel et Commun ;
- revenus et lignes de dépenses ;
- catégories financières et types dépense, épargne et transfert ;
- prévisions, paiements, encaissements et réserve ;
- masquage global des montants ;
- enregistrement automatique local ;
- export, import et instantanés locaux ;
- fonctionnement hors ligne et installation PWA ;
- lecture des anciennes clés et anciennes sauvegardes JSON.

## Fichiers modifiés

- `index.html` : nouvelle structure des écrans et composants ;
- `style.css` : identité ambre, composants iOS, safe areas et accessibilité ;
- `app.js` : navigation, rendus, formulaires, réglages, métadonnées et migration ;
- `storage.js` : copies préalables aux opérations risquées et métadonnées d’instantanés ;
- `service-worker.js` : nouveau cache hors ligne ;
- `manifest.webmanifest` : identité PWA Budget ;
- `assets/icon-180.png`, `icon-192.png`, `icon-512.png` : nouvelle icône ambre ;
- documentation de déploiement et historique.

## Migration

La migration complète les champs manquants sans réinitialiser les objets existants. Avant toute migration d’une structure antérieure, une copie `before-migration` est créée. Les couleurs historiques des catégories sont normalisées vers `#FF9F0A` et les anciens émojis de catégorie sont convertis en noms d’icônes SVG.

## Vérifications effectuées

- validation syntaxique de tous les fichiers JavaScript ;
- validation JSON du manifeste ;
- absence d’identifiants HTML dupliqués ;
- chargement des quatre écrans sans erreur d’exécution ;
- ajout d’une dépense, d’un revenu et d’une échéance ;
- masquage cohérent des montants ;
- migration réelle d’un état 2.2.0 vers 3.0.0 avec conservation des totaux ;
- validation du format d’export et des erreurs d’importation ;
- manifeste installable sans erreur ;
- service worker actif et rechargement réussi hors ligne.

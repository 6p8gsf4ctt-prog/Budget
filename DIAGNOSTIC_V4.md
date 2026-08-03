# Diagnostic et validation — Budget 4.0.0

## Structure conservée

- `index.html` : trois écrans principaux, feuilles modales et réglages.
- `app.js` : données, migration, calculs, rendus, formulaires et import/export.
- `storage.js` : IndexedDB, copie miroir locale et instantanés ; clés inchangées.
- `style.css` : identité Apple sombre et ambre, safe areas et composants tactiles.
- `service-worker.js` : cache hors ligne versionné.
- `manifest.webmanifest` et `assets/` : installation PWA.

## Migration

- `overview` et `summary` deviennent `future`, désormais affiché comme Épargne de précaution.
- `personal` et `shared` deviennent `budget` tout en conservant l’espace actif.
- Une réserve V2/V3 déjà configurée conserve son objectif et son solde.
- Une réserve V3 laissée à l’état non configuré reçoit l’objectif et le solde initial de 5 000 €.
- Le tableau `forecast.items` reste inchangé : aucune opération prévue n’est déplacée ou supprimée.
- Le schéma d’export reste en version 1, car la structure des données financières n’est pas rompue.

## Vérifications automatisées effectuées

- syntaxe JavaScript validée avec `node --check` ;
- correspondance des identifiants HTML et des références JavaScript vérifiée ;
- démarrage testé dans Chromium avec un stockage local simulé ;
- état initial vérifié : version 4.0.0, onglet `future`, objectif 5 000 €, solde 5 000 € ;
- navigation Précaution / Budget / Réglages testée ;
- ouverture du formulaire de prévision testée ;
- absence d’exception JavaScript au chargement et pendant ces interactions ;
- présence d’un seul écran actif et de trois onglets contrôlée.

## Contrôles à réaliser sur iPhone

- mise à jour depuis l’ancienne PWA installée sur le même domaine ;
- partage et téléchargement du fichier JSON avec iOS ;
- rendu des safe areas sur les modèles avec encoche ou Dynamic Island ;
- fermeture complète puis lancement hors ligne depuis l’écran d’accueil.

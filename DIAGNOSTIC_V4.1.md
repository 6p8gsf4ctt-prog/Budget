# Diagnostic et validation — Budget 4.1.0

## Problème corrigé

Les lignes de mouvements utilisaient une disposition horizontale avec un titre forcé sur une seule ligne. Avec un intitulé long, la zone de texte ne se réorganisait pas de manière naturelle sur les petits écrans.

## Correction

- Conteneurs de chronologie limités à 100 % de la largeur disponible.
- Ligne convertie en grille avec une colonne centrale `minmax(0, 1fr)`.
- Intitulés autorisés sur plusieurs lignes avec coupure de secours des chaînes très longues.
- Montants conservés sans retour à la ligne.
- Sous 381 px, le montant passe sous le texte afin de préserver une zone lisible.
- Aucun décalage de l’en-tête n’a été ajouté : la capture fournie correspondait à une page déjà défilée.

## Compatibilité

Aucune modification du schéma de données, des clés IndexedDB, de la copie locale, des imports/exports ou des calculs. Le cache du service worker porte désormais le nom `budget-v4.1.0`.

## Tests effectués

- Rendu complet de l’application à 414 px, 375 px et 320 px de largeur.
- Vérification que `scrollWidth` reste égal à la largeur de la fenêtre : aucun défilement horizontal.
- Vérification du retour à la ligne de « Contrôle technique + réparation Laguna ».
- Vérification du repositionnement du montant sous 381 px.
- Contrôle syntaxique de `app.js`, `storage.js` et `service-worker.js`.
- Validation JSON du manifeste PWA.

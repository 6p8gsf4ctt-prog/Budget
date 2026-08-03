# Budget 4.1.0

Application PWA locale pour piloter deux budgets courants et une épargne de précaution.

## Organisation

- **Épargne de précaution** : écran d’entrée centré sur une réserve cible de 5 000 €, son solde actuel, toutes les dépenses et rentrées prévues, le solde prévisionnel et le montant à renflouer.
- **Budget** : budgets Personnel et Commun conservés dans une structure commune, avec revenus, catégories, montants prévus, utilisés et restants.
- **Réglages** : période, données, sauvegardes, affichage, stockage et informations PWA.

## Données

Toutes les données restent sur l’appareil dans IndexedDB, avec une copie miroir locale et des instantanés de sécurité. Les clés de stockage des versions précédentes sont conservées. La migration vers la V4 ne modifie pas les revenus, dépenses, catégories, espaces ni opérations prévisionnelles existants.

Une réserve non configurée est initialisée à un solde et un objectif de 5 000 €. Une réserve déjà configurée conserve ses valeurs.

## Sauvegarde

L’export produit un fichier `Budget_YYYY-MM-DD_HH-mm.json`. L’import accepte les sauvegardes Budget actuelles ainsi que les anciens formats reconnus par l’application.

## Correctif 4.1

Les mouvements de l’épargne de précaution sont désormais entièrement adaptatifs : les intitulés longs reviennent sur plusieurs lignes et ne peuvent plus élargir l’application au-delà de la largeur de l’iPhone. Sur les écrans les plus étroits, le montant se place automatiquement sous le libellé.

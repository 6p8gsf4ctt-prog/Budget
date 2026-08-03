# Budget — Version 3.0.0

Application PWA locale de gestion budgétaire personnelle et commune.

## Navigation

- **Synthèse** : disponible, revenus, dépenses, progression, catégories, échéances et solde estimé.
- **Budget** : contrôle segmenté Personnel / Commun, revenus, catégories, budgets prévus et dépenses réalisées.
- **À venir** : chronologie des paiements et encaissements, avec projection de fin de période.
- **Réglages** : budget, données, sauvegarde, affichage, stockage et informations PWA.

## Stockage et compatibilité

Les données restent enregistrées dans la base IndexedDB `mon-budget-secure-db` et dans la clé miroir `mon-budget-data-v3`. Les anciennes clés `mon-budget-data-v2` et `mon-budget-data-v1` restent lisibles.

La migration vers la version 3 complète uniquement les champs manquants. Elle conserve les espaces, revenus, catégories, lignes de dépenses, prévisions et instantanés existants.

## Sauvegardes

Les exports utilisent le nom `Budget_YYYY-MM-DD_HH-mm.json` et un schéma explicite compatible avec les anciennes sauvegardes de l’application.

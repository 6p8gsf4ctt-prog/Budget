# Déploiement de Budget 3.0.0

1. Exporter une sauvegarde JSON de précaution depuis la version actuellement installée.
2. Remplacer les fichiers du dépôt par le contenu de cette archive.
3. Publier les fichiers à la racine du site HTTPS utilisé par la PWA.
4. Vérifier que `service-worker.js`, `manifest.webmanifest`, `app.js`, `storage.js` et `style.css` sont servis sans redirection.
5. Ouvrir une première fois l’application avec une connexion afin que le cache `budget-v3.0.0` soit installé.
6. Fermer puis rouvrir l’application installée sur l’iPhone.

La base IndexedDB et la clé `mon-budget-data-v3` sont inchangées. Les données existantes sont chargées puis normalisées en mémoire avant d’être réenregistrées dans le nouveau format.

En cas d’ancienne interface persistante, fermer complètement la PWA. Une suppression puis une réinstallation du raccourci peut être nécessaire uniquement pour renouveler l’icône d’écran d’accueil ; elle ne doit être réalisée qu’après export d’une sauvegarde JSON.

# Déploiement de Budget 4.0.0

1. Remplacer l’ensemble des fichiers de la version publiée par le contenu du dossier V4.
2. Conserver le même domaine, le même chemin et le même protocole HTTPS afin que l’application retrouve IndexedDB et `localStorage`.
3. Ne pas renommer le dossier ou modifier le `scope` du manifeste lors d’une mise à jour installée.
4. Ouvrir une première fois l’application en ligne. Le service worker `budget-v4.0.0` remplace alors l’ancien cache.
5. Vérifier que l’écran d’entrée est **Épargne de précaution** et que les anciennes opérations apparaissent dans la chronologie.
6. Contrôler les budgets Personnel et Commun, puis effectuer un export JSON de sécurité.
7. Fermer et rouvrir l’application hors ligne pour valider le cache PWA.

La mise à jour conserve les noms de base IndexedDB et les clés de stockage existantes. Une copie locale est créée automatiquement avant la migration des données d’une version antérieure.

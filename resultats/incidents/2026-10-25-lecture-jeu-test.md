# Incident : lecture du jeu de test scellé par une commande de contrôle

- Date : 25/10/2026, étape 5.1 (configuration Vercel).
- Commande en cause : contrôle du contenu de `app/dist` dans un clone temporaire du dépôt, hors du dossier du projet (commit `b29ef56` et changements de l’étape 5.1) ; calcul des empreintes SHA-256 de tous les fichiers de `golden/`, `resultats/`, `bench/`, `scripts/` et `modeles/` du clone, pour les comparer à celles des fichiers de `app/dist`. Le parcours incluait `golden/test/` et `scripts/golden/modeles-test.mjs`, contrairement à `CLAUDE.md`.
- Rien n'a été affiché : ni nom ni contenu de fichier du jeu de test ; seules les correspondances avec `app/dist` étaient imprimées.
- Aucune correspondance avec `app/dist` pour ces fichiers (les 4 correspondances viennent de `golden/dev/` et de `modeles/MANIFEST.sha256`, acceptées par Sébastien).
- Conséquence sur les mesures : aucune information du jeu de test n'a servi à un réglage (règles, modèle, post-traitement ou seuils).
- Prévention : tout contrôle qui parcourt des dossiers exclut explicitement `golden/test/` et `scripts/golden/modeles-test.mjs`, car l'interdiction de lecture ne bloque pas les commandes du terminal.

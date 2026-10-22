# mask — règles pour Claude Code

- Le jeu de test (golden/test/) et ses modèles (scripts/golden/modeles-test.mjs) sont scellés : ne jamais les ouvrir, les lire, les afficher ou les analyser, sauf demande explicite de Sébastien dans le message en cours, pour le lot de mesure finale.
- La mise au point des règles et des modèles se fait uniquement sur le jeu de développement (golden/dev/).
- L'évaluateur s'exécute par défaut sur le jeu de développement ; ne jamais le lancer sur le jeu de test sans demande explicite de Sébastien dans le message en cours.
- Jamais de données réelles dans ce dépôt public.
- Aucun git push : Sébastien publie lui-même.
- Le jeu de robustesse (golden/robustesse/) peut être lu pour analyser des résultats, mais ne sert jamais à ajuster les règles, un modèle ou son post-traitement ; ses fichiers ne sont jamais modifiés (seuils.md, amendement (4)).

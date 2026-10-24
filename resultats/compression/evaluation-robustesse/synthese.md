# Jeu de robustesse : mesure unique de C sous WASM (option 3, étape 4b)

> **Jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils** (seuils.md, amendement (4)). Une adresse manquée vaut environ 5 points de rappel.

- Mesure unique, 24/10/2026, une exécution par détecteur, arbre propre au commit `cb2290e` (étiquette `mask-option3-gel` sur `33c8431`).
- Détecteurs : modèle seul (`src/modele.mjs`) et combiné (`src/combine.mjs`, règles 0.4.0 + modèle 0.2.0), sous `--moteur wasm --modele compression/fp16-mixte/model.onnx` (C fp16-mixte v2, SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`), onnxruntime-web 1.31.0-dev.20260914-8d85527a0, WASM dans Node, 1 thread.
- Rapports : `modele.{json,md}`, `combine.{json,md}` de ce dossier, produits hors du dépôt sur l'arbre propre puis copiés à l'identique (vérifié avec `cmp`).
- Comparaison : mesures du lot 1.5a sous onnxruntime-node natif, q8 Xenova (`resultats/robustesse/modele.md`, commit `73fbf8e` ; `resultats/robustesse/combine.md`, commit `9aaafc4`), marquées « moteur non représentatif de l'app » (amendement (5)).

## Seuils

| # | Critère | Bloquant | Modèle seul C (WASM) | Combiné C (WASM) | Modèle 1.5a (natif) | Combiné 1.5a (natif) | Seuil | Verdict combiné C |
|---|---|---|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | oui | 4,8 % (2/42) | 95,2 % (40/42) | 4,8 % (2/42) | 95,2 % (40/42) | 100 % | non atteint |
| S3 | Rappel PERSONNE | oui | 96,7 % (87/90) | 96,7 % (87/90) | 96,7 % (87/90) | 96,7 % (87/90) | ≥ 95 % | atteint |
| S4 | Rappel ADRESSE | oui | 5,3 % (1/19) | 63,2 % (12/19) | 5,3 % (1/19) | 63,2 % (12/19) | ≥ 90 % | non atteint |
| S5 | Rappel ORGANISATION | non | 100 % (35/35) | 100 % (35/35) | 100 % (35/35) | 100 % (35/35) | ≥ 85 % | atteint |
| S6 | Précision globale | non | 98,8 % (159 corrects, 2 erreurs) | 99,0 % (196 corrects, 2 erreurs) | 98,8 % (159 corrects, 2 erreurs) | 99,0 % (197 corrects, 2 erreurs) | ≥ 80 % | atteint |

Écarts constatés entre le combiné C et le combiné 1.5a, hors seuils (listes détaillées des rapports) :

- Oublis : `rob-avocat-01`, PERSONNE « nancy fournier » : oubli chez C, partiel au 1.5a. Les autres oublis sont identiques (14 de chaque côté).
- Erreurs : C `rob-ec-03` « experts-comptables » (NON_ETIQUETE) ; 1.5a `rob-rh-04` « Qualité » (NON_ETIQUETE).
- Types différents : 6 chez C, 7 au 1.5a (`rob-ec-02`, ORGANISATION « Moulins Reynaud » proposée LIEU, au 1.5a seulement).
- Masques : 221 chez C, 222 au 1.5a.

Modèle seul : seuils identiques ; diffèrent les rubriques rappel par type, couverture partielle, débordement, types différents et listes.

## Seuils bloquants non atteints par le combiné C

Nature du cas difficile : tableau « Contenu » de `golden/robustesse/README.md` pour le document. Ces 9 éléments figurent aussi, avec le même statut, dans les oublis du combiné 1.5a.

### S2 — formats fixes (40/42)

| Document | Type | Statut | Élément étiqueté | Cas difficile (README) |
|---|---|---|---|---|
| rob-ec-03 | IBAN | partiel | « FR76 1660 7003 2108 7654⏎3210 957 » | IBAN coupé en fin de ligne |
| rob-rh-03 | NIR | oubli | « 2 91 07 99 351 048 / 53 » | NIR d'une personne née à l'étranger avec clé séparée par « / » |

### S4 — adresses (12/19)

| Document | Statut | Élément étiqueté | Cas difficile (README) |
|---|---|---|---|
| rob-avocat-02 | partiel | « parc d'activités des Gabrielles, lot 14, 83500 La Seyne-sur-Mer » | zone d'activités |
| rob-avocat-02 | partiel | « lieu-dit Les Bastidons, chemin des Oliviers, 83330 Le Castellet » | lieu-dit |
| rob-avocat-03 | partiel | « BP 207, 06002 Nice Cedex 1 » | boîte postale et Cedex |
| rob-avocat-05 | partiel | « 5 impasse des Glycines, appartement 3, 13090 Aix-en-Provence » | non désigné pour cette adresse ; le README cite pour ce document les espaces fines insécables (la ligne s'ouvre par « Adresse » suivi d'une espace fine insécable) |
| rob-ec-04 | partiel | « route de Lyon » | adresse réduite à la voie |
| rob-rh-01 | partiel | « Mas de la Cabrière, quartier Saint-Martin, 13310 Saint-Martin-de-Crau » | mas et quartier ; Saint-Martin dans les adresses |
| rob-rh-05 | partiel | « Les Hauts de Saint-Jean, bâtiment 4⏎83170 BRIGNOLES » | résidence sans numéro |

« Partiel » : au moins une lettre ou un chiffre de l'élément est masqué, mais pas tous (amendement (3)). ⏎ : saut de ligne dans l'élément étiqueté.

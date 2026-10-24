# Évaluation — combine 0.1.0+regles@0.4.0+modele@0.2.0+compression/fp16-mixte/model.onnx@860504f2bf11+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node — jeu robustesse

> **jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils**

- Date (UTC) : 2026-10-24T10:40:59.582Z
- Commit : `cb2290e32db72d4edc5ddce2b060783a88cccb84` (arbre propre : oui)
- Détecteur : combine 0.1.0+regles@0.4.0+modele@0.2.0+compression/fp16-mixte/model.onnx@860504f2bf11+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node (`src/combine.mjs`)
- Moteur : onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (WASM, ort.node.min.mjs dans Node), 1 thread ; modèle `compression/fp16-mixte/model.onnx` (220500160 octets, SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`) ; tokenizer et configuration camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc
- Documents : 15
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 95,2 % (40/42) | 100,0 % | oui | non atteint |
| S3 | Rappel PERSONNE | 96,7 % (87/90) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 63,2 % (12/19) | 90,0 % | oui | non atteint |
| S5 | Rappel ORGANISATION | 100,0 % (35/35) | 85,0 % | non | atteint |
| S6 | Précision globale | 99,0 % (196 corrects, 2 erreurs) | 80,0 % | non | atteint |

## Rappel par type

| Type | Trouvés / total | Rappel | Couverture partielle |
|---|---|---|---|
| ADRESSE | 12 / 19 | 63,2 % | 7 |
| CARTE (S2) | 1 / 1 | 100,0 % | 0 |
| EMAIL (S2) | 16 / 16 | 100,0 % | 0 |
| IBAN (S2) | 2 / 3 | 66,7 % | 1 |
| NIR (S2) | 1 / 2 | 50,0 % | 0 |
| NUMERO_DOSSIER | 4 / 6 | 66,7 % | 0 |
| ORGANISATION | 35 / 35 | 100,0 % | 0 |
| PERSONNE | 87 / 90 | 96,7 % | 1 |
| SIREN (S2) | 4 / 4 | 100,0 % | 0 |
| SIRET (S2) | 5 / 5 | 100,0 % | 0 |
| TELEPHONE (S2) | 11 / 11 | 100,0 % | 0 |
| TVA_INTRA | 3 / 3 | 100,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 9 / 195 éléments (4,6 %).

## Précision

- Masques (après fusion des chevauchements) : 221
- Corrects : 196 ; erreurs : 2 ; précision : 99,0 %
- Erreurs par catégorie : NON_ETIQUETE 2
- Masques sur un neutre seul (ni réussite ni erreur) : 23
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 2 / 10
- LIEU_ISOLE : 22 / 22

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 37 sur 3071 masqués (1,2 %).

Spans retrouvés avec un type proposé différent : 6.

## Oublis

| Document | Type | Statut | Extrait |
|---|---|---|---|
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-02 | ADRESSE | partiel | parc d'activités des Gabrielles, lot 14… |
| rob-avocat-02 | ADRESSE | partiel | lieu-dit Les Bastidons, chemin des Oliv… |
| rob-avocat-03 | NUMERO_DOSSIER | oubli | 26-0412-OB |
| rob-avocat-03 | ADRESSE | partiel | BP 207, 06002 Nice Cedex 1 |
| rob-avocat-05 | PERSONNE | partiel | N’DIAYE |
| rob-avocat-05 | ADRESSE | partiel | 5 impasse des Glycines, appartement 3, … |
| rob-ec-01 | NUMERO_DOSSIER | oubli | 2021-0457 |
| rob-ec-03 | IBAN | partiel | FR76 1660 7003 2108 7654⏎3210 957 |
| rob-ec-04 | ADRESSE | partiel | route de Lyon |
| rob-rh-01 | ADRESSE | partiel | Mas de la Cabrière, quartier Saint-Mart… |
| rob-rh-03 | NIR | oubli | 2 91 07 99 351 048 / 53 |
| rob-rh-05 | ADRESSE | partiel | Les Hauts de Saint-Jean, bâtiment 4⏎831… |

## Erreurs

| Document | Catégorie | Extrait |
|---|---|---|
| rob-avocat-02 | NON_ETIQUETE | Noël |
| rob-ec-03 | NON_ETIQUETE | experts-comptables |

## Types différents

| Document | Type attendu | Type proposé | Extrait |
|---|---|---|---|
| rob-avocat-01 | PERSONNE | LIEU | Nancy |
| rob-avocat-04 | ORGANISATION | LIEU | Cabinet Chabert |
| rob-avocat-05 | ORGANISATION | PERSONNE | Atelier Le Goff |
| rob-ec-02 | ADRESSE | LIEU | rue Paradis, Marseille |
| rob-rh-01 | ORGANISATION | LIEU | Domaine des Trois Chênes |
| rob-rh-03 | ORGANISATION | LIEU | Clinique vétérinaire des Calanques |

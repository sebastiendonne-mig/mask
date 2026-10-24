# Évaluation — modele 0.2.0+compression/fp16-mixte/model.onnx@860504f2bf11+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node — jeu robustesse

> **jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils**

- Date (UTC) : 2026-10-24T10:40:45.700Z
- Commit : `cb2290e32db72d4edc5ddce2b060783a88cccb84` (arbre propre : oui)
- Détecteur : modele 0.2.0+compression/fp16-mixte/model.onnx@860504f2bf11+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node (`src/modele.mjs`)
- Moteur : onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (WASM, ort.node.min.mjs dans Node), 1 thread ; modèle `compression/fp16-mixte/model.onnx` (220500160 octets, SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`) ; tokenizer et configuration camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc
- Documents : 15
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 4,8 % (2/42) | 100,0 % | oui | non atteint |
| S3 | Rappel PERSONNE | 96,7 % (87/90) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 5,3 % (1/19) | 90,0 % | oui | non atteint |
| S5 | Rappel ORGANISATION | 100,0 % (35/35) | 85,0 % | non | atteint |
| S6 | Précision globale | 98,8 % (159 corrects, 2 erreurs) | 80,0 % | non | atteint |

## Rappel par type

| Type | Trouvés / total | Rappel | Couverture partielle |
|---|---|---|---|
| ADRESSE | 1 / 19 | 5,3 % | 18 |
| CARTE (S2) | 0 / 1 | 0,0 % | 0 |
| EMAIL (S2) | 2 / 16 | 12,5 % | 0 |
| IBAN (S2) | 0 / 3 | 0,0 % | 1 |
| NIR (S2) | 0 / 2 | 0,0 % | 0 |
| NUMERO_DOSSIER | 0 / 6 | 0,0 % | 0 |
| ORGANISATION | 35 / 35 | 100,0 % | 0 |
| PERSONNE | 87 / 90 | 96,7 % | 1 |
| SIREN (S2) | 0 / 4 | 0,0 % | 0 |
| SIRET (S2) | 0 / 5 | 0,0 % | 0 |
| TELEPHONE (S2) | 0 / 11 | 0,0 % | 0 |
| TVA_INTRA | 0 / 3 | 0,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 20 / 195 éléments (10,3 %).

## Précision

- Masques (après fusion des chevauchements) : 184
- Corrects : 159 ; erreurs : 2 ; précision : 98,8 %
- Erreurs par catégorie : NON_ETIQUETE 2
- Masques sur un neutre seul (ni réussite ni erreur) : 23
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 2 / 10
- LIEU_ISOLE : 22 / 22

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 37 sur 2249 masqués (1,6 %).

Spans retrouvés avec un type proposé différent : 8.

## Oublis

| Document | Type | Statut | Extrait |
|---|---|---|---|
| rob-avocat-01 | EMAIL | oubli | l.laval@laval-avocats.fr |
| rob-avocat-01 | EMAIL | oubli | nancy.fournier@mailo-perso.fr |
| rob-avocat-01 | NUMERO_DOSSIER | oubli | 26/00418 |
| rob-avocat-01 | ADRESSE | partiel | 3 bis, cours des Tilleuls, 54000 Nancy |
| rob-avocat-01 | TELEPHONE | oubli | 06 39 98 27 14 |
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-01 | EMAIL | oubli | nancy.fournier@mailo-perso.fr |
| rob-avocat-01 | EMAIL | oubli | l.laval@laval-avocats.fr |
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-02 | SIREN | oubli | 812.345.676 |
| rob-avocat-02 | ADRESSE | partiel | parc d'activités des Gabrielles, lot 14… |
| rob-avocat-02 | ADRESSE | partiel | 27 boulevard de Strasbourg — 83000 Toul… |
| rob-avocat-02 | ADRESSE | partiel | lieu-dit Les Bastidons, chemin des Oliv… |
| rob-avocat-03 | NUMERO_DOSSIER | oubli | 26-0412-OB |
| rob-avocat-03 | CARTE | oubli | 3782 916305 74126 |
| rob-avocat-03 | EMAIL | oubli | ange.bonnet.pro@officinemail.fr |
| rob-avocat-03 | TELEPHONE | oubli | 04 65 71 38 02 |
| rob-avocat-03 | ADRESSE | partiel | BP 207, 06002 Nice Cedex 1 |
| rob-avocat-04 | ADRESSE | partiel | Résidence Le Clos Fleuri — Bât. B, appt… |
| rob-avocat-04 | TELEPHONE | oubli | 0033 4 65 71 90 26 |
| rob-avocat-04 | EMAIL | oubli | h.devilleneuve@avocats-cannet.eu |
| rob-avocat-04 | ADRESSE | partiel | 9, rue des Remparts⏎84000 Avignon |
| rob-avocat-04 | NUMERO_DOSSIER | oubli | RC/2026/118 |
| rob-avocat-04 | NUMERO_DOSSIER | oubli | HVR-0388 |
| rob-avocat-05 | PERSONNE | partiel | N’DIAYE |
| rob-avocat-05 | ADRESSE | partiel | 5 impasse des Glycines, appartement 3, … |
| rob-ec-01 | SIREN | oubli | 904 182 532 |
| rob-ec-01 | SIRET | oubli | 904 182 532 00021 |
| rob-ec-01 | TVA_INTRA | oubli | FR 32 904182532 |
| rob-ec-01 | ADRESSE | partiel | 41 rue de la Verrerie, 30700 Uzès |
| rob-ec-01 | IBAN | oubli | BE12 7310 4126 5892 |
| rob-ec-01 | TELEPHONE | oubli | +33 4 65 71 55 60 |
| rob-ec-01 | NUMERO_DOSSIER | oubli | 2021-0457 |
| rob-ec-02 | EMAIL | oubli | pieces+bongrain@cabinet-orsatti.fr |
| rob-ec-02 | TELEPHONE | oubli | 04 65 71 23 45 |
| rob-ec-03 | SIREN | oubli | 883401291 |
| rob-ec-03 | TVA_INTRA | oubli | FR52883401291 |
| rob-ec-03 | SIRET | oubli | 842 770 166 00010 |
| rob-ec-03 | ADRESSE | partiel | 2 traverse des Pêcheurs, 13002 Marseille |
| rob-ec-03 | IBAN | partiel | FR76 1660 7003 2108 7654⏎3210 957 |
| rob-ec-03 | EMAIL | oubli | tresorerie.amisduvieuxport@assoc-mail.o… |
| rob-ec-04 | SIRET | oubli | 52309874700042 |
| rob-ec-04 | TVA_INTRA | oubli | FR86523098747 |
| rob-ec-04 | ADRESSE | partiel | route de Lyon |
| rob-ec-04 | EMAIL | oubli | c.vienne@vienne-distribution.fr |
| rob-ec-04 | TELEPHONE | oubli | 04 65 71 08 83 |
| rob-ec-05 | ADRESSE | partiel | 18 CHEMIN DU LAC⏎          74200 THONON… |
| rob-ec-05 | SIREN | oubli | 438072159 |
| rob-ec-05 | NUMERO_DOSSIER | oubli | 004512 |
| rob-ec-05 | IBAN | oubli | FR76 1254 8029 9804 5172 6309 829 |
| rob-ec-05 | TELEPHONE | oubli | 06.39.98.71.20 |
| rob-rh-01 | SIRET | oubli | 791 153 422 00013 |
| rob-rh-01 | ADRESSE | partiel | 860 route des Vignes, 13310 Saint-Marti… |
| rob-rh-01 | NIR | oubli | 1 86 03 2A 004 118 77 |
| rob-rh-01 | ADRESSE | partiel | Mas de la Cabrière, quartier Saint-Mart… |
| rob-rh-01 | EMAIL | oubli | julien.orsini.2a@courriel-perso.fr |
| rob-rh-01 | TELEPHONE | oubli | +33 6 39 98 66 03 |
| rob-rh-02 | EMAIL | oubli | jo.perrin@logisud-transports.fr |
| rob-rh-02 | TELEPHONE | oubli | 03 53 01 47 19 |
| rob-rh-02 | EMAIL | oubli | tl.nguyen@logisud-transports.fr |
| rob-rh-03 | ADRESSE | partiel | 7 avenue de la Mer – CS 40021 – 13600 L… |
| rob-rh-03 | SIRET | oubli | 512 948 308 00022 |
| rob-rh-03 | NIR | oubli | 2 91 07 99 351 048 / 53 |
| rob-rh-03 | ADRESSE | partiel | 3 montée des Pins, 13600 La Ciotat |
| rob-rh-03 | TELEPHONE | oubli | 04-65-71-30-30 |
| rob-rh-03 | EMAIL | oubli | direction@clinique-calanques.vet |
| rob-rh-05 | ADRESSE | partiel | Les Hauts de Saint-Jean, bâtiment 4⏎831… |
| rob-rh-05 | ADRESSE | partiel | 15 rue de l'Industrie, 83170 Brignoles |
| rob-rh-05 | TELEPHONE | oubli | +33 4.65.71.12.40 |
| rob-rh-05 | EMAIL | oubli | rh@menuiseries-provence-verte.fr |

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
| rob-ec-01 | EMAIL | ORGANISATION | Compta.AtelierLumiere@lumiere-bois.fr |
| rob-ec-02 | ADRESSE | LIEU | rue Paradis, Marseille |
| rob-ec-05 | EMAIL | PERSONNE | JM.DUBREUIL@CHABLAIS-MAIL.FR |
| rob-rh-01 | ORGANISATION | LIEU | Domaine des Trois Chênes |
| rob-rh-03 | ORGANISATION | LIEU | Clinique vétérinaire des Calanques |

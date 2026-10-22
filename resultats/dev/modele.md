# Évaluation — modele 0.1.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 — jeu dev

> **jeu de développement : indicatif, pas la mesure finale**

- Date (UTC) : 2026-10-22T08:29:20.333Z
- Commit : `eeaddda0e5d8ca63c6ba3bf453b6fe04ffbfee4a` (arbre propre : oui)
- Détecteur : modele 0.1.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 (`src/modele.mjs`)
- Documents : 17
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 2,9 % (2/69) | 100,0 % | oui | non atteint |
| S3 | Rappel PERSONNE | 100,0 % (49/49) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 3,3 % (1/30) | 90,0 % | oui | non atteint |
| S5 | Rappel ORGANISATION | 65,2 % (15/23) | 85,0 % | non | non atteint |
| S6 | Précision globale | 81,3 % (122 corrects, 28 erreurs) | 80,0 % | non | atteint |

## Rappel par type

| Type | Trouvés / total | Rappel | Couverture partielle |
|---|---|---|---|
| ADRESSE | 1 / 30 | 3,3 % | 29 |
| CARTE (S2) | 0 / 2 | 0,0 % | 0 |
| EMAIL (S2) | 2 / 21 | 9,5 % | 0 |
| IBAN (S2) | 0 / 10 | 0,0 % | 1 |
| NIR (S2) | 0 / 3 | 0,0 % | 0 |
| NUMERO_DOSSIER | 0 / 7 | 0,0 % | 0 |
| ORGANISATION | 15 / 23 | 65,2 % | 8 |
| PERSONNE | 49 / 49 | 100,0 % | 0 |
| SIREN (S2) | 0 / 3 | 0,0 % | 0 |
| SIRET (S2) | 0 / 11 | 0,0 % | 0 |
| TELEPHONE (S2) | 0 / 19 | 0,0 % | 0 |
| TVA_INTRA | 0 / 6 | 0,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 38 / 184 éléments (20,7 %).

## Précision

- Masques (après fusion des chevauchements) : 178
- Corrects : 122 ; erreurs : 28 ; précision : 81,3 %
- Erreurs par catégorie : NON_ETIQUETE 28
- Masques sur un neutre seul (ni réussite ni erreur) : 28
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 3 / 16
- LIEU_ISOLE : 29 / 29

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 308 sur 2479 masqués (12,4 %).

Spans retrouvés avec un type proposé différent : 3.

## Oublis

| Document | Type | Statut | Extrait |
|---|---|---|---|
| dev-avocat-01 | ADRESSE | partiel | 88 ter rue du Four⏎31000 Toulouse |
| dev-avocat-01 | TELEPHONE | oubli | 05 36 49 64 91 |
| dev-avocat-01 | EMAIL | oubli | compta@cabinet-meunier-associes.fr |
| dev-avocat-01 | ADRESSE | partiel | 1 bis allée des Roses⏎13100 AIX-EN-PROV… |
| dev-avocat-01 | NUMERO_DOSSIER | oubli | 2025-6921-IM |
| dev-avocat-01 | ADRESSE | partiel | 39 rue de la Fontaine, 64000 Pau |
| dev-avocat-01 | IBAN | oubli | FR76 8728 8099 7968 7257 0848 504 |
| dev-avocat-01 | TELEPHONE | oubli | 06 39 98 01 05 |
| dev-avocat-01 | EMAIL | oubli | i.meunier@cabinet-meunier-associes.fr |
| dev-avocat-02 | ADRESSE | partiel | 8 bis rue de la Fontaine⏎84000 Avignon |
| dev-avocat-02 | TELEPHONE | oubli | +33 4 65 71 05 08 |
| dev-avocat-02 | EMAIL | oubli | accueil@delmas-avocats-associes.io |
| dev-avocat-02 | ADRESSE | partiel | 43 rue du Four⏎29000 QUIMPER |
| dev-avocat-02 | NUMERO_DOSSIER | oubli | YD/2026/4644 |
| dev-avocat-02 | ADRESSE | partiel | Le Clos des Cèdres, 74 rue du Château, … |
| dev-avocat-02 | IBAN | oubli | FR76 4419 7553 4338 8948 9701 664 |
| dev-avocat-02 | TELEPHONE | oubli | 0639986458 |
| dev-avocat-03 | ADRESSE | partiel | 60 impasse des Lilas, 67000 Strasbourg |
| dev-avocat-03 | TELEPHONE | oubli | 06.39.98.70.04 |
| dev-avocat-03 | EMAIL | oubli | rose.dasilva@messagerie-libre.fr |
| dev-avocat-03 | SIRET | oubli | 44256350800096 |
| dev-avocat-03 | ADRESSE | partiel | 61 rue de la Gare, 56000 Vannes |
| dev-avocat-03 | NUMERO_DOSSIER | oubli | 2025-8252-CM |
| dev-avocat-03 | IBAN | oubli | FR7617432022672268093394816 |
| dev-avocat-04 | ADRESSE | partiel | Immeuble Le Belvédère, 137 cours des Ar… |
| dev-avocat-04 | TELEPHONE | oubli | 06 39 98 12 83 |
| dev-avocat-04 | EMAIL | oubli | pbarbier@monmel.fr |
| dev-avocat-04 | SIRET | oubli | 79253179000022 |
| dev-avocat-04 | ADRESSE | partiel | Résidence Les Iris, bâtiment B, 97 rue … |
| dev-avocat-04 | NUMERO_DOSSIER | oubli | 2026-3047-IC |
| dev-avocat-04 | IBAN | oubli | FR7669052002172910895870510 |
| dev-avocat-05 | ADRESSE | partiel | Le Clos des Cèdres, 74 allée des Roses,… |
| dev-avocat-05 | TELEPHONE | oubli | 06.39.98.95.46 |
| dev-avocat-05 | EMAIL | oubli | florence.margaux@messagerie-libre.fr |
| dev-avocat-05 | SIRET | oubli | 89411187100089 |
| dev-avocat-05 | NUMERO_DOSSIER | oubli | SF/2026/3047 |
| dev-avocat-05 | IBAN | partiel | FR76 2423 8298 3883 1450 6172 840 |
| dev-ec-01 | ORGANISATION | partiel | SARL Cabinet Paris Audit & Conseil |
| dev-ec-01 | ADRESSE | partiel | 12 chemin des Vignes⏎51100 Reims |
| dev-ec-01 | SIRET | oubli | 224 853 333 00090 |
| dev-ec-01 | TVA_INTRA | oubli | FR 89 224 853 333 |
| dev-ec-01 | TELEPHONE | oubli | +33 3 53 01 73 30 |
| dev-ec-01 | ADRESSE | partiel | Bâtiment C, 2e étage, 74 place du March… |
| dev-ec-01 | SIREN | oubli | 616 457 263 |
| dev-ec-01 | TVA_INTRA | oubli | FR 65 616 457 263 |
| dev-ec-01 | EMAIL | oubli | rparis@cabinet-paris-audit-conseil.immo |
| dev-ec-02 | ORGANISATION | partiel | Benali Expertise Comptable SARL |
| dev-ec-02 | ADRESSE | partiel | Résidence Les Iris, bâtiment B⏎48 rue d… |
| dev-ec-02 | SIRET | oubli | 815 697 636 00018 |
| dev-ec-02 | TVA_INTRA | oubli | FR06815697636 |
| dev-ec-02 | TELEPHONE | oubli | 02 61 91 03 51 |
| dev-ec-02 | ORGANISATION | partiel | BISCUITERIE DE L'ÉTANG SAS |
| dev-ec-02 | ADRESSE | partiel | 31 bis chemin des Vignes, 79000 Niort |
| dev-ec-02 | SIREN | oubli | 612 659 664 |
| dev-ec-02 | TVA_INTRA | oubli | FR15612659664 |
| dev-ec-02 | EMAIL | oubli | aurelie.benali@benali-expertise-comptab… |
| dev-ec-03 | ORGANISATION | partiel | SARL Perrot Expertise Comptable |
| dev-ec-03 | ADRESSE | partiel | 105 route de la Forêt⏎35000 Rennes |
| dev-ec-03 | SIRET | oubli | 113 490 056 00042 |
| dev-ec-03 | TVA_INTRA | oubli | FR83113490056 |
| dev-ec-03 | TELEPHONE | oubli | 02-61-91-82-65 |
| dev-ec-03 | ADRESSE | partiel | 83 rue du Four, 44000 Nantes |
| dev-ec-03 | SIREN | oubli | 996238838 |
| dev-ec-03 | TVA_INTRA | oubli | FR 56 996 238 838 |
| dev-ec-03 | EMAIL | oubli | hperrot@perrot-expertise-comptable.fr |
| dev-ec-04 | EMAIL | oubli | i.lacroix@gauthier-expertise-comptable.… |
| dev-ec-04 | EMAIL | oubli | r.ferrand@chevalier-conseil.bzh |
| dev-ec-04 | EMAIL | oubli | s.royer@gauthier-expertise-comptable.com |
| dev-ec-04 | NUMERO_DOSSIER | oubli | DOS-90413 |
| dev-ec-04 | IBAN | oubli | FR76 5551 7108 4741 9050 8289 476 |
| dev-ec-04 | CARTE | oubli | 4191342619444687 |
| dev-ec-04 | TELEPHONE | oubli | +33 6 39 98 43 01 |
| dev-ec-04 | ADRESSE | partiel | Résidence Les Iris, bâtiment B, 126 rue… |
| dev-ec-04 | TELEPHONE | oubli | 03 53 01 85 71 |
| dev-ec-05 | EMAIL | oubli | yflorence@florence-expertise-comptable.… |
| dev-ec-05 | EMAIL | oubli | pierre.marchand@atelier-des-trois-chene… |
| dev-ec-05 | EMAIL | oubli | n.guerin@florence-expertise-comptable.p… |
| dev-ec-05 | NUMERO_DOSSIER | oubli | EC-2025-8138 |
| dev-ec-05 | IBAN | oubli | FR7672726750097830455455270 |
| dev-ec-05 | CARTE | oubli | 5340-9048-6622-7722 |
| dev-ec-05 | TELEPHONE | oubli | 06.39.98.28.37 |
| dev-ec-05 | ORGANISATION | partiel | Florence Expertise Comptable SELARL |
| dev-ec-05 | ADRESSE | partiel | 82 chemin des Vignes, 49000 Angers |
| dev-ec-05 | TELEPHONE | oubli | 0261917488 |
| dev-rh-01 | ORGANISATION | partiel | SA STUDIO ARDOISE |
| dev-rh-01 | ADRESSE | partiel | 94 rue de la Gare⏎56000 Vannes |
| dev-rh-01 | SIRET | oubli | 13120136000073 |
| dev-rh-01 | ADRESSE | partiel | 128 rue des Tilleuls⏎30000 NÎMES |
| dev-rh-01 | TELEPHONE | oubli | 0261910908 |
| dev-rh-02 | ADRESSE | partiel | 69 rue du Four⏎86000 Poitiers |
| dev-rh-02 | SIRET | oubli | 261 250 393 00079 |
| dev-rh-02 | ADRESSE | partiel | 20 rue du Four⏎64000 PAU |
| dev-rh-02 | EMAIL | oubli | m.meunier@etablissements-paris.org |
| dev-rh-02 | TELEPHONE | oubli | 05.36.49.48.89 |
| dev-rh-03 | ORGANISATION | partiel | LA ROSE DES PRÉS SAS |
| dev-rh-03 | ADRESSE | partiel | 36 rue des Tilleuls⏎29200 Brest |
| dev-rh-03 | SIRET | oubli | 140 262 577 00012 |
| dev-rh-03 | ADRESSE | partiel | 12 rue de la Fontaine⏎13100 AIX-EN-PROV… |
| dev-rh-03 | NIR | oubli | 2 93 02 64 025 432 31 |
| dev-rh-03 | IBAN | oubli | FR7688832123262417995569886 |
| dev-rh-03 | TELEPHONE | oubli | 0261916601 |
| dev-rh-03 | EMAIL | oubli | contact@la-rose-des-pres.immo |
| dev-rh-04 | ORGANISATION | partiel | SARL GARAGE ROCHE |
| dev-rh-04 | ADRESSE | partiel | 122 cours des Arts⏎54000 Nancy |
| dev-rh-04 | SIRET | oubli | 29971552400037 |
| dev-rh-04 | ADRESSE | partiel | 146 avenue des Peupliers⏎49000 ANGERS |
| dev-rh-04 | NIR | oubli | 188079935054376 |
| dev-rh-04 | IBAN | oubli | FR7673396977515090405161242 |
| dev-rh-04 | TELEPHONE | oubli | +33 3 53 01 71 60 |
| dev-rh-04 | EMAIL | oubli | secretariat@garage-roche.org |
| dev-rh-05 | ADRESSE | partiel | 54 place du Marché⏎69003 Lyon |
| dev-rh-05 | SIRET | oubli | 46341025800099 |
| dev-rh-05 | ADRESSE | partiel | 82 rue de la Pierre Levée⏎33000 BORDEAUX |
| dev-rh-05 | NIR | oubli | 185088607952508 |
| dev-rh-05 | IBAN | oubli | FR7646791994535255922315262 |
| dev-rh-05 | TELEPHONE | oubli | 04 65 71 75 51 |
| dev-rh-05 | EMAIL | oubli | compta@atelier-des-trois-chenes.immo |

## Erreurs

| Document | Catégorie | Extrait |
|---|---|---|
| dev-avocat-01 | NON_ETIQUETE | Monsieur |
| dev-avocat-01 | NON_ETIQUETE | Monsieur |
| dev-avocat-02 | NON_ETIQUETE | Monsieur |
| dev-avocat-02 | NON_ETIQUETE | Monsieur |
| dev-avocat-03 | NON_ETIQUETE | CONVENTION |
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-03 | NON_ETIQUETE | Client |
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-03 | NON_ETIQUETE | Client |
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | CONVENTION |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | Client |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | Client |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Client |
| dev-avocat-05 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Client |
| dev-avocat-05 | NON_ETIQUETE | Avocat |
| dev-ec-01 | NON_ETIQUETE | Expert-comptable |
| dev-ec-03 | NON_ETIQUETE | Expert-comptable |
| dev-neutre-02 | NON_ETIQUETE | de Pentecôte |
| dev-neutre-02 | NON_ETIQUETE | Ressources |
| dev-neutre-02 | NON_ETIQUETE | Rose des vents |
| dev-rh-01 | NON_ETIQUETE | Madame |
| dev-rh-02 | NON_ETIQUETE | Monsieur |

## Types différents

| Document | Type attendu | Type proposé | Extrait |
|---|---|---|---|
| dev-avocat-02 | EMAIL | PERSONNE | yasmine.delmas@delmas-avocats-associes.… |
| dev-avocat-05 | ADRESSE | LIEU | Résidence Les Iris, bâtiment B, 68 allé… |
| dev-rh-01 | EMAIL | PERSONNE | nathalie.vidal@studio-ardoise.org |

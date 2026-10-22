# Évaluation — combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 — jeu robustesse

> **jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils**

- Date (UTC) : 2026-10-22T08:51:36.933Z
- Commit : `9aaafc427aba7ecce6b9c4a381d702daf269fa4e` (arbre propre : oui)
- Détecteur : combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 (`src/combine.mjs`)
- Documents : 15
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 95,2 % (40/42) | 100,0 % | oui | non atteint |
| S3 | Rappel PERSONNE | 96,7 % (87/90) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 63,2 % (12/19) | 90,0 % | oui | non atteint |
| S5 | Rappel ORGANISATION | 100,0 % (35/35) | 85,0 % | non | atteint |
| S6 | Précision globale | 99,0 % (197 corrects, 2 erreurs) | 80,0 % | non | atteint |

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
| PERSONNE | 87 / 90 | 96,7 % | 2 |
| SIREN (S2) | 4 / 4 | 100,0 % | 0 |
| SIRET (S2) | 5 / 5 | 100,0 % | 0 |
| TELEPHONE (S2) | 11 / 11 | 100,0 % | 0 |
| TVA_INTRA | 3 / 3 | 100,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 10 / 195 éléments (5,1 %).

## Précision

- Masques (après fusion des chevauchements) : 222
- Corrects : 197 ; erreurs : 2 ; précision : 99,0 %
- Erreurs par catégorie : NON_ETIQUETE 2
- Masques sur un neutre seul (ni réussite ni erreur) : 23
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 2 / 10
- LIEU_ISOLE : 22 / 22

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 49 sur 3095 masqués (1,6 %).

Spans retrouvés avec un type proposé différent : 7.

## Oublis

| Document | Type | Statut | Extrait |
|---|---|---|---|
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-01 | PERSONNE | partiel | nancy fournier |
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
| rob-rh-04 | NON_ETIQUETE | Qualité |

## Types différents

| Document | Type attendu | Type proposé | Extrait |
|---|---|---|---|
| rob-avocat-01 | PERSONNE | LIEU | Nancy |
| rob-avocat-04 | ORGANISATION | LIEU | Cabinet Chabert |
| rob-avocat-05 | ORGANISATION | PERSONNE | Atelier Le Goff |
| rob-ec-02 | ORGANISATION | LIEU | Moulins Reynaud |
| rob-ec-02 | ADRESSE | LIEU | rue Paradis, Marseille |
| rob-rh-01 | ORGANISATION | LIEU | Domaine des Trois Chênes |
| rob-rh-03 | ORGANISATION | LIEU | Clinique vétérinaire des Calanques |

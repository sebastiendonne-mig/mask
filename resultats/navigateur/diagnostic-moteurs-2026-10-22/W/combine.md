# Évaluation — combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node — jeu dev

> **jeu de développement : indicatif, pas la mesure finale**

- Date (UTC) : 2026-10-22T10:50:59.783Z
- Commit : `6172cfa857178693956e3f17f00cacbf7e83dad1` (arbre propre : oui)
- Détecteur : combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node (`../../../../../private/tmp/claude-501/-Users-migranche-Dev-tkoidra-mask/6b56ad32-ffe0-4496-8519-06b9b2e1d8e8/scratchpad/variantes/W/combine.mjs`)
- Documents : 17
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 100,0 % (69/69) | 100,0 % | oui | atteint |
| S3 | Rappel PERSONNE | 100,0 % (49/49) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 100,0 % (30/30) | 90,0 % | oui | atteint |
| S5 | Rappel ORGANISATION | 100,0 % (23/23) | 85,0 % | non | atteint |
| S6 | Précision globale | 95,3 % (183 corrects, 9 erreurs) | 80,0 % | non | atteint |

## Rappel par type

| Type | Trouvés / total | Rappel | Couverture partielle |
|---|---|---|---|
| ADRESSE | 30 / 30 | 100,0 % | 0 |
| CARTE (S2) | 2 / 2 | 100,0 % | 0 |
| EMAIL (S2) | 21 / 21 | 100,0 % | 0 |
| IBAN (S2) | 10 / 10 | 100,0 % | 0 |
| NIR (S2) | 3 / 3 | 100,0 % | 0 |
| NUMERO_DOSSIER | 7 / 7 | 100,0 % | 0 |
| ORGANISATION | 23 / 23 | 100,0 % | 0 |
| PERSONNE | 49 / 49 | 100,0 % | 0 |
| SIREN (S2) | 3 / 3 | 100,0 % | 0 |
| SIRET (S2) | 11 / 11 | 100,0 % | 0 |
| TELEPHONE (S2) | 19 / 19 | 100,0 % | 0 |
| TVA_INTRA | 6 / 6 | 100,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 0 / 184 éléments (0,0 %).

## Précision

- Masques (après fusion des chevauchements) : 217
- Corrects : 183 ; erreurs : 9 ; précision : 95,3 %
- Erreurs par catégorie : NON_ETIQUETE 9
- Masques sur un neutre seul (ni réussite ni erreur) : 25
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 1 / 16
- LIEU_ISOLE : 28 / 29

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 83 sur 3903 masqués (2,1 %).

Spans retrouvés avec un type proposé différent : 0.

## Oublis

Aucun.

## Erreurs

| Document | Catégorie | Extrait |
|---|---|---|
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-03 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-04 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Avocat |
| dev-avocat-05 | NON_ETIQUETE | Avocat |

## Types différents

Aucun.

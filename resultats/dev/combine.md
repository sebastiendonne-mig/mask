# Évaluation — combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 — jeu dev

> **jeu de développement : indicatif, pas la mesure finale**

- Date (UTC) : 2026-10-22T08:47:15.286Z
- Commit : `b7a85473aa157ab3851aebd67354ae795c7d0f16` (arbre propre : oui)
- Détecteur : combine 0.1.0+regles@0.4.0+modele@0.2.0+Xenova/camembert-ner@8e1988247e872ba0137062653b1e5033a31e14fc+q8 (`src/combine.mjs`)
- Documents : 17
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 100,0 % (69/69) | 100,0 % | oui | atteint |
| S3 | Rappel PERSONNE | 100,0 % (49/49) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 100,0 % (30/30) | 90,0 % | oui | atteint |
| S5 | Rappel ORGANISATION | 100,0 % (23/23) | 85,0 % | non | atteint |
| S6 | Précision globale | 89,2 % (182 corrects, 22 erreurs) | 80,0 % | non | atteint |

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

- Masques (après fusion des chevauchements) : 232
- Corrects : 182 ; erreurs : 22 ; précision : 89,2 %
- Erreurs par catégorie : NON_ETIQUETE 22
- Masques sur un neutre seul (ni réussite ni erreur) : 28
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 3 / 16
- LIEU_ISOLE : 29 / 29

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 262 sur 4096 masqués (6,4 %).

Spans retrouvés avec un type proposé différent : 0.

## Oublis

Aucun.

## Erreurs

| Document | Catégorie | Extrait |
|---|---|---|
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

## Types différents

Aucun.

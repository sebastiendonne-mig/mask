# Évaluation — regles 0.4.0 — jeu dev

> **jeu de développement : indicatif, pas la mesure finale**

- Date (UTC) : 2026-10-21T20:15:34.319Z
- Commit : `695689568a0d61450906c8239006e7b71727d7d0` (arbre propre : oui)
- Détecteur : regles 0.4.0 (`src/regles.mjs`)
- Documents : 17
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 100,0 % (69/69) | 100,0 % | oui | atteint |
| S3 | Rappel PERSONNE | 100,0 % (49/49) | 95,0 % | oui | atteint |
| S4 | Rappel ADRESSE | 100,0 % (30/30) | 90,0 % | oui | atteint |
| S5 | Rappel ORGANISATION | 100,0 % (23/23) | 85,0 % | non | atteint |
| S6 | Précision globale | 100,0 % (184 corrects, 0 erreurs) | 80,0 % | non | atteint |

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

- Masques (après fusion des chevauchements) : 184
- Corrects : 184 ; erreurs : 0 ; précision : 100,0 %
- Erreurs par catégorie : aucune
- Masques sur un neutre seul (ni réussite ni erreur) : 0
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 0 / 16
- LIEU_ISOLE : 0 / 29

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 0 sur 3625 masqués (0,0 %).

Spans retrouvés avec un type proposé différent : 0.

## Oublis

Aucun.

## Erreurs

Aucune.

## Types différents

Aucun.

# Évaluation — regles 0.4.0 — jeu robustesse

> **jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils**

- Date (UTC) : 2026-10-22T07:37:56.620Z
- Commit : `a92c84ec077f0b57a5e66310df0da6e15690e956` (arbre propre : oui)
- Détecteur : regles 0.4.0 (`src/regles.mjs`)
- Documents : 15
- Protocole : seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur

## Seuils

| # | Critère | Valeur | Seuil | Bloquant | Statut |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | 95,2 % (40/42) | 100,0 % | oui | non atteint |
| S3 | Rappel PERSONNE | 38,9 % (35/90) | 95,0 % | oui | non atteint |
| S4 | Rappel ADRESSE | 57,9 % (11/19) | 90,0 % | oui | non atteint |
| S5 | Rappel ORGANISATION | 2,9 % (1/35) | 85,0 % | non | non atteint |
| S6 | Précision globale | 100,0 % (97 corrects, 0 erreurs) | 80,0 % | non | atteint |

## Rappel par type

| Type | Trouvés / total | Rappel | Couverture partielle |
|---|---|---|---|
| ADRESSE | 11 / 19 | 57,9 % | 0 |
| CARTE (S2) | 1 / 1 | 100,0 % | 0 |
| EMAIL (S2) | 16 / 16 | 100,0 % | 0 |
| IBAN (S2) | 2 / 3 | 66,7 % | 0 |
| NIR (S2) | 1 / 2 | 50,0 % | 0 |
| NUMERO_DOSSIER | 4 / 6 | 66,7 % | 0 |
| ORGANISATION | 1 / 35 | 2,9 % | 1 |
| PERSONNE | 35 / 90 | 38,9 % | 2 |
| SIREN (S2) | 4 / 4 | 100,0 % | 0 |
| SIRET (S2) | 5 / 5 | 100,0 % | 0 |
| TELEPHONE (S2) | 11 / 11 | 100,0 % | 0 |
| TVA_INTRA | 3 / 3 | 100,0 % | 0 |

Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : 3 / 195 éléments (1,5 %).

## Précision

- Masques (après fusion des chevauchements) : 97
- Corrects : 97 ; erreurs : 0 ; précision : 100,0 %
- Erreurs par catégorie : aucune
- Masques sur un neutre seul (ni réussite ni erreur) : 0
- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : 0

## Neutres masqués

- INSTITUTION : 0 / 10
- LIEU_ISOLE : 0 / 22

## Débordement (informatif, sans seuil)

Lettres et chiffres masqués hors des spans et des neutres : 0 sur 1596 masqués (0,0 %).

Spans retrouvés avec un type proposé différent : 0.

## Oublis

| Document | Type | Statut | Extrait |
|---|---|---|---|
| rob-avocat-01 | PERSONNE | oubli | Nancy |
| rob-avocat-01 | ORGANISATION | oubli | Transports Ferrand |
| rob-avocat-01 | PERSONNE | oubli | Damien |
| rob-avocat-01 | PERSONNE | oubli | Lucas |
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-01 | PERSONNE | oubli | nancy fournier |
| rob-avocat-02 | ORGANISATION | oubli | Kervala |
| rob-avocat-02 | ADRESSE | oubli | parc d'activités des Gabrielles, lot 14… |
| rob-avocat-02 | ORGANISATION | oubli | Plomberie du Faron |
| rob-avocat-02 | ADRESSE | oubli | lieu-dit Les Bastidons, chemin des Oliv… |
| rob-avocat-02 | ORGANISATION | oubli | Kervala |
| rob-avocat-03 | PERSONNE | oubli | BONNET |
| rob-avocat-03 | ORGANISATION | oubli | Assur'Azur |
| rob-avocat-03 | NUMERO_DOSSIER | oubli | 26-0412-OB |
| rob-avocat-03 | PERSONNE | oubli | Olive Bonnet |
| rob-avocat-03 | PERSONNE | oubli | Ange |
| rob-avocat-03 | ORGANISATION | oubli | Pharmacie Bonnet & Fils |
| rob-avocat-03 | ORGANISATION | oubli | Assur'Azur |
| rob-avocat-03 | PERSONNE | oubli | Ange |
| rob-avocat-03 | ORGANISATION | oubli | Assur'Azur |
| rob-avocat-03 | ADRESSE | oubli | BP 207, 06002 Nice Cedex 1 |
| rob-avocat-03 | PERSONNE | oubli | Thibault |
| rob-avocat-03 | ORGANISATION | oubli | Expertis Sud |
| rob-avocat-04 | ORGANISATION | oubli | Cabinet Chabert |
| rob-avocat-04 | PERSONNE | oubli | Constant |
| rob-avocat-04 | ORGANISATION | oubli | Banque Méridienne |
| rob-avocat-04 | PERSONNE | oubli | Bertrand |
| rob-avocat-04 | PERSONNE | oubli | Agathe Constant |
| rob-avocat-04 | ORGANISATION | oubli | Banque Méridienne |
| rob-avocat-04 | PERSONNE | oubli | Constant |
| rob-avocat-04 | PERSONNE | oubli | H. de Villeneuve-Rocca |
| rob-avocat-05 | PERSONNE | oubli | N’DIAYE |
| rob-avocat-05 | PERSONNE | oubli | Aminata Fatou |
| rob-avocat-05 | ADRESSE | oubli | 5 impasse des Glycines, appartement 3, … |
| rob-avocat-05 | PERSONNE | oubli | aminata n’diaye |
| rob-avocat-05 | PERSONNE | partiel | yann le goff |
| rob-avocat-05 | ORGANISATION | partiel | Atelier Le Goff |
| rob-avocat-05 | PERSONNE | oubli | Marchal |
| rob-avocat-05 | PERSONNE | oubli | Yann |
| rob-avocat-05 | PERSONNE | oubli | A. N’Diaye |
| rob-ec-01 | ORGANISATION | oubli | Atelier Lumière & Bois |
| rob-ec-01 | PERSONNE | oubli | FABRE Mathilde |
| rob-ec-01 | PERSONNE | oubli | Haddad, Karim |
| rob-ec-01 | NUMERO_DOSSIER | oubli | 2021-0457 |
| rob-ec-02 | ORGANISATION | oubli | Boulangerie Au Bon Grain |
| rob-ec-02 | PERSONNE | oubli | Mathieu |
| rob-ec-02 | ORGANISATION | oubli | Caisse Solidaire du Littoral |
| rob-ec-02 | ORGANISATION | oubli | Moulins Reynaud |
| rob-ec-02 | PERSONNE | oubli | Célia |
| rob-ec-02 | ADRESSE | oubli | rue Paradis, Marseille |
| rob-ec-02 | PERSONNE | oubli | Karine Orsatti |
| rob-ec-02 | ORGANISATION | oubli | Cabinet Orsatti |
| rob-ec-03 | ORGANISATION | oubli | Audit Provence Conseil |
| rob-ec-03 | PERSONNE | oubli | Sylvie Marchetti |
| rob-ec-03 | ORGANISATION | oubli | Les Amis du Vieux Port |
| rob-ec-03 | PERSONNE | oubli | Jean-Baptiste Roux |
| rob-ec-03 | ORGANISATION | oubli | Caisse Solidaire du Littoral |
| rob-ec-03 | IBAN | oubli | FR76 1660 7003 2108 7654⏎3210 957 |
| rob-ec-03 | PERSONNE | oubli | Lou Agostini |
| rob-ec-04 | ORGANISATION | oubli | Vienne Distribution |
| rob-ec-04 | PERSONNE | oubli | Christophe Vienne |
| rob-ec-04 | ORGANISATION | oubli | Vienne Distribution |
| rob-ec-04 | ADRESSE | oubli | route de Lyon |
| rob-ec-04 | ORGANISATION | oubli | Agri Rhône Équipement |
| rob-ec-04 | PERSONNE | oubli | Paul-Henri Dussart |
| rob-ec-04 | ORGANISATION | oubli | Banque Allobroge |
| rob-ec-04 | PERSONNE | oubli | Christophe |
| rob-ec-04 | PERSONNE | oubli | Lyna |
| rob-ec-05 | PERSONNE | partiel | J.-M. DUBREUIL |
| rob-ec-05 | ORGANISATION | oubli | CABINET ALPES LEMAN EXPERTISE |
| rob-rh-01 | ORGANISATION | oubli | Domaine des Trois Chênes |
| rob-rh-01 | ADRESSE | oubli | Mas de la Cabrière, quartier Saint-Mart… |
| rob-rh-01 | PERSONNE | oubli | Florian Martin |
| rob-rh-01 | PERSONNE | oubli | J. Orsini |
| rob-rh-02 | PERSONNE | oubli | Salomé Rey |
| rob-rh-02 | PERSONNE | oubli | Mohamed Benali |
| rob-rh-02 | PERSONNE | oubli | Thi Lan |
| rob-rh-02 | PERSONNE | oubli | Nguyen Thi Lan |
| rob-rh-02 | PERSONNE | oubli | Thi Lan |
| rob-rh-02 | ORGANISATION | oubli | Frigo Express |
| rob-rh-02 | PERSONNE | oubli | Mohamed |
| rob-rh-02 | PERSONNE | oubli | Jo |
| rob-rh-02 | PERSONNE | oubli | Salomé |
| rob-rh-02 | ORGANISATION | oubli | LogiSud Transports |
| rob-rh-03 | ORGANISATION | oubli | Clinique vétérinaire des Calanques |
| rob-rh-03 | PERSONNE | oubli | BEN SALEM |
| rob-rh-03 | PERSONNE | oubli | CARDONA |
| rob-rh-03 | PERSONNE | oubli | Yasmine |
| rob-rh-03 | NIR | oubli | 2 91 07 99 351 048 / 53 |
| rob-rh-04 | PERSONNE | oubli | Constance Morvan |
| rob-rh-04 | PERSONNE | oubli | Grégoire Petit |
| rob-rh-04 | PERSONNE | oubli | Constance |
| rob-rh-04 | ORGANISATION | oubli | Plastiques Durance |
| rob-rh-04 | PERSONNE | oubli | Ophélie |
| rob-rh-04 | ORGANISATION | oubli | Qualiform |
| rob-rh-04 | ORGANISATION | oubli | Montagnier Packaging |
| rob-rh-04 | PERSONNE | oubli | C. Morvan |
| rob-rh-04 | PERSONNE | oubli | G. Petit |
| rob-rh-05 | ADRESSE | oubli | Les Hauts de Saint-Jean, bâtiment 4⏎831… |
| rob-rh-05 | ORGANISATION | oubli | Menuiseries de la Provence Verte |
| rob-rh-05 | PERSONNE | oubli | Sandrine Gautier |

## Erreurs

Aucune.

## Types différents

Aucun.

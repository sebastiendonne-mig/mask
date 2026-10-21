# Journal de mise au point des règles — jeu de développement

> **Jeu de développement : indicatif, pas la mesure finale.** Les règles ont été écrites après lecture des 17 documents de `golden/dev/` (autorisée : c'est leur rôle). Un score élevé ici mesure surtout l'ajustement à ces documents ; la mesure qui compte est celle du jeu de test, scellé, jamais ouvert.

- Détecteur : `src/regles.mjs` (nom `regles`).
- Évaluateur : `scripts/evaluer.mjs`, protocole de `seuils.md` § 8, amendements du 21/10/2026 (2) et (3).
- Base : commit `13a6522` (« règles : détecteur de référence »), arbre propre pour le tour 0.
- **Provenance des chiffres** : les tours 1 à 3 ont été mesurés sur un arbre **non commité** (`13a6522` + modifications de `src/regles.mjs` et `tests/regles.test.mjs`). Ces modifications sont celles du commit qui contient ce journal. Rapports intermédiaires non conservés dans le dépôt. Le rapport de référence est `resultats/dev/regles.json` et `regles.md`, produit sur l'arbre propre après ce commit.
- Règle suivie : au plus 3 tours, guidés uniquement par les oublis et erreurs du jeu de développement. Chaque ajustement est général : aucun préfixe de fiction, aucun domaine, aucune liste de noms.

## Récapitulatif

| Tour | Version | S2 formats fixes | S3 PERSONNE | S4 ADRESSE | S5 ORGANISATION | S6 précision | Neutres masqués |
|---|---|---|---|---|---|---|---|
| 0 | 0.1.0 | 69/69 (100 %) | 29/49 (59,2 %) | 30/30 (100 %) | 0/23 (0 %) | 141 corrects, 0 erreur (100 %) | 0/45 |
| 1 | 0.2.0 | 69/69 | 44/49 (89,8 %) | 30/30 | 0/23 | 156 / 0 (100 %) | 0/45 |
| 2 | 0.3.0 | 69/69 | 49/49 (100 %) | 30/30 | 0/23 | 161 / 0 (100 %) | 0/45 |
| 3 | 0.4.0 | 69/69 | 49/49 | 30/30 | 23/23 (100 %) | 184 / 0 (100 %) | 0/45 |

Couverture partielle et débordement : 0 à chaque tour.

## Tour 0 — mesure de base

Règles du commit `13a6522` : identifiants à clé de contrôle, e-mails, téléphones, adresses, noms après civilité, numéros de dossier après indice.

Constats : S2 et S4 atteints ; aucune erreur de précision. Oublis : 20 PERSONNE, 23 ORGANISATION (aucune règle d'organisation à ce stade). Les noms oubliés sont de trois sortes :
- nom déjà repéré après une civilité mais réécrit ailleurs sans civilité (« M. Mehdi Meunier » puis « Mehdi MEUNIER » en signature) ;
- nom affiché dans un en-tête de courriel (« Inès Lacroix <…> ») ;
- nom au format « Prénom NOM » sans civilité ni autre occurrence (signatures, « les notes de frais de Sophie HADDAD »).

## Tour 1 — en-têtes de courriel et propagation dans le document

- **Changé** : (a) un nom écrit devant une adresse électronique entre chevrons est masqué (format standard des en-têtes de courriel) ; (b) chaque nom d'au moins deux mots déjà repéré est cherché dans tout le document, sans tenir compte des majuscules. La recherche ne s'arrête pas devant un trait d'union : « Odile Martineau-Roy » n'est pas pris pour « Odile Martineau ». Ce point vient d'un test unitaire, pas du jeu de développement.
- **Pourquoi** : les deux premières sortes d'oublis du tour 0 ; S3 est bloquant.
- **Effet** : S3 29/49 → 44/49 (89,8 %). Précision inchangée (100 %), aucun neutre masqué.
- Garde-fou : un nom d'un seul mot (« Madame Valence ») n'est pas propagé, pour ne pas masquer la ville homonyme.

## Tour 2 — convention « Prénom NOM »

- **Changé** : un mot à initiale majuscule suivi d'un ou plusieurs mots en capitales est masqué comme PERSONNE (« Hélène PERROT », « Jean-Luc LE BRAS »). Sont exclus : les mots-outils et civilités en premier mot, les sigles usuels et formes juridiques en second (TVA, TTC, HT, SARL…). Les noms ainsi trouvés sont aussi propagés (tour 1).
- **Pourquoi** : les 5 oublis restants (« Rose PARIS », « Aurélie BENALI », « Hélène PERROT », « Sophie HADDAD », « Nathalie VIDAL ») suivent tous cette convention, courante dans les courriers français.
- **Effet** : S3 44/49 → 49/49. Précision inchangée (100 %).
- Transparence : les listes d'exclusion (mots-outils comme « Total », « Montant » ; sigles) ont été écrites **par précaution**. Aucune erreur du jeu de développement ne les a rendues nécessaires : sans elles, le résultat sur le dev n'est pas connu, car il n'a pas été mesuré.

## Tour 3 — raisons sociales accolées à une forme juridique

- **Changé** : une suite de mots à initiale majuscule (avec « & » et les liaisons de, des, du, la, le, les, et) précédée ou suivie d'une forme juridique (SA, SAS, SASU, SARL, EURL, SELARL, SELAS, SCP, SCI, SNC, GIE…) est masquée comme ORGANISATION, forme comprise. « la société » reste hors masque. Un article seul devant la forme (« les SARL ») ne déclenche rien ; ce point vient d'un test unitaire.
- **Pourquoi** : les 23 oublis ORGANISATION ; S5 n'est pas bloquant, mais c'était le seul oubli restant.
- **Effet** : S5 0/23 → 23/23. Précision inchangée (100 %).

## Limites et risques de sur-apprentissage (supposés, non mesurés)

- **Score parfait = alerte.** Ce sont des données synthétiques et régulières, lues avant l'écriture des règles. Le jeu de test (modèles de documents différents) dira ce qui tient.
- **ORGANISATION** : le générateur accole toujours la forme juridique à la raison sociale. Dans un vrai document, une entreprise citée sans forme juridique (« chez Studio Ardoise ») est oubliée.
- **« Prénom NOM »** : le générateur écrit souvent les noms ainsi. Un nom en casse ordinaire sans civilité (« Pierre Martin a signé ») est oublié. À l'inverse, des faux positifs sont possibles sur des intitulés comme « Crédit AGRICOLE » ou « Rapport ANNUEL ».
- **Adresses** : les compléments reconnus (Résidence, Bâtiment, Immeuble, Le Clos, étage…) recouvrent tous ceux du générateur. « Le Clos » a été ajouté après lecture du dev ; c'est un mot réel des adresses françaises, mais c'est la règle la plus proche du générateur. Le nom de voie s'arrête à la première virgule ; la ville doit commencer par une majuscule et suivre un code postal à 5 chiffres. Ni boîte postale ni adresse sans code postal.
- **Ce que les règles ne savent pas faire** : noms sans civilité et en casse ordinaire, organisations sans forme juridique, adresses incomplètes, distinction lieu ou personne pour les homonymes (Florence, Paris, Valence). Cela relève du modèle (lot 1.5).

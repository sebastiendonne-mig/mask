# Golden set — jeux de développement et de test

**Données 100 % fictives.** Aucun document, nom, adresse ou identifiant ne provient d'une personne ou d'une entreprise réelle. Tout est produit par `scripts/generate-golden.mjs`.

> **Règle : le jeu de test ne sert qu'à la mesure finale ; ne pas l'ouvrir pour mettre au point les règles.**
> Cela vaut aussi pour ses modèles, isolés dans `scripts/golden/modeles-test.mjs` : pour mettre au point les règles, on lit `golden/dev/` et `scripts/golden/modeles-dev.mjs`, jamais le reste.

## Contenu

| Jeu | Dossier | Documents | Modèles |
|---|---|---|---|
| Développement | `golden/dev/` | 17 : 5 par persona + 2 sans donnée personnelle | avocat : mise en demeure, convention d'honoraires · expert-comptable : attestation de chiffre d'affaires, relance de pièces · RH : promesse d'embauche, bulletin de paie · sans donnée personnelle : note sur les notes de frais, fiche congés payés |
| Test | `golden/test/` | 35 : 10 par persona + 5 sans donnée personnelle | avocat : courrier au client, assignation · expert-comptable : lettre de mission, relevé de compte client · RH : contrat de travail, attestation d'emploi · sans donnée personnelle : 5 modèles distincts |
| Robustesse | `golden/robustesse/` | 15 : 5 par persona, rédigés à la main hors du générateur | voir `golden/robustesse/README.md` |

Le jeu de robustesse ne sert jamais à la mise au point (seuils.md, amendement (4)).

Aucun modèle n'est partagé entre les deux jeux (le script le vérifie). Les modèles du jeu de test correspondent aux types de documents de `seuils.md` (§ 3).

Chaque document existe en deux fichiers : `<doc_id>.txt` (texte, UTF-8, fins de ligne `\n`) et `<doc_id>.json` (étiquettes). Pour l'instant, texte brut uniquement ; les variantes .docx et PDF viendront avec la lecture de documents (amendement du 21/10/2026 dans `seuils.md`).

`golden/test/MANIFEST.sha256` contient l'empreinte SHA-256 de chaque fichier du jeu de test. Vérification :

```sh
cd golden/test && shasum -a 256 -c MANIFEST.sha256
```

## Régénérer

```sh
npm run golden
```

Le générateur utilise un aléa à graine fixe (une graine par document, dérivée de son identifiant) : relancer le script reproduit les fichiers à l'octet près. Il efface et réécrit `golden/dev/` et `golden/test/`. Si une seule vérification échoue, il n'écrit rien et sort avec le code 1.

Vérifications faites à chaque génération :
- `text.slice(start, end) === text` pour chaque étiquette ; pas d'étiquette vide, bordée d'espaces, ou qui en chevauche une autre ;
- chaque occurrence d'une valeur étiquetée est couverte par une étiquette (repère une donnée oubliée par l'étiquetage) ;
- clé de contrôle de chaque identifiant, recalculée à partir du texte tel qu'il apparaît dans le document (voir plus bas) ;
- aucun document sans donnée personnelle ne contient d'étiquette à masquer ; nombre de documents par jeu et par persona ;
- texte normalisé NFC, sans caractère hors du plan multilingue de base.

## Format des étiquettes

```json
{
  "doc_id": "dev-avocat-01",
  "persona": "avocat",
  "split": "dev",
  "template_id": "avocat-mise-en-demeure",
  "spans": [ { "start": 205, "end": 218, "type": "PERSONNE", "text": "Camille ROYER" } ],
  "non_masques": [ { "start": 289, "end": 301, "type": "DATE", "text": "20 mars 2026" } ],
  "neutres": [
    { "start": 44, "end": 51, "type": "INSTITUTION", "text": "barreau" },
    { "start": 55, "end": 63, "type": "LIEU_ISOLE", "text": "Toulouse" }
  ]
}
```

- `persona` : `avocat`, `expert-comptable`, `rh`, ou `aucune` (document sans donnée personnelle).
- `start` / `end` : positions dans le texte, `end` exclu. Ce sont des indices de chaîne JavaScript ; comme le texte ne contient que des caractères du plan multilingue de base, ils sont identiques aux indices de caractères en Python.
- Les étiquettes sont triées par position et ne se chevauchent jamais.
- `spans` : ce qui doit être masqué. Types : `PERSONNE`, `ADRESSE`, `ORGANISATION`, `IBAN`, `SIREN`, `SIRET`, `TVA_INTRA`, `NIR`, `CARTE`, `EMAIL`, `TELEPHONE`, `NUMERO_DOSSIER`.
- `non_masques` : ce qui ne doit PAS être masqué ; un masque dessus est une erreur (faux positif). Types : `DATE`, `MONTANT`.
- `neutres` : éléments qui ne comptent ni comme réussite ni comme erreur et sont rapportés à part (`seuils.md`, amendement du 21/10/2026 (2)). Types : `INSTITUTION`, `LIEU_ISOLE`. Un masque posé dessus n'est pas une erreur ; l'app peut ne pas les masquer, c'est une décision ultérieure pour les lieux isolés.
- Aucune étiquette de `neutres` ne chevauche une étiquette de `spans` (ni de `non_masques`) : le script le vérifie.

### Conventions d'étiquetage

- **PERSONNE** : le nom tel qu'il est écrit (« Rose FLORENCE », « MOREL Pierre », « P. MOREL », « FLORENCE » seul). La civilité (M., Mme, Madame, Maître) est hors étiquette. Toutes les personnes physiques sont étiquetées : parties, avocats, signataires, témoins, collaborateurs.
- **ADRESSE** : de la voie (ou du complément « Résidence… ») jusqu'à la ville, code postal compris. Une adresse sur plusieurs lignes est une seule étiquette, qui contient les retours à la ligne.
- **ORGANISATION** : la raison sociale, forme juridique comprise quand elle y est accolée (« SARL Morel Bâtiment », « LA ROSE DES PRÉS SAS ») ; « la société » est hors étiquette. Seules les entités privées sont étiquetées ORGANISATION : les institutions publiques sont des éléments neutres (INSTITUTION, voir plus bas).
- **Imbrication** : un nom de personne contenu dans une raison sociale ou une adresse électronique n'est pas étiqueté à part ; l'étiquette englobante l'emporte.
- **Identifiants** : la valeur entière telle qu'écrite, espaces compris (« FR76 1234 … », « +33 (0)6 39 98 12 34 », « 2 93 02 64 025 432 31 »).
- **NUMERO_DOSSIER** : référence de dossier du cabinet, numéro de rôle (RG), numéro de dossier comptable. Les numéros de facture ne sont pas étiquetés.
- **DATE** : toutes les dates, y compris les dates de naissance (`seuils.md`, décision c).
- **MONTANT** : le nombre et son unité (« 2 450,00 € », « 31 000 euros »), hors mentions HT/TTC.
- **INSTITUTION** (neutre) : juridictions, organismes et administrations publics, collectivités, ordres professionnels. L'étiquette couvre la désignation seule, sans la ville : « tribunal judiciaire », pas « tribunal judiciaire de Rennes » (la ville reste un LIEU_ISOLE). Désignations retenues, sous leurs formes génériques : tribunal, tribunal judiciaire, conseil de prud'hommes, greffe, registre du commerce et des sociétés, URSSAF, caisse d'allocations familiales, barreau, ordre des avocats, Ordre (des experts-comptables). Une fonction ou une profession (bâtonnier, commissaire de justice) n'est pas une institution ; une désignation générique (« une juridiction commerciale », « l'établissement bancaire ») n'est pas étiquetée. Chaque occurrence d'une désignation retenue est étiquetée, majuscules comprises.
- **LIEU_ISOLE** (neutre, depuis l'amendement du 21/10/2026 (2) ; auparavant dans `non_masques`) : toute ville hors d'une adresse (« Fait à Lyon », « barreau de Nantes » où seule la ville est un lieu isolé, « RCS Lille », lieu de naissance, lieu de travail). Le pays d'un lieu de naissance (« Florence (Italie) ») n'est pas étiqueté.

## Règles de génération

Modèles de documents rédigés une fois en français ; emplacements remplis par le script avec des données fictives ; étiquettes enregistrées au moment de l'insertion, donc connues sans annotation manuelle.

| Identifiant | Construction et contrôle |
|---|---|
| IBAN FR | Code banque, guichet et compte aléatoires ; clé RIB calculée ; clé IBAN calculée (mod 97) |
| SIREN | 8 chiffres aléatoires + clé de Luhn (356 000 000, règle particulière de La Poste, exclu) |
| SIRET | SIREN + NIC, clé de Luhn sur les 14 chiffres |
| TVA intracommunautaire | FR + clé (12 + 3 × (SIREN mod 97)) mod 97 + SIREN |
| NIR | Sexe, année et mois de naissance cohérents avec la date de naissance du document ; département du lieu de naissance (99 + code pays INSEE si né à l'étranger) ; code commune et rang aléatoires ; clé 97 − (13 chiffres mod 97). Corse (2A/2B) jamais générée |
| Carte bancaire | 16 chiffres commençant par 4 ou 51–55, clé de Luhn |
| E-mail | Domaines inventés, extensions variées (.fr, .com, .eu, .net, .org, .pro, .bzh, .immo, .io, .info) |
| Téléphone | Plages réservées à la fiction (voir ci-dessous), 6 formats d'écriture : `01 99 00 12 34`, `01.99.00.12.34`, `0199001234`, `01-99-00-12-34`, `+33 1 99 00 12 34`, `+33 (0)1 99 00 12 34` |

Les formats d'écriture varient aussi pour l'IBAN (groupé ou collé), le SIREN, le SIRET, la TVA et le NIR (espacés ou collés), la carte (espaces, tirets ou collée), les dates (« 1er mars 2026 », « 01/03/2026 ») et les montants (espaces ordinaires ou insécables).

### Téléphones

Les numéros utilisent uniquement les plages que l'Arcep réserve aux œuvres de fiction : racines `01 99 00`, `02 61 91`, `03 53 01`, `04 65 71`, `05 36 49`, `06 39 98`. Ces numéros ne peuvent être ni attribués à un abonné ni appelés.

- Source vérifiée : plan national de numérotation de l'Arcep, version du 1er août 2019 (annexe de la décision n° 2019-0954), § 2.5.12 — https://www.arcep.fr/uploads/tx_gsavis/19-0954.pdf
- Non vérifié : que les modifications ultérieures du plan (décisions de 2022 et suivantes) ont maintenu ces plages telles quelles.
- Pas de plage fiction en 07 : tous les mobiles sont en `06 39 98`.
- Conséquence pour la mise au point : les règles ne doivent pas s'appuyer sur ces préfixes. Elles doivent reconnaître n'importe quel numéro français au bon format.

## Pièges

Répartis dans les deux jeux ; le script affiche leur décompte à chaque génération.

- Prénoms qui sont des mots courants : Rose, Pierre (imposés à tour de rôle à la personne principale de chaque modèle) ; et les mêmes mots hors nom de personne, dans le texte, les noms de voie ou les raisons sociales (« plan de travail en pierre », « allée des Roses », « LA ROSE DES PRÉS SAS »…).
- Noms de famille qui sont des noms de ville : Florence, Paris, Valence ; les mêmes noms apparaissent aussi comme lieux (ville isolée, lieu de naissance, adresse).
- Noms en MAJUSCULES, nom avant prénom, initiale seule, nom seul.
- Adresses sur deux lignes (ou trois avec un complément), ville en majuscules.
- Entreprises portant un nom de famille, parfois celui d'une personne du même document (dans le jeu de développement : « DA SILVA CONSEIL SA » dirigée par Rose DA SILVA, « CABINET MEUNIER & ASSOCIÉS SELAS » et Maître Inès MEUNIER).
- Nombreuses dates, dont des dates de naissance.
- Villes isolées hors adresse.
- Montants, avec espaces ordinaires ou insécables.

Les pièges propres aux formats (identifiants dans un tableau .docx, texte PDF coupé en fin de ligne) viendront avec les variantes .docx et PDF.

## Limites connues

- Données synthétiques, plus propres et plus régulières que des documents réels (`seuils.md`, § 5).
- Un identifiant aléatoire à clé valide (SIREN, SIRET, NIR, IBAN, carte) peut, par hasard, coïncider avec un identifiant attribué. Ce n'est pas vérifié (il faudrait interroger des bases externes) ; il n'est en tout cas associé à aucune personne ni entreprise réelle.
- Domaines de messagerie inventés, non vérifiés dans le DNS : certains peuvent exister.
- Villes et codes postaux réels ; numéros et noms de voies inventés, sans nom de personne. Le code commune du NIR est aléatoire, sans contrôle contre le code officiel géographique.
- Combinaisons prénom + nom tirées au hasard ; quelques combinaisons évoquant une personne connue sont exclues explicitement, sans garantie d'exhaustivité.

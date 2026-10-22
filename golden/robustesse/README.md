# Jeu de robustesse (« jeu de difficulté »)

**Données 100 % fictives**, rédigées à la main. Aucun document, nom, adresse ou identifiant ne provient d'une personne ou d'une entreprise réelle.

> **Règle : ce jeu ne sert jamais à mettre au point les règles ni le post-traitement d'un modèle.** La mise au point se fait sur `golden/dev/` uniquement. Ce jeu est figé par ses empreintes (`MANIFEST.sha256`) ; voir `seuils.md`, amendement du 22/10/2026 (4).

## Pourquoi ce jeu

Le jeu de développement et le jeu de test sortent du même générateur et partagent ses conventions d'écriture (« Prénom NOM », forme juridique accolée à la raison sociale, mêmes compléments d'adresse). Des règles mises au point sur le premier risquent donc d'être flattées par le second. Ce jeu, écrit hors du générateur, contient des cas volontairement difficiles. C'est un jeu de difficulté, pas un échantillon représentatif de documents réels : ses résultats sont rapportés à côté des seuils, sans les remplacer.

## Contenu

15 documents, 5 par persona, chacun en deux fichiers : `<doc_id>.txt` (UTF-8, fins de ligne `\n`, NFC) et `<doc_id>.json` (étiquettes, même format que `golden/README.md`, avec `"split": "robustesse"`).

| Document | Type | Cas difficiles |
|---|---|---|
| rob-avocat-01 | Fil de courriels | En-têtes « De : », prénom seul, nom en minuscules, prénom identique à une ville (Nancy : personne, lieu isolé et ville d'adresse), numéro RG |
| rob-avocat-02 | Parties d'une assignation | Forme juridique non accolée, enseigne entre guillemets, SIREN à points, lieu-dit, zone d'activités, prénom-mot (Noël, et « congés de Noël » à ne pas masquer), nom composé, titres en majuscules |
| rob-avocat-03 | Notes de rendez-vous | Style télégraphique, prénoms-mots (Olive, Ange), nom en majuscules dans un intitulé, apostrophe dans une raison sociale, carte à 15 chiffres groupée 4-6-5, boîte postale et Cedex, dates partielles |
| rob-avocat-04 | Lettre entre confrères | Particule (de Villeneuve-Rocca), initiale + particule, nom-adjectif (Constant / « constante »), prénom seul d'un couple, résidence / bâtiment / appartement sur trois lignes, indicatif 0033 |
| rob-avocat-05 | Attestation de témoin | Apostrophe typographique (N’Diaye), espaces fines insécables, noms en minuscules, nom à particule (Le Goff), nom seul, lieu de naissance à l'étranger |
| rob-ec-01 | Fiche client en tableau | Cellules séparées par des tabulations, forme juridique dans une autre cellule, « NOM, Prénom », TVA espacée, IBAN belge, e-mail en casse mixte, code NAF (à ne pas masquer) |
| rob-ec-02 | Courriel de relance | Prénoms seuls, « + » dans l'adresse e-mail, adresse sans numéro ni code postal, numéro de poste après le téléphone, raisons sociales en mots courants |
| rob-ec-03 | Lettre de mission (association) | Association, SIREN et TVA collés, IBAN coupé en fin de ligne, prénom court (Lou) |
| rob-ec-04 | Note de cession | Même mot pour une personne, une organisation et une ville (Vienne), adresse réduite à la voie, forme juridique entre parenthèses |
| rob-ec-05 | Relance générée par un logiciel | Tout en majuscules, NOM PRÉNOM, initiales composées, adresse indentée sans tirets, périodes (T3 2026, 07-09/2026), années sur deux chiffres |
| rob-rh-01 | CDD saisonnier | NIR d'une personne née en Corse (2A), organisation sans forme juridique, nom de famille Martin et Saint-Martin dans les adresses, mas et quartier |
| rob-rh-02 | Courriel d'accueil | Nom vietnamien dans l'ordre nom-prénom puis prénom composé seul, prénom de deux lettres (Jo), en-têtes Cc |
| rob-rh-03 | Attestation employeur | Nom de naissance et nom d'usage, NIR d'une personne née à l'étranger avec clé séparée par « / », « chez M. et Mme… », CS, téléphone à tirets, e-mail générique de service |
| rob-rh-04 | Compte rendu d'entretien annuel | Prénom et nom qui sont des mots courants (Constance / « constance », Petit / « petit »), initiales, organisation contenant un nom de famille |
| rob-rh-05 | Convocation à entretien préalable | Nom identique à une ville (Lourdes), « chez Mme… », résidence sans numéro, téléphone à points précédé de +33, institutions (mairie, inspection du travail) |

Décompte des étiquettes : PERSONNE 90, ORGANISATION 35, ADRESSE 19, EMAIL 16, TELEPHONE 11, NUMERO_DOSSIER 6, SIRET 5, SIREN 4, IBAN 3, TVA_INTRA 3, NIR 2, CARTE 1 ; DATE 51, MONTANT 14 ; neutres : LIEU_ISOLE 22, INSTITUTION 10.

## Conventions

Celles de `golden/README.md`, avec ces précisions :

- **ADRESSE** : aussi les adresses incomplètes (sans numéro, sans code postal, voie seule), les boîtes postales (BP, CS) et les lieux-dits.
- **ORGANISATION** : aussi les enseignes, associations et banques ; la forme juridique n'est comprise que si elle est accolée (« SCI LES TILLEULS DU LAC » oui ; « Kervala, société par actions simplifiée » : seulement « Kervala »).
- **DATE** : aussi un mois seul, une année seule et les périodes (« T3 2026 », « 07-09/2026 »).
- **IBAN** : aussi un IBAN étranger ou coupé en fin de ligne (l'étiquette contient le saut de ligne).
- **CARTE** : aussi les numéros à 15 chiffres.
- **INSTITUTION** : aussi des désignations publiques absentes du générateur (France Travail, mairie, inspection du travail).
- Pièges de précision volontairement non étiquetés : « congés de Noël », « constance », « un petit retard », le code NAF, les numéros d'articles de loi, les intitulés en majuscules.

## Construction et contrôles

Les textes et les étiquettes sont écrits dans `scripts/robustesse/documents.py` ; `scripts/robustesse/construire.py` calcule les positions et écrit les fichiers (Python 3, bibliothèque standard uniquement) :

```sh
python3 scripts/robustesse/construire.py golden/robustesse
```

Si un seul contrôle échoue, rien n'est écrit. Contrôles :
- `text.slice(start, end) === text` pour chaque étiquette ; pas d'étiquette vide ou bordée d'espaces ; pas de chevauchement partiel (une étiquette contenue dans une plus longue est absorbée, comme dans le générateur) ;
- chaque occurrence d'une valeur à masquer est couverte par une étiquette ;
- chaque mot d'un nom de personne, cherché sans tenir compte de la casse, est couvert partout, sauf les pièges déclarés ;
- clés de contrôle recalculées à partir du texte tel qu'écrit (IBAN, SIREN, SIRET, TVA, NIR, carte) ; téléphones dans les plages Arcep réservées à la fiction ; forme des e-mails ;
- texte NFC, sans caractère hors du plan multilingue de base ; 5 documents par persona ;
- reconstruction identique à l'octet près (vérifiée par comparaison des empreintes).

Limite des contrôles : un nom qui n'apparaît qu'une fois, seul, et qu'on aurait oublié d'étiqueter n'est pas détectable par script. D'où la relecture humaine par sondage (4 documents) avant le gel.

Vérification des empreintes :

```sh
cd golden/robustesse && shasum -a 256 -c MANIFEST.sha256
```

## Limites connues

- **Auteur unique** : Claude (conversation du 22/10/2026). Indépendant du générateur, mais pas indépendant d'un auteur, et de la même famille de modèles que celle qui a écrit le générateur. Avant d'écrire, l'auteur a lu `golden/README.md` et un document du jeu de développement (pour s'écarter de leurs conventions) ; il n'a lu ni les règles (`src/regles.mjs`), ni le jeu de test, ni ses modèles, et n'a fait tourner aucun détecteur sur ce jeu.
- **Petit échantillon** : 19 adresses, donc une adresse manquée vaut environ 5 points de rappel. Les écarts de quelques points ne sont pas interprétables.
- Données synthétiques, plus propres que des documents réels, malgré les cas difficiles.
- Villes et codes postaux réels ; voies, numéros et domaines de messagerie inventés (certains domaines peuvent exister). Téléphones dans les plages de fiction de l'Arcep (même source que `golden/README.md`). Identifiants à clé valide générés sans vérification contre des bases externes : une coïncidence avec un identifiant attribué n'est pas exclue, mais aucun n'est associé à une personne ou une entreprise réelle.
- Code pays INSEE du NIR né à l'étranger (99351, Tunisie) : non vérifié dans le code officiel géographique ; sans effet sur la clé.

# Option 3 : verdict

## En bref

- Candidat retenu : C, fp16-mixte v2, désigné par la règle de l'amendement (5) : fidélité 0 (A et B : 139), 1re visite maximale 23 325,8 ms, sous le seuil de 24 000 ms (sections a et b).
- Le gain de C sur le q8 Xenova (défaut du chargeur) n'est mesuré que sur le jeu de développement : fidélité 0 contre 139 ; modèle seul S3 100,0 % contre 93,9 %, S5 60,9 % contre 17,4 %, S6 85,2 % contre 94,2 % ; 1re visite maximale 23 325,8 ms contre 11 594,6 ms (section b).
- Combiné C sur le jeu de robustesse, mesure unique : S3, S5 et S6 atteints ; S2 (95,2 %) et S4 (63,2 %), bloquants, non atteints (section c).
- C n'est pas le modèle par défaut du chargeur navigateur ; aucune page de l'app n'existe encore dans le dépôt, seul le banc utilise ce chargeur (constat préalable).
- Safari, iPhone et mémoire : non mesurés (section d).

24/10/2026. Faits déjà commités uniquement, chacun avec sa source. Jeu de développement : indicatif, pas la mesure finale (mention portée par chaque rapport de l'évaluateur sur ce jeu, `scripts/evaluer.mjs:42`, par exemple `resultats/compression/evaluation-dev/modele.md`, commit `cb2290e` ; motif : `resultats/dev/journal-regles.md`, commit `6956895`, « la mesure qui compte est celle du jeu de test »). Jeu de robustesse : indicatif, ne modifie pas les seuils (seuils.md, amendement (4)).

## Constat préalable : fichier modèle chargé par défaut par le chargeur navigateur

Le chargeur navigateur (`src/modele-navigateur.mjs`, version du commit `e55ea4a`) charge par défaut, sans l'option `modele` du banc, le q8 Xenova : `onnx/model_quantized.onnx` de `Xenova/camembert-ner`, révision `8e1988247e872ba0137062653b1e5033a31e14fc`.

- Liste des fichiers : `src/modele-commun.mjs:24` (`FICHIERS = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx']`), dépôt et révision lignes 20-21.
- URL de chaque fichier sans option : `src/modele-navigateur.mjs:130` (`CHEMINS.modele + f`, soit `/modeles/camembert-ner/<révision>/`, ligne 26).
- Chargement par la bibliothèque en q8 : `src/modele-navigateur.mjs:192` (`from_pretrained(DEPOT, { dtype: 'q8', device: 'wasm', … })`).
- Dans le dépôt, seul le banc (`bench/page.mjs`, `bench/travailleur.mjs`) importe ce chargeur ; C n'est chargé que par l'option `--modele` du banc (commit `e55ea4a`).

C n'est pas le modèle par défaut du chargeur ; aucune page de l'app n'utilise encore ce chargeur. La seule page HTML du dépôt est celle du banc (`bench/index.html`).

## a. Décision

- Candidat retenu : **C, fp16-mixte v2**, `modeles/compression/fp16-mixte/model.onnx`, 220 500 160 octets, SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb` (`resultats/compression/conversion.json`, commit `29b6251` ; `modeles/MANIFEST.sha256`).
- Recette : `convert_float_to_float16`, `keep_io_types=True`, liste d'exclusion par défaut + `Pow`, `ReduceMean`, `Sqrt`, depuis l'étalon `model.onnx` Jean-Baptiste/camembert-ner (`c9dfa2ec…`), sans pré-traitement ni changement d'opset (seuils.md, amendement (6), commit `d89f47e`). Correctif technique : attribut `to` de `/roberta/Cast` aligné sur FLOAT16, décidé par Sébastien le 24/10/2026 comme sans effet numérique ; la v1, sans ce correctif, n'était pas chargeable (`resultats/compression/conversion.md`, commit `29b6251` ; `resultats/compression/fidelite-fp16-mixte-erreur.txt`, commit `fce4f98`).
- Choix : règle de l'amendement (5) (commit `1215951`), appliquée aux trois candidats de l'amendement (6) (`resultats/compression/regle-de-choix.md`, commit `33c8431`).
- Gel : étiquette annotée `mask-option3-gel` sur `33c8431`, message « Gel option 3 : C fp16-mixte v2, SHA-256 860504f2…, fidélité 0, S7 max 23,3 s, choisi par la règle de l'amendement (5), confirmé par Sébastien le 24/10/2026. »

## b. Mesures sur le jeu de développement

Fidélité (masques différents de l'étalon, modèle seul, 17 documents, onnxruntime-web 1.31.0-dev WASM dans Node) et 1re visite (banc Chrome 155, 100 Mb/s simulés, page isolée, threads par défaut, WASM simple, 5 répétitions ; critère = maximum) :

| Candidat | Taille (octets) | Fidélité | Étalon seul / candidat seul | Documents touchés | 1re visite max | Médiane | Min | Octets servis |
|---|---|---|---|---|---|---|---|---|
| A int8-matmul | 186 209 503 | 139 | 69 / 70 | 16/17 | 18 282,0 ms | 18 152,6 | 18 138,7 | 203,7 Mo |
| B int8-defaut | 111 284 869 | 139 | 69 / 70 | 16/17 | 12 527,7 ms | 12 416,9 | 11 531,3 | 128,8 Mo |
| **C fp16-mixte v2** | 220 500 160 | **0** | 0 / 0 | 0/17 | 23 325,8 ms | 21 386,7 | 21 362,8 | 238,0 Mo |
| q8 Xenova (défaut du chargeur), pour mémoire | 111 284 131 | 139 | 70 / 69 | 16/17 | 11 594,6 ms | 11 540,4 | 11 530,7 | 128,8 Mo |

Sources : fidélité `resultats/compression/fidelite-int8-matmul.json`, `fidelite-int8-defaut.json` (commit `fce4f98`), `fidelite-fp16-mixte.json` (commit `0b506fe`), q8 `resultats/compression/validation-fidelite/q8-contre-fp32.md` (commit `8fe956b`, étalon fp32 Xenova, équivalent à l'étalon Jean-Baptiste : 0 masque différent, `resultats/compression/coherence-etalon.md`, commit `cf30c4b`) ; 1re visite `resultats/compression/banc/{int8-matmul,int8-defaut,fp16-mixte,q8-xenova}/chrome.md` (commits `36a3c09`, `f8df450`, `9dd4b06`, `faf8efe`) ; tailles `conversion.json` (commit `29b6251`) et, pour le q8, `resultats/compression/inspection-base.txt` (commit `8fe956b`).

Les trois « 139 » ne sont pas les mêmes écarts : 97 masques en écart sont communs à A, B et q8 (`resultats/compression/recoupement-139.md`, commit `29b6251`).

Scores du modèle seul, jeu de développement, sous WASM :

| # | Critère | Bloquant | C (= F) | q8 Xenova, défaut du chargeur (= W) | Seuil |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | oui | 2,9 % (2/69) | 1,4 % (1/69) | 100 % |
| S3 | Rappel PERSONNE | oui | 100,0 % (49/49) | 93,9 % (46/49) | ≥ 95 % |
| S4 | Rappel ADRESSE | oui | 0,0 % (0/30) | 0,0 % (0/30) | ≥ 90 % |
| S5 | Rappel ORGANISATION | non | 60,9 % (14/23) | 17,4 % (4/23) | ≥ 85 % |
| S6 | Précision globale | non | 85,2 % (132 corrects, 23 erreurs) | 94,2 % (145 corrects, 9 erreurs) | ≥ 80 % |

Sources : C `resultats/compression/evaluation-dev/modele.md` (commit `cb2290e`, identique à F hors en-tête) ; F et W `resultats/navigateur/diagnostic-moteurs-2026-10-22/{F,W}/modele.md` (mesures du 22/10 au commit `6172cfa`, rapatriées au commit `6e9021f`, non rejouables telles quelles).

## c. Mesure unique sur le jeu de robustesse

Combiné C (règles 0.4.0 + modèle 0.2.0 avec C, WASM), une exécution, arbre propre au commit `cb2290e` :

| # | Critère | Bloquant | Combiné C | Seuil | Verdict |
|---|---|---|---|---|---|
| S2 | Rappel des formats fixes | oui | 95,2 % (40/42) | 100 % | non atteint |
| S3 | Rappel PERSONNE | oui | 96,7 % (87/90) | ≥ 95 % | atteint |
| S4 | Rappel ADRESSE | oui | 63,2 % (12/19) | ≥ 90 % | non atteint |
| S5 | Rappel ORGANISATION | non | 100 % (35/35) | ≥ 85 % | atteint |
| S6 | Précision globale | non | 99,0 % (196 corrects, 2 erreurs) | ≥ 80 % | atteint |

Source : `resultats/compression/evaluation-robustesse/combine.md` et `synthese.md` (commit `84b5290`).

- S2 et S4 ne sont pas atteints. Les 9 éléments manqués ou partiels (S2 : IBAN coupé en fin de ligne, NIR né à l'étranger à clé séparée ; S4 : 7 adresses partielles) sont les mêmes, avec le même statut, qu'au combiné 1.5a sous Node natif (`synthese.md`, commit `84b5290` ; `resultats/robustesse/combine.md`, commit `9aaafc4`).
- Ils relèvent d'abord des règles : le modèle n'a pas de catégorie pour les formats fixes ni pour les adresses (catégories PER, ORG, LOC, MISC, `src/modele-commun.mjs:29` ; seuils.md, amendement du 21/10/2026 : « S4 repose sur les règles et les lieux détectés ») ; modèle seul C sur ce jeu : S2 4,8 % (2/42), S4 5,3 % (1/19) (`evaluation-robustesse/modele.md`, commit `84b5290`).
- Pourcentages S2 à S6 du combiné C identiques à ceux du combiné 1.5a ; écarts ponctuels dans les listes détaillées (un nom passé de partiel à oubli, une erreur différente, un type différent en moins) (`synthese.md`).

## d. Non mesuré

- Le q8 Xenova (défaut du chargeur) sur le jeu de robustesse sous WASM. Choix du 24/10/2026 : le gain de C sur le q8 n'est mesuré que sur le jeu de développement. Les mesures du q8 sur ce jeu datent du lot 1.5a, sous Node natif, marquées « moteur non représentatif de l'app » (`resultats/robustesse/`, seuils.md, amendement (5)).
- Safari (Mac) et iPhone : aucune mesure de C ; le banc n'a tourné que dans Chrome 155 sur Mac.
- La mémoire de C : non mesurée en propre (ni dans le navigateur, ni dans un processus isolé).
- La cause des pics de traitement de C : à la 1re visite, 622 et 423,4 ms pour 1 000 caractères aux répétitions 3 et 5, contre 225,2 à 227,4 ms dans les autres visites (`resultats/compression/banc/fp16-mixte/chrome.json`, commit `9dd4b06`). Cause non recherchée.

## e. Limites

- Tokenizer : `tokenizer.json`, `tokenizer_config.json` et `config.json` restent ceux de Xenova/camembert-ner, révision `8e19882` (`src/modele-commun.mjs:20-24`, `modeles/MANIFEST.sha256`) ; le dépôt Jean-Baptiste ne publie pas de `tokenizer.json` (`resultats/compression/inspection-base.txt`, commit `8fe956b`). L'absence de licence déclarée pour les fichiers Xenova n'est consignée dans aucun fichier du dépôt : à documenter. S9 reste incomplet : licences de camembert-base et du jeu d'entraînement wikiner_fr non vérifiées (seuils.md, amendement (5)).
- Marge S7 : 1re visite maximale de C 23 325,8 ms pour un seuil de choix de 24 000 ms, soit 674,2 ms. Écart constaté entre deux séries du même fichier q8 : médianes 12 214,2 ms (lot 1.5b, `resultats/navigateur/chrome.md`, commit `6172cfa`) et 11 540,4 ms (`banc/q8-xenova/chrome.md`, commit `faf8efe`), soit 673,8 ms, situé dans la phase de téléchargement. À l'intérieur de la série de C, les répétitions vont de 21 362,8 à 23 325,8 ms, l'écart étant aussi dans le téléchargement (`regle-de-choix.md`, commit `33c8431`).
- Volume : 238,0 Mo servis à la 1re visite de C, contre 128,8 Mo pour le q8 Xenova (défaut du chargeur) (`banc/fp16-mixte/chrome.md`, `banc/q8-xenova/chrome.md`).

## f. Reporté au lot 2

- Navigateurs et mobile : Safari Mac, iPhone réel, repli mobile.
- Intégration de C comme modèle par défaut du chargeur, et dans l'app : le chargeur navigateur charge aujourd'hui par défaut le q8 Xenova (constat préalable).
- Tokenizer de provenance propre.
- Règles v2 pour S2 et S4, à valider sur un nouveau jeu indépendant ; le jeu de robustesse ne sert pas à les mettre au point (seuils.md, amendement (4)).
- Factorisation du code de session WASM, en double dans `scripts/navigateur/fidelite.mjs` et `scripts/navigateur/detecteur-wasm.mjs`.
- Empreintes des fichiers WASM d'onnxruntime-web (S1).

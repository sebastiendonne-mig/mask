# mask — seuils et cadrage (lot 0, validés le 21/10/2026)

> Fixés AVANT tout essai. Ils ne bougent plus une fois les mesures lancées ; tout amendement est daté et justifié, avant le run concerné.

## 1. Promesse et limites

- Promesse : repérer et remplacer les données identifiantes d'un document, entièrement dans le navigateur du visiteur. Relecture humaine de chaque remplacement avant usage du texte ailleurs. La table de correspondance reste chez le visiteur.
- L'app ne dit jamais « anonymisé » ni « conforme RGPD ». Pour un document hors des 3 personas : « non évalué sur ce type de document, relisez chaque remplacement ».
- Architecture à valider par la mesure : règles (formats fixes) + modèle (noms, adresses, organisations).
- Contexte : guide déontologique du CNB (mars 2026) sur le secret professionnel et la pseudonymisation avant une IA générative. Limite : pseudonymiser n'est pas anonymiser.

## 2. Périmètre v1

- Entrées : n'importe quel document déposé + 3 personas en démo.
- Formats v1 : texte collé, .txt, .docx, PDF contenant du texte. Exclus et signalés : PDF scannés, images, photos.
- Le fichier ne quitte jamais le navigateur ; vocabulaire de l'interface : « déposer », jamais « uploader ».
- Expérience progressive : règles immédiates, modèle téléchargé en arrière-plan (taille annoncée, barre de progression), puis « compléter la détection » ; cache aux visites suivantes.
- Repli (navigateur incompatible, mobile, modèle non chargé) : vidéo + résultats d'évaluation + mode « règles seules » clairement présenté comme partiel. Repli mobile : décision après les mesures du lot 1.

## 3. Personas et identifiants

| Persona | Document type | Identifiants masqués |
|---|---|---|
| Avocat | Courrier client, assignation | Noms des parties, adresses, organisations, n° de dossier |
| Expert-comptable | Lettre de mission, relevé | Raison sociale, SIREN/SIRET, n° TVA intracommunautaire, IBAN, dirigeant, adresse, e-mail, téléphone |
| RH | Contrat de travail, attestation | Nom, n° de sécurité sociale, adresse, e-mail, téléphone |

Décisions :
- a) Montants (salaire, honoraires) : NON masqués en v1 — limite affichée.
- b) Santé en texte libre (« en arrêt maladie depuis… ») : hors v1 — limite affichée.
- c) Dates : AUCUNE date masquée, y compris les dates de naissance — limite affichée (une date de naissance combinée à d'autres éléments peut permettre une réidentification). Les dates restent dans le golden set : une date masquée compte comme faux positif.
- Point à trancher au lot 1, après mesure : lieux isolés (une ville seule, hors adresse).

## 4. Seuils go/no-go

| # | Critère | Seuil | Bloquant |
|---|---|---|---|
| S1 | Aucune requête réseau contenant du texte du document, aucune télémétrie de contenu (analytics, suivi d'erreurs, journaux) | 0 | Oui |
| S2 | Rappel sur les formats fixes (IBAN, SIREN/SIRET, n° de sécurité sociale, e-mail, téléphone, carte bancaire) | 100 % | Oui |
| S3 | Rappel sur les noms de personnes | ≥ 95 % | Oui |
| S4 | Rappel sur les adresses | ≥ 90 % | Oui |
| S5 | Rappel sur les organisations | ≥ 85 % | Non, affiché |
| S6 | Précision globale | ≥ 80 % | Non, affiché |
| S7 | Chargement : règles < 1 s ; modèle prêt ≤ 30 s à la 1re visite (débit simulé de référence : 100 Mb/s) ; ≤ 5 s aux visites suivantes | — | Oui |
| S8 | Temps de traitement par page | calibré au lot 1, aucun chiffre fixé d'avance | — |
| S9 | Licence compatible avec un usage commercial, provenance officielle, révision épinglée, empreinte vérifiée | — | Oui |

Note : S3 (95 %) est un choix assumé, sans norme externe ; il se justifie par la relecture humaine obligatoire.

## 5. Golden set (sans annotation manuelle)

- 3 personas × 10 documents + 5 documents sans aucune donnée personnelle (faux positifs).
- Génération : modèles de documents rédigés une fois, emplacements remplis par script avec des données fictives (formats et clés de contrôle valides, valeurs inventées) ; étiquettes connues dès la génération. Jamais de données réelles.
- Pièges : prénoms-mots courants (Rose, Pierre), noms de personne = noms de ville (Florence), MAJUSCULES, adresse sur deux lignes, entreprise portant un nom de famille, identifiants dans un tableau .docx, texte PDF coupé en fin de ligne, dates nombreuses (ne doivent pas être masquées).
- Limite assumée : données 100 % synthétiques, plus propres que des documents réels.

## 6. Candidats du lot 1

| Candidat | Type | Licence | Taille | Réserve |
|---|---|---|---|---|
| Règles | Expressions régulières + clés de contrôle | — | ~0 | Référence de base ; ne voit ni noms ni adresses |
| cmarkea/distilcamembert-base-ner | Détection d'entités, français | MIT | à mesurer | PER/LOC/ORG/MISC seulement ; entraîné sur WikiNER (chiffres publiés probablement optimistes sur des courriers) |
| Jean-Baptiste/camembert-ner (port Transformers.js non officiel) | Détection d'entités, français | à vérifier | ~110 M paramètres | Licence et port à vérifier |
| ZenSystemAI/ossredact-pii-base | Données personnelles, 20 types | MIT | ~277 Mo (int8) | Entraînement 100 % synthétique québécois ; formats canadiens, pas SIRET ni n° de sécurité sociale français |
| Petit LLM 1–3 B (WebLLM) | Génératif, challenger | selon modèle | > 1 Go probablement | Ne passera probablement pas S7 dans le navigateur ; mesure si le gain de qualité vaudrait l'attente |

Règle de mesure : même bibliothèque que l'app (Transformers.js), pour que les mesures locales prédisent le comportement réel.

## 7. À vérifier en début de lot 1

- Taille réelle et compatibilité navigateur des deux modèles CamemBERT ; licence de camembert-ner.
- En-têtes de sécurité éventuellement imposés par WebGPU et effet sur les analytics.
- Bibliothèques de lecture .docx et PDF dans le navigateur.
- Licence du dépôt public (décision en attente).

## 8. Amendements (avant tout essai)

### 21/10/2026 — candidats, jeu de développement, licence

- Candidats du banc de mesure : règles + Jean-Baptiste/camembert-ner (version Transformers.js Xenova/camembert-ner, 111 Mo quantifiée). Retiré pour gagner du temps : ZenSystemAI/ossredact-pii-base. En réserve : cmarkea/distilcamembert-base-ner (conversion ONNX nécessaire), utilisé seulement si camembert-ner échoue. Le petit LLM challenger est maintenu.
- Risque connu : ni camembert-ner ni distilcamembert n'ont de catégorie « adresse » ; S4 repose sur les règles et les lieux détectés. En cas d'échec de S3 ou S4, la liste des candidats est réexaminée ; les seuils ne sont pas modifiés.
- Jeu de développement : en plus du golden set (désormais « jeu de test », 3 × 10 + 5 documents), un jeu de développement séparé, généré à partir d'autres modèles de documents, sert à mettre au point les règles. Le jeu de test n'est utilisé qu'une fois, pour la mesure finale ; ses empreintes SHA-256 sont commitées à sa création.
- Formats : le golden set est d'abord généré en texte brut ; les variantes .docx et PDF (pièges du tableau et de la coupure de ligne) seront ajoutées avec la lecture de documents, avant la mesure finale, et leurs empreintes commitées à leur création.
- Licence du dépôt : MIT.

### 21/10/2026 (2) — protocole de comptage, avant l'écriture des règles

- Un élément étiqueté est « retrouvé » seulement s'il est entièrement couvert par les masques ; un masquage partiel (par exemple le prénom seul) compte comme un oubli. Le taux de couverture partielle est rapporté à titre d'information.
- Précision (S6) : un masque est une erreur s'il ne recouvre aucun élément étiqueté à masquer ni aucun élément neutre.
- Éléments neutres, qui ne comptent ni comme réussite ni comme erreur et sont rapportés à part : les institutions publiques (juridictions, organismes et administrations publics, collectivités, ordres professionnels), étiquetées INSTITUTION, et les lieux isolés (LIEU_ISOLE).
- Les dates (DATE) et montants (MONTANT) masqués comptent comme des erreurs (décisions a et c).
- Le traitement des lieux isolés dans l'app (masqués ou non) est décidé après les mesures sur le jeu de développement et avant l'ouverture du jeu de test.
- Les étiquettes INSTITUTION sont ajoutées aux deux jeux avant l'écriture des règles ; le texte des documents est inchangé, seuls les fichiers d'étiquettes et le manifeste sont mis à jour.

### 21/10/2026 (3) — précision du protocole, avant toute mesure

- « Entièrement couvert » s'apprécie sur les lettres et les chiffres : un élément étiqueté est retrouvé si chacune de ses lettres et chacun de ses chiffres est masqué. Espaces, sauts de ligne, espaces insécables et ponctuation laissés visibles ne comptent pas comme un oubli. Une lettre ou un chiffre laissé visible reste un oubli.
- Raison : un modèle renvoie souvent les mots d'un même nom comme des masques séparés ; un espace visible entre deux mots masqués ne révèle rien.

### 22/10/2026 (4) — jeu de robustesse, avant toute mesure du modèle

- Constat : le jeu de test sort du même générateur que le jeu de développement et partage ses conventions d'écriture (« Prénom NOM », forme juridique accolée, mêmes compléments d'adresse) ; trois des quatre ajustements des règles reposent sur ces conventions. Le jeu de test risque donc de flatter les règles et de fausser la comparaison règles / modèle. C'est une erreur de conception du lot 0, reconnue.
- Ajout d'un troisième jeu, `golden/robustesse/` : 15 documents (5 par persona), rédigés à la main hors du générateur, avec des cas volontairement difficiles (détail dans `golden/robustesse/README.md`). C'est un jeu de difficulté, pas un échantillon représentatif.
- Auteur : Claude (conversation du 22/10/2026). Il a lu `golden/README.md` et un document du jeu de développement, pour s'écarter de leurs conventions ; il n'a lu ni les règles, ni le jeu de test, ni ses modèles, et n'a fait tourner aucun détecteur sur ce jeu. Limite : indépendant du générateur, pas d'un auteur unique.
- Étiquettes listées par l'auteur (`scripts/robustesse/documents.py`) ; positions calculées et contrôlées par script (`scripts/robustesse/construire.py`) ; relecture par sondage de Sébastien (4 documents) avant le gel.
- Conventions : celles de `golden/README.md`, précisées dans `golden/robustesse/README.md` (adresses incomplètes, BP, CS et lieux-dits = ADRESSE ; enseignes, associations et banques = ORGANISATION ; mois seul, année seule et périodes = DATE ; IBAN étranger ou coupé = IBAN ; cartes à 15 chiffres = CARTE ; France Travail, mairie, inspection du travail = INSTITUTION).
- Gel : le jeu est commité avec ses empreintes (`golden/robustesse/MANIFEST.sha256`) avant toute mesure du modèle. Ses fichiers ne sont plus modifiés ; une erreur d'étiquetage découverte ensuite n'est corrigée que par un amendement daté, et les résultats avant et après correction sont publiés tous les deux.
- Usage : jamais pour ajuster les règles (gelées depuis `6956895`), un modèle ou son post-traitement ; la mise au point se fait sur le jeu de développement seul. Résultats rapportés à côté des seuils, à titre indicatif : ils ne modifient ni les seuils ni la décision go/no-go, prise sur le jeu de test ; ils éclairent le choix d'architecture (règles seules, modèle seul, ou les deux).
- Échantillon : 90 noms de personnes, 35 organisations, 19 adresses. Une adresse manquée vaut environ 5 points de rappel : les écarts de quelques points ne sont pas interprétables.

### 23/10/2026 (5) — compression du modèle par nous et moteur de référence, avant toute conversion

- Moteur de référence pour toute mesure de qualité du modèle : onnxruntime-web 1.31.0-dev.20260914-8d85527a0, backend WebAssembly, celui que l'app utilise réellement (version exacte imposée par @huggingface/transformers 4.3.1, relevée dans `package-lock.json`). Raison : le 22/10/2026, sur le jeu de développement, les masques du modèle sous onnxruntime-node natif n'étaient identiques à ceux du navigateur que sur 1 document sur 17 (`resultats/navigateur/chrome.md`, lignes 91 à 94, colonne « Modèle = Node natif »).
- Mesures du modèle et du combiné du lot 1.5a (onnxruntime-node natif, `resultats/dev/` et `resultats/robustesse/`) : conservées telles quelles, marquées « moteur non représentatif de l'app ».
- Candidats : deux variantes, fp16 et int8 dynamique par canal, produites par nous à partir du fichier `model.onnx` publié dans Jean-Baptiste/camembert-ner au commit `ef35fe7767c1dad71f5c853838cdd80d0b3441ed` (440 422 178 octets, SHA-256 `c9dfa2ec9e0bfad82d606782ba3e0ab94c001c46481514e0658fc20a624845c5` selon les métadonnées LFS de l'API Hugging Face, revérifié après téléchargement). Outils de production de ce fichier : « ONNX export bot » (Space Hugging Face `optimum/exporters`), selon la PR n° 4 (commit `cc63721`, 22/03/2023) ; commande, versions et opset inconnus. Conversion des candidats en Python sur processeur, sans GPU, sans réentraînement. Seuls nos outils (fp16, int8 dynamique par canal) et leurs versions sont consignés ; l'empreinte SHA-256 de chaque fichier produit est commitée.
- Étalon : ce `model.onnx`, exécuté sous le moteur de référence. Contrôle de cohérence avant toute mesure des candidats, sous le même moteur et sur le jeu de développement, avec l'export fp32 de Xenova (`Xenova/camembert-ner`, révision `8e1988247e872ba0137062653b1e5033a31e14fc`, `onnx/model.onnx`, 440 422 177 octets, SHA-256 `0a2c64c0f051642a3002e5cef91861a26eaa44cceedceac4ce8eabee3fac4f75`) : au plus 10 masques différents (définition du point fidélité) ; le nombre exact est rapporté. Les deux fichiers n'ont pas la même empreinte : le contrôle s'applique.
- Repli, fixé d'avance : si ce fichier ne se charge pas sous le moteur de référence, ou s'il dépasse 10 masques différents, on bascule sur notre propre export fp32 du même commit (outils et versions consignés). Cet export devient à la fois l'étalon et la base des deux candidats (fp16, int8 dynamique par canal), et il est soumis au même contrôle de cohérence (au plus 10 masques différents avec le fp32 Xenova). Si le repli échoue aussi : arrêt, décision de Sébastien.
- Fidélité d'une variante : nombre de masques différents de l'étalon sur le jeu de développement, modèle seul, avec le post-traitement de modele 0.2.0 (entités PERSONNE faites seulement de civilités écartées). Un masque est identifié par ses positions de début et de fin (en caractères du texte d'origine) et sa catégorie (PERSONNE, ORGANISATION, LIEU, DIVERS), tel que renvoyé par `detecter()`, avant la fusion des chevauchements par l'évaluateur. Les masques sont comparés document par document, en comptant les répétitions ; un masque différent est un masque présent d'un seul côté. La fidélité est la somme sur les 17 documents ; le nombre de documents touchés est rapporté à côté. Un masque décalé d'un caractère ou de catégorie différente compte donc pour deux (un de chaque côté). Définition appliquée par `scripts/navigateur/masques-variantes.mjs` ; toute mesure de fidélité utilise ce script, ou une version commitée avant la mesure.
- Règle de choix, fixée d'avance : parmi les variantes dont la 1re visite tient en 24 s au plus (marge de 20 % sous S7), la plus fidèle. 1re visite mesurée avec le banc du lot 1.5b (`bench/piloter-chrome.mjs`) : Chrome, débit simulé de 100 Mb/s, page isolée, threads par défaut, variante WASM simple, 5 répétitions ; critère = maximum des 5 répétitions de « modèle prêt » (session créée + inférence de chauffe, depuis le début de la navigation), même statistique que la colonne « S7 (max ≤ seuil) » de `resultats/navigateur/chrome.md` ; médiane et minimum rapportés à côté. À fidélité égale : la variante dont le fichier du modèle est le plus léger. Si aucune variante ne tient en 24 s : arrêt, décision de Sébastien, aucun choix automatique.
- Le choix se fait sur le jeu de développement seul. Une seule mesure sur le jeu de robustesse, après le gel de la variante choisie.
- Seuils S1 à S9 inchangés. S9 est réévalué avec la provenance documentée : fiche du modèle Jean-Baptiste/camembert-ner, commit `ef35fe7767c1dad71f5c853838cdd80d0b3441ed`, licence MIT déclarée (`license: mit`). Licences du modèle de base camembert-base et du jeu d'entraînement wikiner_fr non vérifiées.

### 24/10/2026 (6) — trois candidats et recettes figées, avant toute conversion

- Contexte : contrôle de cohérence de l'étalon fait le 24/10/2026, 0 masque différent avec le fp32 Xenova, 0 document touché sur 17 (`resultats/compression/coherence-etalon.md`, commit `cf30c4b`). L'étalon `model.onnx` Jean-Baptiste est validé ; le repli de l'amendement (5) ne s'applique pas.
- Remplace, dans l'amendement (5), « deux variantes, fp16 et int8 dynamique par canal » par trois candidats, tous produits depuis l'étalon (Jean-Baptiste/camembert-ner, commit `ef35fe7767c1dad71f5c853838cdd80d0b3441ed`, SHA-256 `c9dfa2ec9e0bfad82d606782ba3e0ab94c001c46481514e0658fc20a624845c5`), sans pré-traitement (pas de `quant_pre_process`) et sans changement d'opset (opset 11 conservé). Outils : onnxruntime 1.31.0, onnxconverter-common 1.16.0, onnx 1.23.2 (`resultats/compression/environnement.md`).
  - A. `int8-matmul` : `onnxruntime.quantization.quantize_dynamic`, `op_types_to_quantize=['MatMul']`, `per_channel=True`, `reduce_range=False`, autres paramètres par défaut. Embeddings non quantifiés.
  - B. `int8-defaut` : `quantize_dynamic`, `per_channel=True`, `reduce_range=False`, `op_types_to_quantize` par défaut (MatMul par canal, embeddings Gather en uint8 par tenseur), autres paramètres par défaut.
  - C. `fp16-mixte` : `onnxconverter_common.float16.convert_float_to_float16`, appel en mémoire (pas la variante par chemin `convert_float_to_float16_model_path`), `keep_io_types=True`, `op_block_list` = liste par défaut (`DEFAULT_OP_BLOCK_LIST`) + `Pow`, `ReduceMean`, `Sqrt`, autres paramètres par défaut.
- Raison : par défaut, la quantification des embeddings est par tenseur, pas par canal. L'arbitrage entre taille et fidélité est laissé à la règle de choix déjà fixée (amendement (5)) ; il n'est pas tranché a priori.
- Recettes appliquées par `scripts/compression/convertir.py`, commité avant toute conversion. Taille, SHA-256, versions des outils et paramètres effectifs de chaque candidat sont consignés dans `resultats/compression/conversion.{json,md}` ; l'empreinte de chaque fichier produit est commitée.
- Correctif technique : autorisé seulement s'il ne change ni les poids ni les calculs (par exemple le type ou le nom d'une sortie). Il est consigné et commité avant toute remesure. Sinon, le candidat est éliminé.
- Règle de choix, étalon, définition de la fidélité, marge S7 : inchangés.

### 24/10/2026 (7) — préversion publique et report des améliorations, avant tout développement de l'application

- Préversion : une préversion de l'application peut être mise en ligne avant la décision go/no-go sur le jeu de test. Elle utilise les règles gelées (0.4.0, commit 6956895) et le modèle C (étiquette mask-option3-gel). La préversion n'est pas un go ; les seuils ne changent pas.
- Conditions non négociables : S1 vérifié sur la version en ligne avant ouverture ; relecture humaine de chaque remplacement ; bandeau « préversion » ; limites affichées avec les résultats mesurés, échecs compris (jeu de robustesse : S2 95,2 %, S4 63,2 %) ; jamais « anonymisé » ni « conforme RGPD ».
- Périmètre : texte collé et documents d'exemple tirés du jeu de développement (jamais du jeu de test) ; Chrome et Edge sur ordinateur ; autres navigateurs : message explicatif.
- Tokenizer : tokenizer.json régénéré depuis le sentencepiece.bpe.model de Jean-Baptiste/camembert-ner (révision ef35fe7), retenu seulement s'il produit des identifiants de tokens identiques à ceux du tokenizer actuel (Xenova) sur tout le jeu de développement. À défaut, la préversion garde le tokenizer Xenova et sa licence non déclarée est documentée.
- Hébergement : fichiers du modèle publiés sur un dépôt Hugging Face au nom de Sébastien, avec la notice de licence MIT de Jean-Baptiste et des empreintes identiques au manifeste ; page de l'application sur Vercel.
- Lot 1.6 (petit LLM challenger) : abandonné.
- ossredact-pii-base : déjà retiré des candidats le 21/10/2026 (amendement du 21/10/2026, ligne 80), et en outre inaccessible publiquement au 24/10/2026 (API Hugging Face : HTTP 401, aucun modèle public de l'auteur). Si la règle du 21/10/2026 s'applique (« En cas d'échec de S3 ou S4, la liste des candidats est réexaminée ; les seuils ne sont pas modifiés. »), il ne pourra pas servir de candidat.
- Reporté après la préversion (v1) : règles v2 mises au point sur un nouveau jeu écrit par Claude, et validées sur un jeu indépendant écrit par Mistral (figé par empreintes avant mesure, mesuré une seule fois ; critère : S2 = 100 %, S3 ≥ 95 %, S4 ≥ 90 %) ; remesure unique du jeu de robustesse, présentée comme non indépendante ; mesure finale sur le jeu de test (lot 1.7) après les règles v2 ; Safari, Firefox et mobile ; formats .docx et PDF. La marge de 24 s de l'amendement (5) s'applique à tout modèle qui remplacerait C.
- Correction du 24/10/2026, après publication : citation de la règle du 21/10/2026 rétablie mot pour mot, statut d'ossredact précisé, format du titre aligné. Version d'origine : commit e94399b.

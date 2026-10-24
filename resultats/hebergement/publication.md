# Publication du modèle sur Hugging Face

24/10/2026. Seuils.md, amendement (7), puce « Hébergement ». Publication décidée par Sébastien (« go » du 24/10/2026), après relecture du README et de la LICENSE ; correction décidée par Sébastien le même jour.

## Dépôt

- Dépôt : [`migranche/mask-camembert-ner`](https://huggingface.co/migranche/mask-camembert-ner), type modèle, **public**. Compte : `migranche` (`hf auth whoami`).
- **Commit à épingler : `018797af8727a7eed18c29a0e033b51005e43430`.**
- Outils : huggingface_hub 2.3.0, hf-xet 1.7.0 (`.cache/venv-onnx`) ; script `scripts/hebergement/publier.py`.

### Historique des commits Hugging Face

| Commit | Heure (UTC) | Contenu | Parent |
|---|---|---|---|
| `6a87c9acaaf05fba7f61ac8af2b26abdfb500543` | 14:19:28 | « initial commit » : `.gitattributes` (1 519 octets), ajouté par Hugging Face à la création | — |
| `26dd16ff5a3f43a34ee3505cd3e3e181c1bb6f29` | 14:19:57 | les 7 fichiers ; README.md `1f7b39753220786255e53d6272817d380ab2dec93e7f1ae634ce42f39f2c9106` (4 831 octets), LICENSE `9c64deb7f1882550d5fcc2a8c32e29f1cd8eeb790675a7bb825f7b40d9ff7e7d` (1 548 octets) | `6a87c9ac` |
| **`018797af8727a7eed18c29a0e033b51005e43430`** | 14:38:11 | correction de README.md et LICENSE seulement | `26dd16ff` |

Raison de la correction : phrase affirmant au présent une vérification pas encore implémentée ; tournure ambiguë de la LICENSE.

- README.md, « Intended use » : « mask pins this repository by commit and is designed to verify each file's SHA-256 against its own manifest before use; this check is implemented in the preview loader. » devient « mask pins this repository by commit and is designed to verify each file's SHA-256 against its own manifest before use. »
- LICENSE : « none is added here. » devient « none is added here for the source model. »

Le commit `26dd16ff` a été fait par une première version du script de publication, restée hors du dépôt (mêmes contrôles : empreinte de chaque fichier local avant l'envoi, `parent_commit`). Le commit `018797af` a été fait par `scripts/hebergement/publier.py --parent 26dd16ff… --fichiers README.md LICENSE`, qui a d'abord revérifié les 7 fichiers locaux et, au commit parent, les 5 fichiers non envoyés.

## Fichiers au commit `018797af`

| Chemin dans le dépôt | Source dans mask | Octets | SHA-256 |
|---|---|---|---|
| `onnx/model_fp16.onnx` | `modeles/compression/fp16-mixte/model.onnx` (C, fp16-mixte v2) | 220 500 160 | `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb` |
| `tokenizer.json` | `modeles/tokenizer/ef35fe7…/tokenizer.json` (`scripts/tokenizer/generer.py`, commit `4411370`) | 1 393 411 | `6898886e61473eeb34a66adb7f5e102ec4a8da3217701369320eb784f7415bfd` |
| `tokenizer_config.json` | `modeles/camembert-ner/ef35fe7…/` (Jean-Baptiste, inchangé) | 269 | `a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f` |
| `special_tokens_map.json` | idem | 210 | `645708b160268d79dbc31bc05bc93f77fda8dfd45dc806b5c3a86e17cfcc5a7a` |
| `config.json` | idem | 892 | `17ec2dd3a642bfc839f3f94bd5ba2e996700aa69b06b3937b0e80b458b962207` |
| `README.md` | `modeles/hf-mask-camembert-ner/README.md` | 4 782 | `5f603f3d74d01343378b25152d6241fca6ec8aece0bd0b904bb4a6fc5301b6fb` |
| `LICENSE` | `modeles/hf-mask-camembert-ner/LICENSE` | 1 569 | `820791fd2a1047538f5951d74a5cfb7002b4f054e92ebc1d89ddf73110f65573` |

- `config.json` de Jean-Baptiste plutôt que celui de Xenova : `id2label` et `label2id` identiques (O, I-LOC, I-PER, I-MISC, I-ORG) ; différences limitées à `_name_or_path`, `transformers_version`, `classifier_dropout` (null chez Xenova, absent chez Jean-Baptiste).
- `onnx/model_fp16.onnx` : nom attendu par Transformers.js 4.3.1 pour `dtype: 'fp16'` (`DEFAULT_DTYPE_SUFFIX_MAPPING`, `dist/transformers.node.mjs` ; chemin `onnx/model<suffixe>.onnx`). Sous WASM, `dtype` ne sert qu'à choisir ce suffixe dans `getSession`. Fichier unique, sans données externes ; entrées int64, sortie `logits` float32 ; opset 11.
- Licence : le dépôt Jean-Baptiste/camembert-ner (révision `ef35fe7`) ne contient ni fichier LICENSE ni notice de copyright nominative ; seule la métadonnée `license: mit` de sa fiche (README.md, SHA-256 `9a8534bb36c563edd94646c7c55a735d6656bf3d1f30ea13e8758e0028a5dc7b`) et de l'API. La LICENSE publiée le dit, et porte une notice au nom de Sébastien limitée à la conversion fp16 et au tokenizer régénéré. Licences de camembert-base et de wikiner_fr : non vérifiées (S9 incomplet).

## Vérifications

### Téléchargement et empreintes

- Commit `26dd16ff` : chaque fichier téléchargé par `https://huggingface.co/migranche/mask-camembert-ner/resolve/26dd16ff5a3f43a34ee3505cd3e3e181c1bb6f29/<chemin>` (curl, redirections suivies), dans un dossier vide hors du dépôt : 7/7 identiques à l'attendu, HTTP 200 au dernier saut.
- Commit `018797af` : README.md et LICENSE téléchargés par `resolve/018797af8727a7eed18c29a0e033b51005e43430/<chemin>` : HTTP 200, SHA-256 égaux à l'attendu, fichiers identiques (`cmp`) aux copies de `modeles/hf-mask-camembert-ner/`. Les 5 autres fichiers relus au même commit (téléchargement, ou empreinte LFS pour le fichier ONNX) : SHA-256 inchangés, égaux à l'attendu.
- Branche `main` du dépôt Hugging Face : `018797af`.

### En-têtes du fichier ONNX (requêtes HEAD, `Origin: https://mask.tkoidra.com`)

Mesurés sur `resolve/26dd16ff…/onnx/model_fp16.onnx`, deux séries à 14:20:33 UTC, résultats identiques ; fichier inchangé au commit `018797af`. URL complètes des redirections non consignées (signature temporaire).

| Saut | Code HTTP | Hôte | access-control-allow-origin | cross-origin-resource-policy | Autres |
|---|---|---|---|---|---|
| 1 | 302 | `huggingface.co` | `https://mask.tkoidra.com` | absent | `access-control-expose-headers` : X-Repo-Commit, X-Request-Id, X-Error-Code, X-Error-Message, X-Total-Count, ETag, Link, Accept-Ranges, Content-Range, X-Linked-Size… ; `x-linked-size` 220500160 ; `x-linked-etag` = SHA-256 attendu |
| 2 | 200 | `us.aws.cdn.hf.co` | `*` | absent | `access-control-expose-headers: *` ; `content-length` 220500160 |

- Constaté : les deux sauts autorisent l'origine `https://mask.tkoidra.com` par CORS ; aucun ne renvoie `cross-origin-resource-policy`.
- Supposé, non vérifié : l'hôte du CDN dépend du lieu de la requête (ici `us.aws.cdn.hf.co`) ; un `fetch()` en mode CORS depuis la page passe ces deux sauts, y compris si la page est isolée (COEP `require-corp`), puisque les réponses CORS n'ont pas besoin de `cross-origin-resource-policy`. À vérifier dans un navigateur à l'étape d'intégration. Non remesuré sur l'URL du commit `018797af`.

## À vérifier avant la mise en ligne de la préversion

Le README publié dit : « mask pins this repository by commit and is designed to verify each file's SHA-256 against its own manifest before use. »

État au 24/10/2026 : le chargeur navigateur (`src/modele-navigateur.mjs`) vérifie le SHA-256 de chaque fichier contre `modeles/MANIFEST.sha256`, mais pour des fichiers servis par l'origine de l'app (`/modeles/…`) ; le chargement depuis ce dépôt Hugging Face, épinglé au commit `018797af…`, n'est pas encore implémenté. **Cette vérification doit être implémentée et constatée avant la mise en ligne de la préversion ; sinon, le signaler à Sébastien.**

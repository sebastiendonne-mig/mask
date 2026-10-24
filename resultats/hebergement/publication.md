# Publication du modèle sur Hugging Face

24/10/2026. Seuils.md, amendement (7), puce « Hébergement ». Publication décidée par Sébastien (« go » du 24/10/2026), après relecture du README et de la LICENSE.

## Dépôt

- Dépôt : [`migranche/mask-camembert-ner`](https://huggingface.co/migranche/mask-camembert-ner), type modèle, **public**.
- Commits Hugging Face :
  - `6a87c9acaaf05fba7f61ac8af2b26abdfb500543`, 14:19:28 UTC, « initial commit » : `.gitattributes` (1 519 octets), ajouté par Hugging Face à la création ;
  - **`26dd16ff5a3f43a34ee3505cd3e3e181c1bb6f29`**, 14:19:57 UTC, nos 7 fichiers en un seul commit (`HfApi.create_commit`, `parent_commit` = `6a87c9ac…`). **Commit à épingler.**
- Outils : huggingface_hub 2.3.0, hf-xet 1.7.0 (`.cache/venv-onnx`). Compte : `migranche` (`hf auth whoami`).
- Empreintes revérifiées par le script de publication juste avant l'envoi ; refus prévu en cas d'écart.

## Fichiers

| Chemin dans le dépôt | Source dans mask | Octets | SHA-256 |
|---|---|---|---|
| `onnx/model_fp16.onnx` | `modeles/compression/fp16-mixte/model.onnx` (C, fp16-mixte v2) | 220 500 160 | `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb` |
| `tokenizer.json` | `modeles/tokenizer/ef35fe7…/tokenizer.json` (`scripts/tokenizer/generer.py`, commit `4411370`) | 1 393 411 | `6898886e61473eeb34a66adb7f5e102ec4a8da3217701369320eb784f7415bfd` |
| `tokenizer_config.json` | `modeles/camembert-ner/ef35fe7…/` (Jean-Baptiste, inchangé) | 269 | `a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f` |
| `special_tokens_map.json` | idem | 210 | `645708b160268d79dbc31bc05bc93f77fda8dfd45dc806b5c3a86e17cfcc5a7a` |
| `config.json` | idem | 892 | `17ec2dd3a642bfc839f3f94bd5ba2e996700aa69b06b3937b0e80b458b962207` |
| `README.md` | rédigé pour cette étape (anglais) | 4 831 | `1f7b39753220786255e53d6272817d380ab2dec93e7f1ae634ce42f39f2c9106` |
| `LICENSE` | rédigé pour cette étape | 1 548 | `9c64deb7f1882550d5fcc2a8c32e29f1cd8eeb790675a7bb825f7b40d9ff7e7d` |

- `config.json` de Jean-Baptiste plutôt que celui de Xenova : `id2label` et `label2id` identiques (O, I-LOC, I-PER, I-MISC, I-ORG) ; différences limitées à `_name_or_path`, `transformers_version`, `classifier_dropout` (null chez Xenova, absent chez Jean-Baptiste).
- `onnx/model_fp16.onnx` : nom attendu par Transformers.js 4.3.1 pour `dtype: 'fp16'` (`DEFAULT_DTYPE_SUFFIX_MAPPING`, `dist/transformers.node.mjs` ; chemin `onnx/model<suffixe>.onnx`). Sous WASM, `dtype` ne sert qu'à choisir ce suffixe dans `getSession`. Fichier unique, sans données externes ; entrées int64, sortie `logits` float32 ; opset 11.
- Licence : le dépôt Jean-Baptiste/camembert-ner (révision `ef35fe7`) ne contient ni fichier LICENSE ni notice de copyright nominative ; seule la métadonnée `license: mit` de sa fiche (README.md, SHA-256 `9a8534bb36c563edd94646c7c55a735d6656bf3d1f30ea13e8758e0028a5dc7b`) et de l'API. La LICENSE publiée le dit, et porte une notice au nom de Sébastien limitée à la conversion fp16 et au tokenizer régénéré. Licences de camembert-base et de wikiner_fr : non vérifiées (S9 incomplet).

## Vérifications

### Téléchargement et empreintes

Chaque fichier téléchargé par `https://huggingface.co/migranche/mask-camembert-ner/resolve/26dd16ff5a3f43a34ee3505cd3e3e181c1bb6f29/<chemin>` (curl, redirections suivies), dans un dossier vide hors du dépôt : **7/7 identiques** à l'attendu (SHA-256 et taille du tableau ci-dessus), HTTP 200 au dernier saut pour chacun.

L'API du dépôt donne aussi, pour `onnx/model_fp16.onnx`, un SHA-256 LFS égal à `860504f2…`, et l'en-tête `x-linked-etag` du premier saut vaut la même empreinte.

### En-têtes du fichier ONNX (requêtes HEAD, `Origin: https://mask.tkoidra.com`)

Deux séries, 14:20:33 UTC, résultats identiques. URL complètes des redirections non consignées (signature temporaire).

| Saut | Code HTTP | Hôte | access-control-allow-origin | cross-origin-resource-policy | Autres |
|---|---|---|---|---|---|
| 1 | 302 | `huggingface.co` | `https://mask.tkoidra.com` | absent | `access-control-expose-headers` : X-Repo-Commit, X-Request-Id, X-Error-Code, X-Error-Message, X-Total-Count, ETag, Link, Accept-Ranges, Content-Range, X-Linked-Size… ; `x-linked-size` 220500160 |
| 2 | 200 | `us.aws.cdn.hf.co` | `*` | absent | `access-control-expose-headers: *` ; `content-length` 220500160 |

- Constaté : les deux sauts autorisent l'origine `https://mask.tkoidra.com` par CORS ; aucun ne renvoie `cross-origin-resource-policy`.
- Supposé, non vérifié : l'hôte du CDN dépend du lieu de la requête (ici `us.aws.cdn.hf.co`) ; un `fetch()` en mode CORS depuis la page passe ces deux sauts, y compris si la page est isolée (COEP `require-corp`), puisque les réponses CORS n'ont pas besoin de `cross-origin-resource-policy`. À vérifier dans un navigateur à l'étape d'intégration.

## À vérifier avant la mise en ligne de la préversion

Le README publié dit : « mask pins this repository by commit and is designed to verify each file's SHA-256 against its own manifest before use; this check is implemented in the preview loader. »

État au 24/10/2026, à la publication : le chargeur navigateur (`src/modele-navigateur.mjs`) vérifie le SHA-256 de chaque fichier contre `modeles/MANIFEST.sha256`, mais pour des fichiers servis par l'origine de l'app (`/modeles/…`) ; le chargement depuis ce dépôt Hugging Face, épinglé au commit `26dd16ff…`, n'est pas encore implémenté. **Cette vérification doit être implémentée et constatée avant la mise en ligne de la préversion ; sinon, le signaler à Sébastien.**

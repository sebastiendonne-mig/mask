# Tokenizer propre : génération et comparaison

24/10/2026. Seuils.md, amendement (7), puce « Tokenizer » : le tokenizer régénéré depuis le `sentencepiece.bpe.model` de Jean-Baptiste/camembert-ner n'est retenu que s'il produit des identifiants de tokens identiques à ceux du tokenizer actuel (Xenova) sur tout le jeu de développement. Pronostic écrit avant la génération : `pronostic.md` (commit `79ec917`).

**Résultat : 0 écart d'identifiant** sur les 17 documents du jeu de développement, dans les trois modes comparés.

## Fichiers

| Rôle | Fichier (relatif à `modeles/`) | Octets | SHA-256 |
|---|---|---|---|
| Source | `camembert-ner/ef35fe7…/sentencepiece.bpe.model` | 810 912 | `988bc5a00281c6d210a5d34bd143d0363741a432fefe741bf71e61b1869d4314` |
| Source | `camembert-ner/ef35fe7…/tokenizer_config.json` | 269 | `a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f` |
| Source | `camembert-ner/ef35fe7…/special_tokens_map.json` | 210 | `645708b160268d79dbc31bc05bc93f77fda8dfd45dc806b5c3a86e17cfcc5a7a` |
| Configuration (id2label) | `camembert-ner/ef35fe7…/config.json` | 892 | `17ec2dd3a642bfc839f3f94bd5ba2e996700aa69b06b3937b0e80b458b962207` |
| **Produit** | `tokenizer/ef35fe7…/tokenizer.json` | 1 393 411 | `6898886e61473eeb34a66adb7f5e102ec4a8da3217701369320eb784f7415bfd` |
| Actuel | `camembert-ner/8e19882…/tokenizer.json` | 2 421 091 | `2fe563b59de779621fa6ef3756e7ae565a87d78ac249afb728daf743ba3821ed` |
| Actuel | `camembert-ner/8e19882…/tokenizer_config.json` | 516 | `ec016bffadf7b3ffc0ca3b9318d166b520a364c8ea3e40b0e26245738b1c08b5` |

Sources téléchargées depuis Jean-Baptiste/camembert-ner à la révision `ef35fe7767c1dad71f5c853838cdd80d0b3441ed`. L'empreinte de `sentencepiece.bpe.model` est égale à l'identifiant LFS publié par l'API Hugging Face pour cette révision. Toutes les empreintes figurent dans `modeles/MANIFEST.sha256`.

## Génération

`scripts/tokenizer/generer.py`, méthode fixée avant toute comparaison (en-tête du script) :

1. `CamembertTokenizer.from_pretrained` lit le modèle sentencepiece, `tokenizer_config.json` et `special_tokens_map.json`, copiés seuls dans un dossier temporaire, sans accès réseau ;
2. `CamembertConverter` (`transformers/convert_slow_tokenizer.py`, convertisseur associé à `CamembertTokenizer`) construit le tokenizer ;
3. `CamembertTokenizer(tokenizer_object=…)` ajoute les jetons spéciaux de la configuration.

Le constructeur `CamembertTokenizer` de transformers 5 seul n'est pas utilisé : son pré-tokeniseur (WhitespaceSplit + Metaspace) traite les espaces autrement.

Reproductibilité : deux exécutions, l'une vers `modeles/tokenizer/ef35fe7…/tokenizer.json`, l'autre vers un dossier temporaire, donnent le même SHA-256 (`6898886e…`) ; `cmp` : fichiers identiques.

## a) Identifiants de tokens

`scripts/tokenizer/comparer.mjs`, Transformers.js (bibliothèque du navigateur) dans Node. Tokenizer actuel chargé avec son `tokenizer_config.json` (Xenova), nouveau avec celui de Jean-Baptiste, tous deux par `preparer` (`src/modele-commun.mjs`). Jeu de développement : 17 documents, 23 280 caractères.

| Mode | Documents | Identiques | Identifiants comparés (jetons spéciaux compris) | Écarts |
|---|---|---|---|---|
| Texte brut entier | 17 | 17 | 5 704 | 0 |
| Copie tokenisable entière (`copieTokenisable`) | 17 | 17 | 5 704 | 0 |
| Mot par mot (`decouperMots` + `tokeniserMots`, entre `<s>` et `</s>`) | 17 | 17 | 5 704 | 0 |

Les deux tokenizers donnent `<s>` = 5 et `</s>` = 6 (`preparer`).

## b) Structure

### tokenizer.json

| Élément | Actuel | Nouveau |
|---|---|---|
| Vocabulaire | 32 005 entrées | 32 005 entrées ; 0 pièce différente ; 8 465 scores écrits différemment, 0 différent en float32 |
| `model` (hors vocabulaire) | Unigram, `unk_id` 3, `byte_fallback` false | identique |
| `normalizer` | Precompiled + Strip (droite) + Replace (` {2,}` → `▁`) | identique (table `precompiled_charsmap` comprise) |
| `pre_tokenizer` | Metaspace, `add_prefix_space: true`, `prepend_scheme: always` | Metaspace, `prepend_scheme: always`, `split: true`, sans `add_prefix_space` |
| `decoder` | idem `pre_tokenizer` | idem `pre_tokenizer` |
| `post_processor` | `<s> $A </s>` (paire `<s> $A </s> </s> $B </s>`) | identique |
| `added_tokens` | 7 : `<s>NOTUSED` 0, `<pad>` 1, `</s>NOTUSED` 2, `<unk>` 3, `<s>` 5, `</s>` 6, `<mask>` 32004 (lstrip) | identique |
| `version`, `truncation`, `padding` | 1.0, null, null | identique |

- `pre_tokenizer` et `decoder` : Transformers.js 4.3.1 ne lit, pour Metaspace, que `replacement`, `str_rep` et `prepend_scheme` (pré-tokeniseur) et `replacement` (décodeur) (`node_modules/@huggingface/transformers/dist/transformers.node.mjs`, lignes 1432-1464 et 2835-2855) ; `add_prefix_space` et `split` n'y sont pas lus.
- Taille : le fichier actuel est indenté (128 210 lignes) ; remis en JSON compact, il fait 1 395 455 octets. Les 2 044 octets restants viennent de l'écriture des scores (exemple : `-3.9756550788879395` contre `-3.975655078887939`), égaux en float32.

### tokenizer_config.json

| Clé | Actuel (Xenova) | Nouveau (Jean-Baptiste) |
|---|---|---|
| `clean_up_tokenization_spaces` | true | absent |
| `mask_token` | AddedToken `<mask>`, lstrip true, normalized true | `"<mask>"` |
| `sp_model_kwargs` | {} | absent |
| `tokenizer_class` | `CamembertTokenizer` | absent |
| `name_or_path` | absent | `camembert-base` |

Autres clés (`additional_special_tokens`, `bos_token`, `cls_token`, `eos_token`, `model_max_length`, `pad_token`, `sep_token`, `unk_token`) : identiques.

## Versions

- Génération : Python 3.14.6 (`.cache/venv-onnx`), transformers 5.20.2, tokenizers 0.23.3, sentencepiece 0.2.2, protobuf 7.36.2. Installés pour cette étape dans `.cache/venv-onnx` : transformers, tokenizers, sentencepiece et leurs dépendances (annotated-doc 0.0.5, anyio 4.15.1, click 8.5.0, filelock 4.2.4, fsspec 2026.9.0, h11 0.16.0, hf-xet 1.7.0, httpcore2 2.16.0, httpx2 2.16.0, huggingface_hub 2.3.0, idna 3.20, markdown-it-py 4.2.0, mdurl 0.1.2, Pygments 2.21.0, PyYAML 6.0.3, regex 2026.9.29, rich 15.0.0, safetensors 0.8.0, shellingham 1.5.4, tqdm 4.70.1, truststore 0.10.5, typer 0.27.3) ; aucun paquet existant modifié.
- Comparaison : Node v24.15.0, @huggingface/transformers 4.3.1.

## Non vérifié

- Jeu de test et jeu de robustesse : non utilisés.
- Textes contenant des jetons spéciaux écrits en clair (`<mask>`, `<pad>`…) ou des caractères absents du jeu de développement : non comparés.
- Intégration au chargeur (`src/`) : étape suivante ; `src/` n'est pas modifié.
- Licence : `sentencepiece.bpe.model`, `tokenizer_config.json` et `special_tokens_map.json` proviennent du dépôt Jean-Baptiste/camembert-ner ; leur licence n'a pas été vérifiée dans cette étape.

Données brutes : `comparaison.json`.

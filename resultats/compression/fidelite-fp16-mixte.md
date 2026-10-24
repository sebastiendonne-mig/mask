# Fidélité : compression/fp16-mixte/model.onnx contre l'étalon camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx

- Date : 2026-10-24T10:11:29.453Z
- Commit : `29b62512a53914b1e041fae1eb5087718d35d99f` (arbre propre : oui) ; script `scripts/navigateur/fidelite.mjs` SHA-256 `70b7bb0648f2291be8100fae0086466a823c0e94e3478560da0415d047e5a263`
- Moteur : onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (WASM, ort.node.min.mjs dans Node), 1 thread, Node 24.15.0
- Détecteur : modele 0.2.0 (src/modele-commun.mjs), tokenizer et configuration camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc
- Jeu : développement, 17 documents
- Définition : seuils.md, amendement (5), point Fidélité : masque = (début, fin, catégorie) de detecter(), avant fusion ; par document, répétitions comptées ; masque différent = présent d’un seul côté ; somme sur les 17 documents

| Rôle | Fichier | Octets | SHA-256 |
|---|---|---|---|
| étalon | `modeles/camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx` | 440422178 | `c9dfa2ec9e0bfad82d606782ba3e0ab94c001c46481514e0658fc20a624845c5` |
| comparé | `modeles/compression/fp16-mixte/model.onnx` | 220500160 | `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb` |

## Résultat

**Fidélité : 0 masques différents** (0 seulement dans l'étalon, 0 seulement dans le comparé), **0 documents touchés** sur 17.

| Document | Masques étalon | Masques comparé | Seulement étalon | Seulement comparé | Différents |
|---|---|---|---|---|---|
| dev-avocat-01 | 12 | 12 | 0 | 0 | 0 |
| dev-avocat-02 | 14 | 14 | 0 | 0 | 0 |
| dev-avocat-03 | 19 | 19 | 0 | 0 | 0 |
| dev-avocat-04 | 20 | 20 | 0 | 0 | 0 |
| dev-avocat-05 | 22 | 22 | 0 | 0 | 0 |
| dev-ec-01 | 10 | 10 | 0 | 0 | 0 |
| dev-ec-02 | 9 | 9 | 0 | 0 | 0 |
| dev-ec-03 | 8 | 8 | 0 | 0 | 0 |
| dev-ec-04 | 14 | 14 | 0 | 0 | 0 |
| dev-ec-05 | 12 | 12 | 0 | 0 | 0 |
| dev-neutre-01 | 2 | 2 | 0 | 0 | 0 |
| dev-neutre-02 | 3 | 3 | 0 | 0 | 0 |
| dev-rh-01 | 9 | 9 | 0 | 0 | 0 |
| dev-rh-02 | 8 | 8 | 0 | 0 | 0 |
| dev-rh-03 | 6 | 6 | 0 | 0 | 0 |
| dev-rh-04 | 6 | 6 | 0 | 0 | 0 |
| dev-rh-05 | 6 | 6 | 0 | 0 | 0 |
| **Total** | 180 | 180 | 0 | 0 | 0 |

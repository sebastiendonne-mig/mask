# Recoupement des « 139 » : écarts de fidélité de A, B et du q8 Xenova

Option 3, étape 2g, 24/10/2026. Aucune nouvelle mesure : calcul fait sur les trois rapports JSON existants. Constats seulement.

## Sources

| | Rapport (SHA-256 du JSON) | Étalon chargé | Candidat chargé | Mesure |
|---|---|---|---|---|
| A | `resultats/compression/fidelite-int8-matmul.json` (`458bf493e1ed51ac…`) | `modeles/camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx` `c9dfa2ec9e0bfad8…` | `modeles/compression/int8-matmul/model.onnx` `71306e6a6cf16c0cf2ba90152664f0701d2feb3a56fe345f0274fb50f2c79b09` | 2026-10-24T09:41:58.932Z, commit `9590b0e`, arbre propre : oui |
| B | `resultats/compression/fidelite-int8-defaut.json` (`c529d90844521448…`) | `modeles/camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx` `c9dfa2ec9e0bfad8…` | `modeles/compression/int8-defaut/model.onnx` `c5729c73f93be250779d22ab36ce91eb12a3f844c10c084e2e84eea2cd1847ba` | 2026-10-24T09:42:38.210Z, commit `9590b0e`, arbre propre : non |
| q8 | `resultats/compression/validation-fidelite/q8-contre-fp32.json` (`25295e78208b82e4…`) | `modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model.onnx` `0a2c64c0f051642a…` | `modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model_quantized.onnx` `43507a27e7e5500b5e197c8c7de803bc94bcc29ce156fcbb19bda18ed322960d` | 2026-10-24T08:38:04.517Z, commit `1215951`, arbre propre : non |

- Fichiers chargés pour A et B : **différents** (SHA-256 inscrits dans les rapports : A `71306e6a6cf16c0c…`, B `c5729c73f93be250…`, q8 `43507a27e7e5500b…` ; trois empreintes distinctes : oui).
- Étalons : Jean-Baptiste (`c9dfa2ec…`) pour A et B ; fp32 Xenova (`0a2c64c0…`) pour le q8 (validation de l'étape 2b). Les deux étalons donnent des masques identiques sur les 17 documents (0 masque différent, `resultats/compression/coherence-etalon.md`, commit `cf30c4b`) : les côtés « étalon seul » sont comparables.

## Méthode

Masque en écart = masque présent d'un seul côté, tel que listé par `scripts/navigateur/fidelite.mjs` (champs `seulEtalon` et `seulCompare` de chaque document). Clé : document, côté (étalon seul / candidat seul), début, fin, catégorie. Intersections en multiensembles (minimum des répétitions). Un masque commun à deux recoupements est donc le même masque, au même endroit, de la même catégorie, manquant ou en trop du même côté.

## Totaux

| | Total | Étalon seul | Candidat seul | Documents touchés |
|---|---|---|---|---|
| A | 139 | 69 | 70 | 16 |
| B | 139 | 69 | 70 | 16 |
| q8 | 139 | 70 | 69 | 16 |

## Masques en écart communs

| Recoupement | Total | Étalon seul | Candidat seul | Documents |
|---|---|---|---|---|
| A∩B | 111 | 64 | 47 | 16 |
| A∩q8 | 108 | 64 | 44 | 16 |
| B∩q8 | 112 | 63 | 49 | 16 |
| A∩B∩q8 | 97 | 61 | 36 | 16 |

## Par document

| Document | A | B | q8 | A∩B | A∩B∩q8 |
|---|---|---|---|---|---|
| dev-avocat-01 | 14 | 14 | 13 | 14 | 11 |
| dev-avocat-02 | 10 | 9 | 9 | 8 | 8 |
| dev-avocat-03 | 14 | 14 | 14 | 13 | 13 |
| dev-avocat-04 | 17 | 18 | 16 | 17 | 15 |
| dev-avocat-05 | 15 | 19 | 15 | 12 | 9 |
| dev-ec-01 | 10 | 9 | 8 | 7 | 5 |
| dev-ec-02 | 10 | 5 | 8 | 4 | 4 |
| dev-ec-03 | 9 | 9 | 10 | 9 | 9 |
| dev-ec-04 | 8 | 7 | 9 | 6 | 6 |
| dev-ec-05 | 4 | 5 | 3 | 4 | 2 |
| dev-neutre-01 | 0 | 0 | 0 | 0 | 0 |
| dev-neutre-02 | 3 | 4 | 3 | 2 | 2 |
| dev-rh-01 | 6 | 6 | 6 | 5 | 5 |
| dev-rh-02 | 5 | 5 | 5 | 4 | 3 |
| dev-rh-03 | 4 | 5 | 4 | 1 | 1 |
| dev-rh-04 | 4 | 2 | 8 | 2 | 1 |
| dev-rh-05 | 6 | 8 | 8 | 3 | 3 |

## Annexe : script de calcul

Lancé depuis la racine du dépôt (`node recoupement.mjs`) ; non versionné à part, reproduit ici à l'identique.

```js
import fs from 'node:fs';
const L = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const F = { A: 'resultats/compression/fidelite-int8-matmul.json', B: 'resultats/compression/fidelite-int8-defaut.json', q8: 'resultats/compression/validation-fidelite/q8-contre-fp32.json' };
const R = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, L(f)]));
// Multiensemble des masques en écart : clé document|côté|début|fin|catégorie.
const ms = (r) => { const m = new Map(); for (const d of r.documents) for (const [cote, l] of [['etalon', d.seulEtalon], ['candidat', d.seulCompare]]) for (const x of l) { const k = `${d.id}|${cote}|${x.start}|${x.end}|${x.type}`; m.set(k, (m.get(k) ?? 0) + 1); } return m; };
const M = Object.fromEntries(Object.entries(R).map(([k, r]) => [k, ms(r)]));
const inter = (...ens) => { const s = new Map(); for (const [k, n] of ens[0]) { const v = Math.min(n, ...ens.slice(1).map((e) => e.get(k) ?? 0)); if (v) s.set(k, v); } return s; };
const total = (m, cote) => [...m].filter(([k]) => !cote || k.split('|')[1] === cote).reduce((s, [, n]) => s + n, 0);
const lignes = [];
const sortie = { fichiers: {}, totaux: {}, communs: {} };
for (const [k, r] of Object.entries(R)) sortie.fichiers[k] = { rapport: F[k], etalon: `${r.etalon.chemin} ${r.etalon.sha256}`, candidat: `${r.compare.chemin} ${r.compare.sha256}`, date: r.date, commit: r.git.hash.slice(0, 7), propre: r.git.propre };
for (const k of Object.keys(M)) sortie.totaux[k] = { total: total(M[k]), etalon: total(M[k], 'etalon'), candidat: total(M[k], 'candidat'), documents: R[k].documentsTouches };
for (const [nom, ens] of [['A∩B', [M.A, M.B]], ['A∩q8', [M.A, M.q8]], ['B∩q8', [M.B, M.q8]], ['A∩B∩q8', [M.A, M.B, M.q8]]]) {
  const i = inter(...ens);
  sortie.communs[nom] = { total: total(i), etalon: total(i, 'etalon'), candidat: total(i, 'candidat'), documents: new Set([...i.keys()].map((k) => k.split('|')[0])).size };
}
// Par document : écarts de chacun et communs aux trois.
sortie.parDocument = R.A.documents.map((d) => {
  const f = (m) => total(new Map([...m].filter(([k]) => k.startsWith(d.id + '|'))));
  return { id: d.id, A: f(M.A), B: f(M.B), q8: f(M.q8), 'A∩B': f(inter(M.A, M.B)), 'A∩B∩q8': f(inter(M.A, M.B, M.q8)) };
});
console.log(JSON.stringify(sortie, null, 1));
```

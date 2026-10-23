# Diagnostic des moteurs d'exécution — 22/10/2026

Mesures exploratoires du 22/10/2026, faites hors dépôt (scratchpad de session Claude Code, `/private/tmp/…`), rapatriées le 23/10/2026 à l'identique (copie octet pour octet, vérifiée avec `cmp`), **non rejouées**.

Jeu de développement seul (17 documents). Détecteur gelé mask-1.5a-gel : modèle 0.2.0 et combiné (règles 0.4.0 + modèle). Évaluateur `scripts/evaluer.mjs` au commit `6172cfa`, arbre propre (`git.propre: true` dans chaque `*.json`).

| Dossier | Moteur et modèle |
|---|---|
| `N/` | onnxruntime-node 1.30.0 natif, réglages par défaut, modèle quantifié Xenova (q8) — référence 1.5a, contrôle |
| `W/` | onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (WASM) exécuté dans Node, q8 — moteur de l'app |
| `WS/` | onnxruntime-web 1.30.0 (WASM, dernière version stable) exécuté dans Node, q8 |
| `F/` | onnxruntime-web 1.31.0-dev (WASM) dans Node, modèle non quantifié Xenova `onnx/model.onnx` (fp32) |

## Contenu

- `N/`, `W/`, `WS/`, `F/` : rapports de l'évaluateur (`modele.*`, `combine.*`).
- `masques.json` : masques bruts de `detecter()` pour les quatre variantes, modèle et combiné, par document.
- `variantes/` : modules de détecteur des variantes W, WS et F (`variante.mjs`, `{W,WS,F}/{modele,combine}.mjs`), passés à l'évaluateur et au script de comparaison.
- `ws-navigateur.json` : une visite du banc 1.5b dans Chrome avec onnxruntime-web 1.30.0 (copie du dépôt hors dépôt, `overrides` npm), config isolée, threads par défaut, sans débit simulé.
- `simulation-etape3/masques.json` : masques du modèle annotés (statut, score, contexte) utilisés par `scripts/simulation-post-traitements-modele-2026-10-22.mjs` (lot 1.5a, scénarios A, B « civilités seules », C).
- Script de comparaison : `scripts/navigateur/masques-variantes.mjs`.

## Scripts conservés comme trace, non rejouables tels quels

Copiés sans modification. Ils contiennent des chemins en dur :

- `scripts/navigateur/masques-variantes.mjs` : `/Users/migranche/Dev/tkoidra/mask` (ligne 3) ; prend en argument le dossier hors dépôt d'où il lisait `variantes/` et `ws-navigateur.json`, et où il écrivait `evaluations/masques.json`.
- `scripts/simulation-post-traitements-modele-2026-10-22.mjs` : `/Users/migranche/Dev/tkoidra/mask` (ligne 4) ; lit `./masques.json` à côté de lui (ligne 7), désormais dans `simulation-etape3/`.
- `variantes/*.mjs` : `/Users/migranche/Dev/tkoidra/mask/…` (sources, `node_modules`, modèle q8) ; `F/modele.mjs` pointe vers le modèle fp32 et `WS/modele.mjs` vers onnxruntime-web 1.30.0, tous deux restés dans le scratchpad (`/private/tmp/…`) et non rapatriés (poids et dépendances).
- Les rapports `*.md` citent le chemin des modules de détecteur des variantes tel qu'il était hors dépôt.

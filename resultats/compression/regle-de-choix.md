# Option 3 : application de la règle de choix (amendement (5)), étape 2h

24/10/2026. Application mécanique, sans gel ni étiquette.

Règle, fixée d'avance (seuils.md, amendement (5)) : parmi les variantes dont la 1re visite tient en 24 s au plus (maximum des 5 répétitions de « modèle prêt »), la plus fidèle ; à fidélité égale, le fichier le plus léger ; si aucune ne tient en 24 s, arrêt. Une seule série par candidat, sans remesure.

## Mesures

| Candidat | Fichier (SHA-256) | Taille (octets) | Fidélité (masques différents) | Étalon seul / candidat seul | Documents touchés | S7 1re visite max (critère) | Médiane | Min | Octets servis | ≤ 24 s |
|---|---|---|---|---|---|---|---|---|---|---|
| A int8-matmul | `71306e6a…` | 186 209 503 | 139 | 69 / 70 | 16/17 | 18 282,0 ms | 18 152,6 | 18 138,7 | 203,7 Mo | oui |
| B int8-defaut | `c5729c73…` | 111 284 869 | 139 | 69 / 70 | 16/17 | 12 527,7 ms | 12 416,9 | 11 531,3 | 128,8 Mo | oui |
| C fp16-mixte (v2) | `860504f2…` | 220 500 160 | 0 | 0 / 0 | 0/17 | 23 325,8 ms | 21 386,7 | 21 362,8 | 238,0 Mo | oui |

Sources :

- Fidélité : `fidelite-int8-matmul.json` (commit `9590b0e`), `fidelite-int8-defaut.json` (commit `9590b0e`, arbre marqué non propre : fichiers de résultats de A non suivis), `fidelite-fp16-mixte.json` (commit `29b6251`). Étalon : `model.onnx` Jean-Baptiste, `c9dfa2ec…`. Moteur : onnxruntime-web 1.31.0-dev, WASM, Node.
- S7 : `banc/int8-matmul/chrome.md` (commit `0b506fe`), `banc/int8-defaut/chrome.md` (commit `36a3c09`), `banc/fp16-mixte/chrome.md` (commit `f8df450`). Chrome 155, 100 Mb/s simulés, page isolée, threads par défaut (4), variante WASM simple, 5 répétitions, profil neuf à chaque 1re visite. Fichier chargé contrôlé (empreinte du manifeste) à chaque visite réussie ; aucun échec ; masques du modèle stables sur les 10 visites de chaque candidat.
- Taille : `conversion.json` et `modeles/MANIFEST.sha256`.

## Signalements (sans effet sur la règle)

- C : maximum 23 325,8 ms, dans la zone 23,3 – 24,7 s (variabilité d'environ ±0,7 s constatée à l'étape 2f). Les répétitions 1 et 2 (23 325,8 et 22 860,3 ms) diffèrent des trois autres (21 362,8 – 21 386,7 ms) par la phase de téléchargement (22 297 et 21 954 ms, contre 20 444 – 20 468 ms) ; session 470 – 572 ms.
- B : deux répétitions vers 11,5 s et trois vers 12,45 s ; l'écart est aussi dans la phase de téléchargement (10 953 – 11 952 ms).

## Application

1. Candidats dont le maximum est ≤ 24 s : A (18 282,0 ms), B (12 527,7 ms), C (23 325,8 ms).
2. Le plus fidèle parmi eux : C (0 masque différent ; A et B : 139).
3. Départage par la taille : non nécessaire (pas d'égalité de fidélité en tête).

**Candidat désigné par la règle : C, fp16-mixte v2** (`modeles/compression/fp16-mixte/model.onnx`, SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`).

Rien n'est gelé ni étiqueté.

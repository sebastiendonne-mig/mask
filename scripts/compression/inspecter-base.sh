#!/bin/sh
# Inspection de la base de l'option 3 (lecture seule) : model.onnx de Jean-Baptiste/camembert-ner
# comparé au fp32 Xenova épinglé. Option 3, étape 2a, rejouée à l'étape 2b depuis le dépôt.
#
#   sh scripts/compression/inspecter-base.sh > resultats/compression/inspection-base.txt
#
# À lancer depuis la racine du dépôt. Python : venv .cache/venv-onnx (resultats/compression/environnement.md).
# Réseau : lecture de l'API Hugging Face seulement (liste des fichiers, config.json vers la sortie standard).
set -eu

PY=.cache/venv-onnx/bin/python
JB_REV=ef35fe7767c1dad71f5c853838cdd80d0b3441ed
XE_REV=8e1988247e872ba0137062653b1e5033a31e14fc
A=modeles/camembert-ner/$JB_REV/model.onnx
B=modeles/camembert-ner/$XE_REV/onnx/model.onnx
HF=https://huggingface.co

echo "# Inspection de la base — $(date -u +%Y-%m-%dT%H:%M:%SZ) — commit $(git rev-parse --short HEAD)"
echo "# A = $A (Jean-Baptiste/camembert-ner@$JB_REV)"
echo "# B = $B (Xenova/camembert-ner@$XE_REV)"
echo
echo "## Empreintes (modeles/MANIFEST.sha256)"
(cd modeles && shasum -a 256 -c MANIFEST.sha256)
echo
echo "## Fichiers des deux dépôts aux révisions épinglées (API Hugging Face)"
echo "### Jean-Baptiste/camembert-ner"
curl -sS -f "$HF/api/models/Jean-Baptiste/camembert-ner/revision/$JB_REV?blobs=true" | "$PY" -I scripts/compression/lister.py
echo "### Xenova/camembert-ner"
curl -sS -f "$HF/api/models/Xenova/camembert-ner/revision/$XE_REV?blobs=true" | "$PY" -I scripts/compression/lister.py
echo
echo "## config.json Jean-Baptiste (API) contre config.json Xenova épinglé"
curl -sS -f -L "$HF/Jean-Baptiste/camembert-ner/resolve/$JB_REV/config.json" | "$PY" -I scripts/compression/config.py "modeles/camembert-ner/$XE_REV/config.json"
echo
echo "## Inspection et comparaison (inspecter.py)"
"$PY" -I scripts/compression/inspecter.py "$A" "$B"
echo
echo "## Équivalence des graphes à renommage près (equivalence.py)"
"$PY" -I scripts/compression/equivalence.py "$A" "$B"
echo
echo "## Octets bruts"
cmp "$A" "$B" | head -1 || true
echo "### 48 premiers octets de A"
head -c 48 "$A" | xxd
echo "### 48 premiers octets de B"
head -c 48 "$B" | xxd

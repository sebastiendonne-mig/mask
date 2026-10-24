# Environnement Python de l'option 3 (compression)

Créé le 24/10/2026 à l'étape 2a. Il sert à l'inspection de la base (`scripts/compression/`). Les conversions viendront plus tard et utiliseront le même environnement.

- Python 3.14.6 (Homebrew, `/opt/homebrew/opt/python@3.14/bin/python3.14`), macOS 15.1, arm64, processeur seul.
- Venv : `.cache/venv-onnx/`, à la racine du dépôt. Il est ignoré par git (ligne `.cache/` du `.gitignore`) et n'est pas commité. `include-system-site-packages = false`.
- Création :

  ```sh
  /opt/homebrew/opt/python@3.14/bin/python3.14 -m venv .cache/venv-onnx
  .cache/venv-onnx/bin/python -m pip install --upgrade pip      # pip 26.2.2
  .cache/venv-onnx/bin/python -m pip install onnx onnxruntime onnxconverter-common
  ```

- Paquets installés (`pip freeze`). Seuls trois ont été demandés ; les six autres sont des dépendances que pip a installées automatiquement.

| Paquet | Version | Demandé |
|---|---|---|
| onnx | 1.23.2 | oui |
| onnxruntime | 1.31.0 | oui |
| onnxconverter-common | 1.16.0 | oui |
| flatbuffers | 25.12.19 | dépendance |
| ml_dtypes | 0.6.0 | dépendance |
| numpy | 2.5.4 | dépendance |
| packaging | 26.3 | dépendance |
| protobuf | 7.36.2 | dépendance |
| typing_extensions | 4.16.0 | dépendance |

- Usage : tout script qui lit un fichier de modèle est lancé avec `python -I` (mode isolé : ni le dossier du script, ni le dossier courant, ni les variables `PYTHON*` ne sont ajoutés aux chemins d'import).
- `onnxruntime` (Python) n'a encore servi à aucune exécution. Le moteur de référence des mesures reste onnxruntime-web en WASM (amendement (5)), lancé par `scripts/navigateur/fidelite.mjs`.

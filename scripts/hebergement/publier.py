# Publication du modèle sur Hugging Face (seuils.md, amendement (7), puce « Hébergement ») :
# dépôt public migranche/mask-camembert-ner, un commit Hugging Face par exécution.
#
#   .cache/venv-onnx/bin/python -I scripts/hebergement/publier.py --parent <commit> [--fichiers README.md LICENSE]
#
# À lancer depuis n'importe quel dossier : chemins relatifs à la racine du dépôt.
#
# Avant l'envoi :
#   - chaque fichier local de FICHIERS est refusé si son SHA-256 diffère de l'attendu ;
#   - chaque fichier du dépôt Hugging Face qui n'est pas envoyé est relu au commit parent
#     (téléchargement par resolve/<parent>/<chemin>, ou empreinte LFS pour le fichier ONNX) et
#     refusé si son SHA-256 diffère de l'attendu.
# Le commit est créé avec parent_commit : refus de Hugging Face si le dépôt a avancé entre-temps.
# Aucun jeton dans ce fichier : HfApi utilise la connexion de `hf auth login`.
#
# Historique : le commit 26dd16ff (24/10/2026) a été fait par une version de ce script restée
# hors du dépôt, avec les 7 fichiers et le README.md et la LICENSE d'origine
# (SHA-256 1f7b3975… et 9c64deb7…, resultats/hebergement/publication.md).

import argparse
import hashlib
import sys
import urllib.request
from pathlib import Path

from huggingface_hub import CommitOperationAdd, HfApi

RACINE = Path(__file__).resolve().parents[2]
DEPOT = "migranche/mask-camembert-ner"
R = "ef35fe7767c1dad71f5c853838cdd80d0b3441ed"

# Chemin dans le dépôt Hugging Face → (source dans mask, SHA-256 attendu).
FICHIERS = {
    "onnx/model_fp16.onnx": ("modeles/compression/fp16-mixte/model.onnx", "860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb"),
    "tokenizer.json": (f"modeles/tokenizer/{R}/tokenizer.json", "6898886e61473eeb34a66adb7f5e102ec4a8da3217701369320eb784f7415bfd"),
    "tokenizer_config.json": (f"modeles/camembert-ner/{R}/tokenizer_config.json", "a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f"),
    "special_tokens_map.json": (f"modeles/camembert-ner/{R}/special_tokens_map.json", "645708b160268d79dbc31bc05bc93f77fda8dfd45dc806b5c3a86e17cfcc5a7a"),
    "config.json": (f"modeles/camembert-ner/{R}/config.json", "17ec2dd3a642bfc839f3f94bd5ba2e996700aa69b06b3937b0e80b458b962207"),
    "README.md": ("modeles/hf-mask-camembert-ner/README.md", "5f603f3d74d01343378b25152d6241fca6ec8aece0bd0b904bb4a6fc5301b6fb"),
    "LICENSE": ("modeles/hf-mask-camembert-ner/LICENSE", "820791fd2a1047538f5951d74a5cfb7002b4f054e92ebc1d89ddf73110f65573"),
}
LFS = {"onnx/model_fp16.onnx"}


def sha256(chemin):
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for morceau in iter(lambda: f.read(1 << 20), b""):
            h.update(morceau)
    return h.hexdigest()


def sha256_distant(api, chemin, revision):
    if chemin in LFS:
        (info,) = api.get_paths_info(DEPOT, [chemin], revision=revision, repo_type="model")
        return info.lfs.sha256 if info.lfs else None
    url = f"https://huggingface.co/{DEPOT}/resolve/{revision}/{chemin}"
    with urllib.request.urlopen(url) as r:
        return hashlib.sha256(r.read()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=f"publication sur {DEPOT}")
    parser.add_argument("--parent", required=True, help="commit Hugging Face parent (hash complet)")
    parser.add_argument("--fichiers", nargs="+", default=list(FICHIERS), help="chemins du dépôt Hugging Face à envoyer")
    parser.add_argument("--message", required=True, help="message du commit Hugging Face")
    args = parser.parse_args()
    inconnus = [f for f in args.fichiers if f not in FICHIERS]
    if inconnus:
        sys.exit(f"refus : fichiers inconnus {inconnus}")

    for dest, (source, attendu) in FICHIERS.items():
        obtenu = sha256(RACINE / source)
        print(f"local   {'OK' if obtenu == attendu else 'DIFFÉRENT'}  {obtenu}  {source}")
        if obtenu != attendu:
            sys.exit(f"refus : {source} {obtenu}, attendu {attendu}")

    api = HfApi()
    for dest, (_, attendu) in FICHIERS.items():
        if dest in args.fichiers:
            continue
        obtenu = sha256_distant(api, dest, args.parent)
        print(f"distant {'OK' if obtenu == attendu else 'DIFFÉRENT'}  {obtenu}  {dest} @ {args.parent[:8]}")
        if obtenu != attendu:
            sys.exit(f"refus : {dest} au commit {args.parent} : {obtenu}, attendu {attendu}")

    operations = [CommitOperationAdd(path_in_repo=d, path_or_fileobj=str(RACINE / FICHIERS[d][0])) for d in args.fichiers]
    info = api.create_commit(repo_id=DEPOT, repo_type="model", operations=operations, commit_message=args.message, parent_commit=args.parent)
    print(f"commit : {info.oid}")
    print(f"url : {info.commit_url}")


if __name__ == "__main__":
    main()

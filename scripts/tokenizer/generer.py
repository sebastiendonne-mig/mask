# Tokenizer de provenance propre (seuils.md, amendement (7), puce « Tokenizer ») : tokenizer.json
# (format « fast » de la bibliothèque tokenizers) construit depuis le sentencepiece.bpe.model de
# Jean-Baptiste/camembert-ner au commit ef35fe7, avec son tokenizer_config.json et son
# special_tokens_map.json.
#
#   .cache/venv-onnx/bin/python -I scripts/tokenizer/generer.py
#   .cache/venv-onnx/bin/python -I scripts/tokenizer/generer.py --sortie <fichier>
#
# À lancer depuis n'importe quel dossier : chemins relatifs à la racine du dépôt.
#
# Sources refusées si l'une est absente de modeles/MANIFEST.sha256 ou si son SHA-256 diffère.
# Elles sont copiées seules dans un dossier temporaire : la bibliothèque ne voit aucun autre
# fichier (ni model.onnx, ni config.json). Aucun accès réseau (HF_HUB_OFFLINE, local_files_only).
#
# Méthode, fixée avant toute comparaison :
#   1. CamembertTokenizer.from_pretrained lit le modèle sentencepiece et la configuration ;
#   2. CamembertConverter (convert_slow_tokenizer.py, convertisseur associé à CamembertTokenizer
#      dans SLOW_TO_FAST_CONVERTERS) construit le tokenizer : Unigram, normaliseur Precompiled +
#      Strip + Replace, pré-tokeniseur Metaspace, post-traitement <s> $A </s> ;
#   3. CamembertTokenizer(tokenizer_object=…) ajoute les jetons spéciaux de la configuration,
#      <mask> avec lstrip comme le définit la classe.
# Le constructeur CamembertTokenizer de transformers 5 seul (sans le convertisseur) n'est pas
# utilisé : son pré-tokeniseur (WhitespaceSplit + Metaspace) traite les espaces autrement.
#
# Outils aux versions de VERSIONS_ATTENDUES, sinon refus. Sortie : tokenizer.json compact
# (Tokenizer.to_str), refus si le fichier existe déjà. Empreinte affichée en fin d'exécution.

import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile
from importlib.metadata import version
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"

RACINE = Path(__file__).resolve().parents[2]
MANIFESTE = RACINE / "modeles" / "MANIFEST.sha256"
REVISION = "ef35fe7767c1dad71f5c853838cdd80d0b3441ed"
SOURCES = {
    "sentencepiece.bpe.model": "988bc5a00281c6d210a5d34bd143d0363741a432fefe741bf71e61b1869d4314",
    "tokenizer_config.json": "a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f",
    "special_tokens_map.json": "645708b160268d79dbc31bc05bc93f77fda8dfd45dc806b5c3a86e17cfcc5a7a",
}
SORTIE = RACINE / "modeles" / "tokenizer" / REVISION / "tokenizer.json"

VERSIONS_ATTENDUES = {"transformers": "5.20.2", "tokenizers": "0.23.3", "sentencepiece": "0.2.2", "protobuf": "7.36.2"}


def sha256(chemin):
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for morceau in iter(lambda: f.read(1 << 20), b""):
            h.update(morceau)
    return h.hexdigest()


def lire_manifeste():
    entrees = {}
    for ligne in MANIFESTE.read_text(encoding="utf-8").splitlines():
        if ligne.strip():
            empreinte, chemin = ligne.split(maxsplit=1)
            entrees[chemin.lstrip("*")] = empreinte
    return entrees


def affiche(chemin):
    # Chemin relatif à la racine du dépôt, absolu hors du dépôt.
    try:
        return str(Path(chemin).resolve().relative_to(RACINE))
    except ValueError:
        return str(Path(chemin).resolve())


def verifier_versions():
    for paquet, attendue in VERSIONS_ATTENDUES.items():
        obtenue = version(paquet)
        if obtenue != attendue:
            sys.exit(f"refus : {paquet} {obtenue}, attendu {attendue}")


def verifier_sources():
    manifeste = lire_manifeste()
    for nom, attendu in SOURCES.items():
        cle = f"camembert-ner/{REVISION}/{nom}"
        if manifeste.get(cle) != attendu:
            sys.exit(f"refus : {cle} absent du manifeste ou empreinte différente de {attendu}")
        chemin = RACINE / "modeles" / cle
        if not chemin.is_file():
            sys.exit(f"refus : fichier absent {affiche(chemin)}")
        if sha256(chemin) != attendu:
            sys.exit(f"refus : empreinte de {affiche(chemin)} différente de {attendu}")


def construire(dossier):
    from transformers.convert_slow_tokenizer import CamembertConverter
    from transformers.models.camembert.tokenization_camembert import CamembertTokenizer

    source = CamembertTokenizer.from_pretrained(dossier, local_files_only=True)
    if Path(source.vocab_file).resolve() != (Path(dossier) / "sentencepiece.bpe.model").resolve():
        sys.exit(f"refus : modèle sentencepiece inattendu {source.vocab_file}")
    converti = CamembertConverter(source).converted()
    configuration = json.loads((Path(dossier) / "tokenizer_config.json").read_text(encoding="utf-8"))
    final = CamembertTokenizer(tokenizer_object=converti, vocab_file=source.vocab_file, **configuration)
    return final.backend_tokenizer


def controler(tokenizer):
    # Garde-fous minimaux, indépendants du tokenizer Xenova (la comparaison est faite ailleurs).
    if tokenizer.get_vocab_size(with_added_tokens=True) != 32005:
        sys.exit(f"refus : {tokenizer.get_vocab_size(with_added_tokens=True)} entrées, attendu 32005")
    if (tokenizer.token_to_id("<s>"), tokenizer.token_to_id("</s>")) != (5, 6):
        sys.exit("refus : <s> et </s> ne sont pas 5 et 6 (config.json : bos_token_id 5, eos_token_id 6)")
    vide = tokenizer.encode("").ids
    if vide != [5, 6]:
        sys.exit(f"refus : texte vide encodé en {vide}, attendu [5, 6]")


def main():
    parser = argparse.ArgumentParser(description="tokenizer.json depuis le sentencepiece de Jean-Baptiste/camembert-ner")
    parser.add_argument("--sortie", type=Path, default=SORTIE)
    args = parser.parse_args()
    sortie = args.sortie.resolve()
    if sortie.exists():
        sys.exit(f"refus : {affiche(sortie)} existe déjà")

    verifier_versions()
    verifier_sources()
    with tempfile.TemporaryDirectory() as dossier:
        for nom in SOURCES:
            shutil.copyfile(RACINE / "modeles" / "camembert-ner" / REVISION / nom, Path(dossier) / nom)
        tokenizer = construire(dossier)
    controler(tokenizer)

    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_bytes(tokenizer.to_str().encode("utf-8"))
    print(f"{sha256(sortie)}  {affiche(sortie)} ({sortie.stat().st_size} octets)")
    print("versions : " + ", ".join(f"{p} {version(p)}" for p in VERSIONS_ATTENDUES) + f", Python {sys.version.split()[0]}")


if __name__ == "__main__":
    main()

# Production des trois candidats de l'option 3 depuis l'étalon (seuils.md, amendement (6)).
#
#   .cache/venv-onnx/bin/python -I scripts/compression/convertir.py                        les trois recettes
#   .cache/venv-onnx/bin/python -I scripts/compression/convertir.py --recette fp16-mixte   une seule
#
# À lancer depuis n'importe quel dossier : chemins relatifs à la racine du dépôt.
#
# Étalon : model.onnx de Jean-Baptiste/camembert-ner au commit ef35fe7, refusé s'il est absent de
# modeles/MANIFEST.sha256 ou si son SHA-256 diffère. Chaque recette travaille sur une copie dans un
# dossier temporaire : les fichiers annexes des outils (<modèle>-inferred.onnx de quantize_dynamic,
# quant_utils.py:1240) ne sont jamais écrits à côté de l'original. Seul model.onnx est ensuite
# déplacé dans modeles/compression/<recette>/ (refus si le fichier existe déjà ou s'il n'est pas
# ignoré par git).
#
# Recettes écrites en dur, exactement comme dans l'amendement (6) : sans pré-traitement, sans
# changement d'opset. Outils aux versions de resultats/compression/environnement.md, sinon refus.
#
# Rapport : resultats/compression/conversion.{json,md}. Une exécution limitée à une recette met à
# jour son entrée et conserve les autres.
#
# --sortie <dossier> : modèles dans <dossier>/<recette>/model.onnx et rapport dans
# <dossier>/conversion.{json,md}, au lieu de modeles/compression/ et resultats/compression/
# (contrôle de reproductibilité). Sans effet sur les calculs ; l'option est consignée dans le
# rapport. Le contrôle « ignoré par git » ne s'applique qu'à une sortie située dans le dépôt.

import argparse
import collections
import datetime
import hashlib
import inspect
import json
import logging
import platform
import shutil
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

import google.protobuf
import numpy
import onnx
import onnxconverter_common
import onnxruntime
from onnx import TensorProto
from onnxconverter_common.float16 import DEFAULT_OP_BLOCK_LIST, convert_float_to_float16
from onnxruntime.quantization import quantize_dynamic
from onnxruntime.quantization.quant_utils import TENSOR_NAME_QUANT_SUFFIX
from onnxruntime.quantization.registry import IntegerOpsRegistry

RACINE = Path(__file__).resolve().parents[2]
MANIFESTE = RACINE / "modeles" / "MANIFEST.sha256"
ETALON_MANIFESTE = "camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx"
ETALON_SHA256 = "c9dfa2ec9e0bfad82d606782ba3e0ab94c001c46481514e0658fc20a624845c5"
SORTIES = RACINE / "modeles" / "compression"
RAPPORT = RACINE / "resultats" / "compression" / "conversion"

VERSIONS_ATTENDUES = {"onnx": "1.23.2", "onnxruntime": "1.31.0", "onnxconverter-common": "1.16.0"}

# --- Recettes (amendement (6)) --------------------------------------------------------------

RECETTES = {
    "int8-matmul": {
        "outil": "onnxruntime.quantization.quantize_dynamic",
        "parametres": {"op_types_to_quantize": ["MatMul"], "per_channel": True, "reduce_range": False},
    },
    "int8-defaut": {
        "outil": "onnxruntime.quantization.quantize_dynamic",
        "parametres": {"per_channel": True, "reduce_range": False},
    },
    "fp16-mixte": {
        "outil": "onnxconverter_common.float16.convert_float_to_float16",
        "parametres": {"keep_io_types": True, "op_block_list": list(DEFAULT_OP_BLOCK_LIST) + ["Pow", "ReduceMean", "Sqrt"]},
    },
}

# --- Utilitaires ---------------------------------------------------------------------------


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


def git(*args):
    return subprocess.run(["git", *args], cwd=RACINE, capture_output=True, text=True)


def etat_git():
    return {
        "hash": git("rev-parse", "HEAD").stdout.strip(),
        "propre": git("status", "--porcelain", "--untracked-files=all").stdout.strip() == "",
    }


def versions_outils():
    return {
        "python": platform.python_version(),
        "onnx": onnx.__version__,
        "onnxruntime": onnxruntime.__version__,
        "onnxconverter-common": onnxconverter_common.__version__,
        "numpy": numpy.__version__,
        "protobuf": google.protobuf.__version__,
        "plateforme": f"{platform.system()} {platform.release()} {platform.machine()}",
    }


def parametres_effectifs(fonction, **kwargs):
    # Tous les paramètres de l'appel, valeurs par défaut de la signature comprises.
    lies = inspect.signature(fonction).bind_partial(**kwargs)
    lies.apply_defaults()
    return {k: (v if isinstance(v, (bool, int, float, str, list, type(None))) else repr(v)) for k, v in lies.arguments.items()}


class Journal(logging.Handler):
    # Messages des outils (logging et warnings) pendant une recette, dédoublonnés avec leur nombre.
    def __init__(self):
        super().__init__(level=logging.WARNING)
        self.messages = collections.Counter()

    def emit(self, record):
        self.messages[f"{record.levelname} {record.getMessage()}"] += 1


def histogramme(iterable):
    return dict(sorted(collections.Counter(iterable).items()))


# --- Contrôles ------------------------------------------------------------------------------


def verifier_versions():
    obtenues = versions_outils()
    for paquet, attendue in VERSIONS_ATTENDUES.items():
        if obtenues[paquet] != attendue:
            sys.exit(f"refus : {paquet} {obtenues[paquet]}, attendu {attendue} (resultats/compression/environnement.md)")


def verifier_etalon():
    manifeste = lire_manifeste()
    if ETALON_MANIFESTE not in manifeste:
        sys.exit(f"refus : {ETALON_MANIFESTE} absent de {MANIFESTE.relative_to(RACINE)}")
    if manifeste[ETALON_MANIFESTE] != ETALON_SHA256:
        sys.exit(f"refus : le manifeste attend {manifeste[ETALON_MANIFESTE]} pour l'étalon, la recette {ETALON_SHA256}")
    chemin = RACINE / "modeles" / ETALON_MANIFESTE
    if not chemin.is_file():
        sys.exit(f"refus : étalon absent ({chemin.relative_to(RACINE)})")
    obtenu = sha256(chemin)
    if obtenu != ETALON_SHA256:
        sys.exit(f"refus : SHA-256 de l'étalon {obtenu}, attendu {ETALON_SHA256}")
    return {"chemin": str(chemin.relative_to(RACINE)), "octets": chemin.stat().st_size, "sha256": obtenu}


def verifier_sortie(nom, dossier):
    sortie = dossier / nom / "model.onnx"
    if sortie.exists():
        sys.exit(f"refus : {affiche(sortie)} existe déjà (le supprimer à la main pour le reproduire)")
    if sortie.resolve().is_relative_to(RACINE) and git("check-ignore", "-q", affiche(sortie)).returncode != 0:
        sys.exit(f"refus : {affiche(sortie)} n'est pas ignoré par git")
    return sortie


# --- Comptages ------------------------------------------------------------------------------


def compter_quantification(modele):
    g = modele.graph
    types_init = {t.name: t.data_type for t in g.initializer}
    entiers = (TensorProto.INT8, TensorProto.UINT8)
    return {
        "noeuds_quantifies_par_type": {
            # Un MatMul quantifié devient MatMulInteger + Cast + Mul (operators/matmul.py:74-120).
            "MatMul": sum(n.op_type == "MatMulInteger" for n in g.node),
            # Gather quantifié : table d'entrée remplacée par un initialiseur entier (operators/gather.py:46).
            "Gather": sum(n.op_type == "Gather" and types_init.get(n.input[0]) in entiers for n in g.node),
            # Transpose quantifié : entrée renommée en <tenseur>_quantized (operators/direct_q8.py:32).
            "Transpose": sum(n.op_type == "Transpose" and n.input[0].endswith(TENSOR_NAME_QUANT_SUFFIX) for n in g.node),
        },
        "matmul_restes_en_float": sum(n.op_type == "MatMul" for n in g.node),
        "operateurs_du_graphe": histogramme(n.op_type for n in g.node),
        "initialiseurs_par_type": histogramme(TensorProto.DataType.Name(t.data_type) for t in g.initializer),
    }


def compter_float16(modele):
    # Type de chaque tenseur : value_info (mis à jour par le convertisseur), entrées, sorties,
    # initialiseurs, constantes. Un nœud est « resté en fp32 » si l'une de ses sorties est FLOAT.
    g = modele.graph
    types = {vi.name: vi.type.tensor_type.elem_type for vi in [*g.value_info, *g.input, *g.output]}
    types.update({t.name: t.data_type for t in g.initializer})
    for n in g.node:
        if n.op_type == "Constant":
            for a in n.attribute:
                if a.name == "value":
                    types[n.output[0]] = a.t.data_type
    fp32, fp16, inconnus, casts = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    for n in g.node:
        if n.op_type == "Cast":
            vers = next((a.i for a in n.attribute if a.name == "to"), None)
            casts[TensorProto.DataType.Name(vers) if vers is not None else "?"] += 1
            continue
        sorties = [types.get(o) for o in n.output]
        if TensorProto.FLOAT in sorties:
            fp32[n.op_type] += 1
        elif TensorProto.FLOAT16 in sorties:
            fp16[n.op_type] += 1
        elif None in sorties:
            inconnus[n.op_type] += 1
    return {
        "noeuds_restes_en_fp32_par_type": dict(sorted(fp32.items())),
        "noeuds_en_fp16_par_type": dict(sorted(fp16.items())),
        "noeuds_de_type_de_sortie_inconnu": dict(sorted(inconnus.items())),
        "cast_par_type_cible": dict(sorted(casts.items())),
        "operateurs_du_graphe": histogramme(n.op_type for n in g.node),
        "initialiseurs_par_type": histogramme(TensorProto.DataType.Name(t.data_type) for t in g.initializer),
    }


# --- Recettes -------------------------------------------------------------------------------


def produire(nom, copie, sortie_temp):
    recette = RECETTES[nom]
    p = recette["parametres"]
    if recette["outil"].endswith("quantize_dynamic"):
        effectifs = parametres_effectifs(quantize_dynamic, model_input=str(copie), model_output=str(sortie_temp), **p)
        quantize_dynamic(str(copie), str(sortie_temp), **p)
        # Valeurs résolues par l'outil quand le paramètre est laissé par défaut (lu dans quantize.py:978-979, 995-996).
        resolus = {
            "op_types_to_quantize": p.get("op_types_to_quantize") or list(IntegerOpsRegistry.keys()),
            "extra_options.MatMulConstBOnly": True,
        }
        return effectifs, resolus, compter_quantification(onnx.load(str(sortie_temp)))
    modele = onnx.load(str(copie))
    effectifs = parametres_effectifs(convert_float_to_float16, model="<ModelProto chargé depuis la copie>", **p)
    converti = convert_float_to_float16(modele, **p)
    onnx.save_model(converti, str(sortie_temp))
    return effectifs, {}, compter_float16(converti)


def convertir(nom, etalon, dossier):
    sortie = verifier_sortie(nom, dossier)
    journal = Journal()
    racine_log = logging.getLogger()
    racine_log.addHandler(journal)
    try:
        with tempfile.TemporaryDirectory(prefix="mask-conversion-") as tmp, warnings.catch_warnings(record=True) as avertis:
            warnings.simplefilter("always")
            copie = Path(tmp) / "etalon" / "model.onnx"
            copie.parent.mkdir()
            shutil.copyfile(RACINE / etalon["chemin"], copie)
            if sha256(copie) != ETALON_SHA256:
                sys.exit("refus : la copie de l'étalon n'a pas la bonne empreinte")
            sortie_temp = Path(tmp) / "sortie" / "model.onnx"
            sortie_temp.parent.mkdir()
            effectifs, resolus, comptages = produire(nom, copie, sortie_temp)
            empreinte = sha256(sortie_temp)
            annexes = sorted(str(f.relative_to(tmp)) for f in Path(tmp).rglob("*") if f.is_file() and f not in (copie, sortie_temp))
            sortie.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(sortie_temp), str(sortie))
            for m in avertis:
                journal.messages[f"{m.category.__name__} {m.message}"] += 1
    finally:
        racine_log.removeHandler(journal)
    if sha256(sortie) != empreinte:
        sys.exit(f"erreur : {affiche(sortie)} différent du fichier produit")
    autres = sorted(f.name for f in sortie.parent.iterdir() if f.name != "model.onnx")
    if autres:
        sys.exit(f"erreur : fichiers inattendus dans {affiche(sortie.parent)} : {autres}")
    return {
        "date": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "outil": RECETTES[nom]["outil"],
        "parametres_recette": RECETTES[nom]["parametres"],
        "parametres_effectifs": effectifs,
        "valeurs_resolues_par_l_outil": resolus,
        "fichier": {"chemin": affiche(sortie), "octets": sortie.stat().st_size, "sha256": empreinte},
        "fichiers_annexes_temporaires": annexes,
        "messages_des_outils": dict(journal.messages),
        **comptages,
    }


# --- Rapport --------------------------------------------------------------------------------


def rapport_markdown(r):
    l = ["# Conversion des candidats de l'option 3 (amendement (6))", ""]
    l.append(f"- Étalon : `{r['etalon']['chemin']}`, {r['etalon']['octets']} octets, SHA-256 `{r['etalon']['sha256']}`")
    l.append(f"- Script : `{r['script']['chemin']}`, SHA-256 `{r['script']['sha256']}`")
    l.append("- Outils : " + ", ".join(f"{k} {v}" for k, v in r["outils"].items()))
    l += ["", "| Recette | Fichier | Octets | SHA-256 |", "|---|---|---|---|"]
    for nom, e in r["recettes"].items():
        l.append(f"| {nom} | `{e['fichier']['chemin']}` | {e['fichier']['octets']} | `{e['fichier']['sha256']}` |")
    for nom, e in r["recettes"].items():
        l += ["", f"## {nom}", ""]
        l.append(f"- Date : {e['date']} ; commit `{e['git']['hash']}`{'' if e['git']['propre'] else ' + modifications non commitées'} ; script SHA-256 `{e['script_sha256']}`")
        if e.get("option_sortie"):
            l.append(f"- Option --sortie : `{e['option_sortie']}`")
        l.append(f"- Outil : `{e['outil']}`")
        l.append(f"- Paramètres de la recette : `{json.dumps(e['parametres_recette'], ensure_ascii=False)}`")
        l.append(f"- Paramètres effectifs : `{json.dumps(e['parametres_effectifs'], ensure_ascii=False)}`")
        if e["valeurs_resolues_par_l_outil"]:
            l.append(f"- Valeurs résolues par l'outil : `{json.dumps(e['valeurs_resolues_par_l_outil'], ensure_ascii=False)}`")
        if "noeuds_quantifies_par_type" in e:
            l.append(f"- Nœuds quantifiés par type d'origine : `{json.dumps(e['noeuds_quantifies_par_type'])}` ; MatMul restés en float : {e['matmul_restes_en_float']}")
        if "noeuds_restes_en_fp32_par_type" in e:
            l.append(f"- Nœuds restés en fp32 par type : `{json.dumps(e['noeuds_restes_en_fp32_par_type'])}`")
            l.append(f"- Nœuds de type de sortie inconnu : `{json.dumps(e['noeuds_de_type_de_sortie_inconnu'])}` ; Cast par type cible : `{json.dumps(e['cast_par_type_cible'])}`")
        l.append(f"- Initialiseurs par type : `{json.dumps(e['initialiseurs_par_type'])}`")
        l.append(f"- Fichiers annexes des outils (dossier temporaire, supprimés) : {', '.join(f'`{a}`' for a in e['fichiers_annexes_temporaires']) or 'aucun'}")
        if e["messages_des_outils"]:
            l.append("- Messages des outils :")
            l += [f"  - ({n}×) {m}" for m, n in e["messages_des_outils"].items()]
    return "\n".join(l) + "\n"


def principal():
    parser = argparse.ArgumentParser(description="Candidats de l'option 3 (seuils.md, amendement (6)).")
    parser.add_argument("--recette", choices=list(RECETTES), help="ne produire que cette recette")
    parser.add_argument("--sortie", help="dossier des modèles et du rapport (reproductibilité), au lieu des emplacements du dépôt")
    args = parser.parse_args()
    dossier = Path(args.sortie).resolve() if args.sortie else SORTIES
    base_rapport = dossier / "conversion" if args.sortie else RAPPORT

    verifier_versions()
    git_etat = etat_git()  # relevé avant toute écriture
    etalon = verifier_etalon()
    noms = [args.recette] if args.recette else list(RECETTES)
    for nom in noms:
        verifier_sortie(nom, dossier)  # tous les refus avant la première conversion

    script = Path(__file__).resolve()
    precedent = json.loads(base_rapport.with_suffix(".json").read_text(encoding="utf-8")) if base_rapport.with_suffix(".json").exists() else {}
    recettes = precedent.get("recettes", {})
    for nom in noms:
        print(f"{nom} : conversion…", flush=True)
        # Commit, script et outils propres à chaque entrée : une entrée conservée d'une exécution
        # précédente garde les siens.
        recettes[nom] = {"git": git_etat, "script_sha256": sha256(script), "outils": versions_outils(), "option_sortie": args.sortie, **convertir(nom, etalon, dossier)}
        print(f"{nom} : {recettes[nom]['fichier']['chemin']} {recettes[nom]['fichier']['octets']} octets {recettes[nom]['fichier']['sha256']}", flush=True)

    rapport = {
        "etalon": etalon,
        "script": {"chemin": str(script.relative_to(RACINE)), "sha256": sha256(script)},
        "outils": versions_outils(),
        "recettes": {nom: recettes[nom] for nom in RECETTES if nom in recettes},
    }
    base_rapport.parent.mkdir(parents=True, exist_ok=True)
    base_rapport.with_suffix(".json").write_text(json.dumps(rapport, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    base_rapport.with_suffix(".md").write_text(rapport_markdown(rapport), encoding="utf-8")
    print(f"rapport : {affiche(base_rapport)}.{{json,md}}")


if __name__ == "__main__":
    principal()

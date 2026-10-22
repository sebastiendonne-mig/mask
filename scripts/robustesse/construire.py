"""Construit golden/robustesse/ à partir de docs.py, avec contrôles bloquants.
Usage (depuis la racine du dépôt) : python3 scripts/robustesse/construire.py golden/robustesse
Bibliothèque standard de Python 3 uniquement. Si un contrôle échoue, rien n'est écrit."""
import hashlib, json, os, re, sys, unicodedata
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from documents import DOCS, VOULUS
import identifiants as ids

SPANS = {"PERSONNE", "ADRESSE", "ORGANISATION", "IBAN", "SIREN", "SIRET", "TVA_INTRA", "NIR",
         "CARTE", "EMAIL", "TELEPHONE", "NUMERO_DOSSIER"}
NON_MASQUES = {"DATE", "MONTANT"}
NEUTRES = {"INSTITUTION", "LIEU_ISOLE"}
FICTION = ("0199 00", "0261 91", "0353 01", "0465 71", "0536 49", "0639 98")
FICTION = tuple(p.replace(" ", "") for p in FICTION)

erreurs, remarques = [], []

def borne(texte, s, e):
    avant = texte[s - 1] if s > 0 else " "
    apres = texte[e] if e < len(texte) else " "
    return not (avant.isalnum()) and not (apres.isalnum())

def occurrences(texte, motif):
    out, i = [], 0
    while True:
        j = texte.find(motif, i)
        if j < 0:
            return out
        if borne(texte, j, j + len(motif)):
            out.append((j, j + len(motif)))
        i = j + 1

def controle_identifiant(t, v, doc_id):
    d = re.sub(r"[^0-9A-Za-z]", "", v)
    ok = True
    if t == "IBAN": ok = ids.iban_ok(d)
    elif t == "SIREN": ok = len(d) == 9 and ids.luhn_ok(d)
    elif t == "SIRET": ok = len(d) == 14 and ids.luhn_ok(d) and ids.luhn_ok(d[:9])
    elif t == "TVA_INTRA": ok = ids.tva_ok(d)
    elif t == "NIR": ok = ids.nir_ok(d)
    elif t == "CARTE": ok = d.isdigit() and len(d) in (15, 16) and ids.luhn_ok(d)
    elif t == "TELEPHONE":
        n = re.sub(r"\D", "", v)
        if n.startswith("0033"): n = "0" + n[4:]
        elif n.startswith("33"): n = "0" + n[2:]
        ok = len(n) == 10 and n.startswith(FICTION)
    elif t == "EMAIL": ok = re.fullmatch(r"[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}", v) is not None
    if not ok:
        erreurs.append(f"{doc_id} : contrôle échoué pour {t} « {v} »")

def construire(d):
    texte, doc_id = d["texte"], d["doc_id"]
    if unicodedata.normalize("NFC", texte) != texte:
        erreurs.append(f"{doc_id} : texte non NFC")
    if any(ord(c) > 0xFFFF for c in texte):
        erreurs.append(f"{doc_id} : caractère hors plan multilingue de base")
    candidats = []
    for et in d["etiquettes"]:
        t, v = et[0], et[1]
        if t not in SPANS | NON_MASQUES | NEUTRES:
            erreurs.append(f"{doc_id} : type inconnu {t}")
        if v != v.strip() or not v:
            erreurs.append(f"{doc_id} : étiquette vide ou bordée d'espaces « {v!r} »")
        if len(et) == 3:
            ctx = et[2]
            occ = []
            for (s, e) in [(m.start(), m.end()) for m in re.finditer(re.escape(ctx), texte)]:
                k = ctx.find(v)
                occ.append((s + k, s + k + len(v)))
        else:
            occ = occurrences(texte, v)
        if not occ:
            erreurs.append(f"{doc_id} : « {v} » ({t}) introuvable")
        for s, e in occ:
            candidats.append((s, e, t, v))
    # l'englobante l'emporte : on traite les plus longues d'abord
    candidats = sorted(set(candidats), key=lambda c: (-(c[1] - c[0]), c[0]))
    retenus = []
    for c in candidats:
        dedans = [r for r in retenus if r[0] <= c[0] and c[1] <= r[1]]
        chevauche = [r for r in retenus if c[0] < r[1] and r[0] < c[1] and not (r[0] <= c[0] and c[1] <= r[1])]
        if chevauche:
            erreurs.append(f"{doc_id} : chevauchement partiel « {c[3]} » ({c[2]}) / « {chevauche[0][3]} » ({chevauche[0][2]})")
            continue
        if dedans:
            r = dedans[0]
            cat = lambda t: "span" if t in SPANS else ("non" if t in NON_MASQUES else "neutre")
            if cat(r[2]) != cat(c[2]) and not (cat(c[2]) == "neutre" and cat(r[2]) == "span"):
                remarques.append(f"{doc_id} : « {c[3]} » ({c[2]}) absorbé par « {r[3]} » ({r[2]})")
            continue
        retenus.append(c)
    retenus.sort()
    for s, e, t, v in retenus:
        if texte[s:e] != v:
            erreurs.append(f"{doc_id} : position fausse pour « {v} »")
        if t in SPANS:
            controle_identifiant(t, v, doc_id)
    # chaque occurrence d'une valeur étiquetée (à masquer) est couverte par une étiquette
    for s, e, t, v in retenus:
        if t not in SPANS:
            continue
        for (a, b) in occurrences(texte, v):
            if not any(r[0] <= a and b <= r[1] for r in retenus):
                erreurs.append(f"{doc_id} : occurrence non couverte de « {v} » à {a}")
    # oubli d'étiquetage : chaque mot (3 lettres ou plus) d'un nom de personne, cherché sans
    # tenir compte de la casse, doit être couvert partout, sauf exceptions déclarées (VOULUS)
    voulus = {(m.lower()) for (i, m) in VOULUS if i == doc_id}
    vus = set()
    for s, e, t, v in retenus:
        if t != "PERSONNE":
            continue
        for mot in re.findall(r"[^\W\d_]{3,}", v):
            for m in re.finditer(re.escape(mot), texte, re.IGNORECASE):
                a, b = m.span()
                if (a, b) in vus or not borne(texte, a, b) or any(r[0] <= a and b <= r[1] for r in retenus):
                    continue
                vus.add((a, b))
                if texte[a:b].lower() in voulus:
                    remarques.append(f"{doc_id} : « {texte[a:b]} » laissé sans étiquette (piège déclaré)")
                else:
                    erreurs.append(f"{doc_id} : « {texte[a:b]} » à {a} ressemble à un nom de personne non étiqueté")
    etiq = lambda ensemble: [dict(start=s, end=e, type=t, text=v) for s, e, t, v in retenus if t in ensemble]
    return dict(doc_id=doc_id, persona=d["persona"], split="robustesse", template_id=d["modele"],
                spans=etiq(SPANS), non_masques=etiq(NON_MASQUES), neutres=etiq(NEUTRES))

def main(sortie):
    os.makedirs(sortie, exist_ok=True)
    resultats = [construire(d) for d in DOCS]
    noms = [d["doc_id"] for d in DOCS]
    if len(set(noms)) != len(noms):
        erreurs.append("identifiants de documents en double")
    par_persona = Counter(d["persona"] for d in DOCS)
    if par_persona != Counter({"avocat": 5, "expert-comptable": 5, "rh": 5}):
        erreurs.append(f"répartition inattendue : {par_persona}")
    for r in remarques:
        print("REMARQUE", r)
    if erreurs:
        for e in erreurs:
            print("ERREUR", e)
        sys.exit(1)
    manifeste = []
    for d, r in zip(DOCS, resultats):
        for nom, contenu in ((d["doc_id"] + ".txt", d["texte"]),
                             (d["doc_id"] + ".json", json.dumps(r, ensure_ascii=False, indent=2) + "\n")):
            octets = contenu.encode("utf-8")
            with open(os.path.join(sortie, nom), "wb") as f:
                f.write(octets)
            manifeste.append(f"{hashlib.sha256(octets).hexdigest()}  {nom}")
    with open(os.path.join(sortie, "MANIFEST.sha256"), "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(manifeste, key=lambda l: l.split("  ")[1])) + "\n")
    total = Counter()
    for r in resultats:
        for cle in ("spans", "non_masques", "neutres"):
            total.update(x["type"] for x in r[cle])
    print(f"OK : {len(resultats)} documents écrits dans {sortie}")
    for t, n in sorted(total.items()):
        print(f"  {t:15} {n}")

if __name__ == "__main__":
    main(sys.argv[1])

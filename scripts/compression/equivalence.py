# Équivalence des graphes à renommage près : chaque entrée de nœud qui est un initialiseur
# est remplacée par son contenu (type, forme, SHA-256 des valeurs) ; les autres noms sont
# renumérotés dans l'ordre d'apparition. Option 3, étape 2a. Lancé par inspecter-base.sh.
#   .cache/venv-onnx/bin/python -I scripts/compression/equivalence.py A.onnx B.onnx
import sys, hashlib
import onnx
from onnx import numpy_helper

def canon(m):
    g = m.graph
    init = {t.name: t for t in g.initializer}
    def contenu(t):
        a = numpy_helper.to_array(t)
        return ("INIT", t.data_type, tuple(t.dims), hashlib.sha256(a.tobytes()).hexdigest())
    noms = {}
    def nom(n):
        if n in init: return contenu(init[n])
        if n == "": return ""
        return noms.setdefault(n, f"v{len(noms)}")
    for i in g.input: nom(i.name)
    out = []
    for n in g.node:
        attrs = []
        for a in n.attribute:
            if a.HasField("t"):
                t = a.t; arr = numpy_helper.to_array(t)
                attrs.append((a.name, t.data_type, tuple(t.dims), hashlib.sha256(arr.tobytes()).hexdigest()))
            else:
                attrs.append((a.name, a.SerializeToString()))
        out.append((n.op_type, n.domain, tuple(nom(x) for x in n.input), tuple(nom(x) for x in n.output), tuple(attrs)))
    sorties = tuple(nom(o.name) for o in g.output)
    utilises = {x for n in g.node for x in n.input if x in init}
    return out, sorties, len(init), len(utilises)

A, B = onnx.load(sys.argv[1]), onnx.load(sys.argv[2])
ca, sa, ia, ua = canon(A); cb, sb, ib, ub = canon(B)
diff = [i for i in range(len(ca)) if ca[i] != cb[i]]
print(f"nœuds canonisés différents : {len(diff)} sur {len(ca)} ; sorties équivalentes : {sa == sb}")
print(f"initialiseurs : {ia}/{ib} ; utilisés par un nœud : {ua}/{ub}")
print("graphes équivalents à renommage près :", not diff and sa == sb and len(ca) == len(cb))

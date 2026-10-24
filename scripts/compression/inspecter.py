# Inspection en lecture seule de deux fichiers ONNX (A = Jean-Baptiste, B = Xenova fp32) :
# métadonnées, entrées et sorties, opérateurs (dont fusionnés), comparaison des nœuds et des
# initialiseurs, taille sérialisée par partie. Option 3, étape 2a. Lancé par inspecter-base.sh.
#   .cache/venv-onnx/bin/python -I scripts/compression/inspecter.py A.onnx B.onnx
import sys, hashlib, collections
import onnx
from onnx import numpy_helper, TensorProto

FUSES = {"Attention", "MultiHeadAttention", "SkipLayerNormalization", "EmbedLayerNormalization",
         "SkipSimplifiedLayerNormalization", "BiasGelu", "FastGelu", "Gelu", "BiasAdd", "FusedMatMul",
         "MatMulNBits", "QAttention", "GroupQueryAttention", "RotaryEmbedding", "QuickGelu", "BiasSoftmax"}

def forme(vi):
    t = vi.type.tensor_type
    dims = [d.dim_param if d.HasField("dim_param") else (d.dim_value if d.HasField("dim_value") else "?") for d in t.shape.dim]
    return f"{vi.name}  {TensorProto.DataType.Name(t.elem_type)}  {dims}"

def h(b):
    return hashlib.sha256(b).hexdigest()

def resume(nom, m):
    g = m.graph
    print(f"===== {nom}")
    print("ir_version:", m.ir_version)
    print("opset_import:", [(o.domain or "ai.onnx", o.version) for o in m.opset_import])
    print("producer_name:", repr(m.producer_name), " producer_version:", repr(m.producer_version))
    print("domain:", repr(m.domain), " model_version:", m.model_version, " doc_string:", repr(m.doc_string[:200]))
    print("metadata_props:", [(p.key, p.value) for p in m.metadata_props])
    print("graph.name:", repr(g.name), " graph.doc_string:", repr(g.doc_string[:200]))
    print("entrées:"); [print("  ", forme(i)) for i in g.input]
    print("sorties:"); [print("  ", forme(o)) for o in g.output]
    print("nœuds:", len(g.node), " initialiseurs:", len(g.initializer), " value_info:", len(g.value_info),
          " sparse_init:", len(g.sparse_initializer), " functions:", len(m.functions))
    ops = collections.Counter((n.domain or "ai.onnx", n.op_type) for n in g.node)
    print("types d'opérateurs:", dict(sorted(ops.items(), key=lambda kv: -kv[1])))
    fus = {k: v for k, v in ops.items() if k[1] in FUSES or k[0] not in ("ai.onnx",)}
    print("opérateurs fusionnés / hors domaine standard:", fus or "aucun")
    ext = [t.name for t in g.initializer if t.data_location == TensorProto.EXTERNAL]
    print("initialiseurs à données externes:", len(ext))

def contenu(t):
    # Contenu canonique : type + forme + valeurs (indépendant de raw_data vs champs typés).
    a = numpy_helper.to_array(t)
    return (t.data_type, tuple(t.dims), h(a.tobytes()))

def comparer(A, B):
    print("===== Comparaison A (Jean-Baptiste) / B (Xenova fp32)")
    # Champs de premier niveau du ModelProto
    for champ in ("ir_version", "producer_name", "producer_version", "domain", "model_version", "doc_string"):
        va, vb = getattr(A, champ), getattr(B, champ)
        print(f"  {champ}: {'identique' if va == vb else f'DIFFÈRE {va!r} / {vb!r}'}")
    print("  opset_import:", "identique" if list(A.opset_import) == list(B.opset_import) else "DIFFÈRE")
    print("  metadata_props:", "identique" if list(A.metadata_props) == list(B.metadata_props) else "DIFFÈRE")
    ga, gb = A.graph, B.graph
    print("  graph.name:", "identique" if ga.name == gb.name else f"DIFFÈRE {ga.name!r} / {gb.name!r}")
    print("  entrées:", "identiques" if [i.SerializeToString() for i in ga.input] == [i.SerializeToString() for i in gb.input] else "DIFFÈRENT")
    print("  sorties:", "identiques" if [o.SerializeToString() for o in ga.output] == [o.SerializeToString() for o in gb.output] else "DIFFÈRENT")
    print("  value_info:", "identiques" if [v.SerializeToString() for v in ga.value_info] == [v.SerializeToString() for v in gb.value_info] else "DIFFÈRENT")
    na = [n.SerializeToString() for n in ga.node]; nb = [n.SerializeToString() for n in gb.node]
    print(f"  nœuds: {len(na)} / {len(nb)} ; liste sérialisée identique (ordre compris) : {na == nb}")
    if na != nb:
        diff = [i for i in range(min(len(na), len(nb))) if na[i] != nb[i]]
        print(f"    positions de nœuds différentes : {len(diff)} ; premières : {diff[:10]}")
        nature = collections.Counter()
        for i in diff:
            x, y = ga.node[i], gb.node[i]
            ecarts = []
            for champ in ("name", "op_type", "domain", "doc_string"):
                if getattr(x, champ) != getattr(y, champ): ecarts.append(champ)
            if list(x.input) != list(y.input): ecarts.append("input")
            if list(x.output) != list(y.output): ecarts.append("output")
            axn = {a.name: a for a in x.attribute}; ayn = {a.name: a for a in y.attribute}
            for k in sorted(axn.keys() | ayn.keys()):
                a, b = axn.get(k), ayn.get(k)
                if a is None or b is None: ecarts.append(f"attr {k} absent d'un côté"); continue
                if a.SerializeToString() == b.SerializeToString(): continue
                if a.HasField("t") and b.HasField("t"):
                    same = contenu(a.t) == contenu(b.t)
                    ecarts.append(f"attr {k} tenseur valeurs {'identiques' if same else 'DIFFÉRENTES'} (encodage {'raw' if a.t.raw_data else 'typé'}/{'raw' if b.t.raw_data else 'typé'})")
                else:
                    ecarts.append(f"attr {k}: {onnx.helper.get_attribute_value(a)!r} / {onnx.helper.get_attribute_value(b)!r}")
            nature[(x.op_type, tuple(ecarts))] += 1
            if i in diff[:5]:
                print(f"    #{i} {x.op_type} {x.name!r}/{y.name!r} out={list(x.output)}/{list(y.output)} : {ecarts}")
        print("    nature des écarts (type, écarts) → nombre :")
        for k, v in nature.most_common(): print(f"      {v:4} × {k}")
    ia = {t.name: t for t in ga.initializer}; ib = {t.name: t for t in gb.initializer}
    print(f"  initialiseurs: {len(ia)} / {len(ib)} ; noms communs {len(ia.keys() & ib.keys())} ; seulement A {len(ia.keys() - ib.keys())} ; seulement B {len(ib.keys() - ia.keys())}")
    print("    seulement A (10 premiers):", sorted(ia.keys() - ib.keys())[:10])
    print("    seulement B (10 premiers):", sorted(ib.keys() - ia.keys())[:10])
    meme_contenu = sum(contenu(ia[k]) == contenu(ib[k]) for k in ia.keys() & ib.keys())
    meme_proto = sum(ia[k].SerializeToString() == ib[k].SerializeToString() for k in ia.keys() & ib.keys())
    print(f"    noms communs à contenu identique (valeurs) : {meme_contenu} ; à sérialisation identique (octet pour octet) : {meme_proto}")
    diffs = sorted(k for k in ia.keys() & ib.keys() if contenu(ia[k]) != contenu(ib[k]))
    print("    noms communs à contenu différent (10 premiers):", diffs[:10])
    # Appariement par contenu, indépendamment des noms
    ca = collections.Counter(contenu(t) for t in ga.initializer); cb = collections.Counter(contenu(t) for t in gb.initializer)
    print(f"    multiensemble des contenus identique (sans les noms) : {ca == cb}")
    # Localisation de l'écart de taille : taille sérialisée par partie
    print("  tailles sérialisées (A / B / écart) :")
    parts = {
        "ModelProto entier": (A.ByteSize(), B.ByteSize()),
        "graph": (ga.ByteSize(), gb.ByteSize()),
        "graph.node (somme)": (sum(n.ByteSize() for n in ga.node), sum(n.ByteSize() for n in gb.node)),
        "graph.initializer (somme)": (sum(t.ByteSize() for t in ga.initializer), sum(t.ByteSize() for t in gb.initializer)),
        "graph.input+output": (sum(x.ByteSize() for x in list(ga.input) + list(ga.output)), sum(x.ByteSize() for x in list(gb.input) + list(gb.output))),
        "graph.value_info": (sum(x.ByteSize() for x in ga.value_info), sum(x.ByteSize() for x in gb.value_info)),
        "len(producer_version)": (len(A.producer_version), len(B.producer_version)),
        "len(graph.name)": (len(ga.name), len(gb.name)),
    }
    for k, (x, y) in parts.items():
        print(f"    {k:28} {x:>12} {y:>12} {x - y:>+6}")

if __name__ == "__main__":
    pa, pb = sys.argv[1], sys.argv[2]
    A, B = onnx.load(pa), onnx.load(pb)
    resume("A " + pa, A); resume("B " + pb, B); comparer(A, B)

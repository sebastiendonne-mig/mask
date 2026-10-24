# Compare un config.json lu sur l'entrée standard (Jean-Baptiste, via l'API, sans écriture disque)
# au config.json Xenova épinglé passé en argument : id2label, label2id, puis toute clé différente.
# Option 3, étape 2a. Lancé par inspecter-base.sh.
import json, sys
jb = json.load(sys.stdin); x = json.load(open(sys.argv[1]))
print("id2label JB    :", jb.get("id2label")); print("id2label Xenova:", x.get("id2label"))
print("id2label identique :", jb.get("id2label") == x.get("id2label"))
print("label2id identique :", jb.get("label2id") == x.get("label2id"))
for k in sorted(jb.keys() | x.keys()):
    if jb.get(k) != x.get(k): print(f"  diffère {k}: JB={jb.get(k)!r}  Xenova={x.get(k)!r}")

# Fichiers d'une révision Hugging Face : réponse JSON de /api/models/<dépôt>/revision/<rév>?blobs=true
# lue sur l'entrée standard (aucun fichier téléchargé). Option 3, étape 2a. Lancé par inspecter-base.sh.
import json, sys
d = json.load(sys.stdin)
print("sha:", d.get("sha"))
for s in d["siblings"]:
    l = s.get("lfs")
    print("%-28s size=%-11s blob=%s lfs_sha256=%s" % (s["rfilename"], s.get("size"), s.get("blobId"), l["sha256"] if l else "-"))

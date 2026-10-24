# Chargeur navigateur : C depuis Hugging Face (hébergement, étape 4a)

24/10/2026. Jeu de développement : indicatif, pas la mesure finale. Une seule série, sans remesure : `chrome.md` et `chrome.json` (arbre propre au commit `a372304`, pronostic `pronostic.md` commité avant la mesure ; code au commit `b5db633`).

## Montage

- Chargeur (`src/modele-navigateur.mjs`) : source par défaut « hf », dépôt `migranche/mask-camembert-ner` épinglé au commit `018797af8727a7eed18c29a0e033b51005e43430` ; 4 fichiers (`config.json`, `tokenizer.json`, `tokenizer_config.json`, `onnx/model_fp16.onnx`), chacun vérifié par SHA-256 contre `modeles/MANIFEST.sha256` avant usage, à chaque chargement (aussi depuis le cache) ; `dtype: 'fp16'`, `device: 'wasm'`, octets remis par `customCache`, `env.fetch` refusé. Source « local » gardée, seulement sur demande explicite.
- Banc : Chrome 155, config d (isolée, threads par défaut, WASM simple), 5 répétitions. Débit : un seul seau de 100 Mb/s partagé par le serveur local et un proxy local (`bench/proxy.mjs`) par lequel passent les connexions HTTPS de Chrome ; le proxy n'accepte que `huggingface.co` et `*.hf.co`, refuse et consigne le reste.

## Mesures contre le pronostic

| | Pronostic | Mesuré (max / médiane / min) | C en local, même config (`resultats/compression/banc/fp16-mixte/chrome.md`) |
|---|---|---|---|
| 1re visite, modèle prêt | max entre 22 et 26 s | **24 298,1** / 21 613,0 / 21 547,4 ms | 23 325,8 / 21 386,7 / 21 362,8 ms |
| Visite suivante, modèle prêt | ≤ 5 s | **778,0** / 774,3 / 758,4 ms | 1 067,8 / 817,9 / 805,6 ms |
| S1 | 0 POST, uniquement les hôtes autorisés | 0 requête autre que GET, 0 corps, 0 requête de la page ou du Worker hors liste | — |

- 1re visite : maximum dans l'intervalle du pronostic ; sous le seuil S7 de 30 s. Le maximum (répétition 4) **dépasse 24 000 ms**, la marge de la règle de choix (amendement (5)) ; les quatre autres répétitions vont de 21 547,4 à 21 670,0 ms. L'écart de la répétition 4 est dans la phase de téléchargement (23 372,1 ms contre 20 622,7 à 20 743,7 ms) : le tunnel vers `us.aws.cdn.hf.co` a reçu ses 220 925 416 octets en 23 112 ms (76,5 Mb/s), contre 20 364 à 20 474 ms (86,3 à 86,8 Mb/s) aux autres répétitions, sous le même seau. Cause (réseau réel ou CDN) supposée, non recherchée.
- Visite suivante : tous les fichiers lus depuis CacheStorage, les 4 empreintes revérifiées (phase « empreintes » : 92,8 à 95,9 ms), aucune connexion vers Hugging Face.
- Octets reçus par visite (1re) : 236,6 Mo (médiane), contre 238,0 Mo en local (tokenizer de 1,39 Mo au lieu de 2,42 Mo).

## Débit effectif

Phase de téléchargement (octets reçus par le proxy + fichiers WebAssembly servis, sur la durée de la phase) : 90,9 ; 91,3 ; 91,2 ; 80,7 ; 91,5 Mb/s (répétitions 1 à 5). Plus gros tunnel (`us.aws.cdn.hf.co`, du premier au dernier octet) : 86,3 ; 86,7 ; 86,5 ; 76,5 ; 86,8 Mb/s. Le seau de 100 Mb/s est donc le facteur limitant, sauf à la répétition 4.

## Masques

Comparés à la série locale de C (même fichier ONNX, ancien tokenizer Xenova) : **identiques**, 17/17 documents pour les règles, le modèle et le combiné, aux 10 visites. Aucun masque ne diffère.

## S1

- Hôtes vus par Playwright (page et Worker) : `127.0.0.1`, `huggingface.co`, `us.aws.cdn.hf.co` (et `blob:`, local).
- Chemins sur `huggingface.co` : les 4 URL `resolve/018797af…/<fichier>` et, pour les 3 petits fichiers, leur redirection 307 sur le même hôte, `/api/resolve-cache/models/migranche/mask-camembert-ner/018797af…/<fichier>`. Cette redirection a été constatée à un essai ; les chemins correspondants (même dépôt, même commit, mêmes fichiers) ont alors été ajoutés à la liste des chemins attendus du pilote, avant le commit du code. La liste des hôtes n'a pas été modifiée.
- Proxy : connexions refusées, toutes hors page (services de Chrome) : `www.gstatic.com`, `www.google.com`, `accounts.google.com`, `update.googleapis.com`, `android.clients.google.com`. Aucune violation CSP, aucune tentative réseau de la bibliothèque.

## Essais avant la série

Trois lancements d'essai de fonctionnement (`--essai`, 1 répétition, config d, sorties hors du dépôt), avant le commit du code, non utilisés comme mesure :

1. arrêt du pilote sur une erreur réseau non gérée du proxy (`ECONNRESET` sur un socket côté Chrome), à un moment non consigné ; corrigée (gestionnaire d'erreur sur toute connexion entrante) ;
2. arrêt du pilote sur son propre contrôle de chemins (redirection `/api/resolve-cache/…` ci-dessus), après une 1re visite réussie (modèle prêt 21 785,7 ms) ;
3. essai complet : 1re visite 21 787,7 ms, visite suivante 788 ms, masques identiques à la série locale de C, aucune requête hors liste.

Téléchargements du fichier ONNX depuis le dépôt Hugging Face pour cette étape : 3 ou 4 aux essais (le premier n'est pas consigné) + 6 pour la série (5 premières visites et la visite de diagnostic).

## Non vérifié

- Source « local » après la modification du chargeur : couverte par les tests unitaires, pas rejouée dans le navigateur.
- Safari, iPhone, autres réseaux et autres régions du CDN.
- Page de l'app : elle n'existe pas encore ; la vérification des empreintes est constatée ici dans le banc, à reconstater sur l'app en ligne avant l'ouverture de la préversion (`resultats/hebergement/publication.md`).

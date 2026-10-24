# Banc navigateur — Chrome (modèle depuis Hugging Face)

> Jeu de développement (17 documents, 23 280 caractères) : indicatif, pas la mesure finale.

> Masques identiques à ceux de la série locale de C, pour chaque visite réussie et chaque détecteur (section « Comparaison avec la série locale de C »).

- Date : 2026-10-24T15:14:51.599Z
- Commit : `a3723046ee1a22a4ec2a18b4f8c042ce5487b27f` ; arbre propre : oui
- Détecteur : combiné = règles 0.4.0 + modèle 0.2.0 (gel mask-1.5a-gel)
- Fichier modèle chargé par la page : `compression/fp16-mixte/model.onnx` (SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`) — source hf, `https://huggingface.co/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/onnx/model_fp16.onnx` ; contrôlé à chaque visite réussie
- Machine : Apple M4 Pro, 12 cœurs logiques, 24 Go ; macOS 15.1 (Darwin 24.1.0)
- Google Chrome 155.0.8059.86 (Playwright 1.64.0, canal chrome, fenêtre visible) ; Node v24.15.0
- Transformers.js 4.3.1 ; onnxruntime-web 1.31.0-dev.20260914-8d85527a0 ; backend WASM (WebGPU hors périmètre)
- Source du modèle : dépôt Hugging Face `migranche/mask-camembert-ner`, commit `018797af8727a7eed18c29a0e033b51005e43430` (https://huggingface.co/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/…), dtype fp16
- Débit simulé : 100 Mb/s, un seul seau partagé par le serveur local (page, bibliothèques, WebAssembly, documents) et le proxy local bench/proxy.mjs (tunnels HTTPS vers Hugging Face, octets reçus) ; le trafic Hugging Face traverse le réseau réel (latence réelle), plafonné par ce seau et par la ligne
- 5 répétitions par configuration ; 1re visite = profil Chrome neuf ; visite suivante = Chrome fermé puis relancé sur le même profil
- transformers.web.min.js servi avec 2 spécificateurs réécrits en chemins locaux (sha256 d'origine cc66a4de933cc21f…, servi 65493142578aea6d…)

Valeurs : médiane [min–max] en ms, sur les répétitions réussies.

## Configurations

| Config | Description | Isolée | Threads effectifs | Variante | Échecs |
|---|---|---|---|---|---|
| d | isolée, threads par défaut, variante simple | true | 4 | simple | aucun |

## S7 — chargement

Seuils : règles < 1000 ms ; modèle prêt ≤ 30000 ms (1re visite, 100 Mb/s) ; ≤ 5000 ms (visites suivantes). « Modèle prêt » = session créée + inférence de chauffe, depuis le début de la navigation.

| Config | Visite | n | Règles prêtes | **Modèle prêt** | Bibliothèques JS | Téléchargement | Empreintes | Mise en cache | Session | Chauffe | Avant chargement | Octets reçus (serveur local + proxy) | S7 (max ≤ seuil) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d | 1re | 5 | 49.8 [44.3–56.3] | **21613 [21547.4–24298.1]** | 83.4 [79.7–89.6] | 20681 [20622.7–23372.1] | 122.6 [110.7–126.8] | 150.5 [148.5–154.6] | 471.5 [463.8–474.7] | 28.9 [28.8–29.2] | 69 [58.9–75.2] | 236.6 Mo | atteint |
| d | suivante | 5 | 51.7 [49.3–58.1] | **774.3 [758.4–778]** | 19.3 [18.3–21.7] | 67.8 [66.2–67.9] | 94.3 [92.8–95.9] | 0 [0–0] | 493.2 [488.6–499.6] | 30.2 [28.8–30.9] | 66.8 [58.8–73.5] | 0.2 Mo | atteint |

## Débit effectif

Phase « téléchargement » (fichiers du modèle depuis Hugging Face et fichiers WebAssembly locaux, en parallèle) : (octets reçus par le proxy + octets WebAssembly servis) / durée de la phase. Plus gros tunnel : octets reçus / temps du premier au dernier octet reçu. Seau : 100 Mb/s.

| Config | Visite | Rép. | Octets proxy | Octets WebAssembly | Phase (Mb/s) | Plus gros tunnel : hôte | octets | durée (ms) | Mb/s |
|---|---|---|---|---|---|---|---|---|---|
| d | 1re | 1 | 221 463 579 | 14 289 219 | 90.9 | us.aws.cdn.hf.co | 220 925 478 | 20474 | 86.3 |
| d | 1re | 2 | 221 462 444 | 14 289 219 | 91.3 | us.aws.cdn.hf.co | 220 925 416 | 20383 | 86.7 |
| d | 1re | 3 | 221 461 782 | 14 289 219 | 91.2 | us.aws.cdn.hf.co | 220 925 447 | 20442 | 86.5 |
| d | 1re | 4 | 221 461 675 | 14 289 219 | 80.7 | us.aws.cdn.hf.co | 220 925 416 | 23112 | 76.5 |
| d | 1re | 5 | 221 461 769 | 14 289 219 | 91.5 | us.aws.cdn.hf.co | 220 925 447 | 20364 | 86.8 |
| d | suivante | 1 | 0 | 0 | 0 | — | — | — | — |
| d | suivante | 2 | 0 | 0 | 0 | — | — | — | — |
| d | suivante | 3 | 0 | 0 | 0 | — | — | — | — |
| d | suivante | 4 | 0 | 0 | 0 | — | — | — | — |
| d | suivante | 5 | 0 | 0 | 0 | — | — | — | — |

## Un cœur ou plusieurs

| Config | Threads | Session (1re visite) | ms pour 1 000 caractères | Modèle prêt (visite suivante) |
|---|---|---|---|---|
| d | 4 | 471.5 [463.8–474.7] | 225.5 [225–226.3] | 774.3 [758.4–778] |

Lecture : b − c = effet des threads seul (même isolation) ; a − c = effet de l'isolation seule (1 thread des deux côtés).

## S8 — traitement (règles + modèle, après « modèle prêt »)

« Page » = 3000 caractères : **convention déclarée pour ce rapport, pas une norme**.

| Config | ms par document (médiane des médianes) | ms pour 1 000 caractères | ms par page (3000 car.) |
|---|---|---|---|
| d | 289.8 [289.3–293.4] | 225.5 [225–226.3] | 676.6 [675.1–678.9] |

Par document (ms, toutes visites) :

| Document | Caractères | d |
|---|---|---|
| dev-avocat-01 | 1870 | 479 [475.4–484.2] |
| dev-avocat-02 | 1870 | 456.9 [455.5–463.1] |
| dev-avocat-03 | 1782 | 410.4 [408.5–420.5] |
| dev-avocat-04 | 1852 | 414.1 [412.6–415.3] |
| dev-avocat-05 | 1908 | 435.8 [434.2–438.6] |
| dev-ec-01 | 1380 | 313.6 [313–316.4] |
| dev-ec-02 | 1398 | 318.5 [317.6–320.6] |
| dev-ec-03 | 1347 | 305.5 [304.5–308.4] |
| dev-ec-04 | 1212 | 289.8 [289.3–293.4] |
| dev-ec-05 | 1211 | 284 [283.5–284.3] |
| dev-neutre-01 | 1090 | 220.5 [219.7–220.7] |
| dev-neutre-02 | 1103 | 223.9 [223.4–224.6] |
| dev-rh-01 | 1050 | 214 [213.3–214.2] |
| dev-rh-02 | 1068 | 213.7 [213.4–214.3] |
| dev-rh-03 | 1047 | 224.9 [224.2–228.8] |
| dev-rh-04 | 1037 | 216.9 [216.7–217.7] |
| dev-rh-05 | 1055 | 226.7 [226.4–227.4] |

## Équivalence des masques

Référence Node = `resultats/navigateur/reference-node-dev.json` (onnxruntime-node natif, celui de toutes les mesures du lot 1.5a). Nombre de documents identiques sur 17 (minimum sur toutes les exécutions de la configuration).

| Config | Exécutions | Stable entre exécutions | Règles = Node | Modèle = Node natif | Combiné = Node natif | Modèle = Node WASM | Modèle = Node natif sans optimisation |
|---|---|---|---|---|---|---|---|
| d | 10 | oui | 17/17 | 4/17 | 4/17 | 1/17 | 1/17 |

### Comparaison avec la série locale de C

Référence : resultats/compression/banc/fp16-mixte/chrome.json (commit f8df450, 10 visites réussies, masques identiques entre elles). Documents identiques sur 17, par visite réussie et par détecteur.

| Config | Rép. | Visite | Règles | Modèle | Combiné | Documents différents |
|---|---|---|---|---|---|---|
| d | 1 | 1 | 17/17 | 17/17 | 17/17 | aucun |
| d | 1 | 2 | 17/17 | 17/17 | 17/17 | aucun |
| d | 2 | 1 | 17/17 | 17/17 | 17/17 | aucun |
| d | 2 | 2 | 17/17 | 17/17 | 17/17 | aucun |
| d | 3 | 1 | 17/17 | 17/17 | 17/17 | aucun |
| d | 3 | 2 | 17/17 | 17/17 | 17/17 | aucun |
| d | 4 | 1 | 17/17 | 17/17 | 17/17 | aucun |
| d | 4 | 2 | 17/17 | 17/17 | 17/17 | aucun |
| d | 5 | 1 | 17/17 | 17/17 | 17/17 | aucun |
| d | 5 | 2 | 17/17 | 17/17 | 17/17 | aucun |

Moteurs côté Node entre eux (scripts/navigateur/moteurs-node.mjs) :

- natif = natif-sans-optimisation : 1/17
- natif = wasm : 1/17
- natif-sans-optimisation = wasm : 3/17

Entre configurations du navigateur (masques du modèle) :

- a/b — isolation (1 thread non isolé / threads par défaut isolé) : non comparable (configuration absente)
- b/c — threads (défaut / 1) : non comparable (configuration absente)
- a/c — isolation seule (1 thread) : non comparable (configuration absente)
- b/d — variante WASM (asyncify / simple) : non comparable (configuration absente)

### Écarts navigateur (config d) / Node natif

A = Node natif (référence 1.5a), B = navigateur. Une ligne par masque présent d'un seul côté ; mots du passage dont l'étiquette retenue change, avec les deux meilleures étiquettes et leurs scores (logits) de chaque côté.

| Document | Seulement chez | Type | Passage | Mots (A ; B) |
|---|---|---|---|---|
| dev-avocat-02 | B | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS » | « SELAS » A : I-ORG 3.53 / I-PER 1.55 ; B : I-ORG 3.69 / I-PER 1.08<br>« DELMAS » A : I-ORG 4.02 / I-PER 2.94 ; B : I-ORG 4.08 / I-PER 2.43<br>« AVOCATS » A : I-ORG 5.26 / I-PER -0.12 ; B : I-ORG 5.08 / I-LOC -0.08<br>« ASSOCIÉS » A : I-ORG 5.34 / I-LOC 0.03 ; B : I-ORG 5.07 / I-LOC 0.18 |
| dev-avocat-02 | A | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS Avocats » | « Avocats » A : I-ORG 2.78 / O 1.74 ; B : O 2.34 / I-ORG 1.93 |
| dev-avocat-02 | B | LIEU | « rue du Four » | « rue » A : I-LOC 3.53 / O 2.43 ; B : I-LOC 3.37 / O 2.46<br>« du » A : I-LOC 3.91 / O 1.72 ; B : I-LOC 3.77 / O 1.76<br>« Four » A : I-LOC 4.69 / O -0.02 ; B : I-LOC 4.56 / O 0.09 |
| dev-avocat-02 | A | LIEU | « rue du Four 29000 QUIMPER  Avignon » | « 29000 » A : I-LOC 3.40 / O 3.30 ; B : O 3.78 / I-LOC 2.95 |
| dev-avocat-02 | B | LIEU | « QUIMPER  Avignon » | « QUIMPER » A : I-LOC 6.27 / O -1.01 ; B : I-LOC 6.25 / O -0.97<br>« Avignon, » A : I-LOC 6.33 / I-MISC -0.80 ; B : I-LOC 6.21 / I-MISC -0.51 |
| dev-avocat-03 | B | PERSONNE | « Client » | « Client » A : O 1.42 / I-PER 0.85 ; B : I-PER 1.17 / O 1.10 |
| dev-avocat-04 | B | LIEU | « cours des Arts » | « cours » A : I-LOC 3.52 / O 2.62 ; B : I-LOC 3.41 / O 2.66<br>« des » A : I-LOC 3.92 / O 2.18 ; B : I-LOC 3.78 / O 2.23<br>« Arts, » A : I-LOC 5.33 / O -0.33 ; B : I-LOC 5.13 / O -0.07 |
| dev-avocat-04 | A | LIEU | « cours des Arts, 64000 Pau » | « 64000 » A : I-LOC 3.46 / O 3.24 ; B : O 3.48 / I-LOC 3.24 |
| dev-avocat-04 | B | LIEU | « Pau » | « Pau, » A : I-LOC 6.00 / O -0.44 ; B : I-LOC 5.99 / O -0.50 |
| dev-avocat-04 | A | LIEU | « rue de la Gare, 83000 Toulon » | « rue » A : I-LOC 3.08 / O 3.04 ; B : O 3.18 / I-LOC 2.77<br>« de » A : I-LOC 2.97 / O 2.78 ; B : O 2.90 / I-LOC 2.65 |
| dev-avocat-04 | B | LIEU | « la Gare, 83000 Toulon » | « la » A : I-LOC 3.19 / O 2.49 ; B : I-LOC 2.82 / O 2.66<br>« Gare, » A : I-LOC 5.03 / O -0.42 ; B : I-LOC 4.66 / O -0.19<br>« 83000 » A : I-LOC 3.60 / O 2.94 ; B : I-LOC 3.44 / O 3.10<br>« Toulon, » A : I-LOC 6.33 / I-ORG -1.00 ; B : I-LOC 6.34 / I-ORG -1.00 |
| dev-avocat-05 | B | LIEU | « allée des Roses » | « allée » A : I-LOC 4.06 / O 2.36 ; B : I-LOC 3.76 / O 2.60<br>« des » A : I-LOC 4.44 / O 1.88 ; B : I-LOC 4.11 / O 2.13<br>« Roses, » A : I-LOC 5.87 / O -0.79 ; B : I-LOC 5.81 / O -0.79 |
| dev-avocat-05 | A | LIEU | « allée des Roses, 44000 Nantes » | « 44000 » A : I-LOC 3.43 / O 3.35 ; B : O 3.64 / I-LOC 3.14 |
| dev-avocat-05 | B | LIEU | « Nantes » | « Nantes, » A : I-LOC 6.25 / O -1.04 ; B : I-LOC 6.30 / O -1.26 |
| dev-avocat-05 | B | LIEU | « Résidence Les Iris, bâtiment B » | « Résidence » A : I-LOC 5.58 / O -0.07 ; B : I-LOC 5.59 / O -0.11<br>« Les » A : I-LOC 5.80 / O -0.72 ; B : I-LOC 5.86 / O -0.91<br>« Iris, » A : I-LOC 5.99 / I-MISC -1.20 ; B : I-LOC 6.05 / I-MISC -1.04<br>« bâtiment » A : I-LOC 4.10 / O 2.10 ; B : I-LOC 3.72 / O 2.41<br>« B, » A : I-LOC 4.44 / O 1.48 ; B : I-LOC 4.02 / O 1.86 |
| dev-avocat-05 | A | LIEU | « Résidence Les Iris, bâtiment B, 68 allée des Glycines, 17000 La Rochelle » | « 68 » A : I-LOC 3.46 / O 3.22 ; B : O 3.42 / I-LOC 3.20<br>« 17000 » A : I-LOC 3.52 / O 3.15 ; B : O 3.43 / I-LOC 3.21 |
| dev-avocat-05 | B | LIEU | « allée des Glycines » | « allée » A : I-LOC 4.22 / O 2.30 ; B : I-LOC 4.04 / O 2.42<br>« des » A : I-LOC 4.41 / O 1.99 ; B : I-LOC 4.22 / O 2.16<br>« Glycines, » A : I-LOC 5.93 / O -0.64 ; B : I-LOC 5.88 / O -0.63 |
| dev-avocat-05 | B | LIEU | « La Rochelle » | « La » A : I-LOC 6.33 / O -1.26 ; B : I-LOC 6.36 / I-MISC -1.32<br>« Rochelle, » A : I-LOC 6.45 / I-MISC -1.14 ; B : I-LOC 6.44 / I-MISC -1.03 |
| dev-ec-01 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 3.44 / O 1.20 ; B : O 3.70 / I-ORG 1.35 |
| dev-ec-01 | B | LIEU | « chemin des Vignes » | « chemin » A : I-LOC 4.09 / O 2.14 ; B : I-LOC 3.95 / O 2.22<br>« des » A : I-LOC 4.42 / O 1.69 ; B : I-LOC 4.27 / O 1.79<br>« Vignes » A : I-LOC 5.58 / O -0.63 ; B : I-LOC 5.45 / O -0.54 |
| dev-ec-01 | A | LIEU | « chemin des Vignes 51100 Reims » | « 51100 » A : I-LOC 3.28 / O 3.05 ; B : O 3.27 / I-LOC 3.11 |
| dev-ec-01 | B | LIEU | « Reims » | « Reims » A : I-LOC 6.11 / O -1.14 ; B : I-LOC 6.18 / O -1.41 |
| dev-ec-02 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 2.71 / O 1.06 ; B : O 3.79 / I-ORG 0.70 |
| dev-ec-02 | B | LIEU | « chemin des Vignes » | « chemin » A : I-LOC 3.74 / O 2.45 ; B : I-LOC 3.61 / O 2.51<br>« des » A : I-LOC 4.01 / O 2.04 ; B : I-LOC 3.85 / O 2.16<br>« Vignes, » A : I-LOC 5.48 / O -0.68 ; B : I-LOC 5.43 / O -0.73 |
| dev-ec-02 | A | LIEU | « chemin des Vignes, 79000 Niort » | « 79000 » A : I-LOC 3.29 / O 3.25 ; B : O 3.54 / I-LOC 2.99 |
| dev-ec-02 | B | LIEU | « Niort » | « Niort, » A : I-LOC 6.20 / I-MISC -1.03 ; B : I-LOC 6.22 / I-MISC -0.77 |
| dev-ec-03 | A | ORGANISATION | « tableau de l'Ordre » | « tableau » A : I-ORG 3.13 / O 2.03 ; B : O 4.40 / I-ORG 0.96<br>« de » A : I-ORG 3.29 / O 1.92 ; B : O 4.19 / I-ORG 1.19<br>« l'Ordre » A : I-ORG 3.81 / O 0.49 ; B : O 3.74 / I-ORG 1.30 |
| dev-ec-04 | B | LIEU | « de la Fontaine » | « de » A : I-LOC 2.81 / O 2.32 ; B : I-LOC 2.70 / O 2.24<br>« la » A : I-LOC 3.44 / O 1.72 ; B : I-LOC 3.25 / O 1.74<br>« Fontaine, » A : I-LOC 4.31 / I-PER -0.38 ; B : I-LOC 4.11 / I-PER -0.12 |
| dev-ec-04 | A | LIEU | « de la Fontaine, 59000 Lille » | « 59000 » A : I-LOC 3.30 / O 3.06 ; B : O 3.29 / I-LOC 3.14 |
| dev-ec-04 | B | LIEU | « Lille » | « Lille » A : I-LOC 5.99 / I-ORG -0.96 ; B : I-LOC 6.06 / I-ORG -0.42 |
| dev-ec-05 | A | PERSONNE | « Yann FLORENCE » | « Yann » A : I-PER 6.31 / I-MISC 0.80 ; B : I-PER 6.34 / I-MISC 1.09<br>« FLORENCE » A : I-PER 6.48 / I-MISC 0.88 ; B : I-PER 6.40 / I-MISC 1.18 |
| dev-ec-05 | B | PERSONNE | « Yann FLORENCE Florence » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 3.80 / I-ORG 3.47 |
| dev-ec-05 | A | ORGANISATION | « Florence Expertise Comptable » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 3.80 / I-ORG 3.47 |
| dev-ec-05 | B | ORGANISATION | « Expertise Comptable » | « Expertise » A : I-ORG 5.24 / I-PER 0.07 ; B : I-ORG 4.80 / I-PER -0.53<br>« Comptable » A : I-ORG 5.30 / I-PER -0.46 ; B : I-ORG 4.86 / I-LOC -0.58 |
| dev-neutre-02 | B | DIVERS | « lundi de Pentecôte » | « lundi » A : O 2.87 / I-MISC 2.74 ; B : I-MISC 3.06 / O 2.72 |
| dev-neutre-02 | A | DIVERS | « de Pentecôte » | « de » A : I-MISC 2.95 / O 2.94 ; B : I-MISC 3.18 / O 2.82<br>« Pentecôte » A : I-MISC 4.63 / O 0.36 ; B : I-MISC 4.86 / O 0.19 |
| dev-rh-02 | B | LIEU | « rue du Four » | « rue » A : I-LOC 3.75 / O 2.24 ; B : I-LOC 3.81 / O 2.14<br>« du » A : I-LOC 4.34 / O 1.47 ; B : I-LOC 4.41 / O 1.37<br>« Four » A : I-LOC 5.23 / O -0.50 ; B : I-LOC 5.27 / O -0.57 |
| dev-rh-02 | A | LIEU | « rue du Four 86000 Poitiers » | « 86000 » A : I-LOC 3.40 / O 3.08 ; B : O 3.45 / I-LOC 3.11 |
| dev-rh-02 | B | LIEU | « Poitiers » | « Poitiers » A : I-LOC 6.12 / O -0.88 ; B : I-LOC 6.17 / O -1.04 |
| dev-rh-03 | A | LIEU | « LA ROSE DES PRÉS » | « LA » A : I-LOC 2.97 / I-ORG 1.56 ; B : I-ORG 3.45 / I-LOC 1.86<br>« ROSE » A : I-LOC 3.49 / I-ORG 2.37 ; B : I-ORG 4.08 / I-LOC 2.20<br>« DES » A : I-LOC 2.68 / I-ORG 2.08 ; B : I-ORG 4.07 / I-LOC 1.30<br>« PRÉS » A : I-LOC 3.14 / I-ORG 2.83 ; B : I-ORG 4.53 / I-LOC 1.62 |
| dev-rh-03 | B | ORGANISATION | « LA ROSE DES PRÉS » | « LA » A : I-LOC 2.97 / I-ORG 1.56 ; B : I-ORG 3.45 / I-LOC 1.86<br>« ROSE » A : I-LOC 3.49 / I-ORG 2.37 ; B : I-ORG 4.08 / I-LOC 2.20<br>« DES » A : I-LOC 2.68 / I-ORG 2.08 ; B : I-ORG 4.07 / I-LOC 1.30<br>« PRÉS » A : I-LOC 3.14 / I-ORG 2.83 ; B : I-ORG 4.53 / I-LOC 1.62 |
| dev-rh-05 | B | ORGANISATION | « ATELIER DES TROIS CHÊNES » | « ATELIER » A : I-ORG 5.19 / I-LOC 0.61 ; B : I-ORG 4.83 / I-LOC 1.17<br>« DES » A : I-ORG 4.95 / I-LOC 0.47 ; B : I-ORG 4.66 / I-LOC 1.01<br>« TROIS » A : I-ORG 5.19 / I-LOC 0.84 ; B : I-ORG 4.94 / I-LOC 1.32<br>« CHÊNES » A : I-ORG 5.12 / I-LOC 1.03 ; B : I-ORG 4.89 / I-LOC 1.43 |
| dev-rh-05 | A | ORGANISATION | « ATELIER DES TROIS CHÊNES SA » | « SA » A : I-ORG 2.01 / O 1.61 ; B : O 1.88 / I-ORG 1.74 |
| dev-rh-05 | B | LIEU | « place du Marché » | « place » A : O 2.64 / I-LOC 2.61 ; B : I-LOC 2.76 / O 2.46 |
| dev-rh-05 | A | LIEU | « du Marché » | « du » A : I-LOC 2.92 / O 1.87 ; B : I-LOC 3.13 / O 1.55<br>« Marché » A : I-LOC 3.72 / I-MISC -0.09 ; B : I-LOC 3.92 / I-MISC -0.13 |
| dev-rh-05 | B | LIEU | « de la Pierre Levée » | « de » A : I-LOC 2.97 / O 2.05 ; B : I-LOC 2.65 / O 2.20<br>« la » A : I-LOC 3.21 / O 1.51 ; B : I-LOC 2.83 / O 1.81<br>« Pierre » A : I-LOC 4.76 / I-PER 1.62 ; B : I-LOC 4.53 / I-PER 2.11<br>« Levée » A : I-LOC 4.99 / I-PER 1.83 ; B : I-LOC 4.78 / I-PER 2.30 |
| dev-rh-05 | A | LIEU | « de la Pierre Levée 33000 BORDEAUX » | « 33000 » A : I-LOC 3.44 / O 3.29 ; B : O 3.50 / I-LOC 3.30 |
| dev-rh-05 | B | LIEU | « BORDEAUX » | « BORDEAUX » A : I-LOC 6.47 / I-ORG -1.37 ; B : I-LOC 6.49 / I-ORG -1.27 |

## S1 — réseau

11 visites (mesure et diagnostic). Requêtes vues par Playwright (page et Workers), journal du serveur, garde sur env.fetch, CSP.

| Hôte | Requêtes | Octets reçus |
|---|---|---|
| 127.0.0.1 | 584 | 91 602 709 |
| huggingface.co | 42 | 3 035 676 |
| us.aws.cdn.hf.co | 6 | 1 323 733 932 |
| blob: (local, sans réseau) | 44 | 0 |

- Requêtes autres que GET : 0
- Requêtes avec un corps : 0
- Requêtes de la page ou du Worker hors liste (origine, huggingface.co, *.hf.co ; chemins huggingface.co attendus) : aucune

Chemins HTTPS demandés par la page et le Worker (sans la requête, signée pour les hôtes de téléchargement) :

| Hôte | Chemin | Requêtes |
|---|---|---|
| huggingface.co | `/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/config.json` | 6 |
| huggingface.co | `/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/tokenizer.j…` | 6 |
| huggingface.co | `/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/tokenizer_c…` | 6 |
| huggingface.co | `/migranche/mask-camembert-ner/resolve/018797af8727a7eed18c29a0e033b51005e43430/onnx/model_…` | 6 |
| huggingface.co | `/api/resolve-cache/models/migranche/mask-camembert-ner/018797af8727a7eed18c29a0e033b51005e…` | 6 |
| huggingface.co | `/api/resolve-cache/models/migranche/mask-camembert-ner/018797af8727a7eed18c29a0e033b51005e…` | 6 |
| huggingface.co | `/api/resolve-cache/models/migranche/mask-camembert-ner/018797af8727a7eed18c29a0e033b51005e…` | 6 |
| us.aws.cdn.hf.co | `/xet-bridge-us/6adcbe70c13c6a86f075e048/b30bcf1b08f097249a4137e5d05ec9833c6598a5f0aaf35e8b…` | 6 |

Proxy (bench/proxy.mjs) : tunnels acceptés par hôte, et connexions refusées (hors liste).

| Hôte | Tunnels | Octets reçus | Octets envoyés | Erreurs |
|---|---|---|---|---|
| huggingface.co | 24 | 3 220 419 | 57 804 | client : EPIPE |
| us.aws.cdn.hf.co | 6 | 1 325 552 620 | 39 434 | aucune |

- Connexions refusées par le proxy : CONNECT www.gstatic.com:443 (11) ; CONNECT www.google.com:443 (29) ; CONNECT accounts.google.com:443 (41) ; CONNECT update.googleapis.com:443 (11) ; CONNECT android.clients.google.com:443 (16)
- Chemins refusés par la liste blanche du serveur : aucun
- Tentatives bloquées (env.fetch de la bibliothèque) : aucune
- Violations CSP (événements page et Worker) : aucune
- Messages CSP dans la console : aucun
- Autres erreurs ou avertissements de console : aucun

Requêtes propres au navigateur hors page (mises à jour, services Google de Chrome) : invisibles pour Playwright ; leurs connexions HTTPS passent par le proxy, qui les refuse hors liste (ci-dessus) ; elles ne portent pas le texte du document.


# Banc navigateur — Chrome (lot 1.5b)

> Jeu de développement (17 documents, 23 280 caractères) : indicatif, pas la mesure finale.

- Date : 2026-10-24T10:24:32.197Z
- Commit : `f8df450af31b3b09f2cc7bbfb20219dc49ff663b` ; arbre propre : oui
- Détecteur : combiné = règles 0.4.0 + modèle 0.2.0 (gel mask-1.5a-gel)
- Fichier modèle chargé par la page : `compression/fp16-mixte/model.onnx` (SHA-256 `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb`) — option --modele ; contrôlé à chaque visite réussie
- Machine : Apple M4 Pro, 12 cœurs logiques, 24 Go ; macOS 15.1 (Darwin 24.1.0)
- Google Chrome 155.0.8059.86 (Playwright 1.64.0, canal chrome, fenêtre visible) ; Node v24.15.0
- Transformers.js 4.3.1 ; onnxruntime-web 1.31.0-dev.20260914-8d85527a0 ; backend WASM (WebGPU hors périmètre)
- Débit simulé : 100 Mb/s, côté serveur (seau partagé par toutes les réponses, boucle locale : ni latence ni perte, donc optimiste par rapport à un vrai réseau)
- 5 répétitions par configuration ; 1re visite = profil Chrome neuf ; visite suivante = Chrome fermé puis relancé sur le même profil
- transformers.web.min.js servi avec 2 spécificateurs réécrits en chemins locaux (sha256 d'origine cc66a4de933cc21f…, servi 65493142578aea6d…)

Valeurs : médiane [min–max] en ms, sur les répétitions réussies.

## Configurations

| Config | Description | Isolée | Threads effectifs | Variante | Échecs |
|---|---|---|---|---|---|
| d | isolée, threads par défaut, variante simple | true | 4 | simple | aucun |

## S7 — chargement

Seuils : règles < 1000 ms ; modèle prêt ≤ 30000 ms (1re visite, 100 Mb/s) ; ≤ 5000 ms (visites suivantes). « Modèle prêt » = session créée + inférence de chauffe, depuis le début de la navigation.

| Config | Visite | n | Règles prêtes | **Modèle prêt** | Bibliothèques JS | Téléchargement | Empreintes | Mise en cache | Session | Chauffe | Avant chargement | Octets servis | S7 (max ≤ seuil) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d | 1re | 5 | 49.3 [38.6–58.5] | **21386.7 [21362.8–23325.8]** | 78.8 [76.7–81.9] | 20467.5 [20444.2–22297] | 97.5 [94.6–101.4] | 156.5 [151.1–164.4] | 490 [469.8–571.8] | 30.9 [29.8–31.7] | 72.9 [60.1–85.8] | 238.0 Mo | atteint |
| d | suivante | 5 | 51.6 [44.7–54.5] | **817.9 [805.6–1067.8]** | 19.9 [18.2–22.8] | 90.8 [88.8–95.3] | 93.5 [92.7–95.2] | 0 [0–0.1] | 506.4 [505.1–749] | 30.2 [29.5–40.2] | 74.1 [62.3–80.9] | 0.2 Mo | atteint |

## Un cœur ou plusieurs

| Config | Threads | Session (1re visite) | ms pour 1 000 caractères | Modèle prêt (visite suivante) |
|---|---|---|---|---|
| d | 4 | 490 [469.8–571.8] | 226 [225.2–622] | 817.9 [805.6–1067.8] |

Lecture : b − c = effet des threads seul (même isolation) ; a − c = effet de l'isolation seule (1 thread des deux côtés).

## S8 — traitement (règles + modèle, après « modèle prêt »)

« Page » = 3000 caractères : **convention déclarée pour ce rapport, pas une norme**.

| Config | ms par document (médiane des médianes) | ms pour 1 000 caractères | ms par page (3000 car.) |
|---|---|---|---|
| d | 290.6 [289.1–534.1] | 226 [225.2–622] | 678 [675.6–1865.9] |

Par document (ms, toutes visites) :

| Document | Caractères | d |
|---|---|---|
| dev-avocat-01 | 1870 | 478.9 [475.9–485.1] |
| dev-avocat-02 | 1870 | 458 [456.3–2452.9] |
| dev-avocat-03 | 1782 | 410.7 [409.6–2748.8] |
| dev-avocat-04 | 1852 | 415.4 [413.1–2592.2] |
| dev-avocat-05 | 1908 | 437.6 [434–2733.6] |
| dev-ec-01 | 1380 | 314.8 [312.6–766.1] |
| dev-ec-02 | 1398 | 318.7 [317.8–767.4] |
| dev-ec-03 | 1347 | 306.3 [304.3–728.8] |
| dev-ec-04 | 1212 | 290.6 [289.1–691.8] |
| dev-ec-05 | 1211 | 283.6 [283.2–682.1] |
| dev-neutre-01 | 1090 | 220.4 [219.5–524.6] |
| dev-neutre-02 | 1103 | 223.9 [223.4–534.1] |
| dev-rh-01 | 1050 | 214.4 [214–504.6] |
| dev-rh-02 | 1068 | 214 [213.2–510.6] |
| dev-rh-03 | 1047 | 224.9 [224.3–539.1] |
| dev-rh-04 | 1037 | 217.3 [216.3–517.7] |
| dev-rh-05 | 1055 | 226.7 [225.8–540.4] |

## Équivalence des masques

Référence Node = `resultats/navigateur/reference-node-dev.json` (onnxruntime-node natif, celui de toutes les mesures du lot 1.5a). Nombre de documents identiques sur 17 (minimum sur toutes les exécutions de la configuration).

| Config | Exécutions | Stable entre exécutions | Règles = Node | Modèle = Node natif | Combiné = Node natif | Modèle = Node WASM | Modèle = Node natif sans optimisation |
|---|---|---|---|---|---|---|---|
| d | 10 | oui | 17/17 | 4/17 | 4/17 | 1/17 | 1/17 |

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
| 127.0.0.1 | 608 | 1 429 000 566 |
| blob: (local, sans réseau) | 44 | 0 |
| new-tab-page | 7 | 1 445 331 |
| resources | 39 | 272 946 |
| theme | 1 | 80 263 |
| favicon2 | 2 | 1 254 |
| www.gstatic.com | 10 | 480 505 |
| ogads-pa.clients6.google.com | 1 | 54 |
| play.google.com | 1 | 155 |
| www.google.com | 7 | 82 167 |
| fonts.gstatic.com | 2 | 34 700 |

- Requêtes autres que GET : 2
- Requêtes avec un corps : 2
- Chemins refusés par la liste blanche du serveur : GET /.well-known/appspecific/com.chrome.devtools.json → 404 ; GET /vendor/ort/ort.webgpu.bundle.min.mjs.map → 404 ; GET /vendor/onnxruntime-common/index.js.map → 404 ; GET /vendor/onnxruntime-common/backend.js.map → 404 ; GET /vendor/onnxruntime-common/env.js.map → 404 ; GET /vendor/onnxruntime-common/inference-session.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-conversion.js.map → 404 ; GET /vendor/onnxruntime-common/tensor.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-factory.js.map → 404 ; GET /vendor/onnxruntime-common/trace.js.map → 404 ; GET /vendor/onnxruntime-common/onnx-model.js.map → 404 ; GET /vendor/onnxruntime-common/onnx-value.js.map → 404 ; GET /vendor/onnxruntime-common/env-impl.js.map → 404 ; GET /vendor/onnxruntime-common/backend-impl.js.map → 404 ; GET /vendor/onnxruntime-common/inference-session-impl.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-impl.js.map → 404 ; GET /vendor/onnxruntime-common/version.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-impl-type-mapping.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-utils-impl.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-factory-impl.js.map → 404 ; GET /vendor/onnxruntime-common/tensor-conversion-impl.js.map → 404
- Tentatives bloquées (env.fetch de la bibliothèque) : aucune
- Violations CSP (événements page et Worker) : aucune
- Messages CSP dans la console : aucun
- Autres erreurs ou avertissements de console : error : Failed to load resource: the server responded with a status of 429 () ; warning : An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.

Non couvert : requêtes propres au navigateur hors page (mises à jour, services Google de Chrome), invisibles pour Playwright ; elles ne portent pas le texte du document.


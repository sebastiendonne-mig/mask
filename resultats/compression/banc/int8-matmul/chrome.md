# Banc navigateur — Chrome (lot 1.5b)

> Jeu de développement (17 documents, 23 280 caractères) : indicatif, pas la mesure finale.

- Date : 2026-10-24T10:16:12.004Z
- Commit : `0b506fe903a5a9893ab0e954911f81835e3938ba` ; arbre propre : oui
- Détecteur : combiné = règles 0.4.0 + modèle 0.2.0 (gel mask-1.5a-gel)
- Fichier modèle chargé par la page : `compression/int8-matmul/model.onnx` (SHA-256 `71306e6a6cf16c0cf2ba90152664f0701d2feb3a56fe345f0274fb50f2c79b09`) — option --modele ; contrôlé à chaque visite réussie
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
| d | 1re | 5 | 62.7 [56.6–83.7] | **18152.6 [18138.7–18282]** | 82.7 [78.7–85.6] | 17455.8 [17448.7–17539.8] | 82.8 [81.7–85] | 130 [128.7–134.4] | 288.2 [286.5–304] | 41.2 [40.9–42] | 69.8 [66–95.6] | 203.7 Mo | atteint |
| d | suivante | 5 | 52 [44.9–57.3] | **602.1 [594.7–740.5]** | 18.2 [17.2–18.9] | 78.9 [77–80.2] | 79 [77.8–79.5] | 0 [0–0.1] | 310.6 [303.5–444] | 42.7 [41.1–47.9] | 73.5 [60.8–81.3] | 0.2 Mo | atteint |

## Un cœur ou plusieurs

| Config | Threads | Session (1re visite) | ms pour 1 000 caractères | Modèle prêt (visite suivante) |
|---|---|---|---|---|
| d | 4 | 288.2 [286.5–304] | 228 [226.3–229.6] | 602.1 [594.7–740.5] |

Lecture : b − c = effet des threads seul (même isolation) ; a − c = effet de l'isolation seule (1 thread des deux côtés).

## S8 — traitement (règles + modèle, après « modèle prêt »)

« Page » = 3000 caractères : **convention déclarée pour ce rapport, pas une norme**.

| Config | ms par document (médiane des médianes) | ms pour 1 000 caractères | ms par page (3000 car.) |
|---|---|---|---|
| d | 294.2 [291.2–295.9] | 228 [226.3–229.6] | 684 [678.8–688.9] |

Par document (ms, toutes visites) :

| Document | Caractères | d |
|---|---|---|
| dev-avocat-01 | 1870 | 476.4 [472.9–485] |
| dev-avocat-02 | 1870 | 460.1 [456.7–471.8] |
| dev-avocat-03 | 1782 | 415.1 [411.4–419.8] |
| dev-avocat-04 | 1852 | 421.1 [416.3–427.9] |
| dev-avocat-05 | 1908 | 440.6 [438–444.3] |
| dev-ec-01 | 1380 | 318.5 [314.8–324.9] |
| dev-ec-02 | 1398 | 323.2 [319.4–325.6] |
| dev-ec-03 | 1347 | 310.5 [307–312.9] |
| dev-ec-04 | 1212 | 293.3 [291.2–295.9] |
| dev-ec-05 | 1211 | 286.7 [284.6–293.4] |
| dev-neutre-01 | 1090 | 222.2 [221.8–224.8] |
| dev-neutre-02 | 1103 | 225.8 [225–227.5] |
| dev-rh-01 | 1050 | 216.6 [215.8–218] |
| dev-rh-02 | 1068 | 216.5 [215.2–219.2] |
| dev-rh-03 | 1047 | 227.6 [227–228.3] |
| dev-rh-04 | 1037 | 219.3 [218.3–221.7] |
| dev-rh-05 | 1055 | 228.3 [227.7–233.1] |

## Équivalence des masques

Référence Node = `resultats/navigateur/reference-node-dev.json` (onnxruntime-node natif, celui de toutes les mesures du lot 1.5a). Nombre de documents identiques sur 17 (minimum sur toutes les exécutions de la configuration).

| Config | Exécutions | Stable entre exécutions | Règles = Node | Modèle = Node natif | Combiné = Node natif | Modèle = Node WASM | Modèle = Node natif sans optimisation |
|---|---|---|---|---|---|---|---|
| d | 10 | oui | 17/17 | 1/17 | 1/17 | 3/17 | 2/17 |

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
| dev-avocat-01 | A | ORGANISATION | « CABINET MEUNIER & ASSOCIÉS SELAS » | « CABINET » A : I-ORG 2.55 / O 1.97 ; B : O 1.46 / I-LOC 0.02<br>« MEUNIER » A : I-ORG 3.34 / I-PER 3.07 ; B : I-PER 1.42 / I-ORG 1.05 |
| dev-avocat-01 | B | PERSONNE | « MEUNIER » | « MEUNIER » A : I-ORG 3.34 / I-PER 3.07 ; B : I-PER 1.42 / I-ORG 1.05 |
| dev-avocat-01 | B | ORGANISATION | « ASSOCIÉS SELAS » | « ASSOCIÉS » A : I-ORG 4.46 / I-LOC -0.05 ; B : I-ORG 2.39 / I-LOC 0.34<br>« SELAS » A : I-ORG 4.23 / I-LOC 0.06 ; B : I-ORG 1.57 / O 0.53 |
| dev-avocat-01 | A | LIEU | « rue du Four 31000 Toulouse » | « rue » A : I-LOC 3.97 / O 2.04 ; B : O 2.09 / I-LOC 1.97<br>« 31000 » A : I-LOC 3.50 / O 3.06 ; B : O 2.01 / I-LOC 1.15 |
| dev-avocat-01 | B | LIEU | « du Four » | « du » A : I-LOC 4.18 / O 1.56 ; B : I-LOC 2.02 / O 1.66<br>« Four » A : I-LOC 4.80 / O 0.22 ; B : I-LOC 2.09 / O 1.10 |
| dev-avocat-01 | B | LIEU | « Toulouse » | « Toulouse » A : I-LOC 6.25 / O -1.26 ; B : I-LOC 3.48 / O 0.18 |
| dev-avocat-01 | A | ORGANISATION | « Établissements » | « Établissements » A : I-ORG 3.30 / O 1.77 ; B : O 1.83 / I-LOC -0.14 |
| dev-avocat-01 | A | ORGANISATION | « SA » | « SA » A : I-ORG 3.19 / O 0.37 ; B : O 1.20 / I-LOC -0.24 |
| dev-avocat-01 | B | LIEU | « allée des Roses » | « allée » A : I-LOC 4.27 / O 1.94 ; B : I-LOC 2.06 / O 2.06<br>« des » A : I-LOC 4.58 / O 1.51 ; B : I-LOC 2.34 / O 1.65<br>« Roses » A : I-LOC 5.70 / O -0.49 ; B : I-LOC 2.65 / O 0.29 |
| dev-avocat-01 | A | LIEU | « allée des Roses 13100 AIX-EN-PROVENCE  Toulouse » | « 13100 » A : I-LOC 3.79 / O 2.95 ; B : O 2.46 / I-LOC 1.32 |
| dev-avocat-01 | B | LIEU | « AIX-EN-PROVENCE  Toulouse » | « AIX-EN-PROVENCE » A : I-LOC 6.31 / O -0.96 ; B : I-LOC 4.28 / O 0.40<br>« Toulouse, » A : I-LOC 6.36 / O -1.44 ; B : I-LOC 4.19 / O 0.34 |
| dev-avocat-01 | A | LIEU | « rue de la Fontaine, 64000 Pau » | « rue » A : I-LOC 3.92 / O 2.15 ; B : O 2.03 / I-LOC 1.33<br>« de » A : I-LOC 4.07 / O 1.75 ; B : O 1.53 / I-LOC 1.07<br>« 64000 » A : I-LOC 3.70 / O 3.05 ; B : O 2.29 / I-LOC 1.10 |
| dev-avocat-01 | B | LIEU | « la Fontaine » | « la » A : I-LOC 4.29 / O 1.37 ; B : I-LOC 1.46 / O 1.32<br>« Fontaine, » A : I-LOC 4.92 / O -0.16 ; B : I-LOC 1.76 / O 0.67 |
| dev-avocat-01 | B | LIEU | « Pau » | « Pau, » A : I-LOC 6.26 / O -1.06 ; B : I-LOC 3.47 / O 0.95 |
| dev-avocat-02 | B | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS » | « SELAS » A : I-ORG 3.53 / I-PER 1.55 ; B : I-ORG 1.11 / O 0.79<br>« DELMAS » A : I-ORG 4.02 / I-PER 2.94 ; B : I-ORG 2.85 / I-LOC 0.21<br>« AVOCATS » A : I-ORG 5.26 / I-PER -0.12 ; B : I-ORG 2.88 / I-LOC 0.62<br>« ASSOCIÉS » A : I-ORG 5.34 / I-LOC 0.03 ; B : I-ORG 2.81 / I-LOC 0.51 |
| dev-avocat-02 | A | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS Avocats » | « Avocats » A : I-ORG 2.78 / O 1.74 ; B : O 1.86 / I-ORG 0.17 |
| dev-avocat-02 | A | LIEU | « rue de la Fontaine 84000 Avignon » | « rue » A : I-LOC 3.81 / O 2.22 ; B : O 2.01 / I-LOC 1.90<br>« de » A : I-LOC 3.90 / O 1.90 ; B : O 1.89 / I-LOC 1.80<br>« 84000 » A : I-LOC 3.64 / O 3.02 ; B : O 2.22 / I-LOC 1.49 |
| dev-avocat-02 | B | LIEU | « la Fontaine » | « la » A : I-LOC 4.21 / O 1.44 ; B : I-LOC 1.95 / O 1.69<br>« Fontaine » A : I-LOC 4.77 / O 0.13 ; B : I-LOC 2.19 / O 1.07 |
| dev-avocat-02 | B | LIEU | « Avignon » | « Avignon » A : I-LOC 6.29 / O -1.44 ; B : I-LOC 3.15 / O 0.57 |
| dev-avocat-02 | B | ORGANISATION | « Menuiserie Royer » | « Menuiserie » A : I-ORG 4.84 / I-PER 0.13 ; B : I-ORG 2.63 / I-LOC 0.68<br>« Royer » A : I-ORG 4.34 / I-PER 1.72 ; B : I-ORG 3.07 / I-LOC 0.96 |
| dev-avocat-02 | A | ORGANISATION | « Menuiserie Royer SARL » | « SARL » A : I-ORG 3.19 / O 0.68 ; B : O 1.35 / I-LOC -0.30 |
| dev-avocat-02 | A | LIEU | « rue du Four 29000 QUIMPER  Avignon » | « rue » A : I-LOC 3.53 / O 2.43 ; B : O 2.07 / I-LOC 1.28<br>« 29000 » A : I-LOC 3.40 / O 3.30 ; B : O 2.61 / I-LOC 1.05 |
| dev-avocat-02 | B | LIEU | « du Four » | « du » A : I-LOC 3.91 / O 1.72 ; B : I-LOC 1.78 / O 1.70<br>« Four » A : I-LOC 4.69 / O -0.02 ; B : I-LOC 2.33 / O 0.63 |
| dev-avocat-02 | B | LIEU | « QUIMPER  Avignon » | « QUIMPER » A : I-LOC 6.27 / O -1.01 ; B : I-LOC 3.87 / O -0.05<br>« Avignon, » A : I-LOC 6.33 / I-MISC -0.80 ; B : I-LOC 3.57 / O 0.23 |
| dev-avocat-02 | A | LIEU | « rue du Château » | « rue » A : I-LOC 3.75 / O 2.46 ; B : O 2.17 / I-LOC 1.87<br>« du » A : I-LOC 4.01 / O 1.89 ; B : O 1.96 / I-LOC 1.59 |
| dev-avocat-02 | B | LIEU | « Château » | « Château, » A : I-LOC 4.55 / O 0.71 ; B : I-LOC 2.49 / O 1.24 |
| dev-avocat-02 | A | PERSONNE | « yasmine.delmas@delmas-avocats-associes.io » | « yasmine.delmas@delmas-avocats-associes.io. » A : I-PER 3.70 / O 1.52 ; B : O 1.43 / I-PER 0.00 |
| dev-avocat-03 | A | DIVERS | « CONVENTION » | « CONVENTION » A : I-MISC 2.14 / O 1.73 ; B : O 1.31 / I-LOC 0.25 |
| dev-avocat-03 | A | LIEU | « des Lilas » | « des » A : I-LOC 3.16 / O 2.99 ; B : O 1.78 / I-LOC 1.33 |
| dev-avocat-03 | B | LIEU | « Lilas » | « Lilas, » A : I-LOC 5.71 / O -0.88 ; B : I-LOC 2.85 / O -0.08 |
| dev-avocat-03 | A | LIEU | « de la Gare, 56000 Vannes » | « de » A : I-LOC 2.89 / O 2.52 ; B : O 1.71 / I-LOC 0.63<br>« la » A : I-LOC 3.20 / O 2.17 ; B : O 1.38 / I-LOC 0.86<br>« 56000 » A : I-LOC 4.14 / O 2.22 ; B : O 2.05 / I-LOC 0.68 |
| dev-avocat-03 | B | LIEU | « Gare » | « Gare, » A : I-LOC 4.75 / I-MISC -0.18 ; B : I-LOC 1.74 / O 0.18 |
| dev-avocat-03 | B | LIEU | « Vannes » | « Vannes, » A : I-LOC 6.21 / I-MISC -0.67 ; B : I-LOC 3.29 / O 0.16 |
| dev-avocat-03 | A | PERSONNE | « Client » | « Client » A : I-PER 1.17 / O 0.67 ; B : O 1.36 / I-PER 0.07 |
| dev-avocat-03 | A | PERSONNE | « M. Pierre BERTIN » | « M. » A : I-PER 2.98 / O 2.73 ; B : O 2.23 / I-PER 0.64 |
| dev-avocat-03 | B | PERSONNE | « Pierre BERTIN » | « Pierre » A : I-PER 6.24 / I-MISC 0.77 ; B : I-PER 3.27 / O -0.12<br>« BERTIN, » A : I-PER 6.20 / I-MISC 0.35 ; B : I-PER 2.78 / O -0.19 |
| dev-avocat-03 | A | PERSONNE | « Client » | « Client » A : I-PER 1.34 / O 0.49 ; B : O 1.50 / I-PER 0.09 |
| dev-avocat-03 | A | PERSONNE | « Client                                   L'Avocat Rose Da Silva                          Maître C. MEUNIER » | « Client » A : I-PER 1.12 / I-MISC 0.81 ; B : O 1.32 / I-PER -0.07<br>« Maître » A : I-PER 2.66 / O 2.42 ; B : O 1.77 / I-PER 0.19 |
| dev-avocat-03 | B | PERSONNE | « Avocat Rose Da Silva » | « L'Avocat » A : I-PER 2.75 / I-MISC -0.03 ; B : I-PER 0.82 / O 0.44<br>« Rose » A : I-PER 6.22 / I-MISC 1.58 ; B : I-PER 3.47 / I-MISC 0.06<br>« Da » A : I-PER 6.30 / I-MISC 1.42 ; B : I-PER 2.83 / I-MISC -0.34<br>« Silva » A : I-PER 6.39 / I-MISC 1.20 ; B : I-PER 3.60 / I-MISC 0.05 |
| dev-avocat-03 | B | PERSONNE | « C. MEUNIER » | « C. » A : I-PER 5.91 / O -0.60 ; B : I-PER 1.66 / O 0.72<br>« MEUNIER » A : I-PER 6.54 / I-LOC -0.52 ; B : I-PER 2.09 / O 0.74 |
| dev-avocat-04 | A | DIVERS | « CONVENTION » | « CONVENTION » A : I-MISC 2.52 / O 1.31 ; B : O 1.00 / I-LOC 0.27 |
| dev-avocat-04 | A | LIEU | « Immeuble Le Belvédère » | « Immeuble » A : I-LOC 5.25 / O 0.42 ; B : O 1.74 / I-LOC 1.59 |
| dev-avocat-04 | B | LIEU | « Le Belvédère » | « Le » A : I-LOC 5.69 / O -0.84 ; B : I-LOC 2.87 / O 0.19<br>« Belvédère, » A : I-LOC 6.18 / I-MISC -0.95 ; B : I-LOC 3.42 / I-PER 0.09 |
| dev-avocat-04 | A | LIEU | « cours des Arts, 64000 Pau » | « cours » A : I-LOC 3.52 / O 2.62 ; B : O 1.92 / I-LOC 1.40<br>« des » A : I-LOC 3.92 / O 2.18 ; B : O 1.65 / I-LOC 1.63<br>« 64000 » A : I-LOC 3.46 / O 3.24 ; B : O 2.26 / I-LOC 1.18 |
| dev-avocat-04 | B | LIEU | « Arts » | « Arts, » A : I-LOC 5.33 / O -0.33 ; B : I-LOC 2.01 / O 0.75 |
| dev-avocat-04 | B | LIEU | « Pau » | « Pau, » A : I-LOC 6.00 / O -0.44 ; B : I-LOC 2.47 / O 1.26 |
| dev-avocat-04 | A | ORGANISATION | « SELARL Cabinet Chevalier & Associés » | « SELARL » A : I-ORG 2.49 / O 1.86 ; B : O 1.08 / I-LOC 0.11 |
| dev-avocat-04 | B | ORGANISATION | « Cabinet Chevalier & Associés » | « Cabinet » A : I-ORG 5.17 / I-PER 1.51 ; B : I-ORG 1.88 / I-PER 1.59<br>« Chevalier » A : I-ORG 5.12 / I-PER 2.12 ; B : I-ORG 2.66 / I-PER 2.27<br>« & » A : I-ORG 5.32 / I-PER 0.67 ; B : I-ORG 2.01 / I-PER 0.32<br>« Associés, » A : I-ORG 5.41 / I-PER 0.80 ; B : I-ORG 2.66 / I-PER 0.69 |
| dev-avocat-04 | B | LIEU | « Résidence Les Iris » | « Résidence » A : I-LOC 5.39 / O 0.00 ; B : I-LOC 1.42 / O 1.29<br>« Les » A : I-LOC 5.63 / O -0.69 ; B : I-LOC 2.50 / O 0.46<br>« Iris, » A : I-LOC 5.92 / I-MISC -0.95 ; B : I-LOC 3.28 / I-PER -0.40 |
| dev-avocat-04 | A | LIEU | « Résidence Les Iris, bâtiment B » | « bâtiment » A : I-LOC 4.07 / O 1.90 ; B : O 1.95 / I-LOC 0.73<br>« B, » A : I-LOC 5.01 / O 0.37 ; B : O 1.12 / I-LOC 0.83 |
| dev-avocat-04 | A | LIEU | « rue de la Gare, 83000 Toulon » | « rue » A : I-LOC 3.08 / O 3.04 ; B : O 1.97 / I-LOC 1.08<br>« de » A : I-LOC 2.97 / O 2.78 ; B : O 1.79 / I-LOC 0.34<br>« la » A : I-LOC 3.19 / O 2.49 ; B : O 1.55 / I-LOC 0.72<br>« 83000 » A : I-LOC 3.60 / O 2.94 ; B : O 2.30 / I-LOC 0.98 |
| dev-avocat-04 | B | LIEU | « Gare » | « Gare, » A : I-LOC 5.03 / O -0.42 ; B : I-LOC 1.63 / O 0.56 |
| dev-avocat-04 | B | LIEU | « Toulon » | « Toulon, » A : I-LOC 6.33 / I-ORG -1.00 ; B : I-LOC 3.54 / O 0.35 |
| dev-avocat-04 | A | PERSONNE | « Client » | « Client » A : I-PER 1.69 / O 0.59 ; B : O 1.75 / I-PER -0.03 |
| dev-avocat-04 | A | PERSONNE | « Client » | « Client » A : I-PER 1.90 / I-MISC 0.41 ; B : O 1.24 / I-PER 0.33 |
| dev-avocat-04 | A | PERSONNE | « Client                                   L'Avocat Pierre Barbier                          Maître I. CHEVALIER » | « Client » A : I-PER 1.62 / I-MISC 0.76 ; B : O 1.36 / I-PER -0.05<br>« Maître » A : I-PER 2.62 / O 2.18 ; B : O 1.61 / I-PER 0.38 |
| dev-avocat-04 | B | PERSONNE | « Avocat Pierre Barbier » | « L'Avocat » A : I-PER 3.23 / I-MISC 0.02 ; B : I-PER 0.91 / O 0.49<br>« Pierre » A : I-PER 6.61 / I-MISC 0.96 ; B : I-PER 2.49 / O 0.13<br>« Barbier » A : I-PER 6.86 / I-MISC 0.63 ; B : I-PER 2.99 / O 0.08 |
| dev-avocat-04 | B | PERSONNE | « I. CHEVALIER » | « I. » A : I-PER 6.15 / I-LOC -0.42 ; B : I-PER 2.02 / O 0.61<br>« CHEVALIER » A : I-PER 6.76 / I-LOC -0.28 ; B : I-PER 2.97 / O 0.24 |
| dev-avocat-05 | A | PERSONNE | « Madame MARGAUX FLORENCE » | « Madame » A : I-PER 2.55 / O 2.38 ; B : O 1.58 / I-PER 0.24 |
| dev-avocat-05 | B | PERSONNE | « MARGAUX FLORENCE » | « MARGAUX » A : I-PER 6.55 / I-MISC -0.05 ; B : I-PER 2.92 / O -0.14<br>« FLORENCE, » A : I-PER 6.52 / I-MISC 0.01 ; B : I-PER 2.56 / O 0.37 |
| dev-avocat-05 | A | LIEU | « allée des Roses, 44000 Nantes » | « allée » A : I-LOC 4.06 / O 2.36 ; B : O 2.08 / I-LOC 1.72<br>« des » A : I-LOC 4.44 / O 1.88 ; B : O 1.84 / I-LOC 1.69<br>« 44000 » A : I-LOC 3.43 / O 3.35 ; B : O 2.61 / I-LOC 1.04 |
| dev-avocat-05 | B | LIEU | « Roses » | « Roses, » A : I-LOC 5.87 / O -0.79 ; B : I-LOC 3.01 / O -0.11 |
| dev-avocat-05 | B | LIEU | « Nantes » | « Nantes, » A : I-LOC 6.25 / O -1.04 ; B : I-LOC 2.70 / O 1.01 |
| dev-avocat-05 | A | ORGANISATION | « SCP Cabinet Ferrand & Associés » | « SCP » A : I-ORG 3.91 / O 1.02 ; B : O 0.74 / I-ORG 0.63 |
| dev-avocat-05 | B | ORGANISATION | « Cabinet Ferrand & Associés » | « Cabinet » A : I-ORG 4.39 / I-PER 2.59 ; B : I-ORG 1.67 / I-PER 0.76<br>« Ferrand » A : I-ORG 4.62 / I-PER 2.87 ; B : I-ORG 2.50 / I-PER 1.79<br>« & » A : I-ORG 4.78 / I-PER 0.93 ; B : I-ORG 2.53 / I-PER 0.21<br>« Associés, » A : I-ORG 4.95 / I-PER 0.95 ; B : I-ORG 2.92 / I-PER 0.39 |
| dev-avocat-05 | A | LIEU | « Résidence Les Iris, bâtiment B, 68 allée des Glycines, 17000 La Rochelle » | « Résidence » A : I-LOC 5.58 / O -0.07 ; B : O 1.43 / I-LOC 1.12<br>« bâtiment » A : I-LOC 4.10 / O 2.10 ; B : O 2.06 / I-LOC 0.79<br>« B, » A : I-LOC 4.44 / O 1.48 ; B : O 1.38 / I-LOC 0.97<br>« 68 » A : I-LOC 3.46 / O 3.22 ; B : O 2.47 / I-LOC 0.82<br>« allée » A : I-LOC 4.22 / O 2.30 ; B : O 2.13 / I-LOC 1.77<br>« des » A : I-LOC 4.41 / O 1.99 ; B : O 2.03 / I-LOC 1.55<br>« 17000 » A : I-LOC 3.52 / O 3.15 ; B : O 2.32 / I-LOC 0.70 |
| dev-avocat-05 | B | LIEU | « Les Iris » | « Les » A : I-LOC 5.80 / O -0.72 ; B : I-LOC 2.18 / O 0.72<br>« Iris, » A : I-LOC 5.99 / I-MISC -1.20 ; B : I-LOC 2.47 / O 0.04 |
| dev-avocat-05 | B | LIEU | « Glycines » | « Glycines, » A : I-LOC 5.93 / O -0.64 ; B : I-LOC 2.37 / O 0.62 |
| dev-avocat-05 | B | LIEU | « La Rochelle » | « La » A : I-LOC 6.33 / O -1.26 ; B : I-LOC 3.43 / O 0.06<br>« Rochelle, » A : I-LOC 6.45 / I-MISC -1.14 ; B : I-LOC 4.82 / O -0.98 |
| dev-avocat-05 | A | PERSONNE | « Client » | « Client » A : I-PER 1.48 / O 0.44 ; B : O 1.37 / I-PER 0.18 |
| dev-avocat-05 | A | LIEU | « FR76 » | « FR76 » A : I-LOC 2.96 / O 2.23 ; B : O 2.03 / I-LOC 0.62 |
| dev-avocat-05 | A | PERSONNE | « Client » | « Client » A : I-PER 1.50 / O 0.42 ; B : O 1.31 / I-PER -0.08 |
| dev-avocat-05 | A | PERSONNE | « Client                                   L'Avocat Margaux Florence » | « Client » A : I-PER 1.57 / I-MISC 0.50 ; B : O 0.93 / I-PER 0.15 |
| dev-avocat-05 | B | PERSONNE | « Avocat Margaux Florence » | « L'Avocat » A : I-PER 3.47 / I-MISC 0.21 ; B : I-PER 1.13 / O 0.14<br>« Margaux » A : I-PER 5.94 / I-ORG 0.47 ; B : I-PER 2.19 / O -0.13<br>« Florence » A : I-PER 5.82 / I-ORG 0.32 ; B : I-PER 1.09 / O 0.63 |
| dev-ec-01 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 3.44 / O 1.20 ; B : O 1.14 / I-ORG -0.04 |
| dev-ec-01 | A | LIEU | « chemin des Vignes 51100 Reims » | « chemin » A : I-LOC 4.09 / O 2.14 ; B : O 2.06 / I-LOC 1.66<br>« des » A : I-LOC 4.42 / O 1.69 ; B : O 1.83 / I-LOC 1.62<br>« 51100 » A : I-LOC 3.28 / O 3.05 ; B : O 1.98 / I-LOC 1.19 |
| dev-ec-01 | B | LIEU | « Vignes » | « Vignes » A : I-LOC 5.58 / O -0.63 ; B : I-LOC 2.28 / O 0.80 |
| dev-ec-01 | B | LIEU | « Reims » | « Reims » A : I-LOC 6.11 / O -1.14 ; B : I-LOC 2.43 / O 0.73 |
| dev-ec-01 | B | PERSONNE | « DA » | « DA » A : I-ORG 4.89 / I-PER 1.24 ; B : I-PER 0.89 / I-ORG 0.74 |
| dev-ec-01 | A | ORGANISATION | « DA SILVA CONSEIL SA » | « DA » A : I-ORG 4.89 / I-PER 1.24 ; B : I-PER 0.89 / I-ORG 0.74<br>« SA, » A : I-ORG 3.55 / O 0.35 ; B : O 1.30 / I-LOC 0.07 |
| dev-ec-01 | B | ORGANISATION | « SILVA CONSEIL » | « SILVA » A : I-ORG 5.41 / I-MISC 0.18 ; B : I-ORG 2.22 / I-LOC 0.38<br>« CONSEIL » A : I-ORG 4.80 / I-MISC -0.21 ; B : I-ORG 1.01 / I-LOC 0.37 |
| dev-ec-01 | B | LIEU | « place » | « place » A : I-LOC 4.14 / O 1.71 ; B : I-LOC 1.47 / O 1.44 |
| dev-ec-01 | A | LIEU | « place du Marché, 59000 Lille » | « du » A : I-LOC 4.33 / O 1.41 ; B : O 1.45 / I-LOC 0.87<br>« 59000 » A : I-LOC 3.86 / O 2.44 ; B : O 2.03 / I-LOC 1.28 |
| dev-ec-01 | B | LIEU | « Marché » | « Marché, » A : I-LOC 4.87 / O 0.13 ; B : I-LOC 1.61 / O 0.53 |
| dev-ec-01 | B | LIEU | « Lille » | « Lille, » A : I-LOC 6.24 / I-MISC -1.28 ; B : I-LOC 3.14 / O 0.45 |
| dev-ec-01 | A | ORGANISATION | « Expert-comptable » | « Expert-comptable » A : I-ORG 2.48 / O 1.56 ; B : O 1.22 / I-ORG 0.04 |
| dev-ec-02 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 2.71 / O 1.06 ; B : O 1.58 / I-LOC -0.56 |
| dev-ec-02 | A | LIEU | « Résidence Les Iris, bâtiment B » | « Résidence » A : I-LOC 4.16 / O 0.12 ; B : O 1.66 / I-LOC 0.63<br>« bâtiment » A : I-LOC 3.54 / O 2.14 ; B : O 2.13 / I-LOC 0.99<br>« B » A : I-LOC 3.92 / O 1.64 ; B : O 1.71 / I-LOC 0.81 |
| dev-ec-02 | B | LIEU | « Les Iris » | « Les » A : I-LOC 4.59 / O -0.92 ; B : I-LOC 1.76 / O 0.60<br>« Iris, » A : I-LOC 4.73 / I-ORG -0.23 ; B : I-LOC 1.96 / O -0.02 |
| dev-ec-02 | A | LIEU | « rue des Écoles 56000 Vannes » | « rue » A : I-LOC 3.88 / O 2.03 ; B : O 1.85 / I-LOC 1.46<br>« des » A : I-LOC 4.05 / O 1.79 ; B : O 1.89 / I-LOC 1.44<br>« 56000 » A : I-LOC 3.48 / O 2.87 ; B : O 2.27 / I-LOC 0.93 |
| dev-ec-02 | B | LIEU | « Écoles » | « Écoles » A : I-LOC 4.98 / O -0.25 ; B : I-LOC 1.88 / O 0.73 |
| dev-ec-02 | B | LIEU | « Vannes » | « Vannes » A : I-LOC 6.07 / I-MISC -0.90 ; B : I-LOC 3.06 / O 0.47 |
| dev-ec-02 | B | LIEU | « BISCUITERIE » | « BISCUITERIE » A : I-ORG 3.83 / I-MISC 1.49 ; B : I-LOC 1.31 / I-ORG 1.07 |
| dev-ec-02 | A | ORGANISATION | « BISCUITERIE DE L'ÉTANG » | « BISCUITERIE » A : I-ORG 3.83 / I-MISC 1.49 ; B : I-LOC 1.31 / I-ORG 1.07 |
| dev-ec-02 | B | ORGANISATION | « DE L'ÉTANG » | « DE » A : I-ORG 3.56 / I-MISC 1.18 ; B : I-ORG 0.87 / I-LOC 0.56<br>« L'ÉTANG » A : I-ORG 3.76 / I-MISC 1.34 ; B : I-ORG 1.41 / I-LOC 0.95 |
| dev-ec-02 | A | LIEU | « chemin des Vignes, 79000 Niort » | « chemin » A : I-LOC 3.74 / O 2.45 ; B : O 1.94 / I-LOC 1.79<br>« des » A : I-LOC 4.01 / O 2.04 ; B : O 1.59 / I-LOC 1.54<br>« 79000 » A : I-LOC 3.29 / O 3.25 ; B : O 2.60 / I-LOC 0.84 |
| dev-ec-02 | B | LIEU | « Vignes » | « Vignes, » A : I-LOC 5.48 / O -0.68 ; B : I-LOC 3.40 / O -0.25 |
| dev-ec-02 | B | LIEU | « Niort » | « Niort, » A : I-LOC 6.20 / I-MISC -1.03 ; B : I-LOC 2.46 / O 1.10 |
| dev-ec-03 | A | ORGANISATION | « tableau de l'Ordre » | « tableau » A : I-ORG 3.13 / O 2.03 ; B : O 1.67 / I-LOC 0.11<br>« de » A : I-ORG 3.29 / O 1.92 ; B : O 1.38 / I-LOC 0.12<br>« l'Ordre » A : I-ORG 3.81 / O 0.49 ; B : O 1.40 / I-LOC -0.44 |
| dev-ec-03 | A | LIEU | « route de la Forêt 35000 Rennes » | « route » A : I-LOC 3.86 / O 2.56 ; B : O 2.13 / I-LOC 1.86<br>« de » A : I-LOC 4.01 / O 2.30 ; B : O 2.04 / I-LOC 1.81<br>« 35000 » A : I-LOC 3.63 / O 2.89 ; B : O 2.45 / I-LOC 1.31 |
| dev-ec-03 | B | LIEU | « la Forêt » | « la » A : I-LOC 4.22 / O 1.97 ; B : I-LOC 1.87 / O 1.71<br>« Forêt » A : I-LOC 5.31 / O -0.09 ; B : I-LOC 2.77 / O 0.84 |
| dev-ec-03 | B | LIEU | « Rennes » | « Rennes » A : I-LOC 6.10 / O -1.02 ; B : I-LOC 3.13 / O 0.14 |
| dev-ec-03 | B | ORGANISATION | « FLORENCE BÂTIMENT » | « FLORENCE » A : I-ORG 5.21 / I-MISC 0.83 ; B : I-ORG 3.12 / I-LOC 0.29<br>« BÂTIMENT » A : I-ORG 5.01 / I-MISC 0.16 ; B : I-ORG 2.54 / I-LOC 0.24 |
| dev-ec-03 | A | ORGANISATION | « FLORENCE BÂTIMENT SARL » | « SARL, » A : I-ORG 3.87 / O 0.41 ; B : O 1.09 / I-ORG 0.03 |
| dev-ec-03 | A | LIEU | « rue du Four, 44000 Nantes » | « rue » A : I-LOC 3.48 / O 2.58 ; B : O 1.75 / I-LOC 1.15<br>« du » A : I-LOC 3.81 / O 1.96 ; B : O 1.29 / I-LOC 1.13<br>« 44000 » A : I-LOC 3.45 / O 3.04 ; B : O 2.33 / I-LOC 0.93 |
| dev-ec-03 | B | LIEU | « Four » | « Four, » A : I-LOC 4.95 / O -0.62 ; B : I-LOC 1.59 / O 0.29 |
| dev-ec-03 | B | LIEU | « Nantes » | « Nantes, » A : I-LOC 6.06 / O -0.82 ; B : I-LOC 2.79 / O 0.91 |
| dev-ec-03 | A | ORGANISATION | « Expert-comptable » | « Expert-comptable » A : I-ORG 2.37 / O 1.61 ; B : O 1.33 / I-ORG -0.14 |
| dev-ec-04 | A | ORGANISATION | « SARL Chevalier Conseil » | « SARL » A : I-ORG 3.21 / O 1.62 ; B : O 1.49 / I-ORG -0.28 |
| dev-ec-04 | B | ORGANISATION | « Chevalier Conseil » | « Chevalier » A : I-ORG 4.98 / I-PER 1.74 ; B : I-ORG 3.30 / I-PER 1.07<br>« Conseil » A : I-ORG 5.17 / I-MISC 0.74 ; B : I-ORG 2.90 / I-LOC 0.55 |
| dev-ec-04 | B | LIEU | « SARL » | « SARL » A : I-ORG 4.17 / O -0.05 ; B : I-LOC 0.67 / O 0.46 |
| dev-ec-04 | A | ORGANISATION | « SARL Gauthier Expertise Comptable » | « SARL » A : I-ORG 4.17 / O -0.05 ; B : I-LOC 0.67 / O 0.46 |
| dev-ec-04 | B | ORGANISATION | « Gauthier Expertise Comptable » | « Gauthier » A : I-ORG 5.28 / I-LOC 0.53 ; B : I-ORG 2.86 / I-LOC 0.81<br>« Expertise » A : I-ORG 5.53 / I-LOC 0.59 ; B : I-ORG 3.03 / I-LOC 1.10<br>« Comptable » A : I-ORG 5.57 / I-LOC 0.64 ; B : I-ORG 3.50 / I-LOC 1.35 |
| dev-ec-04 | A | LIEU | « B » | « B, » A : I-LOC 2.73 / O 2.35 ; B : O 1.43 / I-LOC 0.83 |
| dev-ec-04 | A | LIEU | « de la Fontaine, 59000 Lille » | « de » A : I-LOC 2.81 / O 2.32 ; B : O 1.47 / I-LOC 0.95<br>« 59000 » A : I-LOC 3.30 / O 3.06 ; B : O 1.93 / I-LOC 1.13 |
| dev-ec-04 | B | LIEU | « la Fontaine » | « la » A : I-LOC 3.44 / O 1.72 ; B : I-LOC 1.37 / O 1.24<br>« Fontaine, » A : I-LOC 4.31 / I-PER -0.38 ; B : I-LOC 1.38 / O 0.82 |
| dev-ec-04 | B | LIEU | « Lille » | « Lille » A : I-LOC 5.99 / I-ORG -0.96 ; B : I-LOC 2.93 / O 0.57 |
| dev-ec-05 | A | PERSONNE | « Monsieur Marchand » | « Monsieur » A : I-PER 4.17 / O -0.18 ; B : O 1.26 / I-PER 0.39 |
| dev-ec-05 | B | PERSONNE | « Marchand » | « Marchand, » A : I-PER 5.93 / I-MISC 0.81 ; B : I-PER 2.41 / I-LOC -0.24 |
| dev-ec-05 | A | PERSONNE | « Yann FLORENCE » | « Yann » A : I-PER 6.31 / I-MISC 0.80 ; B : I-PER 3.43 / I-LOC -0.31<br>« FLORENCE » A : I-PER 6.48 / I-MISC 0.88 ; B : I-PER 3.05 / I-LOC -0.37 |
| dev-ec-05 | B | PERSONNE | « Yann FLORENCE Florence » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 1.42 / I-ORG 1.20 |
| dev-ec-05 | A | ORGANISATION | « Florence Expertise Comptable » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 1.42 / I-ORG 1.20 |
| dev-ec-05 | B | ORGANISATION | « Expertise Comptable » | « Expertise » A : I-ORG 5.24 / I-PER 0.07 ; B : I-ORG 1.70 / O -0.01<br>« Comptable » A : I-ORG 5.30 / I-PER -0.46 ; B : I-ORG 2.25 / I-LOC 0.32 |
| dev-ec-05 | A | LIEU | « des Vignes » | « des » A : I-LOC 3.45 / O 2.33 ; B : O 1.85 / I-LOC 1.73 |
| dev-ec-05 | B | LIEU | « Vignes » | « Vignes, » A : I-LOC 5.17 / O -0.95 ; B : I-LOC 2.89 / O 0.06 |
| dev-neutre-02 | A | DIVERS | « de Pentecôte » | « de » A : I-MISC 2.95 / O 2.94 ; B : O 1.38 / I-MISC -0.31 |
| dev-neutre-02 | B | DIVERS | « Pentecôte » | « Pentecôte » A : I-MISC 4.63 / O 0.36 ; B : I-MISC 1.30 / O 0.30 |
| dev-neutre-02 | A | DIVERS | « Ressources » | « Ressources » A : I-MISC 1.12 / O 0.82 ; B : O 2.07 / I-LOC -0.09 |
| dev-rh-01 | A | LIEU | « rue de la Gare 56000 Vannes » | « rue » A : I-LOC 3.36 / O 2.69 ; B : O 2.18 / I-LOC 1.56<br>« de » A : I-LOC 3.59 / O 2.21 ; B : O 1.95 / I-LOC 1.48<br>« 56000 » A : I-LOC 3.58 / O 3.02 ; B : O 2.41 / I-LOC 1.34 |
| dev-rh-01 | B | LIEU | « la Gare » | « la » A : I-LOC 3.79 / O 1.90 ; B : I-LOC 1.82 / O 1.61<br>« Gare » A : I-LOC 4.79 / O -0.01 ; B : I-LOC 2.19 / O 0.37 |
| dev-rh-01 | B | LIEU | « Vannes » | « Vannes » A : I-LOC 6.15 / O -1.13 ; B : I-LOC 3.20 / O 0.60 |
| dev-rh-01 | A | LIEU | « rue des Tilleuls » | « rue » A : I-LOC 3.21 / O 2.43 ; B : O 1.62 / I-LOC 1.48 |
| dev-rh-01 | B | LIEU | « des Tilleuls » | « des » A : I-LOC 3.70 / O 1.63 ; B : I-LOC 1.45 / O 1.39<br>« Tilleuls » A : I-LOC 5.26 / I-PER -0.27 ; B : I-LOC 2.53 / I-PER 0.37 |
| dev-rh-01 | A | PERSONNE | « nathalie.vidal@studio-ardoise.org » | « nathalie.vidal@studio-ardoise.org. » A : I-PER 3.22 / O 1.49 ; B : O 1.87 / I-LOC -0.60 |
| dev-rh-02 | A | ORGANISATION | « ÉTABLISSEMENTS PARIS SA » | « ÉTABLISSEMENTS » A : I-ORG 3.17 / O 1.25 ; B : O 1.33 / I-ORG 0.68<br>« SA » A : I-ORG 2.55 / O 1.27 ; B : O 1.18 / I-ORG 0.06 |
| dev-rh-02 | B | ORGANISATION | « PARIS » | « PARIS » A : I-ORG 4.26 / I-LOC 1.41 ; B : I-ORG 1.45 / I-LOC 0.50 |
| dev-rh-02 | B | LIEU | « rue du Four » | « rue » A : I-LOC 3.75 / O 2.24 ; B : I-LOC 1.82 / O 1.64<br>« du » A : I-LOC 4.34 / O 1.47 ; B : I-LOC 1.96 / O 1.04<br>« Four » A : I-LOC 5.23 / O -0.50 ; B : I-LOC 2.45 / I-PER 0.06 |
| dev-rh-02 | A | LIEU | « rue du Four 86000 Poitiers » | « 86000 » A : I-LOC 3.40 / O 3.08 ; B : O 2.24 / I-LOC 1.01 |
| dev-rh-02 | B | LIEU | « Poitiers » | « Poitiers » A : I-LOC 6.12 / O -0.88 ; B : I-LOC 3.02 / O 0.22 |
| dev-rh-02 | A | LIEU | « rue du Four 64000 PAU  Poitiers » | « rue » A : I-LOC 3.44 / O 2.34 ; B : O 1.63 / I-LOC 1.50<br>« 64000 » A : I-LOC 3.49 / O 3.04 ; B : O 1.60 / I-LOC 1.25 |
| dev-rh-02 | B | LIEU | « du Four » | « du » A : I-LOC 4.04 / O 1.40 ; B : I-LOC 1.47 / O 0.90<br>« Four » A : I-LOC 4.89 / I-PER -0.39 ; B : I-LOC 1.46 / I-PER 0.24 |
| dev-rh-02 | B | LIEU | « PAU  Poitiers » | « PAU » A : I-LOC 6.19 / O -0.98 ; B : I-LOC 3.01 / O 0.26<br>« Poitiers, » A : I-LOC 6.32 / O -1.51 ; B : I-LOC 3.02 / O -0.30 |
| dev-rh-03 | A | LIEU | « de la Fontaine » | « de » A : I-LOC 2.57 / O 2.16 ; B : O 1.29 / I-LOC 0.85<br>« la » A : I-LOC 2.95 / O 1.50 ; B : O 1.10 / I-LOC 0.99 |
| dev-rh-03 | B | LIEU | « Fontaine » | « Fontaine » A : I-LOC 3.84 / I-PER 1.64 ; B : I-LOC 1.85 / I-PER 0.94 |
| dev-rh-04 | A | LIEU | « cours des Arts » | « cours » A : I-LOC 3.08 / O 2.51 ; B : O 1.72 / I-LOC 1.71 |
| dev-rh-04 | B | LIEU | « des Arts » | « des » A : I-LOC 3.64 / O 1.85 ; B : I-LOC 1.96 / O 1.57<br>« Arts » A : I-LOC 4.48 / O -0.01 ; B : I-LOC 1.91 / O 0.85 |
| dev-rh-04 | A | LIEU | « des Peupliers » | « des » A : I-LOC 3.56 / O 2.31 ; B : O 1.54 / I-LOC 1.33 |
| dev-rh-04 | B | LIEU | « Peupliers » | « Peupliers » A : I-LOC 5.75 / I-PER -0.61 ; B : I-LOC 3.07 / I-PER 1.02 |
| dev-rh-05 | B | LIEU | « ATELIER DES TROIS CHÊNES » | « ATELIER » A : I-ORG 5.19 / I-LOC 0.61 ; B : I-LOC 0.58 / O 0.46<br>« DES » A : I-ORG 4.95 / I-LOC 0.47 ; B : I-LOC 0.69 / O 0.42<br>« TROIS » A : I-ORG 5.19 / I-LOC 0.84 ; B : I-LOC 1.20 / I-ORG 0.65<br>« CHÊNES » A : I-ORG 5.12 / I-LOC 1.03 ; B : I-LOC 0.77 / I-ORG 0.20 |
| dev-rh-05 | A | ORGANISATION | « ATELIER DES TROIS CHÊNES SA » | « ATELIER » A : I-ORG 5.19 / I-LOC 0.61 ; B : I-LOC 0.58 / O 0.46<br>« DES » A : I-ORG 4.95 / I-LOC 0.47 ; B : I-LOC 0.69 / O 0.42<br>« TROIS » A : I-ORG 5.19 / I-LOC 0.84 ; B : I-LOC 1.20 / I-ORG 0.65<br>« CHÊNES » A : I-ORG 5.12 / I-LOC 1.03 ; B : I-LOC 0.77 / I-ORG 0.20<br>« SA » A : I-ORG 2.01 / O 1.61 ; B : O 1.96 / I-LOC 0.15 |
| dev-rh-05 | A | LIEU | « du Marché » | « du » A : I-LOC 2.92 / O 1.87 ; B : O 1.35 / I-LOC 0.91 |
| dev-rh-05 | B | LIEU | « Marché » | « Marché » A : I-LOC 3.72 / I-MISC -0.09 ; B : I-LOC 2.14 / I-PER -0.11 |
| dev-rh-05 | A | LIEU | « de la Pierre Levée 33000 BORDEAUX » | « de » A : I-LOC 2.97 / O 2.05 ; B : O 1.49 / I-LOC 1.08<br>« la » A : I-LOC 3.21 / O 1.51 ; B : O 1.18 / I-LOC 1.14<br>« 33000 » A : I-LOC 3.44 / O 3.29 ; B : O 2.53 / I-LOC 1.42 |
| dev-rh-05 | B | LIEU | « Pierre Levée » | « Pierre » A : I-LOC 4.76 / I-PER 1.62 ; B : I-LOC 2.18 / I-PER 0.53<br>« Levée » A : I-LOC 4.99 / I-PER 1.83 ; B : I-LOC 3.10 / I-PER 1.05 |
| dev-rh-05 | B | LIEU | « BORDEAUX » | « BORDEAUX » A : I-LOC 6.47 / I-ORG -1.37 ; B : I-LOC 3.52 / O 0.24 |

## S1 — réseau

11 visites (mesure et diagnostic). Requêtes vues par Playwright (page et Workers), journal du serveur, garde sur env.fetch, CSP.

| Hôte | Requêtes | Octets reçus |
|---|---|---|
| 127.0.0.1 | 608 | 1 223 256 624 |
| blob: (local, sans réseau) | 44 | 0 |

- Requêtes autres que GET : 0
- Requêtes avec un corps : 0
- Chemins refusés par la liste blanche du serveur : aucun
- Tentatives bloquées (env.fetch de la bibliothèque) : aucune
- Violations CSP (événements page et Worker) : aucune
- Messages CSP dans la console : aucun
- Autres erreurs ou avertissements de console : aucun

Non couvert : requêtes propres au navigateur hors page (mises à jour, services Google de Chrome), invisibles pour Playwright ; elles ne portent pas le texte du document.


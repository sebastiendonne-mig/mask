# Banc navigateur — Chrome (lot 1.5b)

> Jeu de développement (17 documents, 23 280 caractères) : indicatif, pas la mesure finale.

- Date : 2026-10-22T09:54:21.620Z
- Commit : `45ddd182b6f1e4ec93eebe056317b14596cc79ff` ; arbre propre : oui
- Détecteur : combiné = règles 0.4.0 + modèle 0.2.0 (gel mask-1.5a-gel)
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
| a | non isolée, threads par défaut, asyncify | false | 1 | asyncify | aucun |
| b | isolée, threads par défaut, asyncify | true | 4 | asyncify | aucun |
| c | isolée, 1 thread forcé, asyncify (témoin) | true | 1 | asyncify | aucun |
| d | isolée, threads par défaut, variante simple | true | 4 | simple | aucun |

## S7 — chargement

Seuils : règles < 1000 ms ; modèle prêt ≤ 30000 ms (1re visite, 100 Mb/s) ; ≤ 5000 ms (visites suivantes). « Modèle prêt » = session créée + inférence de chauffe, depuis le début de la navigation.

| Config | Visite | n | Règles prêtes | **Modèle prêt** | Bibliothèques JS | Téléchargement | Empreintes | Mise en cache | Session | Chauffe | Avant chargement | Octets servis | S7 (max ≤ seuil) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 1re | 5 | 31.6 [31–45] | **13257.4 [13083.9–13276.6]** | 81.5 [78.4–90.2] | 12496.4 [12313–12501.8] | 57.9 [57.1–58.9] | 84.8 [84.6–87.4] | 394.6 [393.6–401.5] | 85.7 [84.1–86.8] | 61.3 [51.4–69.5] | 141.4 Mo | atteint |
| a | suivante | 5 | 37.6 [36–45.7] | **678.6 [674.7–692.9]** | 19.5 [17.4–23] | 50.6 [50.2–54.2] | 47.7 [46.8–48.8] | 0.1 [0–0.1] | 412.1 [410.4–421.4] | 85.3 [84.6–87.4] | 62.8 [48.7–72] | 0.2 Mo | atteint |
| b | 1re | 5 | 47.5 [34.3–53.3] | **13261.3 [13199–13361]** | 84.3 [80.6–86.5] | 12524.3 [12447.5–12601.9] | 58.7 [58.3–59] | 86.8 [85.4–91.5] | 397.6 [393.6–420.4] | 51.7 [48.7–58.7] | 60.9 [55–73.9] | 141.4 Mo | atteint |
| b | suivante | 5 | 45.6 [38.3–52.9] | **660 [653.2–666]** | 19.5 [18.9–19.8] | 51.4 [50.2–53.3] | 48.3 [47.3–49.4] | 0 [0–0] | 418 [413.1–422.7] | 47.1 [46.8–47.8] | 72.7 [71.3–79.7] | 0.2 Mo | atteint |
| c | 1re | 5 | 34.9 [34.2–46.8] | **13258.2 [13160.9–13484.5]** | 80.4 [79.8–83.5] | 12488.7 [12385–12711.4] | 58.1 [56.5–60.7] | 87.2 [84.7–90.4] | 392.6 [390.8–403.8] | 86.2 [85.4–86.8] | 58.7 [55.7–75.2] | 141.4 Mo | atteint |
| c | suivante | 5 | 43.4 [41.6–55] | **682 [669.1–686.3]** | 19.3 [18.5–19.8] | 51.5 [50.2–55.9] | 47 [46.9–48.9] | 0 [0–0] | 406.1 [398.5–411.9] | 85 [84.5–86.5] | 68.3 [65.2–78] | 0.2 Mo | atteint |
| d | 1re | 5 | 40.9 [35.9–81.8] | **12214.2 [12131.8–12331.7]** | 80.8 [78.5–82.3] | 11639.1 [11555.8–11718.6] | 58.9 [57.3–59.7] | 83.2 [80–84.1] | 245.9 [244.9–250.4] | 41 [40.5–41.3] | 64.8 [55.3–102.6] | 128.8 Mo | atteint |
| d | suivante | 5 | 43 [37.1–52.3] | **489.2 [478.1–492.7]** | 17.8 [17–24] | 48.5 [46.4–50.4] | 48.2 [46.1–48.7] | 0 [0–0] | 263.5 [260.5–266] | 40.9 [40.7–41.9] | 68.1 [51.8–77.7] | 0.2 Mo | atteint |

## Un cœur ou plusieurs

| Config | Threads | Session (1re visite) | ms pour 1 000 caractères | Modèle prêt (visite suivante) |
|---|---|---|---|---|
| a | 1 | 394.6 [393.6–401.5] | 864.5 [845–866.1] | 678.6 [674.7–692.9] |
| b | 4 | 397.6 [393.6–420.4] | 229.5 [228.1–229.9] | 660 [653.2–666] |
| c | 1 | 392.6 [390.8–403.8] | 863.4 [854.5–866.5] | 682 [669.1–686.3] |
| d | 4 | 245.9 [244.9–250.4] | 227.8 [226.3–229.6] | 489.2 [478.1–492.7] |

Lecture : b − c = effet des threads seul (même isolation) ; a − c = effet de l'isolation seule (1 thread des deux côtés).

## S8 — traitement (règles + modèle, après « modèle prêt »)

« Page » = 3000 caractères : **convention déclarée pour ce rapport, pas une norme**.

| Config | ms par document (médiane des médianes) | ms pour 1 000 caractères | ms par page (3000 car.) |
|---|---|---|---|
| a | 1113.8 [1088.7–1118.2] | 864.5 [845–866.1] | 2593.4 [2534.9–2598.2] |
| b | 294.9 [291.4–298.3] | 229.5 [228.1–229.9] | 688.4 [684.2–689.7] |
| c | 1112.3 [1103.3–1122.5] | 863.4 [854.5–866.5] | 2590.1 [2563.5–2599.5] |
| d | 294.2 [290.9–296.3] | 227.8 [226.3–229.6] | 683.2 [678.9–688.9] |

Par document (ms, toutes visites) :

| Document | Caractères | a | b | c | d |
|---|---|---|---|---|---|
| dev-avocat-01 | 1870 | 1790.3 [1754.6–1794.9] | 490.1 [484.1–494.8] | 1790 [1774.3–1796.9] | 477.1 [475.8–483] |
| dev-avocat-02 | 1870 | 1753.6 [1717.6–1757.1] | 467.3 [465.5–471.3] | 1750.4 [1732.8–1761.1] | 461.9 [457.6–464] |
| dev-avocat-03 | 1782 | 1574.5 [1544.1–1577.8] | 417.7 [412.8–420] | 1571.9 [1553.1–1577.8] | 414.3 [411.6–416.8] |
| dev-avocat-04 | 1852 | 1584.7 [1542–1589] | 421.6 [416.2–423] | 1582.5 [1565–1591.9] | 421.4 [414.6–426.2] |
| dev-avocat-05 | 1908 | 1672.6 [1631.6–1678.1] | 441.7 [437–447.5] | 1669.8 [1652.8–1680] | 440.3 [437.2–447.1] |
| dev-ec-01 | 1380 | 1205.8 [1178.6–1208.8] | 318.4 [315.3–320.6] | 1204.5 [1190.5–1209.1] | 317.7 [315.7–320.8] |
| dev-ec-02 | 1398 | 1224.6 [1196.9–1227.2] | 323.4 [320.2–327.5] | 1223.6 [1214.6–1227.4] | 322.7 [320.2–326.1] |
| dev-ec-03 | 1347 | 1176.2 [1150.2–1177.5] | 310.8 [307.7–315.9] | 1174.6 [1162.8–1177.6] | 309.4 [306.6–312.4] |
| dev-ec-04 | 1212 | 1113.8 [1088.7–1118.2] | 294.9 [291.4–298.3] | 1112.3 [1103.3–1122.5] | 294.2 [290.9–296.3] |
| dev-ec-05 | 1211 | 1091.8 [1065.9–1100.4] | 287.7 [285.3–292.2] | 1091.4 [1079.9–1098.9] | 287.7 [285–293.6] |
| dev-neutre-01 | 1090 | 851.3 [830.9–856] | 223.6 [222.2–229.8] | 849.3 [840.6–851.7] | 222.8 [222.2–223.3] |
| dev-neutre-02 | 1103 | 863.7 [844.9–866.8] | 226.9 [226.1–228.1] | 863.1 [855.5–865.4] | 226.1 [225.3–226.5] |
| dev-rh-01 | 1050 | 813.9 [795.9–817.6] | 218.1 [216.8–219] | 813 [804.7–815.1] | 216.8 [215.6–217.1] |
| dev-rh-02 | 1068 | 824.7 [807.3–829.3] | 216.9 [215.4–217.7] | 823.5 [814.3–826.7] | 217.1 [215.8–218.7] |
| dev-rh-03 | 1047 | 867.7 [849.6–870.2] | 228.2 [226.9–229.3] | 866.8 [856.7–869] | 227.7 [226.2–229.3] |
| dev-rh-04 | 1037 | 836.5 [817.2–839.3] | 219.9 [219–221] | 835.5 [825.9–838] | 219.4 [218.4–220.4] |
| dev-rh-05 | 1055 | 875 [854.7–876.4] | 229.4 [228.6–229.9] | 873.2 [863.7–876.2] | 228.9 [228.1–230.1] |

## Équivalence des masques

Référence Node = `resultats/navigateur/reference-node-dev.json` (onnxruntime-node natif, celui de toutes les mesures du lot 1.5a). Nombre de documents identiques sur 17 (minimum sur toutes les exécutions de la configuration).

| Config | Exécutions | Stable entre exécutions | Règles = Node | Modèle = Node natif | Combiné = Node natif | Modèle = Node WASM | Modèle = Node natif sans optimisation |
|---|---|---|---|---|---|---|---|
| a | 10 | oui | 17/17 | 1/17 | 1/17 | 17/17 | 3/17 |
| b | 10 | oui | 17/17 | 1/17 | 1/17 | 17/17 | 3/17 |
| c | 10 | oui | 17/17 | 1/17 | 1/17 | 17/17 | 3/17 |
| d | 10 | oui | 17/17 | 1/17 | 1/17 | 17/17 | 3/17 |

Moteurs côté Node entre eux (scripts/navigateur/moteurs-node.mjs) :

- natif = natif-sans-optimisation : 1/17
- natif = wasm : 1/17
- natif-sans-optimisation = wasm : 3/17

Entre configurations du navigateur (masques du modèle) :

- a/b — isolation (1 thread non isolé / threads par défaut isolé) : 17/17 identiques
- b/c — threads (défaut / 1) : 17/17 identiques
- a/c — isolation seule (1 thread) : 17/17 identiques
- b/d — variante WASM (asyncify / simple) : 17/17 identiques

### Écarts navigateur (config a, b, c, d) / Node natif

A = Node natif (référence 1.5a), B = navigateur. Une ligne par masque présent d'un seul côté ; mots du passage dont l'étiquette retenue change, avec les deux meilleures étiquettes et leurs scores (logits) de chaque côté.

| Document | Seulement chez | Type | Passage | Mots (A ; B) |
|---|---|---|---|---|
| dev-avocat-01 | A | ORGANISATION | « CABINET MEUNIER & ASSOCIÉS SELAS » | « CABINET » A : I-ORG 2.55 / O 1.97 ; B : O 1.29 / I-LOC 0.17 |
| dev-avocat-01 | B | ORGANISATION | « MEUNIER & ASSOCIÉS SELAS » | « MEUNIER » A : I-ORG 3.34 / I-PER 3.07 ; B : I-ORG 0.94 / I-PER 0.69<br>« & » A : I-ORG 3.76 / O 0.50 ; B : I-ORG 1.39 / O 0.68<br>« ASSOCIÉS » A : I-ORG 4.46 / I-LOC -0.05 ; B : I-ORG 1.61 / O 0.34<br>« SELAS » A : I-ORG 4.23 / I-LOC 0.06 ; B : I-ORG 1.67 / O 0.57 |
| dev-avocat-01 | A | LIEU | « rue du Four 31000 Toulouse » | « rue » A : I-LOC 3.97 / O 2.04 ; B : O 1.96 / I-LOC 1.92<br>« 31000 » A : I-LOC 3.50 / O 3.06 ; B : O 1.88 / I-LOC 1.43 |
| dev-avocat-01 | B | LIEU | « du Four » | « du » A : I-LOC 4.18 / O 1.56 ; B : I-LOC 1.94 / O 1.72<br>« Four » A : I-LOC 4.80 / O 0.22 ; B : I-LOC 1.99 / O 1.19 |
| dev-avocat-01 | B | LIEU | « Toulouse » | « Toulouse » A : I-LOC 6.25 / O -1.26 ; B : I-LOC 3.37 / O 0.53 |
| dev-avocat-01 | A | ORGANISATION | « Établissements » | « Établissements » A : I-ORG 3.30 / O 1.77 ; B : O 1.06 / I-ORG 0.50 |
| dev-avocat-01 | A | ORGANISATION | « SA » | « SA » A : I-ORG 3.19 / O 0.37 ; B : O 0.65 / I-ORG 0.37 |
| dev-avocat-01 | B | LIEU | « allée des Roses » | « allée » A : I-LOC 4.27 / O 1.94 ; B : I-LOC 2.48 / O 1.94<br>« des » A : I-LOC 4.58 / O 1.51 ; B : I-LOC 2.59 / O 1.71<br>« Roses » A : I-LOC 5.70 / O -0.49 ; B : I-LOC 2.98 / O 0.47 |
| dev-avocat-01 | A | LIEU | « allée des Roses 13100 AIX-EN-PROVENCE  Toulouse » | « 13100 » A : I-LOC 3.79 / O 2.95 ; B : O 2.29 / I-LOC 2.26 |
| dev-avocat-01 | B | LIEU | « AIX-EN-PROVENCE  Toulouse » | « AIX-EN-PROVENCE » A : I-LOC 6.31 / O -0.96 ; B : I-LOC 4.03 / O 0.69<br>« Toulouse, » A : I-LOC 6.36 / O -1.44 ; B : I-LOC 3.92 / O 0.44 |
| dev-avocat-01 | A | LIEU | « rue de la Fontaine, 64000 Pau » | « rue » A : I-LOC 3.92 / O 2.15 ; B : O 1.99 / I-LOC 1.91<br>« 64000 » A : I-LOC 3.70 / O 3.05 ; B : O 2.44 / I-LOC 1.03 |
| dev-avocat-01 | B | LIEU | « de la Fontaine » | « de » A : I-LOC 4.07 / O 1.75 ; B : I-LOC 1.88 / O 1.50<br>« la » A : I-LOC 4.29 / O 1.37 ; B : I-LOC 2.00 / O 1.12<br>« Fontaine, » A : I-LOC 4.92 / O -0.16 ; B : I-LOC 2.58 / O 0.22 |
| dev-avocat-01 | B | LIEU | « Pau » | « Pau, » A : I-LOC 6.26 / O -1.06 ; B : I-LOC 4.06 / O 0.54 |
| dev-avocat-02 | B | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS » | « SELAS » A : I-ORG 3.53 / I-PER 1.55 ; B : I-ORG 1.51 / O 0.43<br>« DELMAS » A : I-ORG 4.02 / I-PER 2.94 ; B : I-ORG 2.85 / I-LOC 0.22<br>« AVOCATS » A : I-ORG 5.26 / I-PER -0.12 ; B : I-ORG 3.25 / I-LOC 0.85<br>« ASSOCIÉS » A : I-ORG 5.34 / I-LOC 0.03 ; B : I-ORG 2.70 / I-LOC 0.69 |
| dev-avocat-02 | A | ORGANISATION | « SELAS DELMAS AVOCATS ASSOCIÉS Avocats » | « Avocats » A : I-ORG 2.78 / O 1.74 ; B : O 1.13 / I-ORG 0.44 |
| dev-avocat-02 | B | LIEU | « rue de la Fontaine » | « rue » A : I-LOC 3.81 / O 2.22 ; B : I-LOC 2.20 / O 1.86<br>« de » A : I-LOC 3.90 / O 1.90 ; B : I-LOC 1.95 / O 1.83<br>« la » A : I-LOC 4.21 / O 1.44 ; B : I-LOC 2.16 / O 1.50<br>« Fontaine » A : I-LOC 4.77 / O 0.13 ; B : I-LOC 2.34 / O 0.87 |
| dev-avocat-02 | A | LIEU | « rue de la Fontaine 84000 Avignon » | « 84000 » A : I-LOC 3.64 / O 3.02 ; B : O 2.08 / I-LOC 1.27 |
| dev-avocat-02 | B | LIEU | « Avignon » | « Avignon » A : I-LOC 6.29 / O -1.44 ; B : I-LOC 3.28 / O 0.13 |
| dev-avocat-02 | B | ORGANISATION | « Menuiserie Royer » | « Menuiserie » A : I-ORG 4.84 / I-PER 0.13 ; B : I-ORG 2.94 / I-LOC 0.13<br>« Royer » A : I-ORG 4.34 / I-PER 1.72 ; B : I-ORG 2.66 / I-PER 1.17 |
| dev-avocat-02 | A | ORGANISATION | « Menuiserie Royer SARL » | « SARL » A : I-ORG 3.19 / O 0.68 ; B : O 0.91 / I-ORG 0.08 |
| dev-avocat-02 | A | LIEU | « rue du Four 29000 QUIMPER  Avignon » | « rue » A : I-LOC 3.53 / O 2.43 ; B : O 2.02 / I-LOC 1.56<br>« 29000 » A : I-LOC 3.40 / O 3.30 ; B : O 2.27 / I-LOC 1.49 |
| dev-avocat-02 | B | LIEU | « du Four » | « du » A : I-LOC 3.91 / O 1.72 ; B : I-LOC 1.81 / O 1.61<br>« Four » A : I-LOC 4.69 / O -0.02 ; B : I-LOC 2.21 / O 0.77 |
| dev-avocat-02 | B | LIEU | « QUIMPER  Avignon » | « QUIMPER » A : I-LOC 6.27 / O -1.01 ; B : I-LOC 4.18 / O -0.15<br>« Avignon, » A : I-LOC 6.33 / I-MISC -0.80 ; B : I-LOC 4.15 / O -0.32 |
| dev-avocat-02 | A | LIEU | « rue du Château » | « rue » A : I-LOC 3.75 / O 2.46 ; B : O 2.13 / I-LOC 1.48<br>« du » A : I-LOC 4.01 / O 1.89 ; B : O 1.89 / I-LOC 1.41 |
| dev-avocat-02 | B | LIEU | « Château » | « Château, » A : I-LOC 4.55 / O 0.71 ; B : I-LOC 2.46 / O 0.83 |
| dev-avocat-03 | A | DIVERS | « CONVENTION » | « CONVENTION » A : I-MISC 2.14 / O 1.73 ; B : O 1.07 / I-LOC 0.38 |
| dev-avocat-03 | A | LIEU | « des Lilas » | « des » A : I-LOC 3.16 / O 2.99 ; B : O 1.64 / I-LOC 1.05 |
| dev-avocat-03 | B | LIEU | « Lilas » | « Lilas, » A : I-LOC 5.71 / O -0.88 ; B : I-LOC 2.00 / O 0.62 |
| dev-avocat-03 | A | LIEU | « de la Gare, 56000 Vannes » | « de » A : I-LOC 2.89 / O 2.52 ; B : O 1.90 / I-LOC 0.68<br>« la » A : I-LOC 3.20 / O 2.17 ; B : O 1.47 / I-LOC 0.81<br>« 56000 » A : I-LOC 4.14 / O 2.22 ; B : O 2.02 / I-LOC 0.81 |
| dev-avocat-03 | B | LIEU | « Gare » | « Gare, » A : I-LOC 4.75 / I-MISC -0.18 ; B : I-LOC 1.53 / O 0.49 |
| dev-avocat-03 | B | LIEU | « Vannes » | « Vannes, » A : I-LOC 6.21 / I-MISC -0.67 ; B : I-LOC 3.45 / O 0.11 |
| dev-avocat-03 | A | PERSONNE | « Client » | « Client » A : I-PER 1.17 / O 0.67 ; B : O 1.42 / I-PER -0.08 |
| dev-avocat-03 | A | PERSONNE | « M. Pierre BERTIN » | « M. » A : I-PER 2.98 / O 2.73 ; B : O 2.08 / I-PER 0.93 |
| dev-avocat-03 | B | PERSONNE | « Pierre BERTIN » | « Pierre » A : I-PER 6.24 / I-MISC 0.77 ; B : I-PER 2.49 / O 0.38<br>« BERTIN, » A : I-PER 6.20 / I-MISC 0.35 ; B : I-PER 2.38 / O 0.20 |
| dev-avocat-03 | A | PERSONNE | « Client » | « Client » A : I-PER 1.34 / O 0.49 ; B : O 1.24 / I-PER 0.30 |
| dev-avocat-03 | A | PERSONNE | « Client                                   L'Avocat Rose Da Silva                          Maître C. MEUNIER » | « Client » A : I-PER 1.12 / I-MISC 0.81 ; B : O 1.24 / I-LOC -0.22<br>« Maître » A : I-PER 2.66 / O 2.42 ; B : O 1.44 / I-PER 0.33 |
| dev-avocat-03 | B | PERSONNE | « Avocat Rose Da Silva » | « L'Avocat » A : I-PER 2.75 / I-MISC -0.03 ; B : I-PER 0.59 / O 0.46<br>« Rose » A : I-PER 6.22 / I-MISC 1.58 ; B : I-PER 4.08 / I-MISC 0.11<br>« Da » A : I-PER 6.30 / I-MISC 1.42 ; B : I-PER 3.73 / I-MISC -0.21<br>« Silva » A : I-PER 6.39 / I-MISC 1.20 ; B : I-PER 4.33 / I-MISC -0.00 |
| dev-avocat-03 | B | PERSONNE | « C. MEUNIER » | « C. » A : I-PER 5.91 / O -0.60 ; B : I-PER 1.28 / O 0.74<br>« MEUNIER » A : I-PER 6.54 / I-LOC -0.52 ; B : I-PER 2.33 / O 0.36 |
| dev-avocat-04 | A | DIVERS | « CONVENTION » | « CONVENTION » A : I-MISC 2.52 / O 1.31 ; B : O 1.23 / I-LOC 0.11 |
| dev-avocat-04 | A | LIEU | « cours des Arts, 64000 Pau » | « cours » A : I-LOC 3.52 / O 2.62 ; B : O 1.98 / I-LOC 1.51<br>« des » A : I-LOC 3.92 / O 2.18 ; B : O 1.84 / I-LOC 1.25<br>« 64000 » A : I-LOC 3.46 / O 3.24 ; B : O 2.31 / I-LOC 1.16 |
| dev-avocat-04 | B | LIEU | « Arts » | « Arts, » A : I-LOC 5.33 / O -0.33 ; B : I-LOC 1.87 / O 0.95 |
| dev-avocat-04 | B | LIEU | « Pau » | « Pau, » A : I-LOC 6.00 / O -0.44 ; B : I-LOC 2.08 / O 1.54 |
| dev-avocat-04 | A | ORGANISATION | « SELARL Cabinet Chevalier & Associés » | « SELARL » A : I-ORG 2.49 / O 1.86 ; B : O 1.49 / I-LOC -0.21 |
| dev-avocat-04 | B | ORGANISATION | « Cabinet Chevalier & Associés » | « Cabinet » A : I-ORG 5.17 / I-PER 1.51 ; B : I-ORG 1.62 / I-PER 1.46<br>« Chevalier » A : I-ORG 5.12 / I-PER 2.12 ; B : I-ORG 2.62 / I-PER 2.42<br>« & » A : I-ORG 5.32 / I-PER 0.67 ; B : I-ORG 2.34 / I-PER 0.40<br>« Associés, » A : I-ORG 5.41 / I-PER 0.80 ; B : I-ORG 2.69 / I-PER 0.72 |
| dev-avocat-04 | B | LIEU | « Résidence Les Iris » | « Résidence » A : I-LOC 5.39 / O 0.00 ; B : I-LOC 1.65 / O 1.45<br>« Les » A : I-LOC 5.63 / O -0.69 ; B : I-LOC 2.92 / O 0.23<br>« Iris, » A : I-LOC 5.92 / I-MISC -0.95 ; B : I-LOC 2.77 / I-PER -0.33 |
| dev-avocat-04 | A | LIEU | « Résidence Les Iris, bâtiment B » | « bâtiment » A : I-LOC 4.07 / O 1.90 ; B : O 1.88 / I-LOC 0.81 |
| dev-avocat-04 | B | LIEU | « B » | « B, » A : I-LOC 5.01 / O 0.37 ; B : I-LOC 1.18 / O 1.13 |
| dev-avocat-04 | A | LIEU | « rue de la Gare, 83000 Toulon » | « rue » A : I-LOC 3.08 / O 3.04 ; B : O 2.08 / I-LOC 1.12<br>« de » A : I-LOC 2.97 / O 2.78 ; B : O 1.86 / I-LOC 0.53<br>« la » A : I-LOC 3.19 / O 2.49 ; B : O 1.62 / I-LOC 0.76<br>« 83000 » A : I-LOC 3.60 / O 2.94 ; B : O 2.06 / I-LOC 0.96 |
| dev-avocat-04 | B | LIEU | « Gare » | « Gare, » A : I-LOC 5.03 / O -0.42 ; B : I-LOC 1.39 / O 0.69 |
| dev-avocat-04 | B | LIEU | « Toulon » | « Toulon, » A : I-LOC 6.33 / I-ORG -1.00 ; B : I-LOC 3.67 / O -0.14 |
| dev-avocat-04 | A | PERSONNE | « Client » | « Client » A : I-PER 1.69 / O 0.59 ; B : O 1.35 / I-PER 0.04 |
| dev-avocat-04 | A | PERSONNE | « Client » | « Client » A : I-PER 1.90 / I-MISC 0.41 ; B : O 1.12 / I-PER 0.25 |
| dev-avocat-04 | A | PERSONNE | « Client                                   L'Avocat Pierre Barbier                          Maître I. CHEVALIER » | « Client » A : I-PER 1.62 / I-MISC 0.76 ; B : O 1.00 / I-PER 0.19<br>« Maître » A : I-PER 2.62 / O 2.18 ; B : O 1.54 / I-PER 0.50 |
| dev-avocat-04 | B | PERSONNE | « Avocat Pierre Barbier » | « L'Avocat » A : I-PER 3.23 / I-MISC 0.02 ; B : I-PER 0.93 / O 0.22<br>« Pierre » A : I-PER 6.61 / I-MISC 0.96 ; B : I-PER 3.28 / O -0.29<br>« Barbier » A : I-PER 6.86 / I-MISC 0.63 ; B : I-PER 3.35 / O -0.30 |
| dev-avocat-04 | B | PERSONNE | « I. CHEVALIER » | « I. » A : I-PER 6.15 / I-LOC -0.42 ; B : I-PER 1.64 / O 0.37<br>« CHEVALIER » A : I-PER 6.76 / I-LOC -0.28 ; B : I-PER 2.87 / O -0.08 |
| dev-avocat-05 | A | PERSONNE | « Madame MARGAUX FLORENCE » | « Madame » A : I-PER 2.55 / O 2.38 ; B : O 1.42 / I-PER 0.36 |
| dev-avocat-05 | B | PERSONNE | « MARGAUX FLORENCE » | « MARGAUX » A : I-PER 6.55 / I-MISC -0.05 ; B : I-PER 2.22 / O 0.34<br>« FLORENCE, » A : I-PER 6.52 / I-MISC 0.01 ; B : I-PER 2.52 / O 0.38 |
| dev-avocat-05 | A | LIEU | « allée des Roses, 44000 Nantes » | « allée » A : I-LOC 4.06 / O 2.36 ; B : O 2.01 / I-LOC 1.91<br>« 44000 » A : I-LOC 3.43 / O 3.35 ; B : O 2.43 / I-LOC 0.92 |
| dev-avocat-05 | B | LIEU | « des Roses » | « des » A : I-LOC 4.44 / O 1.88 ; B : I-LOC 1.91 / O 1.86<br>« Roses, » A : I-LOC 5.87 / O -0.79 ; B : I-LOC 2.63 / O 0.42 |
| dev-avocat-05 | B | LIEU | « Nantes » | « Nantes, » A : I-LOC 6.25 / O -1.04 ; B : I-LOC 3.22 / O 0.68 |
| dev-avocat-05 | A | ORGANISATION | « SCP Cabinet Ferrand & Associés » | « SCP » A : I-ORG 3.91 / O 1.02 ; B : O 1.17 / I-LOC 0.13<br>« Cabinet » A : I-ORG 4.39 / I-PER 2.59 ; B : I-PER 0.71 / O 0.31<br>« Ferrand » A : I-ORG 4.62 / I-PER 2.87 ; B : I-PER 2.26 / I-ORG 1.95 |
| dev-avocat-05 | B | PERSONNE | « Cabinet Ferrand » | « Cabinet » A : I-ORG 4.39 / I-PER 2.59 ; B : I-PER 0.71 / O 0.31<br>« Ferrand » A : I-ORG 4.62 / I-PER 2.87 ; B : I-PER 2.26 / I-ORG 1.95 |
| dev-avocat-05 | B | ORGANISATION | « Associés » | « Associés, » A : I-ORG 4.95 / I-PER 0.95 ; B : I-ORG 1.61 / I-PER 0.82 |
| dev-avocat-05 | B | LIEU | « Résidence Les Iris » | « Résidence » A : I-LOC 5.58 / O -0.07 ; B : I-LOC 1.56 / O 1.21<br>« Les » A : I-LOC 5.80 / O -0.72 ; B : I-LOC 2.67 / O 0.27<br>« Iris, » A : I-LOC 5.99 / I-MISC -1.20 ; B : I-LOC 2.50 / O -0.13 |
| dev-avocat-05 | A | LIEU | « Résidence Les Iris, bâtiment B, 68 allée des Glycines, 17000 La Rochelle » | « bâtiment » A : I-LOC 4.10 / O 2.10 ; B : O 1.75 / I-LOC 1.37<br>« B, » A : I-LOC 4.44 / O 1.48 ; B : O 1.43 / I-LOC 0.88<br>« 68 » A : I-LOC 3.46 / O 3.22 ; B : O 2.52 / I-LOC 0.92<br>« allée » A : I-LOC 4.22 / O 2.30 ; B : O 2.17 / I-LOC 2.07<br>« 17000 » A : I-LOC 3.52 / O 3.15 ; B : O 2.43 / I-LOC 1.09 |
| dev-avocat-05 | B | LIEU | « des Glycines » | « des » A : I-LOC 4.41 / O 1.99 ; B : I-LOC 2.08 / O 1.83<br>« Glycines, » A : I-LOC 5.93 / O -0.64 ; B : I-LOC 3.32 / O 0.26 |
| dev-avocat-05 | B | LIEU | « La Rochelle » | « La » A : I-LOC 6.33 / O -1.26 ; B : I-LOC 3.54 / O 0.04<br>« Rochelle, » A : I-LOC 6.45 / I-MISC -1.14 ; B : I-LOC 4.26 / O -0.43 |
| dev-avocat-05 | A | PERSONNE | « Client » | « Client » A : I-PER 1.48 / O 0.44 ; B : O 1.05 / I-PER 0.25 |
| dev-avocat-05 | A | PERSONNE | « Client » | « Client » A : I-PER 1.50 / O 0.42 ; B : O 0.96 / I-PER 0.13 |
| dev-avocat-05 | A | PERSONNE | « Client                                   L'Avocat Margaux Florence » | « Client » A : I-PER 1.57 / I-MISC 0.50 ; B : O 0.92 / I-PER 0.04<br>« Florence » A : I-PER 5.82 / I-ORG 0.32 ; B : O 0.91 / I-PER 0.41 |
| dev-avocat-05 | B | PERSONNE | « Avocat Margaux » | « L'Avocat » A : I-PER 3.47 / I-MISC 0.21 ; B : I-PER 0.83 / O 0.01<br>« Margaux » A : I-PER 5.94 / I-ORG 0.47 ; B : I-PER 1.35 / O 0.30 |
| dev-ec-01 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 3.44 / O 1.20 ; B : O 0.79 / I-LOC -0.22 |
| dev-ec-01 | A | LIEU | « chemin des Vignes 51100 Reims » | « chemin » A : I-LOC 4.09 / O 2.14 ; B : O 2.09 / I-LOC 1.96<br>« 51100 » A : I-LOC 3.28 / O 3.05 ; B : O 2.01 / I-LOC 1.48 |
| dev-ec-01 | B | LIEU | « des Vignes » | « des » A : I-LOC 4.42 / O 1.69 ; B : I-LOC 2.26 / O 1.62<br>« Vignes » A : I-LOC 5.58 / O -0.63 ; B : I-LOC 3.38 / O 0.32 |
| dev-ec-01 | B | LIEU | « Reims » | « Reims » A : I-LOC 6.11 / O -1.14 ; B : I-LOC 2.95 / O 0.74 |
| dev-ec-01 | B | ORGANISATION | « DA SILVA CONSEIL » | « DA » A : I-ORG 4.89 / I-PER 1.24 ; B : I-ORG 0.90 / I-PER 0.47<br>« SILVA » A : I-ORG 5.41 / I-MISC 0.18 ; B : I-ORG 2.45 / I-LOC 0.39<br>« CONSEIL » A : I-ORG 4.80 / I-MISC -0.21 ; B : I-ORG 1.35 / I-LOC 0.59 |
| dev-ec-01 | A | ORGANISATION | « DA SILVA CONSEIL SA » | « SA, » A : I-ORG 3.55 / O 0.35 ; B : O 1.00 / I-LOC 0.22 |
| dev-ec-01 | B | LIEU | « place du Marché » | « place » A : I-LOC 4.14 / O 1.71 ; B : I-LOC 1.66 / O 1.32<br>« du » A : I-LOC 4.33 / O 1.41 ; B : I-LOC 1.56 / O 1.21<br>« Marché, » A : I-LOC 4.87 / O 0.13 ; B : I-LOC 2.23 / O 0.09 |
| dev-ec-01 | A | LIEU | « place du Marché, 59000 Lille » | « 59000 » A : I-LOC 3.86 / O 2.44 ; B : O 2.01 / I-LOC 1.29 |
| dev-ec-01 | B | LIEU | « Lille » | « Lille, » A : I-LOC 6.24 / I-MISC -1.28 ; B : I-LOC 2.47 / O 0.95 |
| dev-ec-01 | A | ORGANISATION | « Expert-comptable » | « Expert-comptable » A : I-ORG 2.48 / O 1.56 ; B : O 1.36 / I-ORG 0.64 |
| dev-ec-02 | A | ORGANISATION | « Ordre » | « l'Ordre » A : I-ORG 2.71 / O 1.06 ; B : O 0.61 / I-ORG -0.05 |
| dev-ec-02 | A | LIEU | « Résidence Les Iris, bâtiment B » | « Résidence » A : I-LOC 4.16 / O 0.12 ; B : O 1.14 / I-LOC 0.87<br>« bâtiment » A : I-LOC 3.54 / O 2.14 ; B : O 1.87 / I-LOC 0.79<br>« B » A : I-LOC 3.92 / O 1.64 ; B : O 1.42 / I-LOC 0.73 |
| dev-ec-02 | B | LIEU | « Les Iris » | « Les » A : I-LOC 4.59 / O -0.92 ; B : I-LOC 1.47 / O 0.54<br>« Iris, » A : I-LOC 4.73 / I-ORG -0.23 ; B : I-LOC 1.42 / O -0.15 |
| dev-ec-02 | A | LIEU | « rue des Écoles 56000 Vannes » | « rue » A : I-LOC 3.88 / O 2.03 ; B : O 1.71 / I-LOC 1.65<br>« 56000 » A : I-LOC 3.48 / O 2.87 ; B : O 1.94 / I-LOC 0.99 |
| dev-ec-02 | B | LIEU | « des Écoles » | « des » A : I-LOC 4.05 / O 1.79 ; B : I-LOC 1.63 / O 1.61<br>« Écoles » A : I-LOC 4.98 / O -0.25 ; B : I-LOC 1.77 / O 0.59 |
| dev-ec-02 | B | LIEU | « Vannes » | « Vannes » A : I-LOC 6.07 / I-MISC -0.90 ; B : I-LOC 2.94 / O 0.44 |
| dev-ec-02 | B | LIEU | « BISCUITERIE » | « BISCUITERIE » A : I-ORG 3.83 / I-MISC 1.49 ; B : I-LOC 1.29 / I-ORG 0.86 |
| dev-ec-02 | A | ORGANISATION | « BISCUITERIE DE L'ÉTANG » | « BISCUITERIE » A : I-ORG 3.83 / I-MISC 1.49 ; B : I-LOC 1.29 / I-ORG 0.86 |
| dev-ec-02 | B | ORGANISATION | « DE L'ÉTANG » | « DE » A : I-ORG 3.56 / I-MISC 1.18 ; B : I-ORG 1.05 / I-LOC 0.83<br>« L'ÉTANG » A : I-ORG 3.76 / I-MISC 1.34 ; B : I-ORG 1.45 / I-LOC 1.07 |
| dev-ec-02 | B | LIEU | « chemin des Vignes » | « chemin » A : I-LOC 3.74 / O 2.45 ; B : I-LOC 2.06 / O 1.63<br>« des » A : I-LOC 4.01 / O 2.04 ; B : I-LOC 1.81 / O 1.50<br>« Vignes, » A : I-LOC 5.48 / O -0.68 ; B : I-LOC 3.15 / O -0.03 |
| dev-ec-02 | A | LIEU | « chemin des Vignes, 79000 Niort » | « 79000 » A : I-LOC 3.29 / O 3.25 ; B : O 2.33 / I-LOC 0.98 |
| dev-ec-02 | B | LIEU | « Niort » | « Niort, » A : I-LOC 6.20 / I-MISC -1.03 ; B : I-LOC 2.83 / O 0.86 |
| dev-ec-03 | A | ORGANISATION | « tableau de l'Ordre » | « tableau » A : I-ORG 3.13 / O 2.03 ; B : O 1.30 / I-ORG -0.02 |
| dev-ec-03 | B | ORGANISATION | « de l'Ordre » | « de » A : I-ORG 3.29 / O 1.92 ; B : I-ORG 0.79 / O 0.66<br>« l'Ordre » A : I-ORG 3.81 / O 0.49 ; B : I-ORG 0.79 / O 0.67 |
| dev-ec-03 | A | LIEU | « route de la Forêt 35000 Rennes » | « route » A : I-LOC 3.86 / O 2.56 ; B : O 2.22 / I-LOC 1.84<br>« de » A : I-LOC 4.01 / O 2.30 ; B : O 2.16 / I-LOC 1.77<br>« 35000 » A : I-LOC 3.63 / O 2.89 ; B : O 2.40 / I-LOC 1.20 |
| dev-ec-03 | B | LIEU | « la Forêt » | « la » A : I-LOC 4.22 / O 1.97 ; B : I-LOC 2.22 / O 1.90<br>« Forêt » A : I-LOC 5.31 / O -0.09 ; B : I-LOC 2.90 / O 0.51 |
| dev-ec-03 | B | LIEU | « Rennes » | « Rennes » A : I-LOC 6.10 / O -1.02 ; B : I-LOC 3.53 / O 0.06 |
| dev-ec-03 | B | ORGANISATION | « FLORENCE BÂTIMENT » | « FLORENCE » A : I-ORG 5.21 / I-MISC 0.83 ; B : I-ORG 2.37 / I-MISC 0.46<br>« BÂTIMENT » A : I-ORG 5.01 / I-MISC 0.16 ; B : I-ORG 2.33 / I-LOC -0.03 |
| dev-ec-03 | A | ORGANISATION | « FLORENCE BÂTIMENT SARL » | « SARL, » A : I-ORG 3.87 / O 0.41 ; B : O 0.79 / I-LOC 0.18 |
| dev-ec-03 | A | LIEU | « rue du Four, 44000 Nantes » | « rue » A : I-LOC 3.48 / O 2.58 ; B : O 1.59 / I-LOC 1.24<br>« du » A : I-LOC 3.81 / O 1.96 ; B : O 1.40 / I-LOC 1.07<br>« 44000 » A : I-LOC 3.45 / O 3.04 ; B : O 2.30 / I-LOC 1.15 |
| dev-ec-03 | B | LIEU | « Four » | « Four, » A : I-LOC 4.95 / O -0.62 ; B : I-LOC 1.53 / O 0.39 |
| dev-ec-03 | B | LIEU | « Nantes » | « Nantes, » A : I-LOC 6.06 / O -0.82 ; B : I-LOC 2.81 / O 1.05 |
| dev-ec-03 | A | ORGANISATION | « Expert-comptable » | « Expert-comptable » A : I-ORG 2.37 / O 1.61 ; B : O 1.62 / I-LOC -0.44 |
| dev-ec-04 | A | PERSONNE | « Madame Ferrand » | « Madame » A : I-PER 3.27 / O 1.34 ; B : O 1.08 / I-PER 0.82 |
| dev-ec-04 | B | PERSONNE | « Ferrand » | « Ferrand, » A : I-PER 6.85 / I-LOC -0.05 ; B : I-PER 3.85 / I-LOC -0.15 |
| dev-ec-04 | A | ORGANISATION | « SARL Chevalier Conseil » | « SARL » A : I-ORG 3.21 / O 1.62 ; B : O 1.30 / I-ORG -0.37 |
| dev-ec-04 | B | ORGANISATION | « Chevalier Conseil » | « Chevalier » A : I-ORG 4.98 / I-PER 1.74 ; B : I-ORG 3.29 / I-PER 1.19<br>« Conseil » A : I-ORG 5.17 / I-MISC 0.74 ; B : I-ORG 3.22 / I-MISC 0.74 |
| dev-ec-04 | A | ORGANISATION | « SARL Gauthier Expertise Comptable » | « SARL » A : I-ORG 4.17 / O -0.05 ; B : O 0.76 / I-LOC 0.43 |
| dev-ec-04 | B | ORGANISATION | « Gauthier Expertise Comptable » | « Gauthier » A : I-ORG 5.28 / I-LOC 0.53 ; B : I-ORG 2.54 / I-PER 0.75<br>« Expertise » A : I-ORG 5.53 / I-LOC 0.59 ; B : I-ORG 3.58 / I-LOC 0.74<br>« Comptable » A : I-ORG 5.57 / I-LOC 0.64 ; B : I-ORG 3.66 / I-LOC 0.84 |
| dev-ec-04 | A | LIEU | « B » | « B, » A : I-LOC 2.73 / O 2.35 ; B : O 1.30 / I-LOC 0.48 |
| dev-ec-04 | A | LIEU | « de la Fontaine, 59000 Lille » | « de » A : I-LOC 2.81 / O 2.32 ; B : O 1.49 / I-LOC 0.90<br>« la » A : I-LOC 3.44 / O 1.72 ; B : O 1.22 / I-LOC 1.14<br>« 59000 » A : I-LOC 3.30 / O 3.06 ; B : O 2.18 / I-LOC 0.97 |
| dev-ec-04 | B | LIEU | « Fontaine » | « Fontaine, » A : I-LOC 4.31 / I-PER -0.38 ; B : I-LOC 1.24 / O 0.74 |
| dev-ec-04 | B | LIEU | « Lille » | « Lille » A : I-LOC 5.99 / I-ORG -0.96 ; B : I-LOC 2.35 / O 0.75 |
| dev-ec-05 | A | LIEU | « Lyon » | « Lyon, » A : I-LOC 5.48 / I-MISC 0.18 ; B : O 1.51 / I-LOC 1.08 |
| dev-ec-05 | A | PERSONNE | « Yann FLORENCE » | « Yann » A : I-PER 6.31 / I-MISC 0.80 ; B : I-PER 3.57 / I-LOC -0.34<br>« FLORENCE » A : I-PER 6.48 / I-MISC 0.88 ; B : I-PER 3.43 / I-LOC -0.27 |
| dev-ec-05 | B | PERSONNE | « Yann FLORENCE Florence » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 1.64 / I-ORG 0.72 |
| dev-ec-05 | A | ORGANISATION | « Florence Expertise Comptable » | « Florence » A : I-ORG 4.60 / I-PER 2.44 ; B : I-PER 1.64 / I-ORG 0.72 |
| dev-ec-05 | B | ORGANISATION | « Expertise Comptable » | « Expertise » A : I-ORG 5.24 / I-PER 0.07 ; B : I-ORG 1.61 / I-LOC 0.47<br>« Comptable » A : I-ORG 5.30 / I-PER -0.46 ; B : I-ORG 2.30 / I-LOC 0.51 |
| dev-ec-05 | A | LIEU | « des Vignes » | « des » A : I-LOC 3.45 / O 2.33 ; B : O 1.78 / I-LOC 1.21 |
| dev-ec-05 | B | LIEU | « Vignes » | « Vignes, » A : I-LOC 5.17 / O -0.95 ; B : I-LOC 2.44 / O 0.43 |
| dev-neutre-02 | A | DIVERS | « de Pentecôte » | « de » A : I-MISC 2.95 / O 2.94 ; B : O 1.74 / I-LOC -0.64<br>« Pentecôte » A : I-MISC 4.63 / O 0.36 ; B : O 0.97 / I-MISC 0.50 |
| dev-neutre-02 | A | DIVERS | « Ressources » | « Ressources » A : I-MISC 1.12 / O 0.82 ; B : O 1.78 / I-LOC -0.38 |
| dev-neutre-02 | A | DIVERS | « Rose des vents » | « Rose » A : I-MISC 3.47 / I-ORG 0.11 ; B : O 1.03 / I-LOC -0.23<br>« des » A : I-MISC 3.21 / O 0.05 ; B : O 1.25 / I-LOC -0.13<br>« vents » A : I-MISC 2.94 / O 0.45 ; B : O 1.45 / I-LOC -0.21 |
| dev-rh-01 | A | LIEU | « rue de la Gare 56000 Vannes » | « rue » A : I-LOC 3.36 / O 2.69 ; B : O 2.01 / I-LOC 1.51<br>« de » A : I-LOC 3.59 / O 2.21 ; B : O 1.98 / I-LOC 1.46<br>« la » A : I-LOC 3.79 / O 1.90 ; B : O 1.71 / I-LOC 1.63<br>« 56000 » A : I-LOC 3.58 / O 3.02 ; B : O 2.53 / I-LOC 1.37 |
| dev-rh-01 | B | LIEU | « Gare » | « Gare » A : I-LOC 4.79 / O -0.01 ; B : I-LOC 2.08 / O 0.69 |
| dev-rh-01 | B | LIEU | « Vannes » | « Vannes » A : I-LOC 6.15 / O -1.13 ; B : I-LOC 3.68 / O 0.17 |
| dev-rh-01 | A | LIEU | « rue des Tilleuls » | « rue » A : I-LOC 3.21 / O 2.43 ; B : O 1.73 / I-LOC 1.52 |
| dev-rh-01 | B | LIEU | « des Tilleuls » | « des » A : I-LOC 3.70 / O 1.63 ; B : I-LOC 1.49 / O 1.46<br>« Tilleuls » A : I-LOC 5.26 / I-PER -0.27 ; B : I-LOC 2.53 / I-PER 0.28 |
| dev-rh-01 | A | PERSONNE | « nathalie.vidal@studio-ardoise.org » | « nathalie.vidal@studio-ardoise.org. » A : I-PER 3.22 / O 1.49 ; B : O 1.58 / I-PER -0.29 |
| dev-rh-02 | A | ORGANISATION | « ÉTABLISSEMENTS PARIS SA » | « ÉTABLISSEMENTS » A : I-ORG 3.17 / O 1.25 ; B : O 1.43 / I-LOC 0.25<br>« PARIS » A : I-ORG 4.26 / I-LOC 1.41 ; B : I-LOC 1.01 / I-ORG 0.86<br>« SA » A : I-ORG 2.55 / O 1.27 ; B : O 1.12 / I-LOC 0.35 |
| dev-rh-02 | B | LIEU | « PARIS » | « PARIS » A : I-ORG 4.26 / I-LOC 1.41 ; B : I-LOC 1.01 / I-ORG 0.86 |
| dev-rh-02 | B | LIEU | « rue du Four » | « rue » A : I-LOC 3.75 / O 2.24 ; B : I-LOC 2.13 / O 1.70<br>« du » A : I-LOC 4.34 / O 1.47 ; B : I-LOC 2.07 / O 1.21<br>« Four » A : I-LOC 5.23 / O -0.50 ; B : I-LOC 2.47 / O 0.08 |
| dev-rh-02 | A | LIEU | « rue du Four 86000 Poitiers » | « 86000 » A : I-LOC 3.40 / O 3.08 ; B : O 2.37 / I-LOC 1.13 |
| dev-rh-02 | B | LIEU | « Poitiers » | « Poitiers » A : I-LOC 6.12 / O -0.88 ; B : I-LOC 3.14 / O 0.19 |
| dev-rh-02 | B | LIEU | « rue du Four » | « rue » A : I-LOC 3.44 / O 2.34 ; B : I-LOC 1.80 / O 1.72<br>« du » A : I-LOC 4.04 / O 1.40 ; B : I-LOC 1.90 / O 0.99<br>« Four » A : I-LOC 4.89 / I-PER -0.39 ; B : I-LOC 2.09 / I-PER 0.35 |
| dev-rh-02 | A | LIEU | « rue du Four 64000 PAU  Poitiers » | « 64000 » A : I-LOC 3.49 / O 3.04 ; B : O 1.85 / I-LOC 1.62 |
| dev-rh-02 | B | LIEU | « PAU  Poitiers » | « PAU » A : I-LOC 6.19 / O -0.98 ; B : I-LOC 3.42 / O 0.24<br>« Poitiers, » A : I-LOC 6.32 / O -1.51 ; B : I-LOC 2.94 / O 0.44 |
| dev-rh-03 | A | LIEU | « de la Fontaine » | « de » A : I-LOC 2.57 / O 2.16 ; B : O 1.58 / I-LOC 0.77<br>« la » A : I-LOC 2.95 / O 1.50 ; B : O 1.24 / I-LOC 0.91 |
| dev-rh-03 | B | LIEU | « Fontaine » | « Fontaine » A : I-LOC 3.84 / I-PER 1.64 ; B : I-LOC 1.13 / I-PER 0.76 |
| dev-rh-04 | A | ORGANISATION | « GARAGE ROCHE » | « GARAGE » A : I-ORG 3.68 / I-PER 1.41 ; B : O 0.25 / I-ORG 0.05 |
| dev-rh-04 | B | ORGANISATION | « ROCHE » | « ROCHE » A : I-ORG 3.68 / I-PER 1.61 ; B : I-ORG 0.43 / I-PER 0.20 |
| dev-rh-04 | A | LIEU | « cours des Arts » | « cours » A : I-LOC 3.08 / O 2.51 ; B : O 1.98 / I-LOC 1.54<br>« des » A : I-LOC 3.64 / O 1.85 ; B : O 1.92 / I-LOC 1.49 |
| dev-rh-04 | B | LIEU | « Arts » | « Arts » A : I-LOC 4.48 / O -0.01 ; B : I-LOC 1.65 / O 0.75 |
| dev-rh-04 | B | PERSONNE | « PERROT » | « PERROT » A : I-PER 5.98 / I-MISC 0.10 ; B : I-PER 2.28 / O 0.35 |
| dev-rh-04 | A | PERSONNE | « PERROT Pierre » | « Pierre » A : I-PER 4.34 / I-MISC 0.40 ; B : O 1.20 / I-PER 0.82 |
| dev-rh-04 | A | LIEU | « des Peupliers » | « des » A : I-LOC 3.56 / O 2.31 ; B : O 1.47 / I-LOC 1.28 |
| dev-rh-04 | B | LIEU | « Peupliers » | « Peupliers » A : I-LOC 5.75 / I-PER -0.61 ; B : I-LOC 2.85 / I-PER 0.91 |
| dev-rh-05 | B | LIEU | « ATELIER DES TROIS CHÊNES » | « ATELIER » A : I-ORG 5.19 / I-LOC 0.61 ; B : I-LOC 0.88 / I-ORG 0.36<br>« DES » A : I-ORG 4.95 / I-LOC 0.47 ; B : I-LOC 0.87 / O 0.13<br>« TROIS » A : I-ORG 5.19 / I-LOC 0.84 ; B : I-LOC 1.22 / I-ORG 0.35<br>« CHÊNES » A : I-ORG 5.12 / I-LOC 1.03 ; B : I-LOC 1.01 / I-ORG 0.11 |
| dev-rh-05 | A | ORGANISATION | « ATELIER DES TROIS CHÊNES SA » | « ATELIER » A : I-ORG 5.19 / I-LOC 0.61 ; B : I-LOC 0.88 / I-ORG 0.36<br>« DES » A : I-ORG 4.95 / I-LOC 0.47 ; B : I-LOC 0.87 / O 0.13<br>« TROIS » A : I-ORG 5.19 / I-LOC 0.84 ; B : I-LOC 1.22 / I-ORG 0.35<br>« CHÊNES » A : I-ORG 5.12 / I-LOC 1.03 ; B : I-LOC 1.01 / I-ORG 0.11<br>« SA » A : I-ORG 2.01 / O 1.61 ; B : O 1.79 / I-LOC 0.24 |
| dev-rh-05 | A | LIEU | « du Marché » | « du » A : I-LOC 2.92 / O 1.87 ; B : O 1.52 / I-LOC 1.11 |
| dev-rh-05 | B | LIEU | « Marché » | « Marché » A : I-LOC 3.72 / I-MISC -0.09 ; B : I-LOC 1.83 / O 0.38 |
| dev-rh-05 | B | PERSONNE | « FLORENCE » | « FLORENCE » A : I-PER 6.01 / I-MISC 0.64 ; B : I-PER 1.49 / O 1.05 |
| dev-rh-05 | A | PERSONNE | « FLORENCE Julien » | « Julien » A : I-PER 4.90 / I-MISC 0.95 ; B : O 1.21 / I-PER 1.02 |
| dev-rh-05 | A | LIEU | « de la Pierre Levée 33000 BORDEAUX » | « de » A : I-LOC 2.97 / O 2.05 ; B : O 1.40 / I-LOC 0.95<br>« 33000 » A : I-LOC 3.44 / O 3.29 ; B : O 2.75 / I-LOC 1.24 |
| dev-rh-05 | B | LIEU | « la Pierre Levée » | « la » A : I-LOC 3.21 / O 1.51 ; B : I-LOC 1.15 / O 0.86<br>« Pierre » A : I-LOC 4.76 / I-PER 1.62 ; B : I-LOC 2.19 / I-PER 1.16<br>« Levée » A : I-LOC 4.99 / I-PER 1.83 ; B : I-LOC 2.85 / I-PER 1.78 |
| dev-rh-05 | B | LIEU | « BORDEAUX » | « BORDEAUX » A : I-LOC 6.47 / I-ORG -1.37 ; B : I-LOC 3.84 / O -0.06 |

## S1 — réseau

44 visites (mesure et diagnostic). Requêtes vues par Playwright (page et Workers), journal du serveur, garde sur env.fetch, CSP.

| Hôte | Requêtes | Octets reçus |
|---|---|---|
| 127.0.0.1 | 2432 | 3 321 902 286 |
| blob: (local, sans réseau) | 110 | 0 |

- Requêtes autres que GET : 0
- Requêtes avec un corps : 0
- Chemins refusés par la liste blanche du serveur : aucun
- Tentatives bloquées (env.fetch de la bibliothèque) : aucune
- Violations CSP (événements page et Worker) : aucune
- Messages CSP dans la console : aucun
- Autres erreurs ou avertissements de console : aucun

Non couvert : requêtes propres au navigateur hors page (mises à jour, services Google de Chrome), invisibles pour Playwright ; elles ne portent pas le texte du document.


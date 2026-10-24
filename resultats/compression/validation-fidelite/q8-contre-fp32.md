# Fidélité : camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model_quantized.onnx contre l'étalon camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model.onnx

- Date : 2026-10-24T08:38:04.517Z
- Commit : `1215951ca1788af7f58481133c7124744dd8dcbc` + modifications non commitées (arbre propre : non) ; script `scripts/navigateur/fidelite.mjs` SHA-256 `70b7bb0648f2291be8100fae0086466a823c0e94e3478560da0415d047e5a263`
- Moteur : onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (WASM, ort.node.min.mjs dans Node), 1 thread, Node 24.15.0
- Détecteur : modele 0.2.0 (src/modele-commun.mjs), tokenizer et configuration camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc
- Jeu : développement, 17 documents
- Définition : seuils.md, amendement (5), point Fidélité : masque = (début, fin, catégorie) de detecter(), avant fusion ; par document, répétitions comptées ; masque différent = présent d’un seul côté ; somme sur les 17 documents

| Rôle | Fichier | Octets | SHA-256 |
|---|---|---|---|
| étalon | `modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model.onnx` | 440422177 | `0a2c64c0f051642a3002e5cef91861a26eaa44cceedceac4ce8eabee3fac4f75` |
| comparé | `modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model_quantized.onnx` | 111284131 | `43507a27e7e5500b5e197c8c7de803bc94bcc29ce156fcbb19bda18ed322960d` |

## Résultat

**Fidélité : 139 masques différents** (70 seulement dans l'étalon, 69 seulement dans le comparé), **16 documents touchés** sur 17.

| Document | Masques étalon | Masques comparé | Seulement étalon | Seulement comparé | Différents |
|---|---|---|---|---|---|
| dev-avocat-01 | 12 | 13 | 6 | 7 | 13 |
| dev-avocat-02 | 14 | 15 | 4 | 5 | 9 |
| dev-avocat-03 | 19 | 17 | 8 | 6 | 14 |
| dev-avocat-04 | 20 | 20 | 8 | 8 | 16 |
| dev-avocat-05 | 22 | 21 | 8 | 7 | 15 |
| dev-ec-01 | 10 | 10 | 4 | 4 | 8 |
| dev-ec-02 | 9 | 11 | 3 | 5 | 8 |
| dev-ec-03 | 8 | 10 | 4 | 6 | 10 |
| dev-ec-04 | 14 | 13 | 5 | 4 | 9 |
| dev-ec-05 | 12 | 11 | 2 | 1 | 3 |
| dev-neutre-01 | 2 | 2 | 0 | 0 | 0 |
| dev-neutre-02 | 3 | 0 | 3 | 0 | 3 |
| dev-rh-01 | 9 | 9 | 3 | 3 | 6 |
| dev-rh-02 | 8 | 9 | 2 | 3 | 5 |
| dev-rh-03 | 6 | 6 | 2 | 2 | 4 |
| dev-rh-04 | 6 | 6 | 4 | 4 | 8 |
| dev-rh-05 | 6 | 6 | 4 | 4 | 8 |
| **Total** | 180 | 179 | 70 | 69 | 139 |

## Détail par document

### dev-avocat-01 (13)

- étalon seul : 0–32 ORGANISATION « CABINET MEUNIER & ASSOCIÉS SELAS »
- étalon seul : 71–97 LIEU « rue du Four 31000 Toulouse »
- étalon seul : 158–172 ORGANISATION « Établissements »
- étalon seul : 181–183 ORGANISATION « SA »
- étalon seul : 237–284 LIEU « allée des Roses 13100 AIX-EN-PROVENCE Toulouse »
- étalon seul : 489–518 LIEU « rue de la Fontaine, 64000 Pau »
- comparé seul : 8–32 ORGANISATION « MEUNIER & ASSOCIÉS SELAS »
- comparé seul : 75–82 LIEU « du Four »
- comparé seul : 89–97 LIEU « Toulouse »
- comparé seul : 237–252 LIEU « allée des Roses »
- comparé seul : 259–284 LIEU « AIX-EN-PROVENCE Toulouse »
- comparé seul : 493–507 LIEU « de la Fontaine »
- comparé seul : 515–518 LIEU « Pau »

### dev-avocat-02 (9)

- étalon seul : 66–98 LIEU « rue de la Fontaine 84000 Avignon »
- étalon seul : 162–183 ORGANISATION « Menuiserie Royer SARL »
- étalon seul : 230–241 LIEU « rue du Four »
- étalon seul : 495–509 LIEU « rue du Château »
- comparé seul : 66–84 LIEU « rue de la Fontaine »
- comparé seul : 91–98 LIEU « Avignon »
- comparé seul : 162–178 ORGANISATION « Menuiserie Royer »
- comparé seul : 234–241 LIEU « du Four »
- comparé seul : 502–509 LIEU « Château »

### dev-avocat-03 (14)

- étalon seul : 0–10 DIVERS « CONVENTION »
- étalon seul : 125–134 LIEU « des Lilas »
- étalon seul : 254–260 PERSONNE « Client »
- étalon seul : 394–418 LIEU « de la Gare, 56000 Vannes »
- étalon seul : 545–551 PERSONNE « Client »
- étalon seul : 627–643 PERSONNE « M. Pierre BERTIN »
- étalon seul : 1321–1327 PERSONNE « Client »
- étalon seul : 1675–1781 PERSONNE « Client L'Avocat Rose Da Silva Maître C. MEUNIER »
- comparé seul : 129–134 LIEU « Lilas »
- comparé seul : 400–404 LIEU « Gare »
- comparé seul : 412–418 LIEU « Vannes »
- comparé seul : 630–643 PERSONNE « Pierre BERTIN »
- comparé seul : 1718–1738 PERSONNE « Avocat Rose Da Silva »
- comparé seul : 1771–1781 PERSONNE « C. MEUNIER »

### dev-avocat-04 (16)

- étalon seul : 0–10 DIVERS « CONVENTION »
- étalon seul : 136–150 LIEU « cours des Arts »
- étalon seul : 263–298 ORGANISATION « SELARL Cabinet Chevalier & Associés »
- étalon seul : 395–425 LIEU « Résidence Les Iris, bâtiment B »
- étalon seul : 437–458 LIEU « la Gare, 83000 Toulon »
- étalon seul : 584–590 PERSONNE « Client »
- étalon seul : 1389–1395 PERSONNE « Client »
- étalon seul : 1742–1851 PERSONNE « Client L'Avocat Pierre Barbier Maître I. CHEVALIER »
- comparé seul : 146–150 LIEU « Arts »
- comparé seul : 270–298 ORGANISATION « Cabinet Chevalier & Associés »
- comparé seul : 395–413 LIEU « Résidence Les Iris »
- comparé seul : 424–425 LIEU « B »
- comparé seul : 440–444 LIEU « Gare »
- comparé seul : 452–458 LIEU « Toulon »
- comparé seul : 1785–1806 PERSONNE « Avocat Pierre Barbier »
- comparé seul : 1839–1851 PERSONNE « I. CHEVALIER »

### dev-avocat-05 (15)

- étalon seul : 49–72 PERSONNE « Madame MARGAUX FLORENCE »
- étalon seul : 134–149 LIEU « allée des Roses »
- étalon seul : 284–314 ORGANISATION « SCP Cabinet Ferrand & Associés »
- étalon seul : 416–446 LIEU « Résidence Les Iris, bâtiment B »
- étalon seul : 451–469 LIEU « allée des Glycines »
- étalon seul : 614–620 PERSONNE « Client »
- étalon seul : 1433–1439 PERSONNE « Client »
- étalon seul : 1798–1864 PERSONNE « Client L'Avocat Margaux Florence »
- comparé seul : 56–72 PERSONNE « MARGAUX FLORENCE »
- comparé seul : 140–149 LIEU « des Roses »
- comparé seul : 288–303 PERSONNE « Cabinet Ferrand »
- comparé seul : 306–314 ORGANISATION « Associés »
- comparé seul : 416–434 LIEU « Résidence Les Iris »
- comparé seul : 457–469 LIEU « des Glycines »
- comparé seul : 1841–1855 PERSONNE « Avocat Margaux »

### dev-ec-01 (8)

- étalon seul : 99–116 LIEU « chemin des Vignes »
- étalon seul : 344–363 ORGANISATION « DA SILVA CONSEIL SA »
- étalon seul : 421–449 LIEU « place du Marché, 59000 Lille »
- étalon seul : 1314–1330 ORGANISATION « Expert-comptable »
- comparé seul : 106–116 LIEU « des Vignes »
- comparé seul : 344–360 ORGANISATION « DA SILVA CONSEIL »
- comparé seul : 421–436 LIEU « place du Marché »
- comparé seul : 444–449 LIEU « Lille »

### dev-ec-02 (8)

- étalon seul : 93–123 LIEU « Résidence Les Iris, bâtiment B »
- étalon seul : 127–154 LIEU « rue des Écoles 56000 Vannes »
- étalon seul : 363–385 ORGANISATION « BISCUITERIE DE L'ÉTANG »
- comparé seul : 103–111 LIEU « Les Iris »
- comparé seul : 131–141 LIEU « des Écoles »
- comparé seul : 148–154 LIEU « Vannes »
- comparé seul : 363–374 LIEU « BISCUITERIE »
- comparé seul : 375–385 ORGANISATION « DE L'ÉTANG »

### dev-ec-03 (10)

- étalon seul : 97–127 LIEU « route de la Forêt 35000 Rennes »
- étalon seul : 336–358 ORGANISATION « FLORENCE BÂTIMENT SARL »
- étalon seul : 394–419 LIEU « rue du Four, 44000 Nantes »
- étalon seul : 1283–1299 ORGANISATION « Expert-comptable »
- comparé seul : 82–92 ORGANISATION « de l'Ordre »
- comparé seul : 106–114 LIEU « la Forêt »
- comparé seul : 121–127 LIEU « Rennes »
- comparé seul : 336–353 ORGANISATION « FLORENCE BÂTIMENT »
- comparé seul : 401–405 LIEU « Four »
- comparé seul : 413–419 LIEU « Nantes »

### dev-ec-04 (9)

- étalon seul : 263–277 PERSONNE « Madame Ferrand »
- étalon seul : 318–340 ORGANISATION « SARL Chevalier Conseil »
- étalon seul : 1095–1128 ORGANISATION « SARL Gauthier Expertise Comptable »
- étalon seul : 1158–1159 LIEU « B »
- étalon seul : 1169–1183 LIEU « de la Fontaine »
- comparé seul : 270–277 PERSONNE « Ferrand »
- comparé seul : 323–340 ORGANISATION « Chevalier Conseil »
- comparé seul : 1100–1128 ORGANISATION « Gauthier Expertise Comptable »
- comparé seul : 1175–1183 LIEU « Fontaine »

### dev-ec-05 (3)

- étalon seul : 802–806 LIEU « Lyon »
- étalon seul : 1175–1185 LIEU « des Vignes »
- comparé seul : 1179–1185 LIEU « Vignes »

### dev-neutre-02 (3)

- étalon seul : 804–822 DIVERS « lundi de Pentecôte »
- étalon seul : 1030–1040 DIVERS « Ressources »
- étalon seul : 1062–1076 DIVERS « Rose des vents »

### dev-rh-01 (6)

- étalon seul : 21–48 LIEU « rue de la Gare 56000 Vannes »
- étalon seul : 98–114 LIEU « rue des Tilleuls »
- étalon seul : 754–787 PERSONNE « nathalie.vidal@studio-ardoise.org »
- comparé seul : 31–35 LIEU « Gare »
- comparé seul : 42–48 LIEU « Vannes »
- comparé seul : 102–114 LIEU « des Tilleuls »

### dev-rh-02 (5)

- étalon seul : 0–23 ORGANISATION « ÉTABLISSEMENTS PARIS SA »
- étalon seul : 111–142 LIEU « rue du Four 64000 PAU Poitiers »
- comparé seul : 15–20 LIEU « PARIS »
- comparé seul : 111–122 LIEU « rue du Four »
- comparé seul : 129–142 LIEU « PAU Poitiers »

### dev-rh-03 (4)

- étalon seul : 64–80 ORGANISATION « LA ROSE DES PRÉS »
- étalon seul : 220–234 LIEU « de la Fontaine »
- comparé seul : 64–80 LIEU « LA ROSE DES PRÉS »
- comparé seul : 226–234 LIEU « Fontaine »

### dev-rh-04 (8)

- étalon seul : 69–81 ORGANISATION « GARAGE ROCHE »
- étalon seul : 86–100 LIEU « cours des Arts »
- étalon seul : 195–208 PERSONNE « PERROT Pierre »
- étalon seul : 220–233 LIEU « des Peupliers »
- comparé seul : 76–81 ORGANISATION « ROCHE »
- comparé seul : 96–100 LIEU « Arts »
- comparé seul : 195–201 PERSONNE « PERROT »
- comparé seul : 224–233 LIEU « Peupliers »

### dev-rh-05 (8)

- étalon seul : 64–88 ORGANISATION « ATELIER DES TROIS CHÊNES »
- étalon seul : 95–110 LIEU « place du Marché »
- étalon seul : 204–219 PERSONNE « FLORENCE Julien »
- étalon seul : 227–245 LIEU « de la Pierre Levée »
- comparé seul : 64–88 LIEU « ATELIER DES TROIS CHÊNES »
- comparé seul : 104–110 LIEU « Marché »
- comparé seul : 204–212 PERSONNE « FLORENCE »
- comparé seul : 230–245 LIEU « la Pierre Levée »

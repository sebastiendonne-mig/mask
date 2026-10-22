// Fichiers du modèle camembert-ner, épinglés à une révision et vérifiés par empreinte.
//
// Les fichiers vivent dans modeles/camembert-ner/<révision>/ (ignoré par git) ; leurs
// empreintes SHA-256 dans modeles/MANIFEST.sha256 (commité), au format de shasum :
//   cd modeles && shasum -a 256 -c MANIFEST.sha256
// Node uniquement (node:fs, node:crypto).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEPOT = 'Xenova/camembert-ner';
export const REVISION = '8e1988247e872ba0137062653b1e5033a31e14fc';

// Seuls fichiers nécessaires : configuration, tokenizer, modèle quantifié (dtype q8).
export const FICHIERS = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'];

export const RACINE_MODELES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'modeles');
export const DOSSIER = path.join(RACINE_MODELES, 'camembert-ner', REVISION);
export const MANIFESTE = path.join(RACINE_MODELES, 'MANIFEST.sha256');

// Chemin d'un fichier tel qu'il figure dans le manifeste (relatif à modeles/).
export const cheminManifeste = (fichier) => `camembert-ner/${REVISION}/${fichier}`;

export async function sha256Fichier(chemin) {
  const h = crypto.createHash('sha256');
  for await (const morceau of fs.createReadStream(chemin)) h.update(morceau);
  return h.digest('hex');
}

// Manifeste → Map(chemin relatif → empreinte). Absent : Map vide.
export function lireManifeste() {
  if (!fs.existsSync(MANIFESTE)) return new Map();
  const entrees = new Map();
  for (const ligne of fs.readFileSync(MANIFESTE, 'utf8').split('\n')) {
    if (!ligne.trim()) continue;
    const m = /^([0-9a-f]{64}) [ *](.+)$/.exec(ligne);
    if (!m) throw new Error(`${MANIFESTE} : ligne illisible « ${ligne} »`);
    entrees.set(m[2], m[1]);
  }
  return entrees;
}

// Vérifie les quatre fichiers contre le manifeste ; échoue en nommant le premier problème.
export async function verifierFichiers() {
  const manifeste = lireManifeste();
  const aide = 'lancer : node scripts/telecharger-modele.mjs';
  for (const fichier of FICHIERS) {
    const attendu = manifeste.get(cheminManifeste(fichier));
    if (!attendu) throw new Error(`modèle : ${cheminManifeste(fichier)} absent de ${MANIFESTE}`);
    const chemin = path.join(DOSSIER, fichier);
    if (!fs.existsSync(chemin)) throw new Error(`modèle : fichier absent ${chemin} (${aide})`);
    const obtenu = await sha256Fichier(chemin);
    if (obtenu !== attendu) throw new Error(`modèle : empreinte différente pour ${chemin} (attendu ${attendu}, obtenu ${obtenu})`);
  }
}

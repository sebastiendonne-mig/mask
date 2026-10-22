// Masques et scores du détecteur par modèle sur le jeu de développement, avec trois moteurs
// d'exécution côté Node, pour expliquer un écart avec le navigateur (lot 1.5b) :
// - « natif » : onnxruntime-node, optimisations de graphe par défaut (= src/modele.mjs, mesures 1.5a) ;
// - « natif-sans-optimisation » : onnxruntime-node, graphOptimizationLevel 'disabled' ;
// - « wasm » : onnxruntime-web (build WebAssembly pour Node, ort.node.min.mjs), 1 thread,
//   le moteur du navigateur.
// Même logique (src/modele-commun.mjs), mêmes fichiers vérifiés ; seule la session change.
// Diagnostic seulement : ne remplace pas src/modele.mjs.
//
//   node scripts/navigateur/moteurs-node.mjs --sortie fichier.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import * as modele from '../../src/modele.mjs';
import { DOSSIER, verifierFichiers } from '../../src/modele-fichiers.mjs';
import { scoresParMot } from '../../bench/diagnostic.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MOTEURS = ['natif', 'natif-sans-optimisation', 'wasm'];

// Session ORT directe derrière l'interface attendue par logitsFenetre (src/modele-commun.mjs).
async function sessionDirecte(ort, octets, options) {
  const session = await ort.InferenceSession.create(octets, options);
  return async ({ input_ids, attention_mask }) => {
    const o = await session.run({
      input_ids: new ort.Tensor('int64', input_ids.data, input_ids.dims),
      attention_mask: new ort.Tensor('int64', attention_mask.data, attention_mask.dims),
    });
    return { logits: { dims: o.logits.dims, data: o.logits.data } };
  };
}

// documents : [{ id, texte }] → { moteur: { versions, documents: { id: { masques, scores } } } }
export async function parMoteur(documents, { scores = true } = {}) {
  await verifierFichiers();
  const base = await modele.charger(); // natif, optimisations par défaut
  const octets = fs.readFileSync(path.join(DOSSIER, 'onnx', 'model_quantized.onnx'));
  const ortNode = (await import('onnxruntime-node')).default;
  const ortWeb = await import(path.join(RACINE, 'node_modules', 'onnxruntime-web', 'dist', 'ort.node.min.mjs'));
  ortWeb.env.wasm.numThreads = 1;
  const sessions = {
    natif: base.modele,
    'natif-sans-optimisation': await sessionDirecte(ortNode, octets, { graphOptimizationLevel: 'disabled' }),
    wasm: await sessionDirecte(ortWeb, octets, {}),
  };
  const versions = { natif: `onnxruntime-node ${ortNode.env.versions.node ?? '?'}`, 'natif-sans-optimisation': `onnxruntime-node ${ortNode.env.versions.node ?? '?'}`, wasm: `onnxruntime-web ${ortWeb.env.versions.web}` };
  const sortie = {};
  for (const moteur of MOTEURS) {
    const c = { ...base, modele: sessions[moteur] };
    const detecter = modele.fabriqueDetecteur(async () => c)();
    const docs = {};
    for (const { id, texte } of documents) docs[id] = { masques: await detecter(texte), scores: scores ? await scoresParMot(modele, c, texte) : null };
    sortie[moteur] = { version: versions[moteur], documents: docs };
  }
  return sortie;
}

export function documentsDev() {
  const dossier = path.join(RACINE, 'golden', 'dev');
  return fs.readdirSync(dossier).filter((f) => f.endsWith('.txt')).sort().map((f) => ({ id: f.replace(/\.txt$/, ''), texte: fs.readFileSync(path.join(dossier, f), 'utf8') }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { sortie: { type: 'string' } } });
  if (!values.sortie) throw new Error('--sortie fichier.json requis');
  const r = await parMoteur(documentsDev());
  fs.writeFileSync(values.sortie, JSON.stringify(r) + '\n');
  const docs = Object.keys(r.natif.documents);
  const egaux = (a, b) => docs.filter((id) => JSON.stringify(r[a].documents[id].masques) === JSON.stringify(r[b].documents[id].masques)).length;
  for (const [a, b] of [['natif', 'natif-sans-optimisation'], ['natif', 'wasm'], ['natif-sans-optimisation', 'wasm']]) console.log(`${a} = ${b} : ${egaux(a, b)}/${docs.length} documents`);
}

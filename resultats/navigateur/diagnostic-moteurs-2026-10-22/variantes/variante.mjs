// Détecteur « modèle » d'une variante de moteur (diagnostic lot 1.5b, hors dépôt).
// Logique de détection inchangée : src/modele-commun.mjs du dépôt ; seule la session ONNX change.
import fs from 'node:fs';
import path from 'node:path';
import * as lib from '/Users/migranche/Dev/tkoidra/mask/node_modules/@huggingface/transformers/dist/transformers.node.mjs';
import { preparer, fabriqueDetecteur } from '/Users/migranche/Dev/tkoidra/mask/src/modele-commun.mjs';
import { DOSSIER, verifierFichiers } from '/Users/migranche/Dev/tkoidra/mask/src/modele-fichiers.mjs';

// ortChemin : module ORT (ort.node.min.mjs d'onnxruntime-web) ; modeleChemin : fichier .onnx déjà vérifié.
export function creerVariante({ ortChemin, modeleChemin }) {
  let chargement = null;
  const charger = () =>
    (chargement ??= (async () => {
      await verifierFichiers(); // tokenizer et configuration
      const lire = (f) => JSON.parse(fs.readFileSync(path.join(DOSSIER, f), 'utf8'));
      const base = preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
      const ort = await import(ortChemin);
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(fs.readFileSync(modeleChemin));
      const modele = async ({ input_ids, attention_mask }) => {
        const o = await session.run({
          input_ids: new ort.Tensor('int64', input_ids.data, input_ids.dims),
          attention_mask: new ort.Tensor('int64', attention_mask.data, attention_mask.dims),
        });
        return { logits: { dims: o.logits.dims, data: o.logits.data } };
      };
      return { ...base, modele, versionOrt: ort.env.versions.web };
    })());
  return { charger, detecter: fabriqueDetecteur(charger)() };
}

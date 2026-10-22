// Détecteur par modèle, chargeur Node : camembert-ner (Xenova, ONNX quantifié q8) avec
// Transformers.js. La logique (mots, fenêtres, étiquetage, bornes, civilités) vit dans
// src/modele-commun.mjs, partagée avec le chargeur navigateur (src/modele-navigateur.mjs).
//
// Interface commune aux détecteurs : detecter(texte) → [{ start, end, type }].
//
// Chargement exclusivement local, après vérification des empreintes (src/modele-fichiers.mjs) ;
// tout accès réseau de la bibliothèque échoue.

import fs from 'node:fs';
import path from 'node:path';
import { DOSSIER, verifierFichiers } from './modele-fichiers.mjs';
import { fabriqueDetecteur, preparer } from './modele-commun.mjs';

export * from './modele-commun.mjs';

// --- Chargement local --------------------------------------------------------------

let chargement = null;
let chargementModele = null;

// Tokenizer et modèle, chargés une fois, après vérification des empreintes.
export function charger({ avecModele = true } = {}) {
  chargement ??= (async () => {
    await verifierFichiers();
    const lib = await import('@huggingface/transformers');
    lib.env.allowLocalModels = true;
    lib.env.allowRemoteModels = false;
    lib.env.useFSCache = false;
    lib.env.useBrowserCache = false;
    lib.env.fetch = (url) => {
      throw new Error(`modèle : accès réseau interdit (${url})`);
    };

    const lire = (fichier) => JSON.parse(fs.readFileSync(path.join(DOSSIER, fichier), 'utf8'));
    return preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
  })();
  if (!avecModele) return chargement;
  chargementModele ??= chargement.then(async (c) => ({
    ...c,
    modele: await c.lib.AutoModelForTokenClassification.from_pretrained(DOSSIER, { dtype: 'q8', device: 'cpu', local_files_only: true }),
  }));
  return chargementModele;
}

export const creerDetecteur = fabriqueDetecteur(charger);
export const detecter = creerDetecteur();

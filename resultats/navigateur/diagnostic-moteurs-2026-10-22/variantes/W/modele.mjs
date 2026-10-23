// Variante W (diagnostic lot 1.5b, hors dépôt) : détecteur modèle, logique inchangée.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { version as versionGel } from '/Users/migranche/Dev/tkoidra/mask/src/modele-commun.mjs';
import { creerVariante } from '../variante.mjs';

export const nom = 'modele';
export const version = `${versionGel}+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node`;
export const { detecter } = creerVariante({ ortChemin: '/Users/migranche/Dev/tkoidra/mask/node_modules/onnxruntime-web/dist/ort.node.min.mjs', modeleChemin: '/Users/migranche/Dev/tkoidra/mask/modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model_quantized.onnx' });

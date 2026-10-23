// Variante F (diagnostic lot 1.5b, hors dépôt) : détecteur modèle, logique inchangée.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { version as versionGel } from '/Users/migranche/Dev/tkoidra/mask/src/modele-commun.mjs';
import { creerVariante } from '../variante.mjs';
const attendu = '0a2c64c0f051642a3002e5cef91861a26eaa44cceedceac4ce8eabee3fac4f75';
const obtenu = crypto.createHash('sha256').update(fs.readFileSync('/private/tmp/claude-501/-Users-migranche-Dev-tkoidra-mask/6b56ad32-ffe0-4496-8519-06b9b2e1d8e8/scratchpad/telechargements/fp32-8e1988247e872ba0137062653b1e5033a31e14fc/model.onnx')).digest('hex');
if (obtenu !== attendu) throw new Error(`fp32 : empreinte ${obtenu}, attendu ${attendu}`);
export const nom = 'modele';
export const version = `${versionGel}+fp32-onnx/model.onnx+onnxruntime-web@1.31.0-dev.20260914-8d85527a0-wasm-node`;
export const { detecter } = creerVariante({ ortChemin: '/Users/migranche/Dev/tkoidra/mask/node_modules/onnxruntime-web/dist/ort.node.min.mjs', modeleChemin: '/private/tmp/claude-501/-Users-migranche-Dev-tkoidra-mask/6b56ad32-ffe0-4496-8519-06b9b2e1d8e8/scratchpad/telechargements/fp32-8e1988247e872ba0137062653b1e5033a31e14fc/model.onnx' });

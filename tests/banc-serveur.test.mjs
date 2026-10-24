// Liste blanche du serveur du banc (bench/serveur.mjs) : le jeu de test et ses modèles restent
// inatteignables. Chemins seulement : aucun fichier du jeu de test n'est lu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resoudre, CSP } from '../bench/serveur.mjs';
import { cleModeleValide } from '../src/modele-navigateur.mjs';

test('banc : jeu de test, modèles de test et chemins détournés refusés', () => {
  for (const chemin of [
    '/golden/test/MANIFEST.sha256',
    '/golden/test/index.json',
    '/golden/dev/../test/MANIFEST.sha256',
    '/golden/dev/%2e%2e/test/MANIFEST.sha256',
    '/scripts/golden/modeles-test.mjs',
    '/golden/robustesse/README.md',
    '/golden/dev/dev-avocat-01.json',
    '/package.json',
    '/.env',
    '/node_modules/onnxruntime-web/package.json',
  ]) {
    assert.equal(resoudre(chemin), null, chemin);
  }
});

test('banc : fichiers attendus servis', () => {
  assert.ok(resoudre('/golden/dev/dev-avocat-01.txt').fichier.endsWith('golden/dev/dev-avocat-01.txt'));
  assert.ok(resoudre('/vendor/ort/ort-wasm-simd-threaded.asyncify.wasm'));
  assert.ok(resoudre('/vendor/ort/ort-wasm-simd-threaded.wasm'));
  assert.deepEqual(resoudre('/vendor/transformers.web.min.js'), { genere: 'transformers' });
});

test('banc : CSP limitée à l\'origine et au dépôt Hugging Face du modèle', () => {
  assert.match(CSP, /connect-src 'self' https:\/\/huggingface\.co https:\/\/\*\.hf\.co(;|$)/);
  assert.deepEqual(CSP.match(/https?:\/\/[^\s;]+/g), ['https://huggingface.co', 'https://*.hf.co']);
});

test('banc : candidats de compression inscrits au manifeste servis, voisins non inscrits refusés', () => {
  for (const r of ['int8-matmul', 'int8-defaut', 'fp16-mixte']) {
    assert.ok(resoudre(`/modeles/compression/${r}/model.onnx`)?.fichier.endsWith(`modeles/compression/${r}/model.onnx`), r);
  }
  for (const chemin of [
    '/modeles/compression/int8-matmul/model.onnx.partiel',
    '/modeles/compression/autre/model.onnx',
    '/modeles/compression/../camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx',
    '/modeles/camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/model.onnx',
    '/modeles/camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model.onnx',
  ]) {
    assert.equal(resoudre(chemin), null, chemin);
  }
});

test('banc : clé de fichier ONNX (option modele) validée', () => {
  for (const cle of ['compression/int8-matmul/model.onnx', 'camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/onnx/model_quantized.onnx']) assert.ok(cleModeleValide(cle), cle);
  for (const cle of [null, '', '../golden/test/x.onnx', 'compression/../../x.onnx', '/modeles/x.onnx', 'compression/x.json', 'https://exemple.fr/x.onnx', 'compression//x.onnx']) assert.ok(!cleModeleValide(cle), String(cle));
});

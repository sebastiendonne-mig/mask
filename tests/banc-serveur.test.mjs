// Liste blanche du serveur du banc (bench/serveur.mjs) : le jeu de test et ses modèles restent
// inatteignables. Chemins seulement : aucun fichier du jeu de test n'est lu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resoudre, CSP } from '../bench/serveur.mjs';

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

test('banc : CSP sans origine tierce', () => {
  assert.match(CSP, /connect-src 'self'(;|$)/);
  assert.doesNotMatch(CSP, /https?:/);
});

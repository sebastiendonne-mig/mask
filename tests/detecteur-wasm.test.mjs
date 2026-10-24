// Garde-fous du détecteur sous moteur WASM (scripts/navigateur/detecteur-wasm.mjs), sans
// charger de modèle : seuls le manifeste et le type de détecteur sont lus.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerDetecteur, verifierModele, DETECTEURS } from '../scripts/navigateur/detecteur-wasm.mjs';

test('moteur wasm : clé absente du manifeste refusée', async () => {
  await assert.rejects(verifierModele('compression/inconnu/model.onnx'), /absent de modeles\/MANIFEST\.sha256/);
  await assert.rejects(creerDetecteur('modele', 'compression/inconnu/model.onnx'), /absent de modeles\/MANIFEST\.sha256/);
});

test('moteur wasm : détecteur inconnu refusé avant toute lecture', async () => {
  await assert.rejects(creerDetecteur('regles', 'compression/fp16-mixte/model.onnx'), /inconnu/);
});

test('moteur wasm : mêmes détecteurs que l’évaluateur', () => {
  assert.deepEqual(DETECTEURS, { 'src/modele.mjs': 'modele', 'src/combine.mjs': 'combine' });
});

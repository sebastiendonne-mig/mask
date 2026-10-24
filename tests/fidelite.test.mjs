// Tests de la comparaison de masques du script de fidélité (scripts/navigateur/fidelite.mjs),
// sans modèle ni moteur : définition de l'amendement (5), point Fidélité. Masques inventés.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparerDocument, comparer } from '../scripts/navigateur/fidelite.mjs';

const m = (start, end, type = 'PERSONNE') => ({ start, end, type });

test('fidélité : listes identiques, dans un autre ordre → 0', () => {
  const a = [m(0, 5), m(10, 20, 'LIEU'), m(30, 31, 'DIVERS')];
  assert.deepEqual(comparerDocument(a, [...a].reverse()), { seulEtalon: [], seulCompare: [], total: 0 });
});

test('fidélité : masque décalé d’un caractère → compte pour deux', () => {
  const r = comparerDocument([m(0, 5)], [m(0, 6)]);
  assert.equal(r.total, 2);
  assert.deepEqual(r.seulEtalon, [m(0, 5)]);
  assert.deepEqual(r.seulCompare, [m(0, 6)]);
});

test('fidélité : même position, catégorie différente → compte pour deux', () => {
  const r = comparerDocument([m(3, 9, 'ORGANISATION')], [m(3, 9, 'LIEU')]);
  assert.equal(r.total, 2);
  assert.deepEqual(r.seulEtalon, [m(3, 9, 'ORGANISATION')]);
  assert.deepEqual(r.seulCompare, [m(3, 9, 'LIEU')]);
});

test('fidélité : répétitions comptées (multiensemble)', () => {
  const r = comparerDocument([m(1, 2), m(1, 2), m(1, 2)], [m(1, 2)]);
  assert.equal(r.total, 2);
  assert.deepEqual(r.seulEtalon, [m(1, 2), m(1, 2)]);
  assert.deepEqual(r.seulCompare, []);
});

test('fidélité : chevauchements non fusionnés', () => {
  // Deux masques qui se chevauchent d'un côté, leur union de l'autre : trois masques différents.
  const r = comparerDocument([m(0, 5), m(3, 8)], [m(0, 8)]);
  assert.equal(r.total, 3);
});

test('fidélité : masques absents d’un côté', () => {
  assert.equal(comparerDocument([], [m(0, 1), m(4, 6, 'LIEU')]).total, 2);
  assert.equal(comparerDocument([m(0, 1)], []).total, 1);
  assert.equal(comparerDocument([], []).total, 0);
});

test('fidélité : somme sur les documents, documents touchés, détail par document', () => {
  const etalon = { b: [m(0, 4)], a: [m(0, 4), m(6, 9, 'LIEU')], c: [] };
  const compare = { a: [m(0, 4), m(6, 9, 'DIVERS')], b: [m(0, 4)], c: [m(2, 3)] };
  const r = comparer(etalon, compare);
  assert.equal(r.total, 3);
  assert.equal(r.seulEtalon, 1);
  assert.equal(r.seulCompare, 2);
  assert.equal(r.documentsTouches, 2);
  assert.deepEqual(r.documents.map((d) => [d.id, d.nbEtalon, d.nbCompare, d.total]), [['a', 2, 2, 2], ['b', 1, 1, 0], ['c', 0, 1, 1]]);
});

test('fidélité : étalon contre lui-même → 0, aucun document touché', () => {
  const etalon = { a: [m(0, 4), m(0, 4)], b: [m(5, 7, 'ORGANISATION')] };
  const r = comparer(etalon, structuredClone(etalon));
  assert.equal(r.total, 0);
  assert.equal(r.documentsTouches, 0);
});

test('fidélité : documents différents entre étalon et comparé → erreur', () => {
  assert.throws(() => comparer({ a: [] }, { b: [] }), /documents différents/);
  assert.throws(() => comparer({ a: [], b: [] }, { a: [] }), /documents différents/);
});

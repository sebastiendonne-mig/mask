// Détecteur par modèle de bout en bout (camembert-ner, fichiers locaux de modeles/), sur des
// textes inventés. Échoue explicitement si modeles/ est vide (lancer node scripts/telecharger-modele.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charger, detecter, creerDetecteur, decouperMots, decouperFenetres, tokeniserMots } from '../../src/modele.mjs';

const c = await charger();

const PHRASES = [
  'Le dossier a été transmis par Jean Dupont au service comptable de la société Renault à Marseille.',
  'Les pièces justificatives seront conservées pendant cinq ans conformément à la procédure interne.',
  'Après examen, la commission a estimé que la demande était recevable et a fixé une nouvelle réunion.',
];

test('chargement exclusivement local : accès réseau refusé', () => {
  assert.equal(c.lib.env.allowRemoteModels, false);
  assert.throws(() => c.lib.env.fetch('https://huggingface.co/'), /accès réseau interdit/);
});

test('texte de plus de 1 500 sous-mots : chaque entité masquée une fois, sans perte ni doublon', async () => {
  let t = '';
  for (let i = 0; i < 99; i++) t += PHRASES[i % 3] + (i % 5 === 4 ? '\n\n' : ' ');
  const longueurs = tokeniserMots(c.tokenizer, t, decouperMots(t)).map((x) => x.length);
  assert.ok(longueurs.reduce((s, n) => s + n, 0) > 1500);
  assert.ok(decouperFenetres(longueurs).length >= 3);

  const masques = await detecter(t);
  for (let k = 1; k < masques.length; k++) assert.ok(masques[k - 1].end <= masques[k].start, 'masques triés, sans chevauchement');

  const compte = {};
  for (const m of masques) {
    const cle = `${m.type}:${t.slice(m.start, m.end)}`;
    compte[cle] = (compte[cle] ?? 0) + 1;
  }
  assert.deepEqual(compte, { 'PERSONNE:Jean Dupont': 33, 'ORGANISATION:Renault': 33, 'LIEU:Marseille': 33 });
});

test('types masqués configurables', async () => {
  const t = PHRASES[0];
  const seulementPersonnes = creerDetecteur({ types: ['PER'] });
  assert.deepEqual((await seulementPersonnes(t)).map((m) => [m.type, t.slice(m.start, m.end)]), [['PERSONNE', 'Jean Dupont']]);
});

test('texte vide ou sans mot : aucun masque', async () => {
  assert.deepEqual(await detecter(''), []);
  assert.deepEqual(await detecter(' \n\t '), []);
});

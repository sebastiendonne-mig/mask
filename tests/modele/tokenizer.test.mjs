// Tokenizer de camembert-ner (fichiers locaux de modeles/) : normaliseur et équivalence entre
// tokenisation mot par mot et tokenisation du texte entier. Chaînes inventées.
// Échoue explicitement si modeles/ est vide (lancer node scripts/telecharger-modele.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charger, copieTokenisable, decouperMots, tokeniserMots } from '../../src/modele.mjs';

const { tokenizer, pieces, bos, eos } = await charger({ avecModele: false });

const entier = (t) => tokenizer.encode(copieTokenisable(t));
const parMots = (t) => [bos, ...tokeniserMots(tokenizer, t, decouperMots(t)).flat(), eos];

test('jetons spéciaux : <s> et </s>', () => {
  assert.equal(pieces[bos], '<s>');
  assert.equal(pieces[eos], '</s>');
});

test('normaliseur : saut de ligne, tabulation, U+00A0 et U+202F se comportent comme une espace', () => {
  const reference = entier('Jean Dupont');
  for (const blanc of ['\n', '\t', '\r\n', ' ', ' ', '  \n  ']) {
    assert.deepEqual(entier(`Jean${blanc}Dupont`), reference, JSON.stringify(blanc));
  }
  assert.deepEqual(entier('  Jean Dupont   '), reference);
});

test('normaliseur : l’apostrophe typographique est conservée, distincte de l’apostrophe droite', () => {
  const typo = tokenizer.encode('l’Hôtel', { add_special_tokens: false }).map((id) => pieces[id]);
  const droite = tokenizer.encode("l'Hôtel", { add_special_tokens: false }).map((id) => pieces[id]);
  assert.deepEqual(typo, ['▁l', '’', 'Hôtel']);
  assert.deepEqual(droite, ['▁l', "'", 'Hôtel']);
});

test('normaliseur : U+000B est supprimé par la bibliothèque, d’où la copie tokenisable', () => {
  // Sans copie : « a\vb » devient « ab », un seul mot pour le tokenizer, deux pour \S+.
  assert.deepEqual(tokenizer.encode('a\vb', { add_special_tokens: false }).map((id) => pieces[id]), ['▁ab']);
  // Avec la copie : deux mots, et la tokenisation mot par mot égale celle du texte entier.
  assert.equal(decouperMots('a\vb').length, 2);
  assert.deepEqual(parMots('a\vb'), entier('a\vb'));
});

test('équivalence mot par mot / texte entier sur des chaînes inventées', () => {
  const chaines = [
    'Mme Jeanne MORIN, 12 000 € versés le 3 mars.',
    'Société «Atelier Lenoir» — l’Hôtel-Dieu,\n\td’Artagnan  et   O’Neill ;',
    '  M. J. Durand\r\n\r\nqu’il a vu à Saint-Étienne (Loire).  ',
    'contrôle\u0001caché\u007Fici et\u000Blà',
    '',
  ];
  for (const t of chaines) assert.deepEqual(parMots(t), entier(t), JSON.stringify(t));
});

test('mot sans sous-mot (blanc pour le normaliseur, pas pour \\S) : zéro identifiant', () => {
  assert.deepEqual(tokeniserMots(tokenizer, 'a ​ b', decouperMots('a ​ b')).map((x) => x.length), [1, 0, 1]);
  assert.deepEqual(parMots('a ​ b'), entier('a ​ b'));
});

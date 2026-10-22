// Tests de la logique pure du détecteur par modèle (src/modele.mjs), sans tokenizer ni modèle :
// mots, fenêtres, étiquette d'un mot, bornes des masques. Chaînes inventées (aucun texte du golden set).
// Les tests qui chargent le tokenizer ou le modèle sont dans tests/modele/ (npm run test:modele).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  copieTokenisable,
  decouperMots,
  decouperFenetres,
  attribuerFenetres,
  sousMotRepresentatif,
  coeurDuMot,
  regrouper,
  estCivilite,
  creerDetecteur,
  MAX_SOUS_MOTS,
} from '../src/modele.mjs';

const textes = (texte, mots) => mots.map((m) => texte.slice(m.start, m.end));

test('mots : blancs ASCII, espaces insécables, sauts de ligne et tabulations séparent', () => {
  const t = 'Mme Jeanne MORIN\n\tà  Lyon ';
  assert.deepEqual(textes(t, decouperMots(t)), ['Mme', 'Jeanne', 'MORIN', 'à', 'Lyon']);
});

test('mots : caractères supprimés par le normaliseur remplacés par une espace, positions d’origine', () => {
  const t = 'a\vb\u0001c\u007Fd';
  const copie = copieTokenisable(t);
  assert.equal(copie, 'a b c d');
  assert.equal(copie.length, t.length);
  assert.deepEqual(decouperMots(t), [
    { start: 0, end: 1 },
    { start: 2, end: 3 },
    { start: 4, end: 5 },
    { start: 6, end: 7 },
  ]);
});

test('mots : apostrophe typographique et ponctuation restent dans le mot', () => {
  const t = 'l’Hôtel-Dieu, «Dupont»';
  assert.deepEqual(textes(t, decouperMots(t)), ['l’Hôtel-Dieu,', '«Dupont»']);
});

test('fenêtres : plus de 1 500 sous-mots, aucune perte, aucune duplication', () => {
  // Longueurs variées de 1 à 7 sous-mots, déterministes.
  const longueurs = Array.from({ length: 600 }, (_, i) => 1 + ((i * 3) % 7));
  const total = longueurs.reduce((s, n) => s + n, 0);
  assert.ok(total > 1500, `total ${total}`);

  const fenetres = decouperFenetres(longueurs);
  assert.ok(fenetres.length >= 4);
  assert.equal(fenetres[0].debut, 0);
  assert.equal(fenetres.at(-1).fin, longueurs.length);
  for (const [k, f] of fenetres.entries()) {
    const taille = longueurs.slice(f.debut, f.fin).reduce((s, n) => s + n, 0);
    assert.ok(taille <= MAX_SOUS_MOTS, `fenêtre ${k} : ${taille} sous-mots`);
    if (k) {
      assert.ok(f.debut > fenetres[k - 1].debut, 'progression');
      assert.ok(f.debut < fenetres[k - 1].fin, 'chevauchement');
    }
  }

  // Chaque mot reçoit exactement une fenêtre, qui le contient.
  const choix = attribuerFenetres(longueurs, fenetres);
  assert.equal(choix.length, longueurs.length);
  choix.forEach((k, i) => {
    assert.ok(k >= 0, `mot ${i} sans fenêtre`);
    assert.ok(fenetres[k].debut <= i && i < fenetres[k].fin, `mot ${i} hors de sa fenêtre`);
  });
});

test('fenêtres : un mot présent dans deux fenêtres va à celle où il est le plus loin du bord', () => {
  // 10 mots d'un sous-mot, fenêtres de 6, chevauchement 3 : [0,6) puis [3,9) puis [6,10).
  const longueurs = new Array(10).fill(1);
  const fenetres = decouperFenetres(longueurs, 6, 3);
  assert.deepEqual(fenetres, [
    { debut: 0, fin: 6 },
    { debut: 3, fin: 9 },
    { debut: 6, fin: 10 },
  ]);
  // Mot 5 : distance 0 dans [0,6), 2 dans [3,9) → fenêtre 1. Mot 3 : 2 dans [0,6), 0 dans [3,9) → 0.
  // Mot 4 : 1 et 1 → égalité, la première.
  assert.deepEqual(attribuerFenetres(longueurs, fenetres), [0, 0, 0, 0, 0, 1, 1, 1, 2, 2]);
});

test('fenêtres : texte vide, aucune fenêtre ; mot plus long que la fenêtre, erreur explicite', () => {
  assert.deepEqual(decouperFenetres([]), []);
  assert.throws(() => decouperFenetres([3, MAX_SOUS_MOTS + 1, 2]), /dépasse la fenêtre/);
});

test('étiquette d’un mot : premier sous-mot avec une lettre ou un chiffre, après l’élision', () => {
  assert.equal(sousMotRepresentatif(['▁Dupont', ','], 'Dupont,'), 0);
  assert.equal(sousMotRepresentatif(['▁«', 'Dupont', '»'], '«Dupont»'), 1);
  assert.equal(sousMotRepresentatif(['▁l', '’', 'Hôtel'], 'l’Hôtel'), 2);
  assert.equal(sousMotRepresentatif(['▁d', "'", 'Arta', 'gnan'], "d'Artagnan"), 2);
  assert.equal(sousMotRepresentatif(['▁jusqu', '’', 'à'], 'jusqu’à'), 2);
  // Pas une élision (« O’ » n'en est pas une) : premier sous-mot signifiant.
  assert.equal(sousMotRepresentatif(['▁O', '’', 'Neill'], 'O’Neill'), 0);
  // Ni lettre ni chiffre : premier sous-mot ; aucun sous-mot : -1.
  assert.equal(sousMotRepresentatif(['▁', '&'], '&'), 0);
  assert.equal(sousMotRepresentatif([], '​'), -1);
});

test('bornes d’un mot : ponctuation finale exclue, initiale gardée avec son point, élision exclue', () => {
  const coeur = (t) => {
    const c = coeurDuMot(t, 0, t.length);
    return c && t.slice(c.start, c.end);
  };
  assert.equal(coeur('Dupont,'), 'Dupont');
  assert.equal(coeur('«Paris»).'), 'Paris');
  assert.equal(coeur('J.'), 'J.');
  assert.equal(coeur('l’Hôtel-Dieu,'), 'Hôtel-Dieu');
  assert.equal(coeur('O’Neill.'), 'O’Neill');
  assert.equal(coeur('SARL.'), 'SARL');
  assert.equal(coeur('—'), null);
});

test('regroupement : mots consécutifs de même type, un mot O sépare, types filtrés', () => {
  const t = 'M. Jean DUPONT et Marie Martin, Lyon (Acme)';
  const mots = decouperMots(t);
  //            M.   Jean   DUPONT  et   Marie  Martin,  Lyon   (Acme)
  const etiq = ['O', 'PER', 'PER', 'O', 'PER', 'PER', 'LOC', 'ORG'];
  const vus = (masques) => masques.map((m) => [m.type, t.slice(m.start, m.end)]);
  assert.deepEqual(vus(regrouper(t, mots, etiq)), [
    ['PERSONNE', 'Jean DUPONT'],
    ['PERSONNE', 'Marie Martin'],
    ['LIEU', 'Lyon'],
    ['ORGANISATION', 'Acme'],
  ]);
  assert.deepEqual(vus(regrouper(t, mots, etiq, ['PER'])), [
    ['PERSONNE', 'Jean DUPONT'],
    ['PERSONNE', 'Marie Martin'],
  ]);
  // Sans étiquette B-, deux entités du même type collées n'en font qu'une.
  assert.deepEqual(vus(regrouper(t, mots, ['O', 'PER', 'PER', 'PER', 'PER', 'PER', 'O', 'MISC'])), [
    ['PERSONNE', 'Jean DUPONT et Marie Martin'],
    ['DIVERS', 'Acme'],
  ]);
});

test('civilités : entité PERSONNE faite seulement de civilités écartée, nom conservé', () => {
  // Chaque texte est une seule entité PER, tous ses mots étiquetés PER.
  const masque = (t) => {
    const mots = decouperMots(t);
    return regrouper(t, mots, mots.map(() => 'PER')).map((m) => t.slice(m.start, m.end));
  };
  assert.deepEqual(masque('Madame, Monsieur,'), []);
  assert.deepEqual(masque('MONSIEUR'), []);
  assert.deepEqual(masque('M. Mme Me Dr.'), []);
  assert.deepEqual(masque('Mme L’Hermite'), ['Mme L’Hermite']);
  assert.deepEqual(masque("Mme L'Hermite"), ["Mme L'Hermite"]);
  assert.deepEqual(masque('Maître Le Goff'), ['Maître Le Goff']);
  assert.deepEqual(masque('M. Dupont'), ['M. Dupont']);
  // « me » et « mes » en minuscules ne sont jamais des civilités.
  assert.deepEqual(masque('me'), ['me']);
  assert.deepEqual(masque('mes'), ['mes']);
  assert.deepEqual(masque('Madame mes'), ['Madame mes']);
  // Seules les entités PERSONNE sont concernées.
  const t = 'Madame';
  assert.deepEqual(regrouper(t, decouperMots(t), ['ORG']).length, 1);
});

test('civilités : ponctuation retirée, casse respectée pour les abréviations', () => {
  for (const mot of ['Monsieur', 'madame,', 'MAÎTRE', '«Docteur»', 'M.', 'MM.', 'Mlles', 'Pr', 'Mes']) assert.ok(estCivilite(mot), mot);
  for (const mot of ['me', 'mes', 'm.', 'MME', 'Dupont', 'M1', '—', '']) assert.ok(!estCivilite(mot), mot);
});

test('types masqués : configurables, type inconnu refusé', () => {
  assert.equal(typeof creerDetecteur({ types: ['PER', 'ORG'] }), 'function');
  assert.throws(() => creerDetecteur({ types: ['PERSONNE'] }), /type inconnu/);
});

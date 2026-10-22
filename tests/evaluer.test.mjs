// Tests de l'évaluateur sur de petits textes inventés ici (aucun texte du golden set).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluerDocument, agreger, fusionner, verifierArguments, rapportMarkdown } from '../scripts/evaluer.mjs';

// Étiquette construite à partir du texte : évite de compter les positions à la main.
function lab(texte, extraitCherche, type, occurrence = 0) {
  let start = -1;
  for (let k = 0; k <= occurrence; k++) start = texte.indexOf(extraitCherche, start + 1);
  assert.ok(start >= 0, `« ${extraitCherche} » absent du texte`);
  return { start, end: start + extraitCherche.length, type, text: extraitCherche };
}
const masque = (e, type = e.type) => ({ start: e.start, end: e.end, type });

const T1 = 'Contrat signé par Lucien TARDIEU le 3 mai 2026 au greffe de Vierzon.';
const nom1 = lab(T1, 'Lucien TARDIEU', 'PERSONNE');
const date1 = lab(T1, '3 mai 2026', 'DATE');
const greffe1 = lab(T1, 'greffe', 'INSTITUTION');
const ville1 = lab(T1, 'Vierzon', 'LIEU_ISOLE');
const etiq1 = { spans: [nom1], non_masques: [date1], neutres: [greffe1, ville1] };

test('couverture complète : retrouvé, 1 masque correct, précision 100 %', () => {
  const r = evaluerDocument(T1, etiq1, [masque(nom1)]);
  assert.equal(r.elements[0].statut, 'retrouve');
  assert.deepEqual(r.masques.map((m) => m.statut), ['correct']);
  assert.equal(r.erreurs.length, 0);
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.seuils.find((s) => s.id === 'S3').valeur, 1);
  assert.equal(a.seuils.find((s) => s.id === 'S6').valeur, 1);
});

test('couverture partielle (prénom seul) : oubli, compté en couverture partielle', () => {
  const r = evaluerDocument(T1, etiq1, [{ start: nom1.start, end: nom1.start + 6, type: 'PERSONNE' }]);
  assert.equal(r.elements[0].statut, 'partiel');
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.rappelParType.PERSONNE.trouves, 0);
  assert.equal(a.couverturePartielle.partiels, 1);
  assert.equal(a.seuils.find((s) => s.id === 'S3').statut, 'non atteint');
  assert.equal(a.listes.oublis[0].statut, 'partiel');
});

test('amendement (3) : nom masqué en deux morceaux séparés par un espace visible → retrouvé', () => {
  const espace = nom1.start + 'Lucien'.length;
  const r = evaluerDocument(T1, etiq1, [
    { start: nom1.start, end: espace, type: 'PERSONNE' },
    { start: espace + 1, end: nom1.end, type: 'PERSONNE' },
  ]);
  assert.equal(r.elements[0].statut, 'retrouve');
  assert.equal(r.masques.length, 2);
  assert.ok(r.masques.every((m) => m.statut === 'correct'));
});

test('amendement (3) : ponctuation et saut de ligne visibles ne comptent pas', () => {
  const t = 'Écrire au 7 impasse Ravel,\n18100 Vierzon.';
  const adr = lab(t, '7 impasse Ravel,\n18100 Vierzon', 'ADRESSE');
  const r = evaluerDocument(t, { spans: [adr] }, [
    { start: adr.start, end: adr.start + '7 impasse Ravel'.length, type: 'ADRESSE' },
    { start: t.indexOf('18100'), end: adr.end, type: 'ADRESSE' },
  ]);
  assert.equal(r.elements[0].statut, 'retrouve');
});

test('amendement (3) : une lettre visible → oubli, couverture partielle', () => {
  const r = evaluerDocument(T1, etiq1, [{ start: nom1.start, end: nom1.end - 1, type: 'PERSONNE' }]);
  assert.equal(r.elements[0].statut, 'partiel');
});

test('masque sur une date seule : 1 erreur DATE', () => {
  const r = evaluerDocument(T1, etiq1, [masque(nom1), { ...masque(date1), type: 'NUMERO_DOSSIER' }]);
  assert.deepEqual(r.erreurs.map((e) => e.categorie), ['DATE']);
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.precision.valeur, 0.5);
  assert.deepEqual(a.precision.erreursParCategorie, { DATE: 1 });
});

test('un masque couvre un nom et la date qui le suit : nom retrouvé, 1 correct, 1 erreur DATE', () => {
  const r = evaluerDocument(T1, etiq1, [{ start: nom1.start, end: date1.end, type: 'PERSONNE' }]);
  assert.equal(r.elements[0].statut, 'retrouve');
  assert.deepEqual(r.masques.map((m) => m.statut), ['correct']);
  assert.deepEqual(r.erreurs.map((e) => e.categorie), ['DATE']);
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.precision.corrects, 1);
  assert.equal(a.precision.erreurs, 1);
});

test('tout le document masqué d’un bloc : la précision chute', () => {
  const t = 'Payé 1 200,00 € à Lucien TARDIEU le 3 mai 2026, puis 300,00 € le 4 juin 2026.';
  const etiq = {
    spans: [lab(t, 'Lucien TARDIEU', 'PERSONNE')],
    non_masques: [lab(t, '1 200,00 €', 'MONTANT'), lab(t, '3 mai 2026', 'DATE'), lab(t, '300,00 €', 'MONTANT'), lab(t, '4 juin 2026', 'DATE')],
  };
  const r = evaluerDocument(t, etiq, [{ start: 0, end: t.length, type: 'PERSONNE' }]);
  assert.equal(r.elements[0].statut, 'retrouve');
  const a = agreger([{ doc_id: 'd', texte: t, resultat: r }]);
  assert.equal(a.precision.erreurs, 4);
  assert.equal(a.precision.valeur, 1 / 5);
  assert.ok(a.debordement.lettresChiffresHorsEtiquettes > 0);
});

test('une date touchée par deux masques : 1 seule erreur', () => {
  const r = evaluerDocument(T1, etiq1, [
    { start: date1.start, end: date1.start + 1, type: 'X' },
    { start: date1.end - 2, end: date1.end, type: 'X' },
  ]);
  assert.equal(r.erreurs.length, 2, 'deux masques sans span ni neutre : 2 erreurs de masque');
  const r2 = evaluerDocument(T1, etiq1, [
    { start: nom1.start, end: date1.start + 2, type: 'PERSONNE' },
    { start: date1.start + 4, end: date1.end, type: 'X' },
  ]);
  // Le second masque est une erreur (cas 1) qui touche déjà la date : elle n'est pas recomptée.
  assert.equal(r2.erreurs.length, 1);
  const r3 = evaluerDocument(T1, etiq1, [
    { start: nom1.start, end: date1.start + 2, type: 'PERSONNE' },
    { start: date1.start + 4, end: greffe1.end, type: 'ORGANISATION' },
  ]);
  // Un masque correct et un masque sur un neutre touchent la même date : 1 erreur DATE.
  assert.deepEqual(r3.erreurs.map((e) => e.categorie), ['DATE']);
});

test('masque sur un neutre seul : ni réussite ni erreur, neutre compté', () => {
  const r = evaluerDocument(T1, etiq1, [masque(nom1), { ...masque(ville1), type: 'ADRESSE' }]);
  assert.deepEqual(r.masques.map((m) => m.statut), ['correct', 'neutre_seul']);
  assert.equal(r.erreurs.length, 0);
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.precision.valeur, 1);
  assert.equal(a.precision.masquesNeutresSeuls, 1);
  assert.deepEqual(a.neutres.masques, { LIEU_ISOLE: 1 });
  assert.deepEqual(a.neutres.total, { INSTITUTION: 1, LIEU_ISOLE: 1 });
});

test('masque sur un neutre et une date, sans span : la date compte en erreur', () => {
  const t = 'Fait à Vierzon, le 3 mai 2026.';
  const etiq = { spans: [], non_masques: [lab(t, '3 mai 2026', 'DATE')], neutres: [lab(t, 'Vierzon', 'LIEU_ISOLE')] };
  const r = evaluerDocument(t, etiq, [{ start: t.indexOf('Vierzon'), end: t.indexOf('2026') + 4, type: 'ADRESSE' }]);
  assert.deepEqual(r.masques.map((m) => m.statut), ['neutre_date']);
  assert.deepEqual(r.erreurs.map((e) => e.categorie), ['DATE']);
});

test('masque à cheval sur deux éléments : les deux retrouvés, 1 masque correct', () => {
  const t = 'Contact : Lucien TARDIEU lucien@exemple.test';
  const etiq = { spans: [lab(t, 'Lucien TARDIEU', 'PERSONNE'), lab(t, 'lucien@exemple.test', 'EMAIL')] };
  const r = evaluerDocument(t, etiq, [{ start: t.indexOf('Lucien'), end: t.length, type: 'EMAIL' }]);
  assert.deepEqual(r.elements.map((e) => e.statut), ['retrouve', 'retrouve']);
  assert.equal(r.masques.length, 1);
  assert.equal(r.masques[0].statut, 'correct');
});

test('document sans étiquette : tout masque est une erreur « non étiqueté »', () => {
  const t = 'Note de service sans aucune donnée personnelle.';
  const sans = evaluerDocument(t, { spans: [], non_masques: [], neutres: [] }, []);
  const a0 = agreger([{ doc_id: 'd', texte: t, resultat: sans }]);
  assert.equal(a0.precision.valeur, null);
  assert.equal(a0.seuils.find((s) => s.id === 'S6').statut, 'non mesurable');
  const avec = evaluerDocument(t, { spans: [] }, [{ start: 0, end: 4, type: 'PERSONNE' }]);
  assert.deepEqual(avec.erreurs.map((e) => e.categorie), ['NON_ETIQUETE']);
  const a1 = agreger([{ doc_id: 'd', texte: t, resultat: avec }]);
  assert.equal(a1.precision.valeur, 0);
});

test('type différent : rappel inchangé, signalé à part', () => {
  const r = evaluerDocument(T1, etiq1, [{ ...masque(nom1), type: 'ORGANISATION' }]);
  assert.equal(r.elements[0].statut, 'retrouve');
  assert.equal(r.elements[0].typeDifferent, true);
  const a = agreger([{ doc_id: 'd', texte: T1, resultat: r }]);
  assert.equal(a.rappelParType.PERSONNE.trouves, 1);
  assert.equal(a.typesDifferents, 1);
});

test('fusion : chevauchement fusionné, adjacence conservée', () => {
  assert.deepEqual(fusionner([{ start: 5, end: 9 }, { start: 0, end: 6 }, { start: 9, end: 12 }]), [
    { start: 0, end: 9 },
    { start: 9, end: 12 },
  ]);
});

test('S2 groupe les formats fixes ; TVA_INTRA hors S2', () => {
  const t = 'IBAN X1 SIREN X2 TVA X3';
  const etiq = { spans: [lab(t, 'X1', 'IBAN'), lab(t, 'X2', 'SIREN'), lab(t, 'X3', 'TVA_INTRA')] };
  const r = evaluerDocument(t, etiq, [masque(etiq.spans[0]), masque(etiq.spans[1])]);
  const s2 = agreger([{ doc_id: 'd', texte: t, resultat: r }]).seuils.find((s) => s.id === 'S2');
  assert.deepEqual([s2.trouves, s2.total, s2.statut], [2, 2, 'atteint']);
});

test('détecteur à sortie invalide : refusée', () => {
  assert.throws(() => evaluerDocument(T1, etiq1, [{ start: 5, end: 3 }]), /masque invalide/);
  assert.throws(() => evaluerDocument(T1, etiq1, [{ start: 0, end: T1.length + 1 }]), /masque invalide/);
  assert.throws(() => evaluerDocument(T1, etiq1, null), /tableau/);
});

test('garde-fou : --split test refusé sans --mesure-finale', () => {
  assert.throws(() => verifierArguments(['--split', 'test']), /scellé/);
  assert.equal(verifierArguments([]).split, 'dev');
  assert.equal(verifierArguments(['--split', 'test', '--mesure-finale']).mesureFinale, true);
  assert.throws(() => verifierArguments(['--split', 'tout']), /--split/);
  assert.throws(() => verifierArguments(['--inconnu']));
});

test('rapport Markdown : mention du jeu de développement et état git', () => {
  const r = evaluerDocument(T1, etiq1, [masque(nom1)]);
  const md = rapportMarkdown({
    date: '2026-10-21T00:00:00.000Z',
    git: { hash: 'abc1234', propre: false },
    detecteur: { nom: 'essai', version: '0', module: 'x.mjs' },
    split: 'dev',
    mention: 'jeu de développement : indicatif, pas la mesure finale',
    documents: 1,
    protocole: 'p',
    ...agreger([{ doc_id: 'd', texte: T1, resultat: r }]),
  });
  assert.match(md, /indicatif, pas la mesure finale/);
  assert.match(md, /abc1234` \+ modifications non commitées/);
  assert.match(md, /\| S3 \| Rappel PERSONNE \| 100,0 % \(1\/1\)/);
});

test('le jeu de robustesse s’évalue sans --mesure-finale', () => {
  const o = verifierArguments(['--split', 'robustesse']);
  assert.equal(o.split, 'robustesse');
  assert.equal(o.mesureFinale, false);
});

// Tests du détecteur par règles, sur des exemples écrits ici (aucun texte du golden set).
// Identifiants inventés, aux clés valides recalculées ; téléphones dans les plages
// réservées à la fiction (la règle, elle, ne connaît pas ces plages).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detecter, luhn, sirenValide, siretValide, nirValide, ibanValide, tvaFrValide } from '../src/regles.mjs';

// Texte masqué par le détecteur, avec son type : [['IBAN', 'FR76 …'], …].
const trouves = (texte) => detecter(texte).map((m) => [m.type, texte.slice(m.start, m.end)]);
const types = (texte) => detecter(texte).map((m) => m.type);

test('clés de contrôle : valides et fausses', () => {
  assert.ok(luhn('4999990000000007'));
  assert.ok(!luhn('4999990000000008'));
  assert.ok(sirenValide('123456782'));
  assert.ok(!sirenValide('123456783'));
  assert.ok(siretValide('12345678200028'));
  assert.ok(!siretValide('12345678200029'));
  assert.ok(nirValide('185057800608491'));
  assert.ok(!nirValide('185057800608492'));
  assert.ok(nirValide('290032A12345694'), 'Corse 2A');
  assert.ok(tvaFrValide('11', '123456782'));
  assert.ok(!tvaFrValide('12', '123456782'));
  assert.ok(ibanValide('FR7699999000010000000000115'));
  assert.ok(!ibanValide('FR7699999000010000000000116'));
  assert.ok(ibanValide('DE89370400440532013000'), 'IBAN étranger (exemple publié)');
});

test('IBAN groupé, collé, et clé fausse', () => {
  assert.deepEqual(trouves('Virement : IBAN FR76 9999 9000 0100 0000 0000 115.'), [['IBAN', 'FR76 9999 9000 0100 0000 0000 115']]);
  assert.deepEqual(trouves('(IBAN FR7699999000010000000000115)'), [['IBAN', 'FR7699999000010000000000115']]);
  assert.deepEqual(types('IBAN FR76 9999 9000 0100 0000 0000 116'), []);
});

test('SIREN, SIRET et TVA, avec séparateurs variés', () => {
  assert.deepEqual(trouves('SIREN 123 456 782 ; SIRET 123.456.782.00028 ; TVA FR 11 123 456 782'), [
    ['SIREN', '123 456 782'],
    ['SIRET', '123.456.782.00028'],
    ['TVA_INTRA', 'FR 11 123 456 782'],
  ]);
  assert.deepEqual(trouves('SIRET : 12345678200028 — TVA FR11123456782'), [
    ['SIRET', '12345678200028'],
    ['TVA_INTRA', 'FR11123456782'],
  ]);
  assert.deepEqual(types('SIREN 123 456 783 ; SIRET 12345678200029 ; TVA FR 12 123 456 783'), []);
  // Clé de TVA fausse : pas de TVA, mais le SIREN qu'elle contient reste reconnu.
  assert.deepEqual(trouves('TVA FR 12 123 456 782'), [['SIREN', '123 456 782']]);
});

test('numéro trop court ou trop long : rien', () => {
  assert.deepEqual(types('SIREN 12 345 678'), []);
  assert.deepEqual(types('Tél. 01 99 00 12'), []);
  assert.deepEqual(types('Tél. 019900123456'), []);
  assert.deepEqual(types('SIREN 1234 56782'), [], 'groupement inhabituel');
});

test('NIR espacé, collé, Corse, et clé fausse', () => {
  assert.deepEqual(trouves('N° de sécurité sociale : 1 85 05 78 006 084 91'), [['NIR', '1 85 05 78 006 084 91']]);
  assert.deepEqual(trouves('NIR 185057800608491.'), [['NIR', '185057800608491']]);
  assert.deepEqual(trouves('NIR 2 90 03 2A 123 456 94'), [['NIR', '2 90 03 2A 123 456 94']]);
  assert.deepEqual(types('NIR 1 85 05 78 006 084 92'), []);
});

test('carte bancaire : espaces, tirets, collée ; Luhn faux', () => {
  assert.deepEqual(trouves('carte n° 4999 9900 0000 0007 ;'), [['CARTE', '4999 9900 0000 0007']]);
  assert.deepEqual(trouves('carte 4999-9900-0000-0007'), [['CARTE', '4999-9900-0000-0007']]);
  assert.deepEqual(trouves('carte 4999990000000007'), [['CARTE', '4999990000000007']]);
  assert.deepEqual(types('carte 4999 9900 0000 0008'), []);
});

test('téléphones : formats nationaux et +33', () => {
  const formats = ['01 99 00 12 34', '01.99.00.12.34', '0199001234', '01-99-00-12-34', '+33 1 99 00 12 34', '+33 (0)1 99 00 12 34', '+33199001234', '0033 1 99 00 12 34'];
  for (const f of formats) assert.deepEqual(trouves(`Appeler le ${f}.`), [['TELEPHONE', f]], f);
});

test('dates et montants ne sont pas pris pour des numéros', () => {
  assert.deepEqual(types('Le 14/09/2025, puis le 01.03.2026 et le 2026-03-01.'), []);
  assert.deepEqual(types('Montant : 123 456 782,00 € et 123 456 782 euros.'), []);
  assert.deepEqual(types('Exercice du 01/01/2024 au 31/12/2024 : 1 011 891,59 €.'), []);
});

test('e-mails', () => {
  assert.deepEqual(trouves('Écrire à jeanne.dupont-martin@exemple-fictif.test.'), [['EMAIL', 'jeanne.dupont-martin@exemple-fictif.test']]);
  assert.deepEqual(trouves('contact : a.b+tri@sous.domaine.example'), [['EMAIL', 'a.b+tri@sous.domaine.example']]);
  assert.deepEqual(types('arobase seule @ et adresse@incomplete'), []);
});

test('adresses sur une, deux ou trois lignes', () => {
  assert.deepEqual(trouves('demeurant 7 impasse des Saules, 18100 Vierzon, ci-après'), [['ADRESSE', '7 impasse des Saules, 18100 Vierzon']]);
  assert.deepEqual(trouves('Siège :\n14 bis avenue du Général Leclerc\n49100 ANGERS\n'), [['ADRESSE', '14 bis avenue du Général Leclerc\n49100 ANGERS']]);
  assert.deepEqual(trouves('Résidence Les Saules, escalier 2\n3 rue Haute\n13100 Aix-en-Provence'), [
    ['ADRESSE', 'Résidence Les Saules, escalier 2\n3 rue Haute\n13100 Aix-en-Provence'],
  ]);
  assert.deepEqual(trouves('situé 5e étage, 21 quai Saint-Pierre, 72000 Le Mans CEDEX 2.'), [['ADRESSE', '5e étage, 21 quai Saint-Pierre, 72000 Le Mans CEDEX 2']]);
  assert.deepEqual(trouves('12 RUE DES MOULINS 21000 DIJON'), [['ADRESSE', '12 RUE DES MOULINS 21000 DIJON']]);
});

test('pas d’adresse sans type de voie ni code postal', () => {
  assert.deepEqual(types('Il habite 3 rue des Lilas depuis 2020.'), []);
  assert.deepEqual(types('Les 3 places de parking, 18100 euros.'), []);
});

test('noms après une civilité, civilité hors masque', () => {
  assert.deepEqual(trouves('Madame Odile MARTINEAU, demeurant'), [['PERSONNE', 'Odile MARTINEAU']]);
  assert.deepEqual(trouves('représentée par Maître J. DE LA FONTAINE,'), [['PERSONNE', 'J. DE LA FONTAINE']]);
  assert.deepEqual(trouves('sous la responsabilité de M. Gaspard de Villiers. Votre'), [['PERSONNE', 'Gaspard de Villiers']]);
  assert.deepEqual(trouves('Monsieur DUROC Albert\n'), [['PERSONNE', 'DUROC Albert']]);
});

test('formules de politesse sans nom : rien', () => {
  assert.deepEqual(types('Madame, Monsieur,\nVeuillez agréer, Madame, l’expression…'), []);
  assert.deepEqual(types('Madame la Présidente, Monsieur le Bâtonnier'), []);
});

test('numéros de dossier seulement après un indice explicite', () => {
  assert.deepEqual(trouves('Nos réf. : AB/2026/0042\n'), [['NUMERO_DOSSIER', 'AB/2026/0042']]);
  assert.deepEqual(trouves('(dossier n° CPT-00917)'), [['NUMERO_DOSSIER', 'CPT-00917']]);
  assert.deepEqual(trouves('enregistrée sous la référence 2026-0042-XY.'), [['NUMERO_DOSSIER', '2026-0042-XY']]);
  assert.deepEqual(trouves('RG 26/00123'), [['NUMERO_DOSSIER', '26/00123']]);
  assert.deepEqual(types('Le dossier est complet. Facture 2026-0042.'), [], 'référence sans chiffre ou sans indice');
  assert.deepEqual(types('Réf. du 12/03/2026'), [], 'date après l’indice');
});

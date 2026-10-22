// Instantané des masques produits par les détecteurs Node (règles, modèle, combiné) sur un jeu,
// dans l'ordre de sortie de detecter(), sans tri ni fusion. Sert à la non-régression d'un
// changement de code (comparaison à l'octet près de deux instantanés) et de référence Node
// pour l'équivalence avec le navigateur (lot 1.5b).
//
//   node scripts/navigateur/instantane-masques.mjs --split dev|robustesse --sortie fichier.json
//
// Jamais sur le jeu de test (CLAUDE.md). Sur robustesse : comparaison seulement, aucune mise au point.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import * as regles from '../../src/regles.mjs';
import * as modele from '../../src/modele.mjs';
import * as combine from '../../src/combine.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const JEUX = ['dev', 'robustesse'];

const { values } = parseArgs({ options: { split: { type: 'string', default: 'dev' }, sortie: { type: 'string' } } });
if (!JEUX.includes(values.split)) throw new Error(`--split : ${JEUX.join(' ou ')} seulement`);
if (!values.sortie) throw new Error('--sortie fichier.json requis');

const dossier = path.join(RACINE, 'golden', values.split);
const documents = [];
for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith('.txt')).sort()) {
  const texte = fs.readFileSync(path.join(dossier, fichier), 'utf8');
  const masques = {};
  for (const d of [regles, modele, combine]) masques[d.nom] = await d.detecter(texte);
  documents.push({ id: fichier.replace(/\.txt$/, ''), caracteres: texte.length, masques });
}

const instantane = {
  split: values.split,
  detecteurs: Object.fromEntries([regles, modele, combine].map((d) => [d.nom, d.version])),
  documents,
};
const contenu = JSON.stringify(instantane, null, 1) + '\n';
fs.writeFileSync(values.sortie, contenu);
console.log(`${crypto.createHash('sha256').update(contenu).digest('hex')}  ${values.sortie} (${documents.length} documents)`);

// Contrôle de src/modele.mjs : pour chaque document du jeu de développement, la suite
// d'identifiants construite mot par mot (<s>, mots tokenisés seuls, </s>) doit être identique
// à la tokenisation du texte entier (sur la copie tokenisable).
//
//   node scripts/controle-tokenisation.mjs
//
// Jeu de développement uniquement : ni le jeu de test ni le jeu de robustesse.
// Code de sortie 1 et différences affichées si un document diffère.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { charger, copieTokenisable, decouperMots, tokeniserMots } from '../src/modele.mjs';

const DEV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'golden', 'dev');

const { tokenizer, pieces, bos, eos } = await charger({ avecModele: false });
const fichiers = fs.readdirSync(DEV).filter((f) => f.endsWith('.txt')).sort();
let differents = 0;
let sousMots = 0;
let maxDoc = 0;
for (const f of fichiers) {
  const texte = fs.readFileSync(path.join(DEV, f), 'utf8');
  const entier = tokenizer.encode(copieTokenisable(texte));
  const parMots = [bos, ...tokeniserMots(tokenizer, texte, decouperMots(texte)).flat(), eos];
  sousMots += parMots.length - 2;
  maxDoc = Math.max(maxDoc, parMots.length - 2);
  if (entier.length === parMots.length && entier.every((id, k) => id === parMots[k])) continue;
  differents++;
  const k = entier.findIndex((id, i) => id !== parMots[i]);
  const zone = (ids) => ids.slice(Math.max(0, k - 3), k + 4).map((id) => `${id}:${pieces[id]}`).join(' ');
  console.log(`DIFFÉRENT ${f} : ${entier.length} identifiants (texte entier) contre ${parMots.length} (mot par mot), premier écart à ${k}`);
  console.log(`  texte entier : ${zone(entier)}`);
  console.log(`  mot par mot  : ${zone(parMots)}`);
}
console.log(`${fichiers.length} documents, ${fichiers.length - differents} identiques, ${differents} différents ; ${sousMots} sous-mots au total, ${maxDoc} au plus par document`);
process.exit(differents ? 1 : 0);

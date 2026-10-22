// Détecteur combiné : union des masques du détecteur par règles (src/regles.mjs, inchangé)
// et du détecteur par modèle (src/modele.mjs). Les masques qui se chevauchent sont
// fusionnés par l'évaluateur, comme l'app n'afficherait qu'un remplacement.
// Interface commune aux détecteurs : detecter(texte) → [{ start, end, type }].

import * as regles from './regles.mjs';
import * as modele from './modele.mjs';

export const nom = 'combine';
export const version = `0.1.0+regles@${regles.version}+modele@${modele.version}`;

export async function detecter(texte) {
  return [...(await regles.detecter(texte)), ...(await modele.detecter(texte))];
}

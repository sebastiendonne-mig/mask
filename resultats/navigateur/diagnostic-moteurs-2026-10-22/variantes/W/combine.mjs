// Variante W (diagnostic lot 1.5b, hors dépôt) : combiné = règles + modèle de la variante, comme src/combine.mjs.
import * as regles from '/Users/migranche/Dev/tkoidra/mask/src/regles.mjs';
import * as modele from './modele.mjs';
export const nom = 'combine';
export const version = `0.1.0+regles@${regles.version}+modele@${modele.version}`;
export async function detecter(texte) {
  return [...(await regles.detecter(texte)), ...(await modele.detecter(texte))];
}

// Diagnostic d'équivalence (lot 1.5b) : pour chaque mot, les deux étiquettes les mieux notées
// et leurs scores (logits) au sous-mot représentatif, dans la fenêtre retenue — même parcours
// que detecter() (src/modele-commun.mjs). Sans import : m est le module du détecteur (Node ou
// navigateur), c le résultat de son charger(). Lancé seulement hors mesure, pour expliquer un écart.

export async function scoresParMot(m, c, texte) {
  const mots = m.decouperMots(texte);
  const ids = m.tokeniserMots(c.tokenizer, texte, mots);
  const longueurs = ids.map((x) => x.length);
  const fenetres = m.decouperFenetres(longueurs);
  const choix = m.attribuerFenetres(longueurs, fenetres);
  const sortie = mots.map(({ start, end }) => ({ start, end, top: null }));
  for (const [k, { debut, fin }] of fenetres.entries()) {
    const { classes, data } = await m.logitsFenetre(c, ids.slice(debut, fin).flat());
    let decalage = 0;
    for (let i = debut; i < fin; i++) {
      if (choix[i] === k) {
        const r = m.sousMotRepresentatif(ids[i].map((id) => c.pieces[id]), texte.slice(mots[i].start, mots[i].end));
        if (r >= 0) {
          const p = 1 + decalage + r; // +1 : <s>
          const scores = Array.from({ length: classes }, (_, j) => [c.id2label[j], data[p * classes + j]]);
          scores.sort((a, b) => b[1] - a[1]);
          sortie[i].top = scores.slice(0, 2);
        }
      }
      decalage += longueurs[i];
    }
  }
  return sortie;
}

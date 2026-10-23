// Estimation en mémoire (hors dépôt) de l'effet de filtres sur les masques du modèle, dev uniquement.
import fs from 'node:fs';
import path from 'node:path';
const R = '/Users/migranche/Dev/tkoidra/mask';
const { evaluerDocument, agreger } = await import(R + '/scripts/evaluer.mjs');
const regles = await import(R + '/src/regles.mjs');
const masques = JSON.parse(fs.readFileSync(new URL('./masques.json', import.meta.url), 'utf8'));
const DEV = R + '/golden/dev';
const docs = fs.readdirSync(DEV).filter((f) => f.endsWith('.json')).sort().map((f) => ({
  et: JSON.parse(fs.readFileSync(path.join(DEV, f), 'utf8')),
  texte: fs.readFileSync(path.join(DEV, f.replace(/\.json$/, '.txt')), 'utf8'),
}));
const texteDe = Object.fromEntries(docs.map((d) => [d.et.doc_id, d.texte]));

// Déterminants singuliers (articles définis, indéfinis, contractés ; démonstratifs).
const DET = new Set(['le', 'la', 'un', 'une', 'du', 'au', 'ce', 'cet', 'cette']);
const elide = (m) => /(?:^|[\s«“"(])[lL]['’]$/.test(texteDe[m.doc].slice(Math.max(0, m.start - 3), m.start));
const determinant = (m) => m.type === 'PERSONNE' && m.nbMots === 1 && (DET.has(m.motPrecedent.toLowerCase()) || elide(m));
const CIV = new Set(['monsieur', 'madame', 'mademoiselle', 'messieurs', 'mesdames', 'mesdemoiselles', 'maître', 'docteur', 'professeur', 'm', 'mm', 'mme', 'mmes', 'mlle', 'mlles', 'me', 'mes', 'dr', 'pr']);
const civilite = (m) => m.type === 'PERSONNE' && m.texte.split(/\s+/).every((w) => CIV.has(w.toLowerCase().replace(/\.$/, '')));
const divers = (m) => m.type === 'DIVERS';
const seuil = (s) => (m) => m.score < s;

const scenarios = {
  'base': () => false,
  'A déterminant (PER 1 mot)': determinant,
  'B civilités seules': civilite,
  'C sans DIVERS': divers,
  'A+B+C': (m) => determinant(m) || civilite(m) || divers(m),
  'seuil 0,7 (comparaison)': seuil(0.7),
};
const pc = (x) => `${(x.valeur * 100).toFixed(1)} % (${x.trouves}/${x.total})`;
for (const [nom, retirer] of Object.entries(scenarios)) {
  const retires = masques.filter(retirer);
  const st = {};
  for (const m of retires) st[m.statut] = (st[m.statut] ?? 0) + 1;
  for (const avecRegles of [false, true]) {
    const res = docs.map(({ et, texte }) => {
      const mm = masques.filter((m) => m.doc === et.doc_id && !retirer(m)).map(({ start, end, type }) => ({ start, end, type }));
      return { doc_id: et.doc_id, texte, resultat: evaluerDocument(texte, et, avecRegles ? [...regles.detecter(texte), ...mm] : mm) };
    });
    const a = agreger(res);
    const s = Object.fromEntries(a.seuils.map((x) => [x.id, x]));
    console.log(`${nom.padEnd(26)} ${avecRegles ? 'combiné' : 'modèle '} | S2 ${pc(s.S2)} | S3 ${pc(s.S3)} | S4 ${pc(s.S4)} | S5 ${pc(s.S5)} | S6 ${(s.S6.valeur * 100).toFixed(1)} % (${s.S6.corrects} c, ${s.S6.erreurs} e)${avecRegles ? '' : ` | retirés ${JSON.stringify(st)}`}`);
  }
  if (nom !== 'base') for (const m of retires.filter((m) => m.statut !== 'erreur')) console.log(`    retiré non-erreur : ${m.doc} ${m.statut} ${m.type} ${m.score.toFixed(3)} ${JSON.stringify(m.texte)} (mot précédent ${JSON.stringify(m.motPrecedent)})`);
}

// Masques de dev pour N, W, WS, F (modèle et combiné), comparaisons multiensemble.
import fs from 'node:fs';
const R = '/Users/migranche/Dev/tkoidra/mask';
const S = process.argv[2];
const docs = fs.readdirSync(`${R}/golden/dev`).filter((f) => f.endsWith('.txt')).sort().map((f) => ({ id: f.slice(0, -4), texte: fs.readFileSync(`${R}/golden/dev/${f}`, 'utf8') }));
const chemins = { N: { modele: `${R}/src/modele.mjs`, combine: `${R}/src/combine.mjs` } };
for (const v of ['W', 'WS', 'F']) chemins[v] = { modele: `${S}/variantes/${v}/modele.mjs`, combine: `${S}/variantes/${v}/combine.mjs` };
const masques = {};
for (const [v, c] of Object.entries(chemins)) {
  masques[v] = {};
  for (const [det, chemin] of Object.entries(c)) {
    const m = await import(chemin);
    masques[v][det] = {};
    for (const d of docs) masques[v][det][d.id] = await m.detecter(d.texte);
  }
}
fs.writeFileSync(`${S}/evaluations/masques.json`, JSON.stringify(masques));
const cle = (m) => `${m.start}:${m.end}:${m.type}`;
// Masques présents d'un seul côté (multiensembles), sommés sur les 17 documents.
function diff(a, b) {
  let seulA = 0, seulB = 0, docsDiff = 0;
  for (const id of Object.keys(a)) {
    const comp = new Map();
    for (const m of a[id]) comp.set(cle(m), (comp.get(cle(m)) ?? 0) + 1);
    for (const m of b[id]) comp.set(cle(m), (comp.get(cle(m)) ?? 0) - 1);
    let x = 0, y = 0;
    for (const n of comp.values()) n > 0 ? (x += n) : (y -= n);
    seulA += x; seulB += y; if (x || y) docsDiff++;
  }
  return { seulA, seulB, total: seulA + seulB, docsDiff };
}
const sortie = {};
for (const v of Object.keys(masques)) for (const det of ['modele', 'combine']) {
  sortie[`${v} ${det}`] = { nb: Object.values(masques[v][det]).reduce((s, l) => s + l.length, 0), vsF: diff(masques[v][det], masques.F[det]), vsW: diff(masques[v][det], masques.W[det]), vsN: diff(masques[v][det], masques.N[det]) };
}
console.log(JSON.stringify(sortie, null, 1));
// Contrôles : N = référence commitée ; W = navigateur (toutes les visites de chrome.json) ; WS (Node) = WS navigateur.
const ref = JSON.parse(fs.readFileSync(`${R}/resultats/navigateur/reference-node-dev.json`));
console.log('N = reference-node-dev (modele, combine) :', ref.documents.every((d) => JSON.stringify(d.masques.modele) === JSON.stringify(masques.N.modele[d.id]) && JSON.stringify(d.masques.combine) === JSON.stringify(masques.N.combine[d.id])));
const chrome = JSON.parse(fs.readFileSync(`${R}/resultats/navigateur/chrome.json`));
const visites = chrome.visites.filter((v) => v.resultat?.ok);
console.log(`W = navigateur Chrome : ${visites.filter((v) => v.resultat.documents.every((d) => JSON.stringify(d.masques.modele) === JSON.stringify(masques.W.modele[d.id]) && JSON.stringify(d.masques.combine) === JSON.stringify(masques.W.combine[d.id]))).length}/${visites.length} visites identiques (modèle et combiné, 17 documents)`);
const wsNav = JSON.parse(fs.readFileSync(`${S}/ws-navigateur.json`));
console.log('WS Node = WS navigateur (1.30.0 dans Chrome) :', wsNav.documents.every((d) => JSON.stringify(d.masques.modele) === JSON.stringify(masques.WS.modele[d.id])));

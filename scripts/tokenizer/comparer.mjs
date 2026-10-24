// Comparaison du tokenizer actuel (Xenova/camembert-ner, révision 8e19882) et du tokenizer de
// provenance propre (scripts/tokenizer/generer.py, depuis Jean-Baptiste/camembert-ner au commit
// ef35fe7), dans Node avec Transformers.js, la bibliothèque du navigateur (seuils.md,
// amendement (7), puce « Tokenizer »).
//
//   node scripts/tokenizer/comparer.mjs
//   node scripts/tokenizer/comparer.mjs --sortie <fichier.json>
//
// a) Identifiants de tokens, pour chaque document du jeu de développement, de trois façons :
//    texte brut entier, copie tokenisable entière (copieTokenisable), et mot par mot comme le
//    détecteur (decouperMots + tokeniserMots de src/modele-commun.mjs, entre <s> et </s>).
// b) Différences de structure entre les deux tokenizer.json et les deux tokenizer_config.json.
//
// Jeu de développement uniquement : ni le jeu de test ni le jeu de robustesse.
// Fichiers vérifiés contre modeles/MANIFEST.sha256 avant tout usage ; aucun accès réseau.
// Code de sortie 1 et dix premiers écarts affichés si un identifiant diffère.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copieTokenisable, decouperMots, preparer, tokeniserMots } from '../../src/modele-commun.mjs';
import { RACINE_MODELES, lireManifeste, sha256Fichier } from '../../src/modele-fichiers.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEV = path.join(RACINE, 'golden', 'dev');
const SORTIE_DEFAUT = path.join(RACINE, 'resultats', 'tokenizer', 'comparaison.json');

const ACTUEL = {
  nom: 'actuel (Xenova/camembert-ner@8e19882)',
  tokenizer: 'camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/tokenizer.json',
  configTokenizer: 'camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/tokenizer_config.json',
  config: 'camembert-ner/8e1988247e872ba0137062653b1e5033a31e14fc/config.json',
};
const NOUVEAU = {
  nom: 'nouveau (Jean-Baptiste/camembert-ner@ef35fe7, scripts/tokenizer/generer.py)',
  tokenizer: 'tokenizer/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/tokenizer.json',
  configTokenizer: 'camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/tokenizer_config.json',
  config: 'camembert-ner/ef35fe7767c1dad71f5c853838cdd80d0b3441ed/config.json',
};

const i = process.argv.indexOf('--sortie');
const sortie = i > 0 ? path.resolve(process.argv[i + 1]) : SORTIE_DEFAUT;

// Contenu JSON d'un fichier du manifeste, après vérification de son empreinte.
const manifeste = lireManifeste();
async function lireVerifie(cle) {
  const attendu = manifeste.get(cle);
  if (!attendu) throw new Error(`${cle} absent de modeles/MANIFEST.sha256`);
  const chemin = path.join(RACINE_MODELES, ...cle.split('/'));
  const obtenu = await sha256Fichier(chemin);
  if (obtenu !== attendu) throw new Error(`empreinte de ${cle} : ${obtenu}, le manifeste attend ${attendu}`);
  return { cle, sha256: obtenu, octets: fs.statSync(chemin).size, json: JSON.parse(fs.readFileSync(chemin, 'utf8')) };
}

const lib = await import('@huggingface/transformers');
lib.env.allowLocalModels = true;
lib.env.allowRemoteModels = false;
lib.env.useFSCache = false;
lib.env.useBrowserCache = false;
lib.env.fetch = (url) => {
  throw new Error(`accès réseau interdit (${url})`);
};
const versionLib = JSON.parse(fs.readFileSync(path.join(RACINE, 'node_modules', '@huggingface', 'transformers', 'package.json'), 'utf8')).version;

async function charger(t) {
  const fichiers = { tokenizer: await lireVerifie(t.tokenizer), configTokenizer: await lireVerifie(t.configTokenizer), config: await lireVerifie(t.config) };
  const c = preparer(lib, { tokenizerJson: fichiers.tokenizer.json, tokenizerConfig: fichiers.configTokenizer.json, config: fichiers.config.json });
  return { ...t, fichiers, ...c };
}
const a = await charger(ACTUEL);
const n = await charger(NOUVEAU);

// --- a) Identifiants --------------------------------------------------------------

const MODES = {
  brut: (c, texte) => c.tokenizer.encode(texte),
  copie: (c, texte) => c.tokenizer.encode(copieTokenisable(texte)),
  'mot par mot': (c, texte) => [c.bos, ...tokeniserMots(c.tokenizer, texte, decouperMots(texte)).flat(), c.eos],
};

const fichiers = fs.readdirSync(DEV).filter((f) => f.endsWith('.txt')).sort();
const parMode = Object.fromEntries(Object.keys(MODES).map((m) => [m, { documents: 0, identiques: 0, tokens: 0, ecarts: 0 }]));
const ecarts = [];
let caracteres = 0;
for (const f of fichiers) {
  const texte = fs.readFileSync(path.join(DEV, f), 'utf8');
  caracteres += texte.length;
  for (const [mode, encoder] of Object.entries(MODES)) {
    const ia = encoder(a, texte);
    const ib = encoder(n, texte);
    const r = parMode[mode];
    r.documents++;
    r.tokens += ia.length;
    let ecartsDoc = 0;
    for (let k = 0; k < Math.max(ia.length, ib.length); k++) {
      if (ia[k] === ib[k]) continue;
      ecartsDoc++;
      ecarts.push({ document: f, mode, position: k, actuel: ia[k] === undefined ? null : `${ia[k]}:${a.pieces[ia[k]]}`, nouveau: ib[k] === undefined ? null : `${ib[k]}:${n.pieces[ib[k]]}` });
    }
    r.ecarts += ecartsDoc;
    if (ia.length !== ib.length) r.longueursDifferentes = (r.longueursDifferentes ?? 0) + 1;
    if (!ecartsDoc) r.identiques++;
  }
}

// --- b) Structure -------------------------------------------------------------------

// Différences entre deux valeurs JSON : [{ chemin, actuel, nouveau }], valeurs longues abrégées.
const abrege = (v) => {
  if (v === undefined) return '(absent)';
  const s = JSON.stringify(v);
  return s.length > 160 ? `${s.slice(0, 120)}… (${s.length} caractères)` : v;
};
function differences(x, y, chemin = '') {
  if (JSON.stringify(x) === JSON.stringify(y)) return [];
  const objets = x && y && typeof x === 'object' && typeof y === 'object' && Array.isArray(x) === Array.isArray(y);
  if (!objets) return [{ chemin: chemin || '(racine)', actuel: abrege(x), nouveau: abrege(y) }];
  const cles = Array.isArray(x) ? [...Array(Math.max(x.length, y.length)).keys()] : [...new Set([...Object.keys(x), ...Object.keys(y)])];
  return cles.flatMap((k) => differences(x[k], y[k], chemin ? `${chemin}.${k}` : String(k)));
}

const ta = a.fichiers.tokenizer.json;
const tb = n.fichiers.tokenizer.json;
const { vocab: va, ...modeleA } = ta.model;
const { vocab: vb, ...modeleB } = tb.model;
const vocabulaire = {
  taille: { actuel: va.length, nouveau: vb.length },
  piecesDifferentes: va.filter(([p], k) => p !== vb[k]?.[0]).length,
  scoresDifferents: va.filter(([, s], k) => s !== vb[k]?.[1]).length,
  scoresDifferentsFloat32: va.filter(([, s], k) => Math.fround(s) !== Math.fround(vb[k]?.[1])).length,
};
// Clés de premier niveau comparées une à une ; les autres éventuelles, ensemble.
const CLES = ['version', 'truncation', 'padding', 'added_tokens', 'normalizer', 'pre_tokenizer', 'post_processor', 'decoder'];
const autres = (t) => Object.fromEntries(Object.keys(t).filter((k) => k !== 'model' && !CLES.includes(k)).map((k) => [k, t[k]]));
const structure = {
  tokenizer: {
    vocabulaire,
    model: differences(modeleA, modeleB, 'model'),
    ...Object.fromEntries(CLES.map((k) => [k, differences(ta[k], tb[k], k)])),
    autresCles: differences(autres(ta), autres(tb)),
  },
  tokenizerConfig: differences(a.fichiers.configTokenizer.json, n.fichiers.configTokenizer.json),
};

// --- Rapport ------------------------------------------------------------------------

const fichier = (f) => ({ cle: f.cle, sha256: f.sha256, octets: f.octets });
const rapport = {
  date: new Date().toISOString(),
  bibliotheque: `@huggingface/transformers ${versionLib}`,
  node: process.version,
  jeu: { dossier: 'golden/dev', documents: fichiers.length, caracteres },
  tokenizers: Object.fromEntries([a, n].map((t) => [t === a ? 'actuel' : 'nouveau', { nom: t.nom, tokenizer: fichier(t.fichiers.tokenizer), tokenizerConfig: fichier(t.fichiers.configTokenizer), config: fichier(t.fichiers.config), bos: t.bos, eos: t.eos }])),
  identifiants: { parMode, ecarts: ecarts.length, premiers: ecarts.slice(0, 10) },
  structure,
};
fs.mkdirSync(path.dirname(sortie), { recursive: true });
fs.writeFileSync(sortie, JSON.stringify(rapport, null, 2) + '\n');

for (const [mode, r] of Object.entries(parMode)) console.log(`${mode} : ${r.documents} documents, ${r.identiques} identiques, ${r.tokens} identifiants (actuel), ${r.ecarts} écarts`);
console.log(`vocabulaire : ${va.length} / ${vb.length} entrées, ${vocabulaire.piecesDifferentes} pièces différentes, ${vocabulaire.scoresDifferents} scores différents (${vocabulaire.scoresDifferentsFloat32} en float32)`);
for (const [k, d] of Object.entries(structure.tokenizer)) if (Array.isArray(d)) console.log(`tokenizer.json ${k} : ${d.length ? JSON.stringify(d) : 'identique'}`);
console.log(`tokenizer_config.json : ${structure.tokenizerConfig.length} différences`);
for (const d of structure.tokenizerConfig) console.log(`  ${d.chemin} : ${JSON.stringify(d.actuel)} → ${JSON.stringify(d.nouveau)}`);
if (ecarts.length) {
  console.log(`ÉCARTS : ${ecarts.length} ; dix premiers :`);
  for (const e of ecarts.slice(0, 10)) console.log(`  ${e.document} [${e.mode}] position ${e.position} : actuel ${e.actuel}, nouveau ${e.nouveau}`);
}
console.log(`rapport : ${path.relative(RACINE, sortie)}`);
process.exit(ecarts.length ? 1 : 0);

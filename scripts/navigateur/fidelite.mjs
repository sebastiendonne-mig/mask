// Fidélité d'un modèle ONNX par rapport à un étalon (seuils.md, amendement (5), point Fidélité).
//
//   node scripts/navigateur/fidelite.mjs <étalon.onnx> <comparé.onnx> --sortie <dossier>/<nom>
//
// Écrit <nom>.json et <nom>.md. Chemins relatifs au dossier courant.
//
// Détecteur : modele 0.2.0 (src/modele-commun.mjs : detecter(), entités PERSONNE faites
// seulement de civilités écartées), tokenizer et configuration Xenova épinglés au lot 1.5a.
// Seule la session ONNX change d'un fichier à l'autre.
//
// Moteur de référence : onnxruntime-web 1.31.0-dev.20260914-8d85527a0, build WebAssembly
// exécuté dans Node (ort.node.min.mjs), 1 thread, session sans options : exécuté comme la
// variante W du diagnostic du 22/10 (resultats/navigateur/diagnostic-moteurs-2026-10-22/).
//
// Jeu de développement seul (17 documents). Un fichier modèle dont l'empreinte SHA-256
// n'est pas dans modeles/MANIFEST.sha256 est refusé.
//
// Définition : un masque est (début, fin, catégorie) tel que renvoyé par detecter(), avant
// la fusion des chevauchements par l'évaluateur. Comparaison document par document, en
// comptant les répétitions ; un masque différent est un masque présent d'un seul côté.
// Fidélité = somme sur les 17 documents ; documents touchés rapportés à côté.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { fabriqueDetecteur, preparer, version as versionModele } from '../../src/modele-commun.mjs';
import { DOSSIER, RACINE_MODELES, lireManifeste, sha256Fichier, verifierFichiers } from '../../src/modele-fichiers.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const VERSION_ORT = '1.31.0-dev.20260914-8d85527a0';
export const LOGIQUE = '0.2.0';
const NB_DOCUMENTS = 17;

// --- Comparaison (logique pure) ---------------------------------------------------------

export const cle = (m) => `${m.start}:${m.end}:${m.type}`;
const ordre = (a, b) => a.start - b.start || a.end - b.end || a.type.localeCompare(b.type);

// Masques présents d'un seul côté, répétitions comptées (multiensembles).
export function comparerDocument(etalon, compare) {
  const solde = new Map();
  const exemple = new Map();
  for (const [masques, signe] of [[etalon, 1], [compare, -1]]) {
    for (const m of masques) {
      solde.set(cle(m), (solde.get(cle(m)) ?? 0) + signe);
      exemple.set(cle(m), m);
    }
  }
  const seulEtalon = [];
  const seulCompare = [];
  for (const [k, n] of solde) {
    const { start, end, type } = exemple.get(k);
    for (let i = 0; i < Math.abs(n); i++) (n > 0 ? seulEtalon : seulCompare).push({ start, end, type });
  }
  seulEtalon.sort(ordre);
  seulCompare.sort(ordre);
  return { seulEtalon, seulCompare, total: seulEtalon.length + seulCompare.length };
}

// etalon, compare : { id: [masques] }, mêmes documents des deux côtés.
export function comparer(etalon, compare) {
  const ids = Object.keys(etalon).sort();
  const autres = Object.keys(compare).sort();
  if (ids.length !== autres.length || ids.some((id, i) => id !== autres[i])) throw new Error('fidélité : documents différents entre étalon et comparé');
  const documents = ids.map((id) => ({ id, nbEtalon: etalon[id].length, nbCompare: compare[id].length, ...comparerDocument(etalon[id], compare[id]) }));
  return {
    total: documents.reduce((s, d) => s + d.total, 0),
    seulEtalon: documents.reduce((s, d) => s + d.seulEtalon.length, 0),
    seulCompare: documents.reduce((s, d) => s + d.seulCompare.length, 0),
    documentsTouches: documents.filter((d) => d.total > 0).length,
    documents,
  };
}

// --- Exécution ------------------------------------------------------------------------

function verifierArguments(argv) {
  const { values, positionals } = parseArgs({ args: argv, strict: true, allowPositionals: true, options: { sortie: { type: 'string' } } });
  if (positionals.length !== 2) throw new Error('usage : node scripts/navigateur/fidelite.mjs <étalon.onnx> <comparé.onnx> --sortie <dossier>/<nom>');
  if (!values.sortie) throw new Error('--sortie <dossier>/<nom> requis');
  return { etalon: path.resolve(positionals[0]), compare: path.resolve(positionals[1]), sortie: path.resolve(values.sortie) };
}

function etatGit() {
  const git = (...a) => execFileSync('git', a, { cwd: RACINE, encoding: 'utf8' });
  return { hash: git('rev-parse', 'HEAD').trim(), propre: git('status', '--porcelain', '--untracked-files=all').trim() === '' };
}

// Fichier modèle : taille, empreinte, entrée du manifeste (refus si absente).
async function decrireModele(chemin) {
  const sha256 = await sha256Fichier(chemin);
  const entree = [...lireManifeste()].find(([, h]) => h === sha256)?.[0];
  if (!entree) throw new Error(`fidélité : ${chemin} (SHA-256 ${sha256}) absent de modeles/MANIFEST.sha256`);
  return { chemin: path.relative(RACINE, chemin), octets: fs.statSync(chemin).size, sha256, manifeste: entree };
}

function documentsDev() {
  const dossier = path.join(RACINE, 'golden', 'dev');
  const docs = fs.readdirSync(dossier).filter((f) => f.endsWith('.txt')).sort().map((f) => ({ id: f.slice(0, -4), texte: fs.readFileSync(path.join(dossier, f), 'utf8') }));
  if (docs.length !== NB_DOCUMENTS) throw new Error(`fidélité : ${docs.length} documents dans golden/dev, attendu ${NB_DOCUMENTS}`);
  return docs;
}

// Tokenizer et configuration épinglés (lot 1.5a), accès réseau de la bibliothèque interdit.
async function preparerBase() {
  await verifierFichiers();
  const lib = await import('@huggingface/transformers');
  lib.env.allowLocalModels = true;
  lib.env.allowRemoteModels = false;
  lib.env.useFSCache = false;
  lib.env.useBrowserCache = false;
  lib.env.fetch = (url) => {
    throw new Error(`fidélité : accès réseau interdit (${url})`);
  };
  const lire = (f) => JSON.parse(fs.readFileSync(path.join(DOSSIER, f), 'utf8'));
  return preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
}

// Masques de detecter() sur chaque document, session WASM ouverte puis libérée.
async function masquesModele(ort, base, chemin, docs) {
  const session = await ort.InferenceSession.create(fs.readFileSync(chemin));
  const modele = async ({ input_ids, attention_mask }) => {
    const o = await session.run({
      input_ids: new ort.Tensor('int64', input_ids.data, input_ids.dims),
      attention_mask: new ort.Tensor('int64', attention_mask.data, attention_mask.dims),
    });
    return { logits: { dims: o.logits.dims, data: o.logits.data } };
  };
  const detecter = fabriqueDetecteur(async () => ({ ...base, modele }))();
  const masques = {};
  for (const { id, texte } of docs) masques[id] = await detecter(texte);
  await session.release();
  return masques;
}

const fmtMasque = (texte, m) => `${m.start}–${m.end} ${m.type} « ${texte.slice(m.start, m.end).replace(/\s+/g, ' ')} »`;

function rapportMarkdown(r, textes) {
  const l = [];
  l.push(`# Fidélité : ${r.compare.manifeste} contre l'étalon ${r.etalon.manifeste}`, '');
  l.push(`- Date : ${r.date}`);
  l.push(`- Commit : \`${r.git.hash}\`${r.git.propre ? '' : ' + modifications non commitées'} (arbre propre : ${r.git.propre ? 'oui' : 'non'}) ; script \`${r.script.chemin}\` SHA-256 \`${r.script.sha256}\``);
  l.push(`- Moteur : onnxruntime-web ${r.moteur.version} (${r.moteur.build}), ${r.moteur.threads} thread, Node ${r.moteur.node}`);
  l.push(`- Détecteur : modele ${r.detecteur.logique} (${r.detecteur.module}), tokenizer et configuration ${r.detecteur.tokenizer}`);
  l.push(`- Jeu : développement, ${r.documents.length} documents`);
  l.push(`- Définition : ${r.definition}`, '');
  l.push('| Rôle | Fichier | Octets | SHA-256 |', '|---|---|---|---|');
  for (const [role, f] of [['étalon', r.etalon], ['comparé', r.compare]]) l.push(`| ${role} | \`${f.chemin}\` | ${f.octets} | \`${f.sha256}\` |`);
  l.push('', '## Résultat', '');
  l.push(`**Fidélité : ${r.total} masques différents** (${r.seulEtalon} seulement dans l'étalon, ${r.seulCompare} seulement dans le comparé), **${r.documentsTouches} documents touchés** sur ${r.documents.length}.`, '');
  l.push('| Document | Masques étalon | Masques comparé | Seulement étalon | Seulement comparé | Différents |', '|---|---|---|---|---|---|');
  for (const d of r.documents) l.push(`| ${d.id} | ${d.nbEtalon} | ${d.nbCompare} | ${d.seulEtalon.length} | ${d.seulCompare.length} | ${d.total} |`);
  l.push(`| **Total** | ${r.documents.reduce((s, d) => s + d.nbEtalon, 0)} | ${r.documents.reduce((s, d) => s + d.nbCompare, 0)} | ${r.seulEtalon} | ${r.seulCompare} | ${r.total} |`);
  const touches = r.documents.filter((d) => d.total > 0);
  if (touches.length) {
    l.push('', '## Détail par document', '');
    for (const d of touches) {
      l.push(`### ${d.id} (${d.total})`, '');
      for (const m of d.seulEtalon) l.push(`- étalon seul : ${fmtMasque(textes[d.id], m)}`);
      for (const m of d.seulCompare) l.push(`- comparé seul : ${fmtMasque(textes[d.id], m)}`);
      l.push('');
    }
  }
  return l.join('\n').trimEnd() + '\n';
}

async function principal() {
  let options;
  try {
    options = verifierArguments(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (!versionModele.startsWith(`${LOGIQUE}+`)) throw new Error(`fidélité : logique du modèle ${versionModele}, attendu ${LOGIQUE}`);

  // L'état git est relevé avant d'écrire le moindre fichier de résultat.
  const git = etatGit();
  const date = new Date().toISOString();
  const cheminScript = fileURLToPath(import.meta.url);
  const etalon = await decrireModele(options.etalon);
  const compare = await decrireModele(options.compare);

  const ort = await import(path.join(RACINE, 'node_modules', 'onnxruntime-web', 'dist', 'ort.node.min.mjs'));
  if (ort.env.versions.web !== VERSION_ORT) throw new Error(`fidélité : onnxruntime-web ${ort.env.versions.web}, attendu ${VERSION_ORT}`);
  ort.env.wasm.numThreads = 1;

  const base = await preparerBase();
  const docs = documentsDev();
  const masquesEtalon = await masquesModele(ort, base, options.etalon, docs);
  const masquesCompare = await masquesModele(ort, base, options.compare, docs);
  const resultat = comparer(masquesEtalon, masquesCompare);

  const rapport = {
    date,
    git,
    script: { chemin: path.relative(RACINE, cheminScript), sha256: await sha256Fichier(cheminScript) },
    moteur: { paquet: 'onnxruntime-web', version: ort.env.versions.web, build: 'WASM, ort.node.min.mjs dans Node', threads: ort.env.wasm.numThreads, node: process.versions.node },
    detecteur: { logique: LOGIQUE, module: 'src/modele-commun.mjs', tokenizer: path.relative(RACINE_MODELES, DOSSIER) },
    split: 'dev',
    definition: 'seuils.md, amendement (5), point Fidélité : masque = (début, fin, catégorie) de detecter(), avant fusion ; par document, répétitions comptées ; masque différent = présent d’un seul côté ; somme sur les 17 documents',
    etalon,
    compare,
    ...resultat,
  };

  fs.mkdirSync(path.dirname(options.sortie), { recursive: true });
  fs.writeFileSync(options.sortie + '.json', JSON.stringify(rapport, null, 2) + '\n');
  fs.writeFileSync(options.sortie + '.md', rapportMarkdown(rapport, Object.fromEntries(docs.map((d) => [d.id, d.texte]))));
  console.log(`fidélité : ${resultat.total} masques différents (${resultat.seulEtalon} étalon seul, ${resultat.seulCompare} comparé seul), ${resultat.documentsTouches}/${docs.length} documents touchés`);
  console.log(`rapport : ${path.relative(process.cwd(), options.sortie)}.{json,md} — commit ${git.hash.slice(0, 7)}${git.propre ? '' : ' + modifications non commitées'}`);
}

if (import.meta.main) await principal();

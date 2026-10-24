// Serveur local du banc de mesure navigateur (lot 1.5b). Aucune dépendance.
//
//   node bench/serveur.mjs [--port 8123] [--isolation on|off] [--debit 100]
//
// - Écoute sur 127.0.0.1 seulement.
// - Liste blanche : seuls les fichiers nommés ci-dessous sont servis ; tout autre chemin
//   répond 404 (golden/test et ses modèles sont inatteignables par construction).
// - --isolation on : en-têtes COOP/COEP, la page devient crossOriginIsolated (threads WASM).
// - --debit N : débit global simulé de N Mb/s, partagé par toutes les réponses en cours (et,
//   au banc, par le proxy de bench/proxy.mjs : même limiteur, option limiteur de creerServeur).
// - CSP sur toutes les réponses : aucun script tiers ; connexions limitées à l'origine et aux
//   origines du dépôt Hugging Face du modèle (huggingface.co, *.hf.co ; même règle que
//   hoteAutorise de bench/proxy.mjs).
// - transformers.web.min.js est servi avec ses deux spécificateurs nus réécrits en chemins
//   locaux (ce que ferait un bundler) : un Worker n'hérite pas de l'import map de la page.
// - Candidats de l'option 3 : les fichiers modeles/compression/<recette>/model.onnx inscrits
//   dans modeles/MANIFEST.sha256 sont servis aussi (option 3, étape 2f).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { REVISION, FICHIERS } from '../src/modele-commun.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NM = path.join(RACINE, 'node_modules');
const ORT_DIST = path.join(NM, 'onnxruntime-web', 'dist');
// Copie d'onnxruntime-common utilisée par onnxruntime-web (1.31.0-dev), pas celle du niveau
// supérieur (1.30.0, pour onnxruntime-node).
const ORT_COMMON = path.join(NM, 'onnxruntime-web', 'node_modules', 'onnxruntime-common', 'dist', 'esm');
const TRANSFORMERS = path.join(NM, '@huggingface', 'transformers', 'dist', 'transformers.web.min.js');

export const VARIANTES_WASM = ['ort-wasm-simd-threaded.asyncify', 'ort-wasm-simd-threaded'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.sha256': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
};

export const CSP = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://huggingface.co https://*.hf.co",
  "style-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

// --- Liste blanche ---------------------------------------------------------------

const fixes = new Map([
  ['/bench/index.html', path.join(RACINE, 'bench', 'index.html')],
  ['/bench/page.mjs', path.join(RACINE, 'bench', 'page.mjs')],
  ['/bench/travailleur.mjs', path.join(RACINE, 'bench', 'travailleur.mjs')],
  ['/bench/diagnostic.mjs', path.join(RACINE, 'bench', 'diagnostic.mjs')],
  ['/bench/banc.css', path.join(RACINE, 'bench', 'banc.css')],
  ['/src/regles.mjs', path.join(RACINE, 'src', 'regles.mjs')],
  ['/src/modele-commun.mjs', path.join(RACINE, 'src', 'modele-commun.mjs')],
  ['/src/modele-navigateur.mjs', path.join(RACINE, 'src', 'modele-navigateur.mjs')],
  ['/resultats/navigateur/reference-node-dev.json', path.join(RACINE, 'resultats', 'navigateur', 'reference-node-dev.json')],
  ['/vendor/ort/ort.webgpu.bundle.min.mjs', path.join(ORT_DIST, 'ort.webgpu.bundle.min.mjs')],
  ['/modeles/MANIFEST.sha256', path.join(RACINE, 'modeles', 'MANIFEST.sha256')],
]);
for (const v of VARIANTES_WASM) for (const ext of ['.mjs', '.wasm']) fixes.set(`/vendor/ort/${v}${ext}`, path.join(ORT_DIST, v + ext));
for (const f of FICHIERS) fixes.set(`/modeles/camembert-ner/${REVISION}/${f}`, path.join(RACINE, 'modeles', 'camembert-ner', REVISION, ...f.split('/')));
for (const f of fs.readdirSync(ORT_COMMON).filter((x) => /^[a-z-]+\.js$/.test(x))) fixes.set(`/vendor/onnxruntime-common/${f}`, path.join(ORT_COMMON, f));
export const CANDIDAT = /^[0-9a-f]{64} [ *](compression\/[a-z0-9-]+\/model\.onnx)$/;
for (const ligne of fs.readFileSync(path.join(RACINE, 'modeles', 'MANIFEST.sha256'), 'utf8').split('\n')) {
  const m = CANDIDAT.exec(ligne);
  if (m) fixes.set(`/modeles/${m[1]}`, path.join(RACINE, 'modeles', ...m[1].split('/')));
}

// Fichiers versionnés (chemin qui change avec la version) : mis en cache sans revalidation.
const immuable = (chemin) => chemin.startsWith('/vendor/') || chemin.startsWith('/modeles/camembert-ner/') || chemin.startsWith('/modeles/compression/');

const DOC_DEV = /^\/golden\/dev\/(dev-[a-z]+-\d{2})\.txt$/;

// Chemin d'URL → { fichier } ou { genere: 'transformers' | 'index-dev' } ou null (404).
// Pure : aucun accès disque pour un chemin refusé.
export function resoudre(chemin) {
  if (fixes.has(chemin)) return { fichier: fixes.get(chemin) };
  if (chemin === '/vendor/transformers.web.min.js') return { genere: 'transformers' };
  if (chemin === '/golden/dev/index.json') return { genere: 'index-dev' };
  const m = DOC_DEV.exec(chemin);
  if (m) return { fichier: path.join(RACINE, 'golden', 'dev', `${m[1]}.txt`) };
  return null;
}

// --- Contenus générés ------------------------------------------------------------

const REECRITURES = [
  ['from"onnxruntime-web/webgpu"', 'from"/vendor/ort/ort.webgpu.bundle.min.mjs"'],
  ['from"onnxruntime-common"', 'from"/vendor/onnxruntime-common/index.js"'],
];

export function transformersReecrit() {
  const original = fs.readFileSync(TRANSFORMERS, 'utf8');
  let texte = original;
  for (const [avant, apres] of REECRITURES) {
    const n = texte.split(avant).length - 1;
    if (n !== 1) throw new Error(`banc : ${avant} trouvé ${n} fois dans ${TRANSFORMERS} (1 attendu)`);
    texte = texte.replace(avant, apres);
  }
  const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
  return { corps: Buffer.from(texte), shaOriginal: sha(original), shaServi: sha(texte) };
}

function indexDev() {
  const ids = fs.readdirSync(path.join(RACINE, 'golden', 'dev')).filter((f) => DOC_DEV.test(`/golden/dev/${f}`)).sort().map((f) => f.replace(/\.txt$/, ''));
  return Buffer.from(JSON.stringify(ids));
}

// --- Débit simulé ----------------------------------------------------------------

// Seau partagé : chaque morceau réserve sa durée d'émission à la suite des précédents.
export function creerLimiteur(mbps) {
  if (!mbps) return null;
  const octetsParMs = (mbps * 1e6) / 8 / 1000;
  let libre = 0;
  return (taille) => {
    const maintenant = performance.now();
    libre = Math.max(libre, maintenant) + taille / octetsParMs;
    return libre - maintenant;
  };
}

const MORCEAU = 64 * 1024;

async function ecrire(res, corps, limiteur) {
  for (let i = 0; i < corps.length; i += MORCEAU) {
    const morceau = corps.subarray(i, i + MORCEAU);
    if (limiteur) await new Promise((r) => setTimeout(r, limiteur(morceau.length)));
    if (!res.write(morceau)) await new Promise((r) => res.once('drain', r));
    if (res.destroyed) return;
  }
}

async function ecrireFichier(res, fichier, limiteur) {
  for await (const morceau of fs.createReadStream(fichier, { highWaterMark: MORCEAU })) {
    if (limiteur) await new Promise((r) => setTimeout(r, limiteur(morceau.length)));
    if (!res.write(morceau)) await new Promise((r) => res.once('drain', r));
    if (res.destroyed) return;
  }
}

// --- Serveur ---------------------------------------------------------------------

// limiteur : seau partagé (creerLimiteur) ; à défaut, un seau propre de debit Mb/s.
export function creerServeur({ isolation = false, debit = 0, limiteur = creerLimiteur(debit) } = {}) {
  const journal = [];
  const transformers = transformersReecrit();
  const debut = performance.now();

  const serveur = http.createServer(async (req, res) => {
    const chemin = new URL(req.url, 'http://127.0.0.1').pathname;
    const entree = { t: Math.round(performance.now() - debut), methode: req.method, chemin, statut: 0, octets: 0 };
    journal.push(entree);
    const entetes = {
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Resource-Policy': 'same-origin',
    };
    if (isolation) {
      entetes['Cross-Origin-Opener-Policy'] = 'same-origin';
      entetes['Cross-Origin-Embedder-Policy'] = 'require-corp';
    }
    const repondre = (statut) => {
      entree.statut = statut;
      res.writeHead(statut, entetes);
      res.end();
    };
    if (req.method !== 'GET') return repondre(405);
    if (chemin === '/' || chemin === '/bench' || chemin === '/bench/') {
      entetes.Location = '/bench/index.html';
      return repondre(302);
    }
    const cible = resoudre(chemin);
    if (!cible) return repondre(404);

    let corps = null;
    let taille;
    if (cible.genere === 'transformers') corps = transformers.corps;
    else if (cible.genere === 'index-dev') corps = indexDev();
    if (corps) taille = corps.length;
    else {
      try {
        taille = fs.statSync(cible.fichier).size;
      } catch {
        return repondre(404);
      }
    }
    const ext = cible.genere === 'transformers' ? '.js' : cible.genere === 'index-dev' ? '.json' : path.extname(cible.fichier);
    entetes['Content-Type'] = TYPES[ext] ?? 'application/octet-stream';
    entetes['Content-Length'] = taille;
    entetes['Cache-Control'] = immuable(chemin) ? 'public, max-age=31536000, immutable' : 'no-cache';
    entree.statut = 200;
    entree.octets = taille;
    res.writeHead(200, entetes);
    if (corps) await ecrire(res, corps, limiteur);
    else await ecrireFichier(res, cible.fichier, limiteur);
    res.end();
  });

  return {
    serveur,
    journal,
    transformers: { shaOriginal: transformers.shaOriginal, shaServi: transformers.shaServi, octets: transformers.corps.length },
    ecouter: (port = 0) => new Promise((ok) => serveur.listen(port, '127.0.0.1', () => ok(serveur.address().port))),
    fermer: () => new Promise((ok) => serveur.close(ok)),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: { port: { type: 'string', default: '8123' }, isolation: { type: 'string', default: 'on' }, debit: { type: 'string', default: '0' } },
  });
  if (!['on', 'off'].includes(values.isolation)) throw new Error('--isolation on|off');
  const s = creerServeur({ isolation: values.isolation === 'on', debit: Number(values.debit) });
  const port = await s.ecouter(Number(values.port));
  console.log(`banc : http://127.0.0.1:${port}/bench/index.html (isolation ${values.isolation}, débit ${Number(values.debit) ? values.debit + ' Mb/s' : 'non limité'})`);
  console.log('Ctrl+C pour arrêter.');
}

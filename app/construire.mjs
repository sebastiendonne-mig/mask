// Construction de la page de la préversion : copie dans app/dist/ (ignoré par git) des fichiers
// servis, à la même origine. Aucun bundler : le code est déjà en modules ES natifs ; le seul
// changement de contenu est celui du banc (bench/serveur.mjs, transformersReecrit) : les deux
// spécificateurs nus de transformers.web.min.js réécrits en chemins locaux.
//
//   node app/construire.mjs          (Vercel : buildCommand de vercel.json, à la racine)
//
// Liste fermée : rien d'autre n'est copié (ni golden/test, ni modèles, ni données). Les trois
// exemples viennent du jeu de développement (fictif).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { transformersReecrit } from '../bench/serveur.mjs';

const APP = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(APP, '..');
export const DIST = path.join(APP, 'dist');
const NM = path.join(RACINE, 'node_modules');
const ORT_DIST = path.join(NM, 'onnxruntime-web', 'dist');
const ORT_COMMON = path.join(NM, 'onnxruntime-web', 'node_modules', 'onnxruntime-common', 'dist', 'esm');

export const EXEMPLES = ['dev-avocat-01', 'dev-ec-04', 'dev-rh-03'];
// Variante WASM simple seulement (app/travailleur.mjs).
const VARIANTE = 'ort-wasm-simd-threaded';

// Chemin publié → fichier source (relatif à la racine du dépôt).
export function sources() {
  const s = new Map();
  for (const f of ['index.html', 'app.css', 'app.mjs', 'logique.mjs', 'travailleur.mjs', 'icone.svg']) s.set(`/${f}`, `app/${f}`);
  for (const f of ['regles.mjs', 'modele-commun.mjs', 'modele-navigateur.mjs']) s.set(`/src/${f}`, `src/${f}`);
  s.set('/modeles/MANIFEST.sha256', 'modeles/MANIFEST.sha256');
  for (const id of EXEMPLES) s.set(`/exemples/${id}.txt`, `golden/dev/${id}.txt`);
  const ort = path.relative(RACINE, ORT_DIST);
  s.set('/vendor/ort/ort.webgpu.bundle.min.mjs', `${ort}/ort.webgpu.bundle.min.mjs`);
  for (const ext of ['.mjs', '.wasm']) s.set(`/vendor/ort/${VARIANTE}${ext}`, `${ort}/${VARIANTE}${ext}`);
  const commun = path.relative(RACINE, ORT_COMMON);
  for (const f of fs.readdirSync(ORT_COMMON).filter((x) => /^[a-z-]+\.js$/.test(x))) s.set(`/vendor/onnxruntime-common/${f}`, `${commun}/${f}`);
  return s;
}

export function construire() {
  fs.rmSync(DIST, { recursive: true, force: true });
  const ecrits = [];
  const ecrire = (publie, corps) => {
    const cible = path.join(DIST, ...publie.split('/').filter(Boolean));
    fs.mkdirSync(path.dirname(cible), { recursive: true });
    fs.writeFileSync(cible, corps);
    ecrits.push({ publie, octets: corps.length, sha256: crypto.createHash('sha256').update(corps).digest('hex') });
  };
  for (const [publie, source] of sources()) ecrire(publie, fs.readFileSync(path.join(RACINE, source)));
  ecrire('/vendor/transformers.web.min.js', transformersReecrit().corps);
  return ecrits.sort((a, b) => a.publie.localeCompare(b.publie));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ecrits = construire();
  for (const f of ecrits) console.log(`${f.sha256}  ${String(f.octets).padStart(9)}  ${f.publie}`);
  console.log(`${ecrits.length} fichiers, ${ecrits.reduce((n, f) => n + f.octets, 0)} octets → ${path.relative(RACINE, DIST)}/`);
}

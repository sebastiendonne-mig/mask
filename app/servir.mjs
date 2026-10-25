// Serveur local de la page de la préversion : sert app/dist/ (ou --dist <dossier>) avec les en-têtes
// du vercel.json de la racine du dépôt (mêmes valeurs que sur Vercel). Aucune dépendance. Écoute sur
// 127.0.0.1 seulement ; GET et HEAD.
//
//   node app/construire.mjs && node app/servir.mjs [--port 8124] [--dist <dossier>]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DIST } from './construire.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// En-têtes de la seule règle de vercel.json (source « /(.*) »).
export function entetesVercel() {
  const config = JSON.parse(fs.readFileSync(path.join(RACINE, 'vercel.json'), 'utf8'));
  if (config.headers.length !== 1 || config.headers[0].source !== '/(.*)') throw new Error('servir : une seule règle d\'en-têtes attendue, source « /(.*) »');
  return Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.sha256': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

// Chemin d'URL → fichier de dist/, ou null (hors de dist/, ou absent).
export function resoudre(chemin, racine = DIST) {
  let decode;
  try {
    decode = decodeURIComponent(chemin);
  } catch {
    return null;
  }
  if (decode === '/') decode = '/index.html';
  if (decode.includes('\0') || decode.split('/').includes('..')) return null;
  const fichier = path.join(racine, ...decode.split('/').filter(Boolean));
  if (!fichier.startsWith(racine + path.sep)) return null;
  return fs.existsSync(fichier) && fs.statSync(fichier).isFile() ? fichier : null;
}

export function creerServeur({ racine = DIST } = {}) {
  const entetes = entetesVercel();
  const journal = [];
  const serveur = http.createServer((req, res) => {
    const chemin = new URL(req.url, 'http://127.0.0.1').pathname;
    const entree = { methode: req.method, chemin, statut: 0 };
    journal.push(entree);
    const fin = (statut) => {
      entree.statut = statut;
      res.writeHead(statut, entetes);
      res.end();
    };
    if (!['GET', 'HEAD'].includes(req.method)) return fin(405);
    const fichier = resoudre(chemin, racine);
    if (!fichier) return fin(404);
    const corps = fs.readFileSync(fichier);
    entree.statut = 200;
    res.writeHead(200, { ...entetes, 'Content-Type': TYPES[path.extname(fichier)] ?? 'application/octet-stream', 'Content-Length': corps.length, 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : corps);
  });
  return {
    journal,
    ecouter: (port = 0) => new Promise((ok) => serveur.listen(port, '127.0.0.1', () => ok(serveur.address().port))),
    fermer: () =>
      new Promise((ok) => {
        serveur.closeAllConnections?.();
        serveur.close(ok);
      }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { port: { type: 'string', default: '8124' }, dist: { type: 'string', default: DIST } } });
  const racine = path.resolve(values.dist);
  if (!fs.existsSync(path.join(racine, 'index.html'))) throw new Error(`servir : ${racine}/index.html absent, lancer d'abord node app/construire.mjs`);
  const port = await creerServeur({ racine }).ecouter(Number(values.port));
  console.log(`mask (préversion) : http://127.0.0.1:${port}/ — dossier ${racine}, en-têtes de vercel.json. Ctrl+C pour arrêter.`);
}

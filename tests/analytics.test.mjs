// Mesure de fréquentation de la page (Vercel Web Analytics) : seuls scripts chargés par index.html,
// initialisation en fichier servi (la CSP interdit les scripts en ligne), fichier publié par la construction.
// Aucun navigateur ici : le trafic réseau réel est contrôlé par app/essai-chrome.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources } from '../app/construire.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(RACINE, 'app');

test('analytics : index.html ne charge comme scripts que l\'application, va-init.js puis le script de Vercel', () => {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  const balises = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  const src = balises.map((b) => b.match(/\ssrc="([^"]*)"/)?.[1]);
  assert.ok(src.every(Boolean), 'aucun script en ligne');
  assert.deepEqual(src, ['/app.mjs', '/va-init.js', '/_vercel/insights/script.js']);
  assert.match(balises[0], /\stype="module"/);
  // Ordre du document conservé par defer : la file d'attente window.va existe avant le script de Vercel.
  assert.match(balises[1], /\sdefer\b/);
  assert.match(balises[2], /\sdefer\b/);
});

test('analytics : va-init.js est publié et se limite à la file d\'attente window.va', () => {
  assert.equal(sources().get('/va-init.js'), 'app/va-init.js');
  const code = fs.readFileSync(path.join(APP, 'va-init.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim();
  assert.equal(code, 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };');
});

// Page de la préversion (app/) : logique de pseudonymisation, avertissements, textes imposés,
// en-têtes et construction de vercel.json (racine du dépôt), serveur local et liste des fichiers publiés. Aucun navigateur ici :
// l'essai dans Chrome est app/essai-chrome.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fusionner, entites, remplacer, avertissements, normaliser, estMobile, TROUVE_PAR } from '../app/logique.mjs';
import { sources, EXEMPLES } from '../app/construire.mjs';
import { resoudre, entetesVercel } from '../app/servir.mjs';
import { detecter } from '../src/regles.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(RACINE, 'app');
const lire = (f) => fs.readFileSync(path.join(APP, f), 'utf8');
const sourcesApp = () => fs.readdirSync(APP).filter((f) => fs.statSync(path.join(APP, f)).isFile());

test('app : fusion règles + modèle (chevauchement → une zone, catégorie des règles d\'abord)', () => {
  const regles = [{ start: 0, end: 30, type: 'ADRESSE' }, { start: 40, end: 45, type: 'PERSONNE' }];
  const modele = [{ start: 20, end: 38, type: 'LIEU' }, { start: 45, end: 50, type: 'PERSONNE' }, { start: 60, end: 70, type: 'ORGANISATION' }, { start: 62, end: 75, type: 'LIEU' }];
  assert.deepEqual(fusionner(regles, modele), [
    { start: 0, end: 38, type: 'ADRESSE', trouvePar: 'les deux' },
    { start: 40, end: 45, type: 'PERSONNE', trouvePar: 'règles' },
    { start: 45, end: 50, type: 'PERSONNE', trouvePar: 'modèle' }, // adjacents : distincts, comme l'évaluateur
    { start: 60, end: 75, type: 'LIEU', trouvePar: 'modèle' }, // modèle seul : le masque le plus long
  ]);
  assert.deepEqual(fusionner([], []), []);
});

test('app : une même entité garde le même pseudonyme, numéroté par catégorie', () => {
  const texte = 'Mme Jeanne Dupont et Jeanne DUPONT ; Paul Martin ; IBAN FR76 3000 6000 0112 3456 7890 189, FR7630006000011234567890189.';
  const zone = (s, type) => ({ start: texte.indexOf(s), end: texte.indexOf(s) + s.length, type });
  const zones = [zone('Jeanne Dupont', 'PERSONNE'), zone('Jeanne DUPONT', 'PERSONNE'), zone('Paul Martin', 'PERSONNE'), zone('FR76 3000 6000 0112 3456 7890 189', 'IBAN'), zone('FR7630006000011234567890189', 'IBAN')];
  const liste = entites(texte, zones);
  assert.deepEqual(liste.map((e) => [e.pseudonyme, e.formes, e.occurrences.length]), [
    ['[PERSONNE_1]', ['Jeanne Dupont', 'Jeanne DUPONT'], 2],
    ['[PERSONNE_2]', ['Paul Martin'], 1],
    ['[IBAN_1]', ['FR76 3000 6000 0112 3456 7890 189', 'FR7630006000011234567890189'], 2],
  ]);
  assert.equal(remplacer(texte, liste, new Set(liste.map((e) => e.cle))), 'Mme [PERSONNE_1] et [PERSONNE_1] ; [PERSONNE_2] ; IBAN [IBAN_1], [IBAN_1].');
  // « garder » décoché : l'entité reste telle quelle, les autres pseudonymes ne changent pas.
  assert.equal(remplacer(texte, liste, new Set([liste[1].cle])), 'Mme Jeanne Dupont et Jeanne DUPONT ; [PERSONNE_2] ; IBAN FR76 3000 6000 0112 3456 7890 189, FR7630006000011234567890189.');
  assert.equal(normaliser('PERSONNE', 'L’Étang  Bleu'), "l'étang bleu");
});

test('app : sauts de ligne d\'une zone remplacée conservés après le pseudonyme, détection inchangée', () => {
  const texte = 'À :\n1 bis allée des Roses\n13100 AIX-EN-PROVENCE\n\nToulouse, le 20 mars 2026\r\nFin';
  const zone = { start: 4, end: texte.indexOf(','), type: 'ADRESSE' };
  const liste = entites(texte, [zone]);
  assert.deepEqual(liste[0].occurrences, [{ start: zone.start, end: zone.end }]);
  assert.equal(remplacer(texte, liste, new Set([liste[0].cle])), 'À :\n[ADRESSE_1]\n\n\n, le 20 mars 2026\r\nFin');
  const crlf = 'a\r\nb c';
  const l2 = entites(crlf, [{ start: 0, end: 4, type: 'PERSONNE' }]);
  assert.equal(remplacer(crlf, l2, new Set([l2[0].cle])), '[PERSONNE_1]\r\n c');
});

test('app : exemples (jeu de développement), règles seules → aucun élément gardé ne reste', () => {
  for (const id of EXEMPLES) {
    const texte = fs.readFileSync(path.join(RACINE, 'golden', 'dev', `${id}.txt`), 'utf8');
    const liste = entites(texte, fusionner(detecter(texte), []));
    assert.ok(liste.length > 0, id);
    const sortie = remplacer(texte, liste, new Set(liste.map((e) => e.cle)));
    for (const e of liste) for (const f of e.formes) assert.ok(!sortie.includes(f), `${id} : « ${f} » reste`);
  }
});

test('app : avertissements (navigateur, isolation, mobile) sans blocage', () => {
  const chrome = { userAgentData: { brands: [{ brand: 'Google Chrome' }, { brand: 'Chromium' }], mobile: false } };
  const edge = { userAgentData: { brands: [{ brand: 'Microsoft Edge' }], mobile: false } };
  const chromeAndroid = { userAgentData: { brands: [{ brand: 'Google Chrome' }], mobile: true } };
  const firefox = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:140.0) Gecko/20100101 Firefox/140.0' };
  const iphone = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1' };
  assert.deepEqual(avertissements(chrome, true), []);
  assert.deepEqual(avertissements(edge, true), []);
  assert.equal(avertissements(firefox, true).length, 1);
  assert.match(avertissements(chrome, false)[0], /crossOriginIsolated/);
  for (const nav of [chromeAndroid, iphone]) {
    const a = avertissements(nav, true);
    assert.equal(a.length, 2);
    assert.match(a[1], /220 Mo/);
  }
});

test('app : textes imposés présents mot pour mot', () => {
  const html = lire('index.html');
  for (const t of [
    'mask — préversion',
    'Pseudonymiser un texte dans votre navigateur.',
    "Préversion — mask est en cours d'évaluation. Il peut laisser passer des données personnelles : relisez chaque remplacement avant d'utiliser le texte. Le texte que vous collez reste dans votre navigateur. Seuls sortent le modèle, téléchargé depuis Hugging Face, et une mesure de fréquentation (Vercel Web Analytics : page visitée, pays, navigateur, type d'appareil — jamais votre texte).",
    'Collez votre texte',
    'Exemple avocat',
    'Exemple expert-comptable',
    'Exemple RH',
    'Effacer',
    'Compléter avec le modèle (220 Mo, téléchargés une seule fois)',
    "J'ai relu chaque remplacement",
    'Cette table reste dans votre navigateur et disparaît quand vous fermez la page.',
    'Ce que mask rate encore',
    "Pseudonymiser n'est pas anonymiser : une personne peut parfois être reconnue par le contexte.",
    'Dans le détail : 96,7 % des noms, 95,2 % des numéros à format fixe (IBAN, numéro de sécurité sociale…) et 63,2 % des adresses.',
    'Trouvé par',
    "Les règles repèrent tout de suite les formats fixes (IBAN, e-mail, téléphone…), les adresses et une partie des noms et des sociétés. Le modèle open weight, téléchargé une seule fois, en repère d'autres, notamment des noms de personnes, d'organisations et de lieux.",
    "Téléchargement du modèle open weight : 220 Mo, une seule fois. Aucun texte n'est envoyé.",
    'Ratés connus : un IBAN coupé en fin de ligne, un numéro de sécurité sociale dont la clé est séparée, des adresses incomplètes ou atypiques.',
    "Un nom repéré à un endroit n'est pas forcément remplacé partout : vérifiez chaque occurrence.",
    "mask n'a été évalué que sur des documents fictifs d'avocat, d'expert-comptable et de RH ; sur d'autres types de documents, ses résultats ne sont pas évalués.",
    'Volontairement non masqués : les montants et les dates.',
    'Testé sur Chrome, sur ordinateur. Les autres navigateurs ne sont pas encore vérifiés.',
    'Méthode, seuils et résultats détaillés : <a href="https://github.com/sebastiendonne-mig/mask"',
    'href="https://tkoidra.com"',
    'href="https://huggingface.co/migranche/mask-camembert-ner"',
    'Licence MIT',
  ]) assert.ok(html.includes(t), t);
  // Les deux puces ajoutées le 25/10/2026 suivent « Ratés connus… ».
  const ordre = ['Sur 15 documents fictifs', 'Pseudonymiser n', 'Dans le détail', 'Ratés connus', 'Un nom repéré à un endroit', "mask n'a été évalué que", 'Volontairement non masqués'].map((t) => html.indexOf(t));
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
  // Le bandeau est en dehors de <main> et collé en haut (position: sticky).
  assert.match(lire('app.css'), /\.bandeau \{ position: sticky; top: 0;/);
});

test('app : ni « anonymisé » ni « RGPD » ; « anonymis » seulement dans la phrase imposée', () => {
  for (const f of sourcesApp()) {
    const t = lire(f);
    assert.ok(!/anonymisé/i.test(t), `${f} : « anonymisé »`);
    assert.ok(!/RGPD/i.test(t), `${f} : « RGPD »`);
    const autres = t.replace("Pseudonymiser n'est pas anonymiser", '');
    assert.ok(!/anonymis/i.test(autres), `${f} : « anonymis » hors de la phrase imposée`);
  }
});

test('app : aucun stockage, aucune ressource tierce, aucun script ni style en ligne', () => {
  for (const f of ['app.mjs', 'logique.mjs', 'travailleur.mjs']) {
    const t = lire(f).replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/localStorage|sessionStorage|indexedDB|caches\.|document\.cookie|sendBeacon|XMLHttpRequest|WebSocket/.test(t), f);
    assert.ok(!/https?:\/\//.test(t), `${f} : URL externe`);
  }
  const html = lire('index.html');
  assert.ok(!/<script(?![^>]*\ssrc=)/.test(html), 'script en ligne');
  assert.ok(!/<style|\sstyle=|\son[a-z]+=/i.test(html), 'style ou gestionnaire en ligne');
  const ressources = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('/'));
  assert.deepEqual(ressources.filter((u) => !/^https:\/\/(tkoidra\.com|github\.com\/sebastiendonne-mig\/mask|huggingface\.co\/migranche\/mask-camembert-ner)$/.test(u)), [], 'seuls les trois liens du pied de page et du texte');
  assert.ok(!/url\(|@import|@font-face/.test(lire('app.css')), 'aucune ressource dans la feuille de style');
  assert.match(html, /<textarea id="texte"[^>]*spellcheck="false"[^>]*autocomplete="off"/);
});

test('app : vercel.json (racine) : en-têtes et construction', () => {
  const e = entetesVercel();
  assert.equal(e['Cross-Origin-Opener-Policy'], 'same-origin');
  assert.equal(e['Cross-Origin-Embedder-Policy'], 'require-corp');
  assert.equal(e['Referrer-Policy'], 'no-referrer');
  const csp = Object.fromEntries(e['Content-Security-Policy'].split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
  assert.deepEqual(csp['default-src'], ["'self'"]);
  assert.deepEqual(csp['connect-src'], ["'self'", 'https://huggingface.co', 'https://*.hf.co']);
  // blob: : fabrique WebAssembly d'onnxruntime-web chargée par Transformers.js depuis un blob (essai du 25/10/2026).
  assert.deepEqual(csp['script-src'], ["'self'", "'wasm-unsafe-eval'", 'blob:']);
  for (const k of ['style-src', 'font-src', 'img-src', 'worker-src']) assert.equal(csp[k], undefined, `${k} : hérite de default-src ou script-src`);
  const config = JSON.parse(fs.readFileSync(path.join(RACINE, 'vercel.json'), 'utf8'));
  assert.equal(config.framework, null);
  assert.equal(config.installCommand, 'npm ci --omit=dev --ignore-scripts');
  assert.equal(config.buildCommand, 'node app/construire.mjs');
  assert.equal(config.outputDirectory, 'app/dist');
  assert.deepEqual(config.headers.map((h) => h.source), ['/(.*)'], 'en-têtes sur toutes les routes');
  assert.ok(!fs.existsSync(path.join(APP, 'vercel.json')), 'un seul vercel.json, à la racine');
});

test('app : serveur local, chemins hors de dist/ refusés', () => {
  const racine = fs.mkdtempSync(path.join(RACINE, '.cache', 'essai-servir-'));
  try {
    fs.writeFileSync(path.join(racine, 'index.html'), 'ok');
    assert.equal(resoudre('/', racine), path.join(racine, 'index.html'));
    for (const c of ['/../package.json', '/%2e%2e/package.json', '/a/%00', '/absent.html', '/%E0%A4%A']) assert.equal(resoudre(c, racine), null, c);
  } finally {
    fs.rmSync(racine, { recursive: true, force: true });
  }
});

test('app : fichiers publiés (liste fermée, exemples du jeu de développement)', () => {
  const s = sources();
  for (const [publie, source] of s) {
    assert.ok(!source.includes('golden/test') && !source.includes('modeles-test') && !source.includes('robustesse'), source);
    assert.ok(fs.existsSync(path.join(RACINE, source)), source);
    assert.ok(publie.startsWith('/'), publie);
  }
  assert.deepEqual([...s.keys()].filter((p) => p.startsWith('/exemples/')), EXEMPLES.map((id) => `/exemples/${id}.txt`));
  assert.ok(EXEMPLES.every((id) => s.get(`/exemples/${id}.txt`) === `golden/dev/${id}.txt`));
  assert.ok(![...s.values()].some((x) => x.endsWith('.onnx')), 'aucun fichier de modèle publié');
});

test('app : « Trouvé par » d\'une entité sur l\'ensemble de ses occurrences', () => {
  const texte = 'Paul Martin, puis Paul Martin, puis Lyon.';
  const regles = [{ start: 0, end: 11, type: 'PERSONNE' }];
  const modele = [{ start: 18, end: 29, type: 'PERSONNE' }, { start: 36, end: 40, type: 'LIEU' }];
  const liste = entites(texte, fusionner(regles, modele));
  assert.deepEqual(liste.map((e) => [e.pseudonyme, e.trouvePar]), [['[PERSONNE_1]', TROUVE_PAR.deux], ['[LIEU_1]', TROUVE_PAR.modele]]);
  assert.deepEqual(entites(texte, fusionner(regles, [])).map((e) => e.trouvePar), [TROUVE_PAR.regles]);
});

test('app : téléphone ou tablette → pas de chargement automatique du modèle', () => {
  assert.equal(estMobile({ userAgentData: { mobile: false, platform: 'macOS', brands: [] } }), false);
  assert.equal(estMobile({ userAgentData: { mobile: false, platform: 'Windows', brands: [] }, maxTouchPoints: 10 }), false);
  assert.equal(estMobile({ userAgentData: { mobile: true, platform: 'Android', brands: [] } }), true);
  assert.equal(estMobile({ userAgentData: { mobile: false, platform: 'Android', brands: [] } }), true, 'tablette Android');
  const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
  assert.equal(estMobile({ userAgent: mac, maxTouchPoints: 0 }), false);
  assert.equal(estMobile({ userAgent: mac, maxTouchPoints: 5 }), true, 'iPad (Safari s\'annonce comme un Mac)');
  // Le bouton est caché par défaut ; app.mjs l'affiche sur téléphone ou tablette, ou après un échec.
  assert.match(lire('index.html'), /<button type="button" id="bouton-modele" hidden>/);
});

test('app : chiffre global = résultats commités du combiné C sur le jeu de robustesse', () => {
  const r = JSON.parse(fs.readFileSync(path.join(RACINE, 'resultats', 'compression', 'evaluation-robustesse', 'combine.json'), 'utf8'));
  const types = Object.values(r.rappelParType);
  const n = types.reduce((s, t) => s + t.trouves, 0);
  const m = types.reduce((s, t) => s + t.total, 0);
  assert.equal(m, r.couverturePartielle.total);
  const x = ((100 * n) / m).toFixed(1).replace('.', ',');
  assert.ok(lire('index.html').includes(`Sur ${r.documents} documents fictifs écrits pour être difficiles, mask (règles et modèle) a repéré ${x} % des éléments à pseudonymiser (${n} sur ${m}).`), `${x} % (${n} sur ${m})`);
});

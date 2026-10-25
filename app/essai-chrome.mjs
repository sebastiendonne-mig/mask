// Essai automatisé de la page de la préversion (Chrome, Playwright) :
//
//   node app/essai-chrome.mjs [--sortie fichier.json] [--dist <dossier> | --url <adresse>]
//
// Construit app/dist/ (ou sert tel quel le dossier --dist, par exemple la construction d'un clone
// neuf), le sert en local avec les en-têtes de vercel.json ; avec --url, aucun serveur local : la
// page en ligne est ouverte directement (son hôte ne passe pas par le proxy). Ouvre un profil
// Chrome neuf (ordinateur : le modèle se charge seul à l'ouverture, téléchargé une fois depuis
// Hugging Face). Vérifie que les règles répondent avant le modèle, que la case « J'ai relu chaque
// remplacement » se décoche quand le modèle complète la liste, puis charge les trois exemples
// (avocat, expert-comptable, RH) et vérifie, pour chacun :
// - qu'aucun élément gardé de la liste des remplacements ne reste dans le texte pseudonymisé ;
// - que la copie n'est possible qu'après « J'ai relu chaque remplacement », et copie ce texte ;
// et, pour toute la visite :
// - que les seules requêtes (page et Worker, vues par Playwright) vont vers l'origine locale,
//   huggingface.co (chemins du commit épinglé) et *.hf.co, en GET sans corps ; Chrome passe par le
//   proxy du banc (bench/proxy.mjs, sans limite de débit), qui consigne les hôtes des tunnels ;
// - qu'aucune violation CSP n'est signalée, que rien n'est stocké hors du cache du modèle, et
//   qu'aucun texte des exemples n'apparaît dans une URL demandée ;
// - que le chargeur a vérifié par SHA-256 les 4 fichiers du modèle pendant la visite (état du
//   chargeur lu dans le Worker, empreintes comparées à modeles/MANIFEST.sha256), et que les copies
//   gardées dans CacheStorage ont ces mêmes empreintes.
// Code de sortie : 0 si tout est conforme, 1 sinon.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { construire, EXEMPLES } from './construire.mjs';
import { creerServeur } from './servir.mjs';
import { creerProxy, horsListe } from '../bench/proxy.mjs';
import { HF, urlHF, lireManifeste } from '../src/modele-navigateur.mjs';

const { values } = parseArgs({ options: { sortie: { type: 'string' }, dist: { type: 'string' }, url: { type: 'string' } } });
if (values.url && values.dist) throw new Error('essai : --url et --dist sont exclusifs');
const enLigne = values.url ? new URL(values.url) : null;
if (enLigne && enLigne.protocol !== 'https:') throw new Error('essai : --url doit être en https');
const MANIFESTE = lireManifeste(fs.readFileSync(path.join(import.meta.dirname, '..', 'modeles', 'MANIFEST.sha256'), 'utf8'));

// Chemins attendus sur huggingface.co : resolve/<commit>/<fichier> et sa redirection sur le même
// hôte (constatée à l'étape 4a, resultats/navigateur/hf/synthese.md).
const CHEMINS_HF = new Set(HF.fichiers.flatMap((f) => [new URL(urlHF(f.chemin)).pathname, `/api/resolve-cache/models/${HF.depot}/${HF.commit}/${f.chemin}`]));
const BOUTONS = { 'dev-avocat-01': 'Exemple avocat', 'dev-ec-04': 'Exemple expert-comptable', 'dev-rh-03': 'Exemple RH' };

const fichiers = values.dist || enLigne ? null : construire();
const serveur = enLigne ? null : creerServeur(values.dist ? { racine: path.resolve(values.dist) } : {});
const port = serveur ? await serveur.ecouter() : null;
const proxy = creerProxy();
const portProxy = await proxy.ecouter();
const origine = enLigne ? enLigne.origin : `http://127.0.0.1:${port}`;
const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'mask-app-essai-'));
const textes = Object.fromEntries(EXEMPLES.map((id) => [id, fs.readFileSync(path.join(import.meta.dirname, '..', 'golden', 'dev', `${id}.txt`), 'utf8')]));

const requetes = [];
const consoles = [];
const r = { date: new Date().toISOString(), origine, controles: {}, exemples: {} };
const t0 = performance.now();
const ms = () => Math.round(performance.now() - t0);

// Charge un exemple et attend la fin de l'analyse (avecModele : règles et modèle ; sinon règles).
async function chargerExemple(page, id, avecModele) {
  await page.getByRole('button', { name: BOUTONS[id] }).click();
  await page.waitForFunction(
    ({ t, m }) => document.querySelector('#texte').value === t && document.body.dataset.analyse === 'terminee' && (m ? /règles et modèle/ : /\(règles\)/).test(document.querySelector('#etat-detection').textContent),
    { t: textes[id], m: avecModele },
    { timeout: 120_000 },
  );
}

// Contrôles d'un exemple, modèle chargé.
async function controlerExemple(page, id) {
  const e = { etat: await page.textContent('#etat-detection'), controles: {} };
  e.controles.texteCharge = (await page.inputValue('#texte')) === textes[id];
  const lignes = await page.$$eval('#remplacements tbody tr', (trs) =>
    trs.map((tr) => ({ formes: JSON.parse(tr.dataset.formes), categorie: tr.cells[1].textContent, pseudonyme: tr.cells[2].textContent, trouvePar: tr.cells[3].textContent.replace('Trouvé par : ', ''), garder: tr.querySelector('input').checked })),
  );
  const sortie = await page.textContent('#sortie');
  e.remplacements = lignes;
  e.restes = lignes.filter((l) => l.garder).flatMap((l) => l.formes.filter((f) => sortie.includes(f)).map((f) => ({ forme: f, pseudonyme: l.pseudonyme })));
  e.controles.aucunElementGardeRestant = e.restes.length === 0;
  e.controles.pseudonymesPresents = lignes.filter((l) => l.garder).every((l) => sortie.includes(l.pseudonyme));
  e.controles.trouveParRenseigne = lignes.every((l) => ['règles', 'modèle', 'les deux'].includes(l.trouvePar));
  e.controles.toutesLignesGardeesParDefaut = lignes.length > 0 && lignes.every((l) => l.garder);
  e.correspondance = await page.locator('#correspondance tbody tr').count();
  e.controles.correspondanceComplete = e.correspondance === lignes.filter((l) => l.garder).length;
  // Sauts de ligne : autant dans le texte pseudonymisé que dans le texte d'origine.
  e.controles.sautsDeLigneConserves = sortie.split('\n').length === textes[id].split('\n').length;
  e.controles.copieInactiveAvantRelecture = await page.isDisabled('#copier');
  await page.getByLabel('J\'ai relu chaque remplacement').check();
  e.controles.copieActiveApresRelecture = await page.isEnabled('#copier');
  await page.click('#copier');
  e.controles.copieConforme = (await page.evaluate(() => navigator.clipboard.readText())) === sortie;
  return e;
}

const contexte = await chromium.launchPersistentContext(profil, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1200, height: 900 },
  proxy: { server: `http://127.0.0.1:${portProxy}`, bypass: enLigne ? enLigne.hostname : '127.0.0.1' },
});
try {
  await contexte.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: origine });
  contexte.on('request', (q) => requetes.push({ url: q.url(), methode: q.method(), type: q.resourceType(), corps: q.postDataBuffer()?.length ?? 0 }));
  contexte.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) consoles.push({ type: m.type(), texte: m.text().slice(0, 500) });
  });
  await contexte.addInitScript(() => {
    window.__violations = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__violations.push({ directive: e.violatedDirective, bloque: e.blockedURI }));
  });

  const page = contexte.pages()[0] ?? (await contexte.newPage());
  const tOuverture = ms();
  await page.goto(`${origine}/`);
  r.navigateur = await page.evaluate(() => ({ ua: navigator.userAgent, isole: self.crossOriginIsolated }));
  r.avertissements = await page.$$eval('#avertissements li', (l) => l.map((x) => x.textContent));

  // Chargement automatique (ordinateur) : bouton caché, barre de progression visible.
  r.chargementAuto = await page.evaluate(() => ({ modele: document.body.dataset.modele, boutonCache: document.querySelector('#bouton-modele').hidden, progressionVisible: !document.querySelector('#chargement').hidden, annonce: document.querySelector('#chargement .annonce').textContent }));
  r.controles.chargementAutomatique = r.chargementAuto.modele === 'chargement' && r.chargementAuto.boutonCache && r.chargementAuto.progressionVisible && r.chargementAuto.annonce === "Téléchargement du modèle open weight : 220 Mo, une seule fois. Aucun texte n'est envoyé.";

  // Règles seules sur le premier exemple, case cochée avant que le modèle soit prêt.
  await chargerExemple(page, EXEMPLES[0], false);
  r.reglesSeules = { exemple: EXEMPLES[0], etat: await page.textContent('#etat-detection'), modeleEncoreEnChargement: (await page.evaluate(() => document.body.dataset.modele)) === 'chargement' };
  r.controles.reglesAvantModele = r.reglesSeules.modeleEncoreEnChargement;
  await page.getByLabel('J\'ai relu chaque remplacement').check();
  await page.waitForFunction(() => ['pret', 'erreur'].includes(document.body.dataset.modele), null, { timeout: 600_000, polling: 250 });
  r.modele = { etat: await page.textContent('#etat-modele'), statut: await page.evaluate(() => document.body.dataset.modele), msDepuisOuverture: ms() - tOuverture };
  r.controles.modelePret = r.modele.statut === 'pret';
  if (r.controles.modelePret) {
    await page.waitForFunction(() => document.body.dataset.analyse === 'terminee' && /règles et modèle/.test(document.querySelector('#etat-detection').textContent), null, { timeout: 120_000 });
    r.combineAuto = { etat: await page.textContent('#etat-detection'), relu: await page.isChecked('#relu') };
    r.controles.combineRelanceSeul = true;
    r.controles.reluDecocheQuandModelePret = !r.combineAuto.relu;
  }

  if (r.controles.modelePret) {
    for (const id of EXEMPLES) {
      if (id !== EXEMPLES[0]) await chargerExemple(page, id, true); // le premier est déjà affiché, complété par le modèle
      r.exemples[id] = await controlerExemple(page, id);
    }
  }
  r.controles.troisExemplesConformes = EXEMPLES.every((id) => r.exemples[id] && Object.values(r.exemples[id].controles).every(Boolean));

  r.stockage = await page.evaluate(async () => {
    const caches_ = {};
    for (const nom of await caches.keys()) caches_[nom] = (await (await caches.open(nom)).keys()).map((q) => q.url);
    return { localStorage: localStorage.length, sessionStorage: sessionStorage.length, indexedDB: (await indexedDB.databases()).map((d) => d.name), caches: caches_ };
  });
  const urlsCache = Object.values(r.stockage.caches).flat();
  r.controles.aucunStockageDuTexte =
    r.stockage.localStorage === 0 && r.stockage.sessionStorage === 0 && r.stockage.indexedDB.length === 0 && urlsCache.every((u) => u.startsWith(`https://huggingface.co/${HF.depot}/resolve/${HF.commit}/`) || u.startsWith(`${origine}/vendor/ort/`));
  // Empreintes : état du chargeur dans le Worker de la page (même instance du module), puis
  // empreintes des copies gardées dans CacheStorage, calculées dans la page.
  const travailleur = page.workers().find((w) => new URL(w.url()).pathname === '/travailleur.mjs');
  r.empreintes = { chargeur: null, cache: null };
  if (travailleur) {
    r.empreintes.chargeur = await travailleur.evaluate(async () => {
      const m = await import('/src/modele-navigateur.mjs');
      return { source: m.etat.source, mesures: Object.keys(m.etat.mesures), fichiers: m.etat.fichiers.map(({ url, cle, octets, depuisCache, sha256 }) => ({ url, cle, octets, depuisCache, sha256 })) };
    });
  }
  r.empreintes.cache = await page.evaluate(async (prefixe) => {
    const sortie = {};
    for (const nom of await caches.keys()) {
      const c = await caches.open(nom);
      for (const q of await c.keys()) {
        if (!q.url.startsWith(prefixe)) continue;
        const o = await (await c.match(q)).arrayBuffer();
        sortie[q.url] = [...new Uint8Array(await crypto.subtle.digest('SHA-256', o))].map((x) => x.toString(16).padStart(2, '0')).join('');
      }
    }
    return sortie;
  }, `https://huggingface.co/${HF.depot}/resolve/${HF.commit}/`);
  const attendus = HF.fichiers.map((f) => ({ url: urlHF(f.chemin), cle: f.cle, octets: f.octets, sha256: MANIFESTE.get(f.cle) }));
  const verifies = r.empreintes.chargeur?.fichiers.filter((f) => f.cle) ?? [];
  r.controles.empreintesVerifieesParLeChargeur =
    r.empreintes.chargeur?.source === 'hf' &&
    r.empreintes.chargeur.mesures.includes('empreintes') &&
    verifies.length === 4 &&
    attendus.every((a) => verifies.some((f) => f.url === a.url && f.cle === a.cle && f.octets === a.octets && f.sha256 === a.sha256 && f.depuisCache === false));
  r.controles.copiesEnCacheConformes = Object.keys(r.empreintes.cache).length === 4 && attendus.every((a) => r.empreintes.cache[a.url] === a.sha256);
  r.violations = await page.evaluate(() => window.__violations);
  await page.waitForTimeout(1000);
} finally {
  await contexte.close();
  await serveur?.fermer();
  await proxy.fermer();
  fs.rmSync(profil, { recursive: true, force: true });
}

// --- Réseau ----------------------------------------------------------------------------

const hotes = [...new Set(requetes.map((q) => (q.url.startsWith('blob:') ? 'blob: (local)' : new URL(q.url).host)))];
// Cherchés dans les URL demandées : les textes d'origine repérés (4 caractères ou plus) et chaque
// ligne des exemples de 20 caractères ou plus.
const formes = Object.values(r.exemples).flatMap((e) => e.remplacements.flatMap((l) => l.formes));
const lignesLongues = Object.values(textes).flatMap((t) => t.split('\n').map((l) => l.trim()));
const fragments = [...new Set([...formes.filter((f) => f.length >= 4), ...lignesLongues.filter((l) => l.length >= 20)])];
r.reseau = {
  requetes: requetes.length,
  hotes,
  nonGet: requetes.filter((q) => q.methode !== 'GET'),
  avecCorps: requetes.filter((q) => q.corps > 0),
  // L'origine de la page (en ligne) est traitée comme l'origine locale : seule origine admise hors Hugging Face.
  horsListe: horsListe(enLigne ? requetes.filter((q) => !q.url.startsWith(`${origine}/`)) : requetes, CHEMINS_HF),
  urlsAvecTexte: requetes.filter((q) => fragments.some((f) => decodeURIComponent(q.url).includes(f))).map((q) => q.url),
  tunnels: [...new Set(proxy.tunnels.map((t) => t.hote))],
  refusProxy: [...new Set(proxy.refus.map((x) => x.cible))],
  serveurLocal: serveur && { requetes: serveur.journal.length, nonGet: serveur.journal.filter((x) => x.methode !== 'GET').length, statuts: [...new Set(serveur.journal.map((x) => x.statut))] },
};
r.controles.reseauConforme = r.reseau.nonGet.length === 0 && r.reseau.avecCorps.length === 0 && r.reseau.horsListe.length === 0 && r.reseau.tunnels.every((h) => h === 'huggingface.co' || h.endsWith('.hf.co'));
r.controles.texteAbsentDesUrl = r.reseau.urlsAvecTexte.length === 0;
r.controles.aucuneViolationCsp = (r.violations ?? []).length === 0 && !consoles.some((c) => /Content Security Policy/i.test(c.texte));
r.consoles = consoles;
r.construction = fichiers ? { fichiers: fichiers.length, octets: fichiers.reduce((n, f) => n + f.octets, 0) } : enLigne ? { url: enLigne.href } : { dist: path.resolve(values.dist) };

const ok = Object.values(r.controles).every(Boolean);
r.ok = ok;
if (values.sortie) fs.writeFileSync(values.sortie, JSON.stringify(r, null, 1) + '\n');
const resume = Object.fromEntries(Object.entries(r.exemples).map(([id, e]) => [id, { etat: e.etat, entites: e.remplacements.length, trouvePar: e.remplacements.map((l) => l.trouvePar), restes: e.restes, controles: e.controles }]));
console.log(JSON.stringify({ ok, controles: r.controles, navigateur: r.navigateur, avertissements: r.avertissements, chargementAuto: r.chargementAuto, reglesSeules: r.reglesSeules, modele: r.modele, combineAuto: r.combineAuto, exemples: resume, reseau: { ...r.reseau, nonGet: r.reseau.nonGet.length, avecCorps: r.reseau.avecCorps.length }, stockage: r.stockage, violations: r.violations, consoles }, null, 1));
process.exit(ok ? 0 : 1);

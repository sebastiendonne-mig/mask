// Pilotage automatique du banc dans le Chrome installé (Playwright, canal « chrome »), lot 1.5b.
//
//   node bench/piloter-chrome.mjs [--repetitions 5] [--configs a,b,c,d] [--sortie resultats/navigateur] [--essai]
//                                 [--modele <clé du manifeste>]
//
// Configurations (serveur bench/serveur.mjs, débit simulé 100 Mb/s côté serveur) :
//   a  non isolée (pas de COOP/COEP) : 1 thread par défaut, variante WASM par défaut (asyncify)
//   b  isolée, threads par défaut d'onnxruntime-web, asyncify
//   c  isolée, 1 thread forcé, asyncify (témoin : b − c = gain des threads seul)
//   d  isolée, threads par défaut, variante WASM simple
// Chaque répétition : profil Chrome neuf → 1re visite ; fermeture complète de Chrome, relance
// sur le même profil → visite suivante. Ordre des configurations décalé à chaque répétition.
// Puis une visite de diagnostic par configuration (scores par mot), hors mesure, et les
// masques des moteurs Node (scripts/navigateur/moteurs-node.mjs) pour expliquer les écarts.
//
// Sans --essai : refuse de mesurer si l'arbre git n'est pas propre ; écrit chrome.json et chrome.md.
//
// --source hf|local (hf par défaut) : source du modèle de la page (src/modele-navigateur.mjs).
//   hf : C et son tokenizer depuis le dépôt Hugging Face épinglé (HF). Chrome passe par le proxy
//   local bench/proxy.mjs pour tout hôte autre que 127.0.0.1 ; le proxy n'accepte que
//   huggingface.co et *.hf.co et partage le seau de 100 Mb/s du serveur local. Si une requête de
//   la page ou du Worker vise un hôte hors de cette liste, le pilote consigne les visites dans
//   chrome-arret.json et s'arrête.
//   local : fichiers servis par le serveur local, comme au lot 1.5b et à l'option 3.
// --modele (source locale seulement) : fichier ONNX chargé par la page à la place du q8 épinglé
// (clé de modeles/MANIFEST.sha256, par exemple compression/int8-matmul/model.onnx), option 3,
// étape 2f. Consigné dans le rapport ; chaque visite réussie doit avoir chargé ce fichier avec son
// empreinte du manifeste, sinon le pilote s'arrête. Sans --modele : q8 épinglé, comme au lot 1.5b.
// Source hf : même contrôle, pour onnx/model_fp16.onnx du commit épinglé.
//
// Source hf : masques comparés à ceux de la série locale de C (option 3, étape 2h,
// resultats/compression/banc/fp16-mixte/chrome.json), même fichier ONNX.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { creerLimiteur, creerServeur } from './serveur.mjs';
import { creerProxy, horsListe } from './proxy.mjs';
import { REVISION } from '../src/modele-commun.mjs';
import { HF, cleModeleValide, urlHF } from '../src/modele-navigateur.mjs';
import { parMoteur, documentsDev } from '../scripts/navigateur/moteurs-node.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBIT = 100;
const PAGE = 3000;

export const CONFIGS = [
  { id: 'a', libelle: 'non isolée, threads par défaut, asyncify', isolation: false, threads: 'defaut', variante: 'auto' },
  { id: 'b', libelle: 'isolée, threads par défaut, asyncify', isolation: true, threads: 'defaut', variante: 'auto' },
  { id: 'c', libelle: 'isolée, 1 thread forcé, asyncify (témoin)', isolation: true, threads: '1', variante: 'auto' },
  { id: 'd', libelle: 'isolée, threads par défaut, variante simple', isolation: true, threads: 'defaut', variante: 'simple' },
];

const SEUILS_S7 = { reglesPretes: 1000, premiereVisite: 30000, visiteSuivante: 5000 };

// Série locale de C (option 3, étape 2h) : référence des masques pour la source hf.
const SERIE_C_LOCALE = path.join(RACINE, 'resultats', 'compression', 'banc', 'fp16-mixte', 'chrome.json');
// Chemins attendus sur huggingface.co (source hf) : resolve/<commit>/<chemin> de chaque fichier, et
// la redirection 307 de Hugging Face, sur le même hôte, des fichiers hors stockage de gros fichiers
// (/api/resolve-cache/models/<dépôt>/<commit>/<chemin>, constatée le 24/10/2026).
const CHEMINS_HF = new Set(HF.fichiers.flatMap((f) => [new URL(urlHF(f.chemin)).pathname, `/api/resolve-cache/models/${HF.depot}/${HF.commit}/${f.chemin}`]));

// --- Outils ----------------------------------------------------------------------

const executer = (cmd, args) => execFileSync(cmd, args, { cwd: RACINE, encoding: 'utf8' }).trim();
const arrondi = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10) / 10);

export function stats(xs) {
  const v = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0, mediane: null, min: null, max: null };
  const m = v.length >> 1;
  return { n: v.length, mediane: arrondi(v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2), min: arrondi(v[0]), max: arrondi(v.at(-1)) };
}

const versionPaquet = (nom) => JSON.parse(fs.readFileSync(path.join(RACINE, 'node_modules', ...nom.split('/'), 'package.json'), 'utf8')).version;

function lireEnvironnement() {
  const cpu = os.cpus();
  return {
    machine: `${cpu[0]?.model ?? '?'}, ${cpu.length} cœurs logiques, ${Math.round(os.totalmem() / 2 ** 30)} Go`,
    systeme: `macOS ${executer('sw_vers', ['-productVersion'])} (Darwin ${os.release()})`,
    chrome: executer(CHROME, ['--version']),
    node: process.version,
    transformers: versionPaquet('@huggingface/transformers'),
    onnxruntimeWeb: versionPaquet('onnxruntime-web'),
    playwright: versionPaquet('playwright'),
  };
}

// --- Une visite ------------------------------------------------------------------

// proxy : null, ou { p: creerProxy(), port } ; Chrome y passe pour tout hôte autre que 127.0.0.1.
async function visite(profil, url, serveur, proxy = null) {
  serveur.journal.length = 0;
  proxy?.p.vider();
  const options = { channel: 'chrome', headless: false, viewport: { width: 1200, height: 900 } };
  if (proxy) options.proxy = { server: `http://127.0.0.1:${proxy.port}`, bypass: '127.0.0.1' };
  const contexte = await chromium.launchPersistentContext(profil, options);
  const requetes = [];
  const parRequete = new Map();
  const enCours = [];
  const consoles = [];
  contexte.on('request', (r) => {
    const e = { url: r.url(), methode: r.method(), type: r.resourceType(), corps: r.postDataBuffer()?.length ?? 0, statut: null, octets: null, echec: null };
    parRequete.set(r, e);
    requetes.push(e);
  });
  contexte.on('requestfinished', (r) => {
    enCours.push(
      (async () => {
        const e = parRequete.get(r);
        const s = await r.sizes().catch(() => null);
        const rep = await r.response().catch(() => null);
        if (e) Object.assign(e, { statut: rep?.status() ?? null, octets: s && s.responseBodySize >= 0 ? s.responseBodySize : null });
      })(),
    );
  });
  contexte.on('requestfailed', (r) => {
    const e = parRequete.get(r);
    if (e) e.echec = r.failure()?.errorText ?? 'échec';
  });
  contexte.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) consoles.push({ type: m.type(), texte: m.text().slice(0, 500) });
  });
  try {
    const page = contexte.pages()[0] ?? (await contexte.newPage());
    await page.goto(url);
    await page.waitForFunction(() => window.__resultat, null, { timeout: 600_000, polling: 250 });
    const resultat = await page.evaluate(() => window.__resultat);
    await Promise.all(enCours);
    return { resultat, requetes, consoles, ...journaux(serveur, proxy) };
  } finally {
    await contexte.close();
  }
}

const journaux = (serveur, proxy) => ({
  journalServeur: serveur.journal.map((x) => ({ ...x })),
  journalProxy: proxy ? { tunnels: proxy.p.tunnels.map((x) => ({ ...x })), refus: proxy.p.refus.map((x) => ({ ...x })) } : null,
});

// Masques des documents d'un résultat comparés à une référence { id: { regles, modele, combine } }.
export function comparerMasques(documents, reference) {
  const parDetecteur = {};
  for (const det of ['regles', 'modele', 'combine']) {
    const differents = documents.filter((d) => JSON.stringify(d.masques[det]) !== JSON.stringify(reference[d.id]?.[det])).map((d) => d.id);
    parDetecteur[det] = { identiques: documents.length - differents.length, total: documents.length, differents };
  }
  return parDetecteur;
}

// --- Analyse ---------------------------------------------------------------------

const cleMasque = (m) => `${m.start}:${m.end}:${m.type}`;
const chaine = (masques) => JSON.stringify(masques);

// Masques présents d'un seul côté, avec les deux meilleures étiquettes de chaque côté pour les mots
// du passage (scores : [{ start, end, top: [[étiquette, score], [étiquette, score]] }] par mot).
export function ecarts(texte, a, b, scoresA, scoresB) {
  const sortie = [];
  const dansA = new Set(a.map(cleMasque));
  const dansB = new Set(b.map(cleMasque));
  for (const [cote, liste, autre] of [['A', a, dansB], ['B', b, dansA]]) {
    for (const m of liste) {
      if (autre.has(cleMasque(m))) continue;
      const mots = [];
      (scoresA ?? []).forEach((s, i) => {
        if (s.start < m.end && m.start < s.end) mots.push({ mot: texte.slice(s.start, s.end), A: s.top, B: scoresB?.[i]?.top ?? null });
      });
      sortie.push({ seulement: cote, start: m.start, end: m.end, type: m.type, passage: texte.slice(m.start, m.end), mots });
    }
  }
  return sortie.sort((x, y) => x.start - y.start || x.end - y.end);
}

const octetsProxy = (v) => (v.journalProxy?.tunnels ?? []).reduce((s, t) => s + t.recus, 0);

// Débit apparent d'une visite pendant la phase de téléchargement (fichiers du modèle et
// WebAssembly, en parallèle) : octets reçus par le proxy + octets WebAssembly servis, sur la durée
// de la phase ; et débit du plus gros tunnel (octets reçus / temps du premier au dernier octet reçu). Mb/s.
function debitVisite(v) {
  const d = v.resultat?.temps?.durees?.telechargement;
  const wasm = (v.journalServeur ?? []).filter((e) => e.chemin.startsWith('/vendor/ort/ort-wasm')).reduce((s, e) => s + e.octets, 0);
  const proxy = octetsProxy(v);
  const gros = [...(v.journalProxy?.tunnels ?? [])].sort((a, b) => b.recus - a.recus)[0];
  const dureeGros = gros?.premierOctet != null ? gros.dernierOctet - gros.premierOctet : null;
  return {
    octetsProxy: proxy,
    octetsWasm: wasm,
    phaseMbps: d ? arrondi(((proxy + wasm) * 8) / 1e6 / (d / 1000)) : null,
    plusGrosTunnel: gros ? { hote: gros.hote, recus: gros.recus, dureeMs: dureeGros, mbps: dureeGros ? arrondi((gros.recus * 8) / 1e6 / (dureeGros / 1000)) : null } : null,
  };
}

function analyser({ visites, diagnostics, moteurs, documents, configs, referenceC = null }) {
  const textes = new Map(documents.map((d) => [d.id, d.texte]));
  const ids = documents.map((d) => d.id);
  const analyse = { configurations: {}, equivalence: {}, s1: {} };

  for (const cfg of configs) {
    const runs = visites.filter((v) => v.config === cfg.id);
    const okRuns = runs.filter((v) => v.resultat?.ok);
    const par = (n) => okRuns.filter((v) => v.visite === n);
    const chargement = {};
    for (const n of [1, 2]) {
      const rs = par(n).map((v) => v.resultat);
      chargement[n === 1 ? 'premiereVisite' : 'visiteSuivante'] = {
        repetitions: rs.length,
        reglesPretes: stats(rs.map((r) => r.temps.reglesPretes)),
        modelePret: stats(rs.map((r) => r.temps.modelePret)),
        durees: Object.fromEntries(['avantChargement', 'bibliotheque', 'telechargement', 'empreintes', 'miseEnCache', 'session', 'chauffe'].map((k) => [k, stats(rs.map((r) => r.temps.durees[k]))])),
        octetsServis: stats(par(n).map((v) => v.journalServeur.reduce((s, e) => s + e.octets, 0) + octetsProxy(v))),
        octetsProxy: stats(par(n).map(octetsProxy)),
        debit: par(n).map((v) => ({ repetition: v.repetition, ...debitVisite(v) })),
      };
    }
    const rs = okRuns.map((v) => v.resultat);
    const parDocument = Object.fromEntries(ids.map((id) => [id, stats(rs.map((r) => r.documents.find((d) => d.id === id)?.ms.total))]));
    analyse.configurations[cfg.id] = {
      libelle: cfg.libelle,
      echecs: runs.filter((v) => !v.resultat?.ok).map((v) => ({ repetition: v.repetition, visite: v.visite, erreur: v.resultat?.erreur ?? v.erreur })),
      isolation: [...new Set(rs.map((r) => r.config.isolation))],
      numThreads: [...new Set(rs.map((r) => r.numThreads))],
      variante: [...new Set(rs.map((r) => r.config.variante))],
      chargement,
      s8: {
        msParDocumentMediane: stats(rs.map((r) => r.s8.msParDocumentMediane)),
        msPour1000Caracteres: stats(rs.map((r) => r.s8.msPour1000Caracteres)),
        msParPage: stats(rs.map((r) => r.s8.msParPage)),
        parDocument,
      },
    };
  }

  // Équivalence. Référence Node (natif, mesures 1.5a), moteur WASM dans Node, entre configurations.
  const reference = JSON.parse(fs.readFileSync(path.join(RACINE, 'resultats', 'navigateur', 'reference-node-dev.json'), 'utf8'));
  const refNode = new Map(reference.documents.map((d) => [d.id, d.masques]));
  const sortieCfg = {};
  for (const cfg of configs) {
    const rs = visites.filter((v) => v.config === cfg.id && v.resultat?.ok).map((v) => v.resultat);
    if (!rs.length) continue;
    const signatures = new Set(rs.map((r) => chaine(r.documents.map((d) => d.masques))));
    const premier = rs[0];
    sortieCfg[cfg.id] = Object.fromEntries(premier.documents.map((d) => [d.id, d.masques]));
    const compte = (det, ref) => Math.min(...rs.map((r) => r.documents.filter((d) => chaine(d.masques[det]) === chaine(ref(d.id))).length));
    analyse.equivalence[cfg.id] = {
      executions: rs.length,
      stableEntreExecutions: signatures.size === 1,
      vsNodeNatif: Object.fromEntries(['regles', 'modele', 'combine'].map((det) => [det, compte(det, (id) => refNode.get(id)[det])])),
      vsNodeWasm: { modele: compte('modele', (id) => moteurs.wasm.documents[id].masques) },
      vsNodeNatifSansOptimisation: { modele: compte('modele', (id) => moteurs['natif-sans-optimisation'].documents[id].masques) },
      documents: ids.length,
    };
  }
  // Source hf : masques identiques à ceux de la série locale de C (même fichier ONNX).
  if (referenceC) {
    analyse.equivalence.serieCLocale = Object.fromEntries(
      configs.map((cfg) => {
        const rs = visites.filter((v) => v.config === cfg.id && v.resultat?.ok);
        const comparaisons = rs.map((v) => ({ repetition: v.repetition, visite: v.visite, parDetecteur: comparerMasques(v.resultat.documents, referenceC.masques) }));
        const differents = comparaisons.filter((c) => Object.values(c.parDetecteur).some((x) => x.differents.length));
        return [cfg.id, { source: referenceC.source, executions: comparaisons.length, executionsAvecEcart: differents.length, comparaisons }];
      }),
    );
  }
  analyse.equivalence.moteursNode = Object.fromEntries(
    [['natif', 'natif-sans-optimisation'], ['natif', 'wasm'], ['natif-sans-optimisation', 'wasm']].map(([a, b]) => [`${a} = ${b}`, ids.filter((id) => chaine(moteurs[a].documents[id].masques) === chaine(moteurs[b].documents[id].masques)).length]),
  );

  // Entre configurations : masques du modèle, document par document, avec les scores des deux côtés.
  const paires = [['a', 'b', 'isolation (1 thread non isolé / threads par défaut isolé)'], ['b', 'c', 'threads (défaut / 1)'], ['a', 'c', 'isolation seule (1 thread)'], ['b', 'd', 'variante WASM (asyncify / simple)']];
  analyse.equivalence.entreConfigurations = [];
  for (const [x, y, sujet] of paires) {
    if (!sortieCfg[x] || !sortieCfg[y]) {
      analyse.equivalence.entreConfigurations.push({ paire: `${x}/${y}`, sujet, comparable: false });
      continue;
    }
    const differents = ids.filter((id) => chaine(sortieCfg[x][id].modele) !== chaine(sortieCfg[y][id].modele));
    analyse.equivalence.entreConfigurations.push({
      paire: `${x}/${y}`,
      sujet,
      comparable: true,
      identiques: ids.length - differents.length,
      documents: ids.length,
      ecarts: differents.map((id) => ({ document: id, ecarts: ecarts(textes.get(id), sortieCfg[x][id].modele, sortieCfg[y][id].modele, diagnostics[x]?.[id], diagnostics[y]?.[id]) })),
    });
  }

  // Écarts navigateur / Node natif (référence 1.5a), pour chaque sortie distincte du navigateur.
  const distinctes = new Map();
  for (const cfg of configs) {
    if (!sortieCfg[cfg.id]) continue;
    const s = chaine(ids.map((id) => sortieCfg[cfg.id][id].modele));
    if (!distinctes.has(s)) distinctes.set(s, []);
    distinctes.get(s).push(cfg.id);
  }
  analyse.equivalence.ecartsNodeNatif = [...distinctes.values()].map((groupe) => {
    const cfg = groupe[0];
    return {
      configurations: groupe,
      documents: ids
        .filter((id) => chaine(sortieCfg[cfg][id].modele) !== chaine(refNode.get(id).modele))
        .map((id) => ({ document: id, ecarts: ecarts(textes.get(id), refNode.get(id).modele, sortieCfg[cfg][id].modele, moteurs.natif.documents[id].scores, diagnostics[cfg]?.[id]) })),
    };
  });

  // S1 : toutes les visites (mesure et diagnostic).
  const toutes = [...visites, ...Object.values(diagnostics.__visites ?? {})];
  const hotes = {};
  const refusServeur = [];
  const nonGet = [];
  const avecCorps = [];
  for (const v of toutes) {
    for (const r of v.requetes ?? []) {
      const u = new URL(r.url);
      const hote = ['blob:', 'data:'].includes(u.protocol) ? `${u.protocol} (local, sans réseau)` : u.hostname;
      hotes[hote] ??= { requetes: 0, octets: 0 };
      hotes[hote].requetes++;
      hotes[hote].octets += r.octets ?? 0;
      if (r.methode !== 'GET') nonGet.push(r);
      if (r.corps > 0) avecCorps.push(r);
    }
    for (const e of v.journalServeur ?? []) if (e.statut !== 200 && e.statut !== 302) refusServeur.push(e);
  }
  const resultats = toutes.map((v) => v.resultat).filter(Boolean);
  const cheminsTiers = {};
  for (const v of toutes) {
    for (const r of v.requetes ?? []) {
      const u = new URL(r.url);
      if (u.protocol !== 'https:') continue;
      cheminsTiers[u.hostname] ??= {};
      cheminsTiers[u.hostname][u.pathname] = (cheminsTiers[u.hostname][u.pathname] ?? 0) + 1;
    }
  }
  const tunnels = {};
  for (const v of toutes) for (const t of v.journalProxy?.tunnels ?? []) {
    tunnels[t.hote] ??= { tunnels: 0, recus: 0, envoyes: 0, erreurs: [] };
    tunnels[t.hote].tunnels++;
    tunnels[t.hote].recus += t.recus;
    tunnels[t.hote].envoyes += t.envoyes;
    if (t.erreur) tunnels[t.hote].erreurs.push(t.erreur);
  }
  analyse.s1 = {
    visites: toutes.length,
    hotes,
    horsListe: toutes.flatMap((v) => horsListe(v.requetes, CHEMINS_HF)),
    cheminsTiers,
    proxy: { tunnels, refus: toutes.flatMap((v) => v.journalProxy?.refus ?? []) },
    nonGet,
    avecCorps,
    refuseesParLeServeur: refusServeur,
    tentativesBloquees: resultats.flatMap((r) => r.tentativesBloquees),
    violationsCsp: resultats.flatMap((r) => r.s1.violations),
    consoleCsp: toutes.flatMap((v) => (v.consoles ?? []).filter((c) => /Content Security Policy|Refused to/i.test(c.texte))),
    consoleErreurs: toutes.flatMap((v) => v.consoles ?? []),
  };
  return analyse;
}

// --- Rapport -----------------------------------------------------------------------

const fmt = (s) => (s?.n ? `${s.mediane} [${s.min}–${s.max}]` : '—');
const ms = (x) => (x == null ? '—' : `${Math.round(x)}`);
const top = (t) => (t ? t.map(([l, s]) => `${l} ${s.toFixed(2)}`).join(' / ') : '—');

export function rapport(r) {
  const L = [];
  const p = (...x) => L.push(...x);
  const e = r.environnement;
  const hf = r.source === 'hf';
  p(`# Banc navigateur — Chrome (${hf ? 'modèle depuis Hugging Face' : 'lot 1.5b'})`, '');
  p(`> Jeu de développement (17 documents, 23 280 caractères) : indicatif, pas la mesure finale.${r.essai ? ' **ESSAI — pas une mesure de référence.**' : ''}`, '');
  const serieC = r.analyse.equivalence.serieCLocale;
  if (serieC) {
    const ecart = Object.values(serieC).some((c) => c.executionsAvecEcart);
    p(ecart ? `> **ATTENTION : au moins un masque diffère de la série locale de C** (section « Comparaison avec la série locale de C »).` : `> Masques identiques à ceux de la série locale de C, pour chaque visite réussie et chaque détecteur (section « Comparaison avec la série locale de C »).`, '');
  }
  p(`- Date : ${r.date}`, `- Commit : \`${r.git.hash}\` ; arbre propre : ${r.git.propre ? 'oui' : 'non'}`, `- Détecteur : ${r.detecteur}`);
  if (r.modele) p(`- Fichier modèle chargé par la page : \`${r.modele.cle}\` (SHA-256 \`${r.modele.sha256}\`)${hf ? ` — source hf, \`${urlHF(r.hf.fichiers.find((f) => f.chemin.endsWith('.onnx')).chemin)}\`` : r.modele.option ? ` — option --modele` : ' — q8 épinglé, sans --modele'} ; contrôlé à chaque visite réussie`);
  p(`- Machine : ${e.machine} ; ${e.systeme}`, `- ${e.chrome} (Playwright ${e.playwright}, canal chrome, fenêtre visible) ; Node ${e.node}`);
  p(`- Transformers.js ${e.transformers} ; onnxruntime-web ${e.onnxruntimeWeb} ; backend WASM (WebGPU hors périmètre)`);
  if (hf) p(`- Source du modèle : dépôt Hugging Face \`${r.hf.depot}\`, commit \`${r.hf.commit}\` (https://huggingface.co/${r.hf.depot}/resolve/${r.hf.commit}/…), dtype ${r.hf.dtype}`);
  p(hf
    ? `- Débit simulé : ${DEBIT} Mb/s, un seul seau partagé par le serveur local (page, bibliothèques, WebAssembly, documents) et le proxy local bench/proxy.mjs (tunnels HTTPS vers Hugging Face, octets reçus) ; le trafic Hugging Face traverse le réseau réel (latence réelle), plafonné par ce seau et par la ligne`
    : `- Débit simulé : ${DEBIT} Mb/s, côté serveur (seau partagé par toutes les réponses, boucle locale : ni latence ni perte, donc optimiste par rapport à un vrai réseau)`);
  p(`- ${r.repetitions} répétitions par configuration ; 1re visite = profil Chrome neuf ; visite suivante = Chrome fermé puis relancé sur le même profil`);
  p(`- transformers.web.min.js servi avec 2 spécificateurs réécrits en chemins locaux (sha256 d'origine ${r.transformers.shaOriginal.slice(0, 16)}…, servi ${r.transformers.shaServi.slice(0, 16)}…)`, '');
  p(`Valeurs : médiane [min–max] en ms, sur les répétitions réussies.`, '');

  p(`## Configurations`, '', `| Config | Description | Isolée | Threads effectifs | Variante | Échecs |`, `|---|---|---|---|---|---|`);
  for (const [id, c] of Object.entries(r.analyse.configurations)) p(`| ${id} | ${c.libelle} | ${c.isolation.join(', ') || '—'} | ${c.numThreads.join(', ') || '—'} | ${c.variante.join(', ') || '—'} | ${c.echecs.length ? c.echecs.map((x) => `rép. ${x.repetition} v${x.visite} : ${x.erreur}`).join(' ; ') : 'aucun'} |`);
  p('');

  p(`## S7 — chargement`, '');
  p(`Seuils : règles < ${SEUILS_S7.reglesPretes} ms ; modèle prêt ≤ ${SEUILS_S7.premiereVisite} ms (1re visite, 100 Mb/s) ; ≤ ${SEUILS_S7.visiteSuivante} ms (visites suivantes). « Modèle prêt » = session créée + inférence de chauffe, depuis le début de la navigation.`, '');
  p(`| Config | Visite | n | Règles prêtes | **Modèle prêt** | Bibliothèques JS | Téléchargement | Empreintes | Mise en cache | Session | Chauffe | Avant chargement | Octets reçus (serveur local + proxy) | S7 (max ≤ seuil) |`, `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const [id, c] of Object.entries(r.analyse.configurations)) {
    for (const [cle, nomV, seuil] of [['premiereVisite', '1re', SEUILS_S7.premiereVisite], ['visiteSuivante', 'suivante', SEUILS_S7.visiteSuivante]]) {
      const v = c.chargement[cle];
      const d = v.durees;
      const okModele = v.modelePret.n ? v.modelePret.max <= seuil : null;
      const okRegles = v.reglesPretes.n ? v.reglesPretes.max < SEUILS_S7.reglesPretes : null;
      const verdict = okModele == null ? '—' : okModele && okRegles ? 'atteint' : 'non atteint';
      p(`| ${id} | ${nomV} | ${v.repetitions} | ${fmt(v.reglesPretes)} | **${fmt(v.modelePret)}** | ${fmt(d.bibliotheque)} | ${fmt(d.telechargement)} | ${fmt(d.empreintes)} | ${fmt(d.miseEnCache)} | ${fmt(d.session)} | ${fmt(d.chauffe)} | ${fmt(d.avantChargement)} | ${v.octetsServis.n ? `${(v.octetsServis.mediane / 1e6).toFixed(1)} Mo` : '—'} | ${verdict} |`);
    }
  }
  p('');

  if (hf) {
    p(`## Débit effectif`, '');
    p(`Phase « téléchargement » (fichiers du modèle depuis Hugging Face et fichiers WebAssembly locaux, en parallèle) : (octets reçus par le proxy + octets WebAssembly servis) / durée de la phase. Plus gros tunnel : octets reçus / temps du premier au dernier octet reçu. Seau : ${DEBIT} Mb/s.`, '');
    p(`| Config | Visite | Rép. | Octets proxy | Octets WebAssembly | Phase (Mb/s) | Plus gros tunnel : hôte | octets | durée (ms) | Mb/s |`, `|---|---|---|---|---|---|---|---|---|---|`);
    for (const [id, c] of Object.entries(r.analyse.configurations)) {
      for (const [cle, nomV] of [['premiereVisite', '1re'], ['visiteSuivante', 'suivante']]) {
        for (const d of c.chargement[cle].debit) p(`| ${id} | ${nomV} | ${d.repetition} | ${d.octetsProxy.toLocaleString('fr-FR')} | ${d.octetsWasm.toLocaleString('fr-FR')} | ${d.phaseMbps ?? '—'} | ${d.plusGrosTunnel?.hote ?? '—'} | ${d.plusGrosTunnel ? d.plusGrosTunnel.recus.toLocaleString('fr-FR') : '—'} | ${d.plusGrosTunnel?.dureeMs ?? '—'} | ${d.plusGrosTunnel?.mbps ?? '—'} |`);
      }
    }
    p('');
  }

  p(`## Un cœur ou plusieurs`, '');
  p(`| Config | Threads | Session (1re visite) | ms pour 1 000 caractères | Modèle prêt (visite suivante) |`, `|---|---|---|---|---|`);
  for (const [id, c] of Object.entries(r.analyse.configurations)) p(`| ${id} | ${c.numThreads.join(', ') || '—'} | ${fmt(c.chargement.premiereVisite.durees.session)} | ${fmt(c.s8.msPour1000Caracteres)} | ${fmt(c.chargement.visiteSuivante.modelePret)} |`);
  p('', `Lecture : b − c = effet des threads seul (même isolation) ; a − c = effet de l'isolation seule (1 thread des deux côtés).`, '');

  p(`## S8 — traitement (règles + modèle, après « modèle prêt »)`, '');
  p(`« Page » = ${PAGE} caractères : **convention déclarée pour ce rapport, pas une norme**.`, '');
  p(`| Config | ms par document (médiane des médianes) | ms pour 1 000 caractères | ms par page (${PAGE} car.) |`, `|---|---|---|---|`);
  for (const [id, c] of Object.entries(r.analyse.configurations)) p(`| ${id} | ${fmt(c.s8.msParDocumentMediane)} | ${fmt(c.s8.msPour1000Caracteres)} | ${fmt(c.s8.msParPage)} |`);
  p('', `Par document (ms, toutes visites) :`, '');
  const cfgIds = Object.keys(r.analyse.configurations);
  p(`| Document | Caractères | ${cfgIds.join(' | ')} |`, `|---|---|${cfgIds.map(() => '---').join('|')}|`);
  for (const d of r.documents) p(`| ${d.id} | ${d.caracteres} | ${cfgIds.map((id) => fmt(r.analyse.configurations[id].s8.parDocument[d.id])).join(' | ')} |`);
  p('');

  const eq = r.analyse.equivalence;
  p(`## Équivalence des masques`, '');
  p(`Référence Node = \`resultats/navigateur/reference-node-dev.json\` (onnxruntime-node natif, celui de toutes les mesures du lot 1.5a). Nombre de documents identiques sur 17 (minimum sur toutes les exécutions de la configuration).`, '');
  p(`| Config | Exécutions | Stable entre exécutions | Règles = Node | Modèle = Node natif | Combiné = Node natif | Modèle = Node WASM | Modèle = Node natif sans optimisation |`, `|---|---|---|---|---|---|---|---|`);
  for (const id of cfgIds) {
    const q = eq[id];
    if (!q) continue;
    p(`| ${id} | ${q.executions} | ${q.stableEntreExecutions ? 'oui' : '**non**'} | ${q.vsNodeNatif.regles}/17 | ${q.vsNodeNatif.modele}/17 | ${q.vsNodeNatif.combine}/17 | ${q.vsNodeWasm.modele}/17 | ${q.vsNodeNatifSansOptimisation.modele}/17 |`);
  }
  if (eq.serieCLocale) {
    p('', `### Comparaison avec la série locale de C`, '');
    p(`Référence : ${Object.values(eq.serieCLocale)[0]?.source ?? '—'}. Documents identiques sur 17, par visite réussie et par détecteur.`, '');
    p(`| Config | Rép. | Visite | Règles | Modèle | Combiné | Documents différents |`, `|---|---|---|---|---|---|---|`);
    for (const [id, c] of Object.entries(eq.serieCLocale)) {
      for (const x of c.comparaisons) {
        const d = x.parDetecteur;
        const diff = [...new Set(Object.values(d).flatMap((y) => y.differents))];
        p(`| ${id} | ${x.repetition} | ${x.visite} | ${d.regles.identiques}/${d.regles.total} | ${d.modele.identiques}/${d.modele.total} | ${d.combine.identiques}/${d.combine.total} | ${diff.join(', ') || 'aucun'} |`);
      }
    }
  }
  p('', `Moteurs côté Node entre eux (scripts/navigateur/moteurs-node.mjs) :`, '');
  for (const [k, v] of Object.entries(eq.moteursNode)) p(`- ${k} : ${v}/17`);
  p('', `Entre configurations du navigateur (masques du modèle) :`, '');
  for (const x of eq.entreConfigurations) p(`- ${x.paire} — ${x.sujet} : ${x.comparable ? `${x.identiques}/${x.documents} identiques` : 'non comparable (configuration absente)'}`);
  for (const x of eq.entreConfigurations.filter((y) => y.comparable && y.ecarts.length)) {
    p('', `### Écarts ${x.paire} (A = ${x.paire[0]}, B = ${x.paire[2]})`, '');
    tableEcarts(p, x.ecarts);
  }
  for (const g of eq.ecartsNodeNatif) {
    p('', `### Écarts navigateur (config ${g.configurations.join(', ')}) / Node natif`, '');
    p(`A = Node natif (référence 1.5a), B = navigateur. Une ligne par masque présent d'un seul côté ; mots du passage dont l'étiquette retenue change, avec les deux meilleures étiquettes et leurs scores (logits) de chaque côté.`, '');
    if (!g.documents.length) p('Aucun écart.');
    else tableEcarts(p, g.documents);
  }
  p('');

  const s = r.analyse.s1;
  p(`## S1 — réseau`, '', `${s.visites} visites (mesure et diagnostic). Requêtes vues par Playwright (page et Workers), journal du serveur, garde sur env.fetch, CSP.`, '');
  p(`| Hôte | Requêtes | Octets reçus |`, `|---|---|---|`);
  for (const [h, v] of Object.entries(s.hotes)) p(`| ${h} | ${v.requetes} | ${v.octets.toLocaleString('fr-FR')} |`);
  p('');
  p(`- Requêtes autres que GET : ${s.nonGet.length}`, `- Requêtes avec un corps : ${s.avecCorps.length}`);
  p(`- Requêtes de la page ou du Worker hors liste (origine, huggingface.co, *.hf.co ; chemins huggingface.co attendus) : ${s.horsListe.length ? [...new Set(s.horsListe.map((x) => `${x.url} (${x.motif})`))].join(' ; ') : 'aucune'}`);
  if (Object.keys(s.cheminsTiers).length) {
    p('', `Chemins HTTPS demandés par la page et le Worker (sans la requête, signée pour les hôtes de téléchargement) :`, '', `| Hôte | Chemin | Requêtes |`, `|---|---|---|`);
    for (const [h, chemins] of Object.entries(s.cheminsTiers)) for (const [c, n] of Object.entries(chemins)) p(`| ${h} | \`${c.length > 90 ? `${c.slice(0, 90)}…` : c}\` | ${n} |`);
    p('');
  }
  if (r.source === 'hf') {
    p(`Proxy (bench/proxy.mjs) : tunnels acceptés par hôte, et connexions refusées (hors liste).`, '', `| Hôte | Tunnels | Octets reçus | Octets envoyés | Erreurs |`, `|---|---|---|---|---|`);
    for (const [h, t] of Object.entries(s.proxy.tunnels)) p(`| ${h} | ${t.tunnels} | ${t.recus.toLocaleString('fr-FR')} | ${t.envoyes.toLocaleString('fr-FR')} | ${t.erreurs.length ? [...new Set(t.erreurs)].join(' ; ') : 'aucune'} |`);
    const refus = {};
    for (const x of s.proxy.refus) refus[`${x.methode} ${x.cible}`] = (refus[`${x.methode} ${x.cible}`] ?? 0) + 1;
    p('', `- Connexions refusées par le proxy : ${Object.keys(refus).length ? Object.entries(refus).map(([k, n]) => `${k} (${n})`).join(' ; ') : 'aucune'}`);
  }
  p(`- Chemins refusés par la liste blanche du serveur : ${s.refuseesParLeServeur.length ? [...new Set(s.refuseesParLeServeur.map((x) => `${x.methode} ${x.chemin} → ${x.statut}`))].join(' ; ') : 'aucun'}`);
  p(`- Tentatives bloquées (env.fetch de la bibliothèque) : ${s.tentativesBloquees.length ? [...new Set(s.tentativesBloquees)].join(' ; ') : 'aucune'}`);
  p(`- Violations CSP (événements page et Worker) : ${s.violationsCsp.length ? JSON.stringify(s.violationsCsp) : 'aucune'}`);
  p(`- Messages CSP dans la console : ${s.consoleCsp.length ? [...new Set(s.consoleCsp.map((c) => c.texte))].join(' ; ') : 'aucun'}`);
  p(`- Autres erreurs ou avertissements de console : ${s.consoleErreurs.length ? [...new Set(s.consoleErreurs.map((c) => `${c.type} : ${c.texte}`))].join(' ; ') : 'aucun'}`);
  p('', r.source === 'hf'
    ? `Requêtes propres au navigateur hors page (mises à jour, services Google de Chrome) : invisibles pour Playwright ; leurs connexions HTTPS passent par le proxy, qui les refuse hors liste (ci-dessus) ; elles ne portent pas le texte du document.`
    : `Non couvert : requêtes propres au navigateur hors page (mises à jour, services Google de Chrome), invisibles pour Playwright ; elles ne portent pas le texte du document.`, '');
  return L.join('\n') + '\n';
}

function tableEcarts(p, documents) {
  p(`| Document | Seulement chez | Type | Passage | Mots (A ; B) |`, `|---|---|---|---|---|`);
  for (const d of documents) {
    for (const x of d.ecarts) {
      const changes = x.mots.filter((m) => m.A?.[0]?.[0] !== m.B?.[0]?.[0]);
      const montres = changes.length ? changes : x.mots;
      const mots = montres.map((m) => `« ${m.mot} » A : ${top(m.A)} ; B : ${top(m.B)}`).join('<br>');
      p(`| ${d.document} | ${x.seulement} | ${x.type} | « ${x.passage.replace(/\|/g, '\\|').replace(/\n/g, ' ')} » | ${mots.replace(/\|/g, '\\|') || '—'} |`);
    }
  }
}

// --- Programme ---------------------------------------------------------------------

// Masques de la série locale de C : ceux de la première visite réussie, après contrôle qu'ils
// sont les mêmes à toutes les visites réussies de la série.
function lireSerieCLocale() {
  const serie = JSON.parse(fs.readFileSync(SERIE_C_LOCALE, 'utf8'));
  const ok = serie.visites.filter((v) => v.resultat?.ok);
  const masques = (v) => Object.fromEntries(v.resultat.documents.map((d) => [d.id, d.masques]));
  const signatures = new Set(ok.map((v) => JSON.stringify(masques(v))));
  if (!ok.length || signatures.size !== 1) throw new Error(`${path.relative(RACINE, SERIE_C_LOCALE)} : ${ok.length} visites réussies, ${signatures.size} jeux de masques distincts (1 attendu)`);
  return { source: `${path.relative(RACINE, SERIE_C_LOCALE)} (commit ${serie.git.hash.slice(0, 7)}, ${ok.length} visites réussies, masques identiques entre elles)`, masques: masques(ok[0]) };
}

async function main() {
  const { values } = parseArgs({
    options: {
      repetitions: { type: 'string', default: '5' },
      configs: { type: 'string', default: CONFIGS.map((c) => c.id).join(',') },
      sortie: { type: 'string', default: path.join(RACINE, 'resultats', 'navigateur') },
      essai: { type: 'boolean', default: false },
      modele: { type: 'string' },
      source: { type: 'string' },
    },
  });
  if (values.modele !== undefined && !cleModeleValide(values.modele)) throw new Error(`--modele : clé invalide « ${values.modele} »`);
  if (values.source !== undefined && !['hf', 'local'].includes(values.source)) throw new Error(`--source : hf ou local, pas « ${values.source} »`);
  if (values.source === 'hf' && values.modele !== undefined) throw new Error('--modele est réservé à --source local');
  const source = values.source ?? (values.modele !== undefined ? 'local' : 'hf');
  const hf = source === 'hf';
  const onnxHF = HF.fichiers.find((f) => f.chemin.endsWith('.onnx'));
  const cleModele = hf ? onnxHF.cle : values.modele ?? `camembert-ner/${REVISION}/onnx/model_quantized.onnx`;
  const shaModele = new Map(fs.readFileSync(path.join(RACINE, 'modeles', 'MANIFEST.sha256'), 'utf8').split('\n').filter(Boolean).map((l) => l.split(/ [ *]/).reverse())).get(cleModele);
  if (!shaModele) throw new Error(`--modele : ${cleModele} absent de modeles/MANIFEST.sha256`);
  const repetitions = Number(values.repetitions);
  const configs = values.configs.split(',').map((id) => CONFIGS.find((c) => c.id === id) ?? (() => { throw new Error(`configuration inconnue : ${id}`); })());
  const propre = executer('git', ['status', '--porcelain']) === '';
  if (!propre && !values.essai) throw new Error('arbre git non propre : mesure refusée (commiter d\'abord, ou --essai)');
  const git = { hash: executer('git', ['rev-parse', 'HEAD']), propre };
  const environnement = lireEnvironnement();
  console.log(`commit ${git.hash.slice(0, 7)} (propre : ${propre}) ; ${environnement.chrome} ; ${repetitions} répétitions ; configurations ${configs.map((c) => c.id).join(', ')} ; source ${source}${hf ? ` (${HF.depot}@${HF.commit.slice(0, 8)})` : ''} ; modèle ${cleModele}`);

  // Un seul seau de DEBIT Mb/s pour le serveur local et le proxy (visites successives).
  const limiteur = creerLimiteur(DEBIT);
  const serveurs = {};
  for (const isolation of [false, true]) {
    const s = creerServeur({ isolation, limiteur });
    serveurs[isolation] = { s, port: await s.ecouter(0) };
  }
  let proxy = null;
  if (hf) {
    const p = creerProxy({ limiteur });
    proxy = { p, port: await p.ecouter(0) };
  }
  const parametreModele = `&source=${source}${values.modele ? `&modele=${encodeURIComponent(values.modele)}` : ''}`;
  const url = (cfg, extra = '') => `http://127.0.0.1:${serveurs[cfg.isolation].port}/bench/index.html?auto=1&variante=${cfg.variante}&threads=${cfg.threads}${parametreModele}${extra}`;
  // Une visite réussie doit avoir chargé le fichier demandé (source hf : URL du commit épinglé),
  // avec l'empreinte du manifeste.
  const controlerModele = (r) => {
    const onnx = r.fichiers.find((f) => f.cle === cleModele && (!hf || f.url === urlHF(onnxHF.chemin)));
    if (r.config.source !== source || r.config.modeleCharge !== cleModele || onnx?.sha256 !== shaModele) throw new Error(`modèle chargé ${r.config.source} ${r.config.modeleCharge} (${onnx?.sha256 ?? 'empreinte absente'}), attendu ${source} ${cleModele} (${shaModele})`);
  };
  // Source hf : arrêt si la page ou le Worker a visé un hôte hors liste, ou si la CSP a bloqué une requête.
  const controlerHotes = (v) => {
    const hors = horsListe(v.requetes, CHEMINS_HF);
    const csp = v.resultat?.s1?.violations ?? [];
    if (!hors.length && !csp.length) return;
    const arret = path.join(values.sortie, 'chrome-arret.json');
    fs.mkdirSync(values.sortie, { recursive: true });
    fs.writeFileSync(arret, JSON.stringify({ date: new Date().toISOString(), git, horsListe: hors, violationsCsp: csp, visites }, null, 1) + '\n');
    throw new Error(`arrêt : requête hors liste ou bloquée par la CSP (${JSON.stringify([...hors, ...csp])}) ; visites consignées dans ${arret}`);
  };
  const nouveauProfil = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mask-banc-'));

  const visites = [];
  const abandon = new Set();
  for (let rep = 1; rep <= repetitions; rep++) {
    const ordre = configs.map((_, i) => configs[(i + rep - 1) % configs.length]);
    for (const cfg of ordre) {
      if (abandon.has(cfg.id)) continue;
      const profil = nouveauProfil();
      try {
        for (const n of [1, 2]) {
          let v;
          try {
            v = await visite(profil, url(cfg), serveurs[cfg.isolation].s, proxy);
          } catch (err) {
            v = { resultat: null, erreur: String(err?.message ?? err), requetes: [], consoles: [], journalServeur: [] };
          }
          visites.push({ config: cfg.id, repetition: rep, visite: n, ...v });
          if (hf) controlerHotes(v);
          const r = v.resultat;
          if (r?.ok) controlerModele(r);
          console.log(`rép. ${rep} config ${cfg.id} visite ${n} : ${r?.ok ? `règles ${r.temps.reglesPretes} ms, modèle prêt ${r.temps.modelePret} ms, ${r.numThreads} thread(s), ${r.s8.msPour1000Caracteres} ms/1000 car.` : `ÉCHEC ${r?.erreur ?? v.erreur}`}`);
          if (!r?.ok) {
            if (rep === 1 && n === 1) abandon.add(cfg.id);
            break;
          }
        }
      } finally {
        fs.rmSync(profil, { recursive: true, force: true });
      }
    }
  }

  // Diagnostic (hors mesure) : scores par mot, une visite par configuration.
  const diagnostics = { __visites: {} };
  for (const cfg of configs) {
    if (abandon.has(cfg.id)) continue;
    const profil = nouveauProfil();
    try {
      const v = await visite(profil, url(cfg, '&diagnostic=1'), serveurs[cfg.isolation].s, proxy);
      if (hf) controlerHotes(v);
      diagnostics.__visites[cfg.id] = { ...v, resultat: { ...v.resultat, diagnostic: null } };
      diagnostics[cfg.id] = v.resultat?.diagnostic ?? null;
      console.log(`diagnostic config ${cfg.id} : ${v.resultat?.ok ? 'ok' : `ÉCHEC ${v.resultat?.erreur}`}`);
    } finally {
      fs.rmSync(profil, { recursive: true, force: true });
    }
  }
  for (const { s } of Object.values(serveurs)) await s.fermer();
  await proxy?.p.fermer();

  console.log('moteurs Node (natif, natif sans optimisation, WASM)…');
  const documents = documentsDev();
  const moteurs = await parMoteur(documents);

  const analyse = analyser({ visites, diagnostics, moteurs, documents, configs, referenceC: hf ? lireSerieCLocale() : null });
  const sortie = {
    format: 'banc-chrome-1',
    date: new Date().toISOString(),
    essai: values.essai,
    git,
    environnement,
    detecteur: 'combiné = règles 0.4.0 + modèle 0.2.0 (gel mask-1.5a-gel)',
    source,
    hf: hf ? { depot: HF.depot, commit: HF.commit, dtype: HF.dtype, fichiers: HF.fichiers } : null,
    modele: { cle: cleModele, sha256: shaModele, option: values.modele ?? null },
    debitMbps: DEBIT,
    repetitions,
    configurations: configs,
    transformers: serveurs[true].s.transformers,
    documents: documents.map((d) => ({ id: d.id, caracteres: d.texte.length })),
    analyse,
    visites: visites.map(({ resultat, ...v }) => ({ ...v, resultat: resultat ? { ...resultat, diagnostic: undefined } : null })),
  };
  fs.mkdirSync(values.sortie, { recursive: true });
  fs.writeFileSync(path.join(values.sortie, 'chrome.json'), JSON.stringify(sortie, null, 1) + '\n');
  fs.writeFileSync(path.join(values.sortie, 'chrome.md'), rapport(sortie));
  console.log(`écrit : ${path.join(values.sortie, 'chrome.json')} et chrome.md`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

// Chargeur navigateur (src/modele-navigateur.mjs), source Hugging Face : téléchargement, empreintes
// et cache (telechargerVerifies, la fonction qu'utilise charger()), avec un faux fetch et un faux
// CacheStorage ; dépôt épinglé cohérent avec le manifeste et resultats/hebergement/publication.md ;
// règle des hôtes du proxy du banc.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HF, configurer, lireManifeste, telechargerVerifies, urlHF } from '../src/modele-navigateur.mjs';
import { hoteAutorise, horsListe } from '../bench/proxy.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (o) => crypto.createHash('sha256').update(o).digest('hex');

function fauxCache(initial = {}) {
  const contenu = new Map(Object.entries(initial));
  const appels = { put: [], delete: [] };
  return {
    contenu,
    appels,
    match: async (url) => (contenu.has(url) ? new Response(contenu.get(url)) : undefined),
    put: async (url, reponse) => {
      appels.put.push(url);
      contenu.set(url, new Uint8Array(await reponse.arrayBuffer()));
    },
    delete: async (url) => {
      appels.delete.push(url);
      return contenu.delete(url);
    },
  };
}

function fauxFetch(reponses) {
  const appels = [];
  const f = async (url, options) => {
    appels.push({ url, options });
    const r = reponses[url];
    return r === undefined ? new Response(null, { status: 404 }) : new Response(r);
  };
  f.appels = appels;
  return f;
}

const BON = new TextEncoder().encode('{"fichier": "modèle de test"}');
const URL_A = 'https://huggingface.co/x/resolve/c/a.json';
const URL_WASM = 'http://127.0.0.1/vendor/ort/ort-wasm-simd-threaded.wasm';
const WASM = new Uint8Array([0, 97, 115, 109]);

function cas({ octets = BON.length, attendu = sha(BON), cache = fauxCache(), reseau = { [URL_A]: BON, [URL_WASM]: WASM } } = {}) {
  const cacheOrt = fauxCache();
  const fetch = fauxFetch(reseau);
  const jalons = [];
  const progression = [];
  const appel = () =>
    telechargerVerifies({
      sources: [{ url: URL_A, cle: 'x/a.json', octets, cache }],
      annexes: [{ url: URL_WASM, cache: cacheOrt }],
      manifeste: new Map([['x/a.json', attendu]]),
      fetch,
      surProgression: (p) => progression.push(p),
      jalon: (n) => jalons.push(n),
    });
  return { appel, cache, cacheOrt, fetch, jalons, progression };
}

test('chargeur : fichier conforme vérifié, mis en cache après vérification, progression complète', async () => {
  const c = cas();
  const { modele, annexes } = await c.appel();
  assert.equal(modele[0].sha256, sha(BON));
  assert.equal(modele[0].depuisCache, false);
  assert.deepEqual(new Uint8Array(modele[0].octets), BON);
  assert.deepEqual(new Uint8Array(annexes[0].octets), WASM);
  assert.deepEqual(c.jalons, ['telechargement', 'empreintes', 'miseEnCache']);
  assert.deepEqual(c.cache.appels.put, [URL_A]);
  assert.deepEqual(c.cacheOrt.appels.put, [URL_WASM]);
  assert.deepEqual(c.progression.at(-1), { recus: BON.length, total: BON.length });
  assert.equal(c.fetch.appels.find((x) => x.url === URL_A).options.credentials, 'omit');
});

test('chargeur : empreinte fausse → refus explicite, rien mis en cache, aucun repli', async () => {
  const c = cas({ attendu: '0'.repeat(64) });
  await assert.rejects(c.appel(), /empreinte différente pour x\/a\.json \(attendu 0{64}, obtenu [0-9a-f]{64}\)/);
  assert.deepEqual(c.cache.appels.put, []);
  assert.deepEqual(c.cacheOrt.appels.put, []);
  assert.equal(c.cache.contenu.size, 0);
  assert.deepEqual(c.jalons, ['telechargement']);
  assert.deepEqual(c.fetch.appels.map((x) => x.url).sort(), [URL_WASM, URL_A].sort(), 'une seule requête par fichier : pas de nouvel essai ni d\'autre source');
});

test('chargeur : copie en cache corrompue → supprimée, refus explicite, sans téléchargement', async () => {
  const cache = fauxCache({ [URL_A]: new TextEncoder().encode('{"fichier": "modifié"}') });
  const c = cas({ cache });
  await assert.rejects(c.appel(), /empreinte différente pour x\/a\.json \(copie en cache, supprimée\)/);
  assert.deepEqual(cache.appels.delete, [URL_A]);
  assert.equal(cache.contenu.has(URL_A), false);
  assert.equal(c.fetch.appels.some((x) => x.url === URL_A), false);
});

test('chargeur : fichier plus long que la taille attendue → refus', async () => {
  const c = cas({ octets: BON.length - 1 });
  await assert.rejects(c.appel(), /dépasse la taille attendue/);
  assert.deepEqual(c.cache.appels.put, []);
});

test('chargeur : clé absente du manifeste → refus avant tout téléchargement ; HTTP en erreur → refus', async () => {
  await assert.rejects(
    telechargerVerifies({ sources: [{ url: URL_A, cle: 'absente', octets: 1, cache: fauxCache() }], manifeste: new Map(), fetch: fauxFetch({}) }),
    /absente absent du manifeste/,
  );
  const c = cas({ reseau: { [URL_WASM]: WASM } });
  await assert.rejects(c.appel(), /a\.json → HTTP 404/);
});

test('chargeur : configuration (source, modele réservé à la source locale)', () => {
  assert.throws(() => configurer({ source: 'cdn' }), /source inconnue/);
  assert.throws(() => configurer({ modele: 'compression/int8-matmul/model.onnx' }), /réservé à la source locale/);
  assert.throws(() => configurer({ surProgression: 'non' }), /surProgression/);
  configurer({ source: 'local', modele: 'compression/int8-matmul/model.onnx' });
  configurer();
});

test('dépôt épinglé : commit de publication.md, URL du commit, empreintes du manifeste', () => {
  const publication = fs.readFileSync(path.join(RACINE, 'resultats', 'hebergement', 'publication.md'), 'utf8');
  assert.match(publication, new RegExp(`Commit à épingler : \`${HF.commit}\``));
  const manifeste = lireManifeste(fs.readFileSync(path.join(RACINE, 'modeles', 'MANIFEST.sha256'), 'utf8'));
  for (const f of HF.fichiers) {
    assert.equal(urlHF(f.chemin), `https://huggingface.co/migranche/mask-camembert-ner/resolve/${HF.commit}/${f.chemin}`);
    const empreinte = manifeste.get(f.cle);
    assert.ok(empreinte, f.cle);
    const ligne = publication.split('\n').find((l) => l.startsWith(`| \`${f.chemin}\` |`));
    assert.ok(ligne?.includes(`\`${empreinte}\``), `${f.chemin} : empreinte du manifeste absente de publication.md`);
    assert.ok(ligne?.includes(f.octets.toLocaleString('fr-FR').replace(/ /g, ' ')), `${f.chemin} : taille ${f.octets}`);
  }
});

test('banc : hôtes autorisés par le proxy et requêtes hors liste', () => {
  for (const h of ['huggingface.co', 'us.aws.cdn.hf.co', 'cas-bridge.xethub.hf.co']) assert.ok(hoteAutorise(h), h);
  for (const h of ['hf.co', 'evilhf.co', 'hf.co.exemple.fr', 'huggingface.co.exemple.fr', 'cdn-lfs.huggingface.co', 'exemple.fr', undefined]) assert.ok(!hoteAutorise(h), String(h));
  const attendus = new Set([new URL(urlHF('config.json')).pathname]);
  const requetes = [
    { url: 'http://127.0.0.1:8123/bench/index.html' },
    { url: 'blob:http://127.0.0.1:8123/x' },
    { url: urlHF('config.json') },
    { url: 'https://us.aws.cdn.hf.co/xet/abc?signature=s' },
    { url: 'https://huggingface.co/autre/depot/resolve/main/config.json' },
    { url: 'https://exemple.fr/collecte?texte=x' },
    { url: 'http://us.aws.cdn.hf.co/x' },
  ];
  assert.deepEqual(horsListe(requetes, attendus), [
    { url: 'https://huggingface.co/autre/depot/resolve/main/config.json', motif: 'chemin huggingface.co inattendu' },
    { url: 'https://exemple.fr/collecte', motif: 'hôte hors liste' },
    { url: 'http://us.aws.cdn.hf.co/x', motif: 'hôte hors liste' },
  ]);
});

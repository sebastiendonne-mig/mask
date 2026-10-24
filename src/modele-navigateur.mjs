// Détecteur par modèle, chargeur navigateur (Worker de module ou page) : même logique que
// le chargeur Node (src/modele-commun.mjs), avec onnxruntime-web (backend WASM).
//
// Source du modèle (amendement (7), puce « Hébergement ») :
// - par défaut, « hf » : C (fp16 mixte) et son tokenizer depuis le dépôt Hugging Face
//   migranche/mask-camembert-ner, épinglé au commit HF.commit (resultats/hebergement/publication.md),
//   par https://huggingface.co/<dépôt>/resolve/<commit>/<chemin> ;
// - « local », réservée aux tests et au banc : fichiers servis par l'origine de l'app (q8 Xenova
//   épinglé, ou un autre fichier ONNX du manifeste par configurer({ modele })), comme au lot 1.5b.
//   Jamais choisie sans configurer({ source: 'local' }) explicite ; aucun repli d'une source vers l'autre.
//
// - La bibliothèque, onnxruntime-web et ses fichiers WebAssembly sont servis par l'origine de
//   l'app (CHEMINS) ; aucun CDN. wasmPaths est fixé avant l'import de Transformers.js : la
//   bibliothèque ne fabrique alors jamais l'URL du CDN (transformers.web.js:8731, condition « !wasmPaths »).
// - Les fichiers du modèle sont vérifiés (SHA-256, crypto.subtle) contre modeles/MANIFEST.sha256
//   avant tout usage, puis gardés dans CacheStorage pour les visites suivantes, et revérifiés
//   à chaque chargement. Empreinte différente ou fichier trop long : refus explicite ; une entrée
//   de cache fautive est supprimée.
// - La bibliothèque reçoit les octets par env.customCache ; env.fetch est remplacé par une
//   fonction qui refuse et note toute tentative.
// - Progression du téléchargement des fichiers du modèle : etat.progression et
//   configurer({ surProgression }).

import { DEPOT, REVISION, FICHIERS, fabriqueDetecteur, preparer } from './modele-commun.mjs';

export * from './modele-commun.mjs';

export const CHEMINS = {
  transformers: '/vendor/transformers.web.min.js',
  ort: '/vendor/ort/ort.webgpu.bundle.min.mjs',
  dossierOrt: '/vendor/ort/',
  manifeste: '/modeles/MANIFEST.sha256',
  modele: `/modeles/camembert-ner/${REVISION}/`,
};

// Dépôt Hugging Face épinglé : fichiers nécessaires, avec la clé de modeles/MANIFEST.sha256 qui
// porte leur empreinte et leur taille (resultats/hebergement/publication.md).
const REV_JB = 'ef35fe7767c1dad71f5c853838cdd80d0b3441ed';
export const HF = Object.freeze({
  depot: 'migranche/mask-camembert-ner',
  commit: '018797af8727a7eed18c29a0e033b51005e43430',
  dtype: 'fp16',
  fichiers: Object.freeze([
    { chemin: 'config.json', cle: `camembert-ner/${REV_JB}/config.json`, octets: 892 },
    { chemin: 'tokenizer.json', cle: `tokenizer/${REV_JB}/tokenizer.json`, octets: 1393411 },
    { chemin: 'tokenizer_config.json', cle: `camembert-ner/${REV_JB}/tokenizer_config.json`, octets: 269 },
    { chemin: 'onnx/model_fp16.onnx', cle: 'compression/fp16-mixte/model.onnx', octets: 220500160 },
  ]),
});
export const urlHF = (chemin) => `https://huggingface.co/${HF.depot}/resolve/${HF.commit}/${chemin}`;

// Variantes des fichiers WebAssembly d'onnxruntime-web.
export const VARIANTES = { asyncify: 'ort-wasm-simd-threaded.asyncify', simple: 'ort-wasm-simd-threaded' };
export const SOURCES = ['hf', 'local'];

// Même règle que la bibliothèque (transformers.web.js:8734-8737) : variante simple pour
// Safari < 26 sans WebGPU, asyncify sinon. À évaluer dans la page : navigator.vendor
// n'existe pas dans un Worker.
export function varianteParDefaut(nav = globalThis.navigator) {
  const ua = nav?.userAgent ?? '';
  const safari = (nav?.vendor ?? '').includes('Apple') && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury|brave/i.test(ua) && !ua.includes('Chrome') && !ua.includes('Android');
  const version = /Version\/(\d+)/.exec(ua);
  const safariAvant26 = safari && version ? Number(version[1]) < 26 : false;
  return safariAvant26 && !('gpu' in (nav ?? {})) ? 'simple' : 'asyncify';
}

// --- État observable (banc de mesure) ------------------------------------------------

export const etat = {
  variante: null,
  numThreadsDemande: null,
  numThreads: null,
  source: null, // 'hf' ou 'local'
  modele: null, // clé du manifeste du fichier ONNX chargé
  versions: null,
  mesures: {}, // instants performance.now() des étapes
  fichiers: [], // { chemin, url, cle, octets, depuisCache, sha256 }
  progression: { recus: 0, total: null }, // octets des fichiers du modèle
  clesDemandees: [], // clés demandées par la bibliothèque à customCache
  tentativesBloquees: [], // appels à env.fetch, tous refusés
};

const marquer = (nom) => (etat.mesures[nom] = performance.now());

let configuration = { variante: 'asyncify', numThreads: undefined, source: 'hf', modele: null, surProgression: null };

// Fichier ONNX que la bibliothèque charge avec la source locale (dtype q8).
const FICHIER_ONNX = 'onnx/model_quantized.onnx';

// Clé du manifeste d'un fichier ONNX à charger à la place du q8 épinglé (banc de mesure) :
// chemin relatif à modeles/, sans « .. », terminé par .onnx.
export const cleModeleValide = (cle) => typeof cle === 'string' && /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*\.onnx$/.test(cle) && !cle.split('/').includes('..');

// À appeler avant charger(). numThreads : undefined → défaut d'onnxruntime-web.
// source : 'hf' (défaut) ou 'local'. modele (source locale seulement) : null → q8 épinglé
// (FICHIERS) ; sinon clé du manifeste du fichier ONNX à charger à la place du q8.
// surProgression : fonction appelée avec { recus, total } pendant le téléchargement.
export function configurer({ variante = 'asyncify', numThreads, source = 'hf', modele = null, surProgression = null } = {}) {
  if (!Object.hasOwn(VARIANTES, variante)) throw new Error(`modèle : variante WASM inconnue « ${variante} »`);
  if (!SOURCES.includes(source)) throw new Error(`modèle : source inconnue « ${source} » (hf, local)`);
  if (modele !== null && source !== 'local') throw new Error('modèle : configurer({ modele }) est réservé à la source locale');
  if (modele !== null && !cleModeleValide(modele)) throw new Error(`modèle : clé de fichier ONNX invalide « ${modele} »`);
  if (surProgression !== null && typeof surProgression !== 'function') throw new Error('modèle : surProgression doit être une fonction');
  configuration = { variante, numThreads, source, modele, surProgression };
}

const hex = (tampon) => [...new Uint8Array(tampon)].map((o) => o.toString(16).padStart(2, '0')).join('');

export function lireManifeste(texte) {
  const entrees = new Map();
  for (const ligne of texte.split('\n')) {
    if (!ligne.trim()) continue;
    const m = /^([0-9a-f]{64}) [ *](.+)$/.exec(ligne);
    if (!m) throw new Error(`modèle : manifeste, ligne illisible « ${ligne} »`);
    entrees.set(m[2], m[1]);
  }
  return entrees;
}

// Corps d'une réponse, lu en flux. max : taille attendue (refus au-delà), ou null.
// surRecus(n) : appelé avec le nombre d'octets de chaque morceau.
async function lireCorps(reponse, url, max, surRecus) {
  if (!reponse.body) {
    const octets = await reponse.arrayBuffer();
    if (max !== null && octets.byteLength > max) throw new Error(`modèle : ${url} dépasse la taille attendue (${max} octets)`);
    surRecus(octets.byteLength);
    return octets;
  }
  const lecteur = reponse.body.getReader();
  const morceaux = [];
  let total = 0;
  const tampon = max !== null ? new Uint8Array(max) : null;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    if (tampon) {
      if (total + value.byteLength > max) {
        await lecteur.cancel();
        throw new Error(`modèle : ${url} dépasse la taille attendue (${max} octets)`);
      }
      tampon.set(value, total);
    } else morceaux.push(value);
    total += value.byteLength;
    surRecus(value.byteLength);
  }
  if (tampon) return total === max ? tampon.buffer : tampon.slice(0, total).buffer;
  const sortie = new Uint8Array(total);
  let i = 0;
  for (const m of morceaux) {
    sortie.set(m, i);
    i += m.byteLength;
  }
  return sortie.buffer;
}

// Octets d'une URL : CacheStorage d'abord, réseau sinon (sans cookie ni référent).
async function obtenir(cache, url, { max = null, surRecus = () => {}, fetch: recuperer = globalThis.fetch } = {}) {
  let reponse = await cache.match(url);
  const depuisCache = Boolean(reponse);
  if (!reponse) {
    reponse = await recuperer(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!reponse.ok) throw new Error(`modèle : ${url} → HTTP ${reponse.status}`);
  }
  return { url, octets: await lireCorps(reponse, url, max, surRecus), depuisCache };
}

// Téléchargement (ou lecture du cache), empreintes contre le manifeste, puis mise en cache des
// seuls fichiers vérifiés et lus du réseau.
// sources : fichiers du modèle, [{ url, cle, octets, cache }] (octets : taille attendue ou null),
// tous vérifiés ; refus explicite au premier fichier fautif, entrée de cache fautive supprimée.
// annexes : [{ url, cache }], téléchargés en parallèle et mis en cache sans empreinte (fichiers
// WebAssembly d'onnxruntime-web, comme au lot 1.5b).
// jalon(nom) : appelé après chaque phase (« telechargement », « empreintes », « miseEnCache »).
// Renvoie { modele: [{ url, cle, octets, depuisCache, sha256 }], annexes: [{ url, octets, depuisCache }] }.
export async function telechargerVerifies({ sources, annexes = [], manifeste, fetch: recuperer = globalThis.fetch, digest = (o) => crypto.subtle.digest('SHA-256', o), surProgression = () => {}, jalon = () => {} }) {
  for (const s of sources) if (!manifeste.has(s.cle)) throw new Error(`modèle : ${s.cle} absent du manifeste`);
  const connus = sources.every((s) => Number.isInteger(s.octets));
  const progression = { recus: 0, total: connus ? sources.reduce((n, s) => n + s.octets, 0) : null };
  const surRecus = (n) => {
    progression.recus += n;
    surProgression({ ...progression });
  };
  const [modele, autres] = await Promise.all([
    Promise.all(sources.map((s) => obtenir(s.cache, s.url, { max: s.octets ?? null, surRecus, fetch: recuperer }).then((f) => ({ ...f, cle: s.cle, cache: s.cache })))),
    Promise.all(annexes.map((a) => obtenir(a.cache, a.url, { fetch: recuperer }).then((f) => ({ ...f, cache: a.cache })))),
  ]);
  jalon('telechargement');

  for (const f of modele) {
    const attendu = manifeste.get(f.cle);
    const obtenu = hex(await digest(f.octets));
    if (obtenu !== attendu) {
      await f.cache.delete(f.url);
      throw new Error(`modèle : empreinte différente pour ${f.cle}${f.depuisCache ? ' (copie en cache, supprimée)' : ''} (attendu ${attendu}, obtenu ${obtenu})`);
    }
    f.sha256 = obtenu;
  }
  jalon('empreintes');

  await Promise.all([...modele, ...autres].filter((f) => !f.depuisCache).map((f) => f.cache.put(f.url, new Response(f.octets))));
  jalon('miseEnCache');
  const sans = ({ cache, ...f }) => f;
  return { modele: modele.map(sans), annexes: autres.map(sans) };
}

// --- Chargement --------------------------------------------------------------------

let chargementModele = null;

export function charger() {
  chargementModele ??= (async () => {
    marquer('debut');
    const origine = globalThis.location.origin;
    const absolue = (chemin) => new URL(chemin, origine).href;
    const base = VARIANTES[configuration.variante];
    const wasmPaths = { mjs: absolue(`${CHEMINS.dossierOrt}${base}.mjs`), wasm: absolue(`${CHEMINS.dossierOrt}${base}.wasm`) };

    const ort = await import(CHEMINS.ort);
    ort.env.wasm.wasmPaths = { ...wasmPaths };
    if (configuration.numThreads !== undefined) ort.env.wasm.numThreads = configuration.numThreads;
    const lib = await import(CHEMINS.transformers);
    etat.variante = configuration.variante;
    etat.numThreadsDemande = configuration.numThreads ?? 'défaut';
    etat.versions = { transformers: lib.env.version, ...ort.env.versions };
    etat.source = configuration.source;
    marquer('bibliotheque');

    // Fichiers du modèle : nom attendu par la bibliothèque (fichier), URL, clé du manifeste, taille.
    const hf = configuration.source === 'hf';
    const depot = hf ? HF.depot : DEPOT;
    const dtype = hf ? HF.dtype : 'q8';
    const sources = hf
      ? HF.fichiers.map((f) => ({ fichier: f.chemin, url: urlHF(f.chemin), cle: f.cle, octets: f.octets }))
      : FICHIERS.map((f) =>
          configuration.modele && f === FICHIER_ONNX
            ? { fichier: f, url: absolue(`/modeles/${configuration.modele}`), cle: configuration.modele, octets: null }
            : { fichier: f, url: absolue(CHEMINS.modele + f), cle: `camembert-ner/${REVISION}/${f}`, octets: null },
        );
    const onnx = sources.find((s) => s.fichier.endsWith('.onnx'));
    etat.modele = onnx.cle;

    // Téléchargement (ou lecture du cache local), en parallèle avec les fichiers WebAssembly.
    const cacheModele = await caches.open(hf ? `mask-modele-hf-${HF.commit}` : `mask-modele-${REVISION}`);
    const cacheOrt = await caches.open(`mask-ort-${ort.env.versions.web}`);
    const manifeste = lireManifeste(await (await fetch(CHEMINS.manifeste, { cache: 'no-cache' })).text());
    etat.progression = { recus: 0, total: null };
    const surProgression = (p) => {
      etat.progression = p;
      configuration.surProgression?.(p);
    };
    const { modele, annexes: wasm } = await telechargerVerifies({
      sources: sources.map((s) => ({ ...s, cache: cacheModele })),
      annexes: [wasmPaths.wasm, wasmPaths.mjs].map((url) => ({ url, cache: cacheOrt })),
      manifeste,
      surProgression,
      jalon: marquer,
    });
    etat.fichiers = [...modele, ...wasm].map(({ url, cle, octets, depuisCache, sha256 }) => ({ chemin: new URL(url).pathname, url, cle: cle ?? null, octets: octets.byteLength, depuisCache, sha256: sha256 ?? null }));

    // La bibliothèque lit tout par customCache ; aucun accès réseau de sa part.
    // Clés : chemin local de la bibliothèque (/models/<dépôt>/<fichier>) pour le modèle,
    // URL absolue de wasmPaths pour les fichiers WebAssembly.
    const servis = new Map([
      [new URL(wasmPaths.wasm).pathname, wasm[0].octets],
      [new URL(wasmPaths.mjs).pathname, wasm[1].octets],
    ]);
    sources.forEach((s, i) => servis.set(`/models/${depot}/${s.fichier}`, modele[i].octets));
    const trouver = (cle) => servis.get(new URL(String(cle), origine).pathname);
    lib.env.allowRemoteModels = false;
    lib.env.allowLocalModels = true;
    lib.env.useBrowserCache = false;
    lib.env.useCustomCache = true;
    lib.env.customCache = {
      match: async (cle) => {
        etat.clesDemandees.push(String(cle));
        const octets = trouver(cle);
        return octets ? new Response(octets) : undefined;
      },
      put: async () => {},
    };
    lib.env.fetch = async (url) => {
      etat.tentativesBloquees.push(String(url));
      throw new Error(`modèle : accès réseau interdit (${url})`);
    };

    const lire = (f) => JSON.parse(new TextDecoder().decode(modele[sources.findIndex((s) => s.fichier === f)].octets));
    const prepare = preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
    const instance = await lib.AutoModelForTokenClassification.from_pretrained(depot, { dtype, device: 'wasm', local_files_only: true });
    // Les octets ne servent plus : la session a sa propre copie.
    servis.clear();
    for (const x of [...modele, ...wasm]) x.octets = null;
    etat.numThreads = ort.env.wasm.numThreads;
    marquer('session');
    return { ...prepare, modele: instance };
  })();
  return chargementModele;
}

export const creerDetecteur = fabriqueDetecteur(charger);
export const detecter = creerDetecteur();

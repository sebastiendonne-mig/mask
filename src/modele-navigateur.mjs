// Détecteur par modèle, chargeur navigateur (Worker de module ou page) : même logique que
// le chargeur Node (src/modele-commun.mjs), avec onnxruntime-web (backend WASM).
//
// Hébergement local intégral : la bibliothèque, onnxruntime-web, ses fichiers WebAssembly et
// les fichiers du modèle sont servis par l'origine de l'app (CHEMINS) ; aucun CDN.
// - wasmPaths est fixé avant l'import de Transformers.js : la bibliothèque ne fabrique alors
//   jamais l'URL du CDN (transformers.web.js:8731, condition « !wasmPaths »).
// - Les fichiers du modèle sont vérifiés (SHA-256, crypto.subtle) contre modeles/MANIFEST.sha256
//   avant tout usage, puis gardés dans CacheStorage pour les visites suivantes, et revérifiés
//   à chaque chargement.
// - La bibliothèque reçoit les octets par env.customCache ; env.fetch est remplacé par une
//   fonction qui refuse et note toute tentative.
// - Banc de mesure : configurer({ modele }) charge un autre fichier ONNX inscrit au manifeste
//   (candidats de l'option 3) à la place du q8, sous la même clé pour la bibliothèque ; sans
//   cette option, fichiers, URL, clés et cache sont ceux du q8 épinglé.

import { DEPOT, REVISION, FICHIERS, fabriqueDetecteur, preparer } from './modele-commun.mjs';

export * from './modele-commun.mjs';

export const CHEMINS = {
  transformers: '/vendor/transformers.web.min.js',
  ort: '/vendor/ort/ort.webgpu.bundle.min.mjs',
  dossierOrt: '/vendor/ort/',
  manifeste: '/modeles/MANIFEST.sha256',
  modele: `/modeles/camembert-ner/${REVISION}/`,
};

// Variantes des fichiers WebAssembly d'onnxruntime-web.
export const VARIANTES = { asyncify: 'ort-wasm-simd-threaded.asyncify', simple: 'ort-wasm-simd-threaded' };

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
  modele: null, // clé du manifeste du fichier ONNX chargé
  versions: null,
  mesures: {}, // instants performance.now() des étapes
  fichiers: [], // { chemin, octets, depuisCache, sha256 }
  clesDemandees: [], // clés demandées par la bibliothèque à customCache
  tentativesBloquees: [], // appels à env.fetch, tous refusés
};

const marquer = (nom) => (etat.mesures[nom] = performance.now());

let configuration = { variante: 'asyncify', numThreads: undefined, modele: null };

// Fichier ONNX que la bibliothèque charge (dtype q8).
const FICHIER_ONNX = 'onnx/model_quantized.onnx';

// Clé du manifeste d'un fichier ONNX à charger à la place du q8 épinglé (banc de mesure) :
// chemin relatif à modeles/, sans « .. », terminé par .onnx.
export const cleModeleValide = (cle) => typeof cle === 'string' && /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*\.onnx$/.test(cle) && !cle.split('/').includes('..');

// À appeler avant charger(). numThreads : undefined → défaut d'onnxruntime-web.
// modele : null → q8 épinglé (FICHIERS) ; sinon clé du manifeste du fichier ONNX à charger,
// vérifié contre son empreinte et remis à la bibliothèque à la place du q8.
export function configurer({ variante = 'asyncify', numThreads, modele = null } = {}) {
  if (!Object.hasOwn(VARIANTES, variante)) throw new Error(`modèle : variante WASM inconnue « ${variante} »`);
  if (modele !== null && !cleModeleValide(modele)) throw new Error(`modèle : clé de fichier ONNX invalide « ${modele} »`);
  configuration = { variante, numThreads, modele };
}

const hex = (tampon) => [...new Uint8Array(tampon)].map((o) => o.toString(16).padStart(2, '0')).join('');

function lireManifeste(texte) {
  const entrees = new Map();
  for (const ligne of texte.split('\n')) {
    if (!ligne.trim()) continue;
    const m = /^([0-9a-f]{64}) [ *](.+)$/.exec(ligne);
    if (!m) throw new Error(`modèle : manifeste, ligne illisible « ${ligne} »`);
    entrees.set(m[2], m[1]);
  }
  return entrees;
}

// Octets d'une URL de l'origine : CacheStorage d'abord, réseau sinon.
async function obtenir(cache, url) {
  let reponse = await cache.match(url);
  const depuisCache = Boolean(reponse);
  if (!reponse) {
    reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`modèle : ${url} → HTTP ${reponse.status}`);
  }
  return { url, octets: await reponse.arrayBuffer(), depuisCache };
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
    marquer('bibliotheque');

    // Téléchargement (ou lecture du cache local), en parallèle.
    const cacheModele = await caches.open(`mask-modele-${REVISION}`);
    const cacheOrt = await caches.open(`mask-ort-${ort.env.versions.web}`);
    const manifeste = lireManifeste(await (await fetch(CHEMINS.manifeste, { cache: 'no-cache' })).text());
    // URL et clé du manifeste de chaque fichier ; seul le fichier ONNX change si un modèle est configuré.
    const sources = FICHIERS.map((f) =>
      configuration.modele && f === FICHIER_ONNX
        ? { url: absolue(`/modeles/${configuration.modele}`), cle: configuration.modele }
        : { url: absolue(CHEMINS.modele + f), cle: `camembert-ner/${REVISION}/${f}` },
    );
    etat.modele = sources[FICHIERS.indexOf(FICHIER_ONNX)].cle;
    const [modele, wasm] = await Promise.all([
      Promise.all(sources.map((s) => obtenir(cacheModele, s.url))),
      Promise.all([wasmPaths.wasm, wasmPaths.mjs].map((u) => obtenir(cacheOrt, u))),
    ]);
    marquer('telechargement');

    // Empreintes du modèle, à chaque chargement (aussi depuis le cache).
    for (const i of FICHIERS.keys()) {
      const attendu = manifeste.get(sources[i].cle);
      if (!attendu) throw new Error(`modèle : ${sources[i].cle} absent du manifeste`);
      const obtenu = hex(await crypto.subtle.digest('SHA-256', modele[i].octets));
      if (obtenu !== attendu) {
        await cacheModele.delete(modele[i].url);
        throw new Error(`modèle : empreinte différente pour ${sources[i].cle} (attendu ${attendu}, obtenu ${obtenu})`);
      }
      modele[i].sha256 = obtenu;
    }
    marquer('empreintes');

    // Mise en cache, seulement après vérification.
    await Promise.all([
      ...modele.filter((x) => !x.depuisCache).map((x) => cacheModele.put(x.url, new Response(x.octets))),
      ...wasm.filter((x) => !x.depuisCache).map((x) => cacheOrt.put(x.url, new Response(x.octets))),
    ]);
    marquer('miseEnCache');
    etat.fichiers = [...modele, ...wasm].map(({ url, octets, depuisCache, sha256 }) => ({ chemin: new URL(url).pathname, octets: octets.byteLength, depuisCache, sha256: sha256 ?? null }));

    // La bibliothèque lit tout par customCache ; aucun accès réseau de sa part.
    // Clés : chemin local de la bibliothèque (/models/<dépôt>/<fichier>) pour le modèle,
    // URL absolue de wasmPaths pour les fichiers WebAssembly.
    const servis = new Map([
      [new URL(wasmPaths.wasm).pathname, wasm[0].octets],
      [new URL(wasmPaths.mjs).pathname, wasm[1].octets],
    ]);
    const trouver = (cle) => {
      const chemin = new URL(String(cle), origine).pathname;
      if (servis.has(chemin)) return servis.get(chemin);
      const i = FICHIERS.findIndex((f) => chemin === `/models/${DEPOT}/${f}`);
      return i >= 0 ? modele[i].octets : undefined;
    };
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

    const lire = (f) => JSON.parse(new TextDecoder().decode(modele[FICHIERS.indexOf(f)].octets));
    const prepare = preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
    const instance = await lib.AutoModelForTokenClassification.from_pretrained(DEPOT, { dtype: 'q8', device: 'wasm', local_files_only: true });
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

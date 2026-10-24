// Worker du banc de mesure (lot 1.5b) : charge le modèle, fait l'inférence de chauffe, traite
// les documents (règles puis modèle) et renvoie temps, masques et état du chargeur.
//
// Messages reçus : { type: 'config', config: { variante, numThreads, modele, diagnostic } } (lance le
// chargement) puis { type: 'documents', documents: [{ id, texte }] }.

import * as modele from '/src/modele-navigateur.mjs';
import * as regles from '/src/regles.mjs';
import { scoresParMot } from '/bench/diagnostic.mjs';

// Phrase fictive de chauffe (hors jeu de développement).
const PHRASE_CHAUFFE = 'Madame Lucie Fabre a rencontré la société Ormeaux Conseil à Besançon.';

const violations = [];
self.addEventListener('securitypolicyviolation', (e) => violations.push({ source: 'worker', directive: e.violatedDirective, bloque: e.blockedURI }));

let config = null;
let pret = null;

async function preparer() {
  modele.configurer({ variante: config.variante, numThreads: config.numThreads, modele: config.modele ?? null });
  const c = await modele.charger();
  const t0 = performance.now();
  await modele.detecter(PHRASE_CHAUFFE);
  modele.etat.mesures.chauffe = performance.now();
  modele.etat.mesures.chauffeDebut = t0;
  return c;
}

async function traiter(documents) {
  const c = await pret;
  const resultats = [];
  for (const { id, texte } of documents) {
    const a = performance.now();
    const mr = await regles.detecter(texte);
    const b = performance.now();
    const mm = await modele.detecter(texte);
    const d = performance.now();
    resultats.push({ id, caracteres: texte.length, ms: { regles: b - a, modele: d - b, total: d - a }, masques: { regles: mr, modele: mm, combine: [...mr, ...mm] } });
  }
  modele.etat.mesures.traitement = performance.now();
  let diagnostic = null;
  if (config.diagnostic) {
    diagnostic = {};
    for (const { id, texte } of documents) diagnostic[id] = await scoresParMot(modele, c, texte);
  }
  return { resultats, diagnostic };
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'config') {
      config = data.config;
      pret = preparer();
      pret.catch(() => {}); // l'erreur est rapportée à la réception des documents
      return;
    }
    if (data.type === 'documents') {
      const { resultats, diagnostic } = await traiter(data.documents);
      self.postMessage({ ok: true, ...instantane(), documents: resultats, diagnostic });
    }
  } catch (e) {
    self.postMessage({ ok: false, erreur: String(e?.message ?? e), pile: e?.stack ?? null, ...instantane() });
  }
};

function instantane() {
  return {
    origineTemps: performance.timeOrigin,
    crossOriginIsolated: self.crossOriginIsolated,
    hardwareConcurrency: navigator.hardwareConcurrency,
    etat: structuredClone(modele.etat),
    ressources: performance.getEntriesByType('resource').map((r) => ({ url: r.name, octets: r.transferSize, decode: r.decodedBodySize, debut: r.startTime, duree: r.duration })),
    violations,
  };
}

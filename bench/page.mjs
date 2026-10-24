// Page du banc de mesure (lot 1.5b). Temps en ms depuis le début de la navigation
// (performance.timeOrigin de la page) ; ceux du Worker y sont ramenés par son timeOrigin.
//
// Paramètres d'URL : variante=auto|asyncify|simple, threads=defaut|1, auto=1 (lance la mesure
// au chargement), diagnostic=1 (scores par mot, après la mesure), modele=<clé du manifeste>
// (fichier ONNX chargé à la place du q8 épinglé, src/modele-navigateur.mjs). Résultat : window.__resultat
// et bouton de téléchargement JSON. Aucune requête sortante autre que GET vers l'origine.

import { varianteParDefaut, cleModeleValide } from '/src/modele-navigateur.mjs';

const PAGE = 3000; // caractères par « page » : convention déclarée (S8), pas une norme
const PHRASE_REGLES = 'Madame Lucie Fabre, 12 rue des Ormeaux, 25000 Besançon, lucie.fabre@exemple.fr.';

const violations = [];
document.addEventListener('securitypolicyviolation', (e) => violations.push({ source: 'page', directive: e.violatedDirective, bloque: e.blockedURI }));

const params = new URLSearchParams(location.search);
const choixVariante = ['asyncify', 'simple'].includes(params.get('variante')) ? params.get('variante') : 'auto';
const choixThreads = params.get('threads') === '1' ? '1' : 'defaut';
const diagnostic = params.get('diagnostic') === '1';
const choixModele = cleModeleValide(params.get('modele')) ? params.get('modele') : null;

const $ = (s) => document.querySelector(s);
const formulaire = $('#reglages');
formulaire.variante.value = choixVariante;
formulaire.threads.value = choixThreads;
formulaire.addEventListener('submit', (e) => {
  e.preventDefault();
  const p = new URLSearchParams({ variante: formulaire.variante.value, threads: formulaire.threads.value, auto: '1', ...(choixModele ? { modele: choixModele } : {}) });
  location.search = p.toString();
});

function statut(texte, classe) {
  const el = $('#statut');
  el.textContent = texte;
  el.className = `statut ${classe}`;
}

const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const arrondi = (x) => (x == null ? null : Math.round(x * 10) / 10);

async function lancer() {
  statut('EN COURS — chargement du modèle et traitement des 17 documents…', 'encours');
  const variante = choixVariante === 'auto' ? varianteParDefaut() : choixVariante;
  const numThreads = choixThreads === '1' ? 1 : undefined;

  const w = new Worker('/bench/travailleur.mjs', { type: 'module' });
  const reponse = new Promise((ok) => {
    w.onmessage = (e) => ok(e.data);
    w.onerror = (e) => ok({ ok: false, erreur: `Worker : ${e.message ?? 'erreur de chargement'}` });
  });
  w.postMessage({ type: 'config', config: { variante, numThreads, modele: choixModele, diagnostic } });

  // Règles prêtes : module importé et premier appel terminé (thread principal).
  const regles = await import('/src/regles.mjs');
  await regles.detecter(PHRASE_REGLES);
  const reglesPretes = performance.now();

  const ids = await (await fetch('/golden/dev/index.json')).json();
  const documents = await Promise.all(ids.map(async (id) => ({ id, texte: await (await fetch(`/golden/dev/${id}.txt`)).text() })));
  const reference = await (await fetch('/resultats/navigateur/reference-node-dev.json')).json();
  w.postMessage({ type: 'documents', documents });

  const r = await reponse;
  const resultat = assembler(r, { variante, numThreads, reglesPretes, reference });
  window.__resultat = resultat;
  afficher(resultat);
  statut(resultat.ok ? 'TERMINÉ' : `ERREUR — ${resultat.erreur}`, resultat.ok ? 'termine' : 'erreur');
  const bouton = $('#telecharger');
  bouton.disabled = false;
  bouton.onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(resultat, null, 1)], { type: 'application/json' }));
    a.download = `banc-${resultat.navigateur.court}-${resultat.config.isolation ? 'isole' : 'non-isole'}-${variante}-t${choixThreads}-${resultat.date.replace(/[:.]/g, '-')}.json`;
    a.click();
  };
}

function assembler(r, { variante, numThreads, reglesPretes, reference }) {
  const rel = (m) => (m == null ? null : arrondi(r.origineTemps + m - performance.timeOrigin));
  const m = r.etat?.mesures ?? {};
  const etapes = ['debut', 'bibliotheque', 'telechargement', 'empreintes', 'miseEnCache', 'session', 'chauffe'];
  const instants = Object.fromEntries(etapes.map((e) => [e, rel(m[e])]));
  const duree = (a, b) => (m[a] == null || m[b] == null ? null : arrondi(m[b] - m[a]));
  const ua = navigator.userAgent;

  const res = {
    format: 'banc-mask-1',
    date: new Date().toISOString(),
    navigateur: { ua, court: /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'autre' },
    config: {
      variante,
      threadsDemandes: numThreads ?? 'défaut',
      isolation: self.crossOriginIsolated,
      isolationWorker: r.crossOriginIsolated ?? null,
      diagnostic,
      modeleDemande: choixModele,
      modeleCharge: r.etat?.modele ?? null,
    },
    ok: Boolean(r.ok),
    erreur: r.erreur ?? null,
    pile: r.pile ?? null,
    hardwareConcurrency: r.hardwareConcurrency ?? navigator.hardwareConcurrency,
    numThreads: r.etat?.numThreads ?? null,
    backend: 'wasm',
    versions: r.etat?.versions ?? null,
    temps: {
      reglesPretes: arrondi(reglesPretes),
      modelePret: instants.chauffe,
      instants,
      durees: {
        avantChargement: instants.debut,
        bibliotheque: duree('debut', 'bibliotheque'),
        telechargement: duree('bibliotheque', 'telechargement'),
        empreintes: duree('telechargement', 'empreintes'),
        miseEnCache: duree('empreintes', 'miseEnCache'),
        session: duree('miseEnCache', 'session'),
        chauffe: duree('session', 'chauffe'),
      },
    },
    fichiers: r.etat?.fichiers ?? [],
    clesDemandees: r.etat?.clesDemandees ?? [],
    tentativesBloquees: r.etat?.tentativesBloquees ?? [],
    documents: (r.documents ?? []).map((d) => ({ ...d, ms: { regles: arrondi(d.ms.regles), modele: arrondi(d.ms.modele), total: arrondi(d.ms.total) } })),
    s1: {
      ressourcesPage: performance.getEntriesByType('resource').map((x) => ({ url: x.name, octets: x.transferSize, decode: x.decodedBodySize })),
      ressourcesWorker: r.ressources ?? [],
      violations: [...violations, ...(r.violations ?? [])],
    },
    diagnostic: r.diagnostic ?? null,
  };

  if (res.documents.length) {
    const totaux = res.documents.map((d) => d.ms.total);
    const caracteres = res.documents.reduce((s, d) => s + d.caracteres, 0);
    const somme = totaux.reduce((s, x) => s + x, 0);
    res.s8 = {
      documents: res.documents.length,
      caracteres,
      msParDocumentMediane: arrondi(mediane(totaux)),
      msParDocumentMax: arrondi(Math.max(...totaux)),
      msPour1000Caracteres: arrondi((somme / caracteres) * 1000),
      msParPage: arrondi((somme / caracteres) * PAGE),
      caracteresParPage: PAGE,
    };
    const ref = new Map(reference.documents.map((d) => [d.id, d]));
    res.equivalence = { reference: reference.detecteurs, parDetecteur: {} };
    for (const det of ['regles', 'modele', 'combine']) {
      const differents = res.documents.filter((d) => JSON.stringify(d.masques[det]) !== JSON.stringify(ref.get(d.id)?.masques[det])).map((d) => d.id);
      res.equivalence.parDetecteur[det] = { identiques: res.documents.length - differents.length, total: res.documents.length, differents };
    }
  }
  return res;
}

// --- Affichage ------------------------------------------------------------------------

function tableau(titres, lignes) {
  const t = document.createElement('table');
  const tete = t.createTHead().insertRow();
  for (const h of titres) tete.appendChild(Object.assign(document.createElement('th'), { textContent: h }));
  const corps = t.createTBody();
  for (const l of lignes) {
    const tr = corps.insertRow();
    for (const v of l) {
      const td = tr.insertCell();
      td.textContent = v == null ? '—' : String(v);
      if (typeof v === 'number') td.className = 'n';
    }
  }
  const enveloppe = document.createElement('div');
  enveloppe.className = 'defile';
  enveloppe.appendChild(t);
  return enveloppe;
}

function titre(texte) {
  return Object.assign(document.createElement('h2'), { textContent: texte });
}

function afficher(r) {
  const s = $('#resultats');
  s.replaceChildren();
  s.append(
    titre('Environnement'),
    tableau(['Élément', 'Valeur'], [
      ['Navigateur', r.navigateur.ua],
      ['Page isolée (crossOriginIsolated)', String(r.config.isolation)],
      ['Cœurs logiques', r.hardwareConcurrency],
      ['Threads WASM demandés / effectifs', `${r.config.threadsDemandes} / ${r.numThreads ?? '—'}`],
      ['Backend / variante WASM', `${r.backend} / ${r.config.variante}`],
      ['Versions', JSON.stringify(r.versions)],
      ['Stockage (estimation)', '…'],
    ]),
    titre('Chargement (ms depuis le début de la navigation)'),
    tableau(['Mesure', 'ms'], [
      ['Règles prêtes', r.temps.reglesPretes],
      ['Modèle prêt (session + chauffe)', r.temps.modelePret],
      ['  dont avant le chargement (page, Worker)', r.temps.durees.avantChargement],
      ['  dont bibliothèques JS', r.temps.durees.bibliotheque],
      ['  dont téléchargement / lecture du cache', r.temps.durees.telechargement],
      ['  dont empreintes SHA-256', r.temps.durees.empreintes],
      ['  dont mise en cache', r.temps.durees.miseEnCache],
      ['  dont session', r.temps.durees.session],
      ['  dont chauffe', r.temps.durees.chauffe],
    ]),
    titre('Fichiers'),
    tableau(['Chemin', 'Octets', 'Depuis le cache', 'SHA-256 vérifié'], r.fichiers.map((f) => [f.chemin, f.octets, f.depuisCache ? 'oui' : 'non', f.sha256 ?? '— (non vérifié)'])),
  );
  if (r.s8) {
    s.append(
      titre('Traitement (S8)'),
      tableau(['Mesure', 'Valeur'], [
        ['Documents / caractères', `${r.s8.documents} / ${r.s8.caracteres}`],
        ['ms par document (médiane)', r.s8.msParDocumentMediane],
        ['ms par document (max)', r.s8.msParDocumentMax],
        ['ms pour 1 000 caractères', r.s8.msPour1000Caracteres],
        [`ms par « page » (${r.s8.caracteresParPage} caractères, convention)`, r.s8.msParPage],
      ]),
      tableau(['Document', 'Caractères', 'Règles (ms)', 'Modèle (ms)', 'Total (ms)'], r.documents.map((d) => [d.id, d.caracteres, d.ms.regles, d.ms.modele, d.ms.total])),
      titre('Équivalence avec la référence Node'),
      tableau(['Détecteur', 'Identiques', 'Différents'], Object.entries(r.equivalence.parDetecteur).map(([k, v]) => [k, `${v.identiques}/${v.total}`, v.differents.join(', ') || 'aucun'])),
    );
  }
  const domaines = new Set([...r.s1.ressourcesPage, ...r.s1.ressourcesWorker].map((x) => new URL(x.url).host));
  s.append(
    titre('S1 — réseau'),
    tableau(['Contrôle', 'Valeur'], [
      ['Domaines contactés (page + Worker)', [...domaines].join(', ')],
      ['Tentatives bloquées (env.fetch)', r.tentativesBloquees.length ? r.tentativesBloquees.join(', ') : 'aucune'],
      ['Violations CSP', r.s1.violations.length ? JSON.stringify(r.s1.violations) : 'aucune'],
    ]),
  );
  if (!r.ok) s.append(titre('Erreur'), Object.assign(document.createElement('pre'), { textContent: `${r.erreur}\n${r.pile ?? ''}` }));

  navigator.storage?.estimate?.().then(
    (e) => {
      const cellule = s.querySelector('table tbody tr:last-child td:last-child');
      if (cellule) cellule.textContent = `${Math.round(e.usage / 1e6)} Mo utilisés / ${Math.round(e.quota / 1e6)} Mo de quota`;
    },
    () => {},
  );
}

if (params.get('auto') === '1') lancer();

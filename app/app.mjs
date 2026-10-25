// Page de la préversion (étape 4b, amendement (7)).
//
// - Règles (src/regles.mjs) sur le thread principal, dès qu'il y a du texte.
// - Modèle dans un Worker (app/travailleur.mjs), seulement après le clic sur « Compléter avec le
//   modèle » ; détection combinée = union règles + modèle, comme au banc, fusionnée en un seul
//   remplacement par zone (app/logique.mjs).
// - Le texte reste en mémoire dans la page et le Worker : aucun envoi réseau, aucun stockage
//   (ni localStorage, ni sessionStorage, ni IndexedDB, ni CacheStorage), aucune mesure d'audience.
//   Le DOM est construit par textContent : le texte collé n'est jamais interprété comme du HTML.

import { detecter as detecterRegles } from '/src/regles.mjs';
import { CATEGORIES, fusionner, entites, remplacer, avertissements, estMobile } from '/logique.mjs';

const $ = (s) => document.querySelector(s);
const el = (balise, proprietes = {}, enfants = []) => {
  const e = Object.assign(document.createElement(balise), proprietes);
  e.append(...enfants);
  return e;
};
const Mo = (octets) => (octets / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

const zoneTexte = $('#texte');
const relu = $('#relu');
const copier = $('#copier');
const boutonModele = $('#bouton-modele');
const progression = $('#progression');
const chargement = $('#chargement'); // annonce du téléchargement et barre de progression

const etat = {
  texte: '',
  regles: [],
  modele: null, // masques du modèle pour etat.texte, ou null
  modeleCharge: false,
  enAnalyse: false,
  demande: 0,
  liste: [],
  gardees: new Set(),
  ecartees: new Set(), // clés des entités décochées (« garder » = non)
  signature: '',
  sortie: '',
};
let travailleur = null;

// --- Avertissements (navigateur, isolation) --------------------------------------------

const messages = avertissements(navigator, self.crossOriginIsolated);
if (messages.length) {
  $('#avertissements').append(el('ul', {}, messages.map((m) => el('li', { textContent: m }))));
  $('#avertissements').hidden = false;
}

// --- Texte -----------------------------------------------------------------------------

let minuterie = null;
zoneTexte.addEventListener('input', () => {
  clearTimeout(minuterie);
  minuterie = setTimeout(nouveauTexte, 120);
});

function nouveauTexte() {
  etat.texte = zoneTexte.value;
  etat.regles = etat.texte ? detecterRegles(etat.texte) : [];
  etat.modele = null;
  etat.enAnalyse = false;
  if (etat.modeleCharge && etat.texte) demanderModele();
  afficher();
}

for (const b of document.querySelectorAll('[data-exemple]')) {
  b.addEventListener('click', async () => {
    const r = await fetch(`/exemples/${b.dataset.exemple}.txt`);
    zoneTexte.value = await r.text();
    etat.ecartees.clear();
    nouveauTexte();
  });
}

$('#effacer').addEventListener('click', () => {
  zoneTexte.value = '';
  etat.ecartees.clear();
  relu.checked = false;
  nouveauTexte();
  zoneTexte.focus();
});

// --- Modèle ----------------------------------------------------------------------------

// Ordinateur : chargement automatique à l'ouverture. Téléphone ou tablette : sur clic seulement
// (220 Mo). Le bouton réapparaît partout si le chargement échoue.
boutonModele.addEventListener('click', chargerModele);

function chargerModele() {
  boutonModele.disabled = true;
  document.body.dataset.modele = 'chargement';
  $('#etat-modele').textContent = 'Préparation du chargement…';
  chargement.hidden = false;
  travailleur = new Worker('/travailleur.mjs', { type: 'module' });
  travailleur.onmessage = ({ data }) => recevoir(data);
  travailleur.onerror = (e) => echecChargement(e.message ?? 'erreur de chargement du Worker');
  travailleur.postMessage({ type: 'charger' });
}

function demanderModele() {
  etat.demande += 1;
  etat.enAnalyse = true;
  travailleur.postMessage({ type: 'detecter', id: etat.demande, texte: etat.texte });
}

function recevoir(m) {
  if (m.type === 'progression') {
    progression.max = m.total ?? 1;
    progression.value = m.recus;
    $('#etat-modele').textContent = m.total && m.recus >= m.total ? 'Vérification des empreintes et préparation du modèle…' : `Chargement du modèle : ${Mo(m.recus)} Mo sur ${m.total ? Mo(m.total) : '?'} Mo`;
  } else if (m.type === 'pret') {
    etat.modeleCharge = true;
    document.body.dataset.modele = 'pret';
    chargement.hidden = true;
    boutonModele.hidden = true;
    $('#etat-modele').textContent = 'Modèle prêt : fichiers vérifiés par leur empreinte SHA-256.';
    relu.checked = false; // la liste va être complétée : à relire
    if (etat.texte) demanderModele();
    afficher();
  } else if (m.type === 'resultat') {
    if (m.id !== etat.demande) return;
    if (etat.modele === null) relu.checked = false; // la liste relue était celle des règles seules
    etat.modele = m.masques;
    etat.enAnalyse = false;
    afficher();
  } else if (m.type === 'erreur') {
    if (m.id === undefined) return echecChargement(m.message);
    if (m.id !== etat.demande) return;
    etat.enAnalyse = false;
    $('#etat-modele').textContent = `Erreur du modèle pendant l'analyse : ${m.message}. Seules les règles sont appliquées.`;
    afficher();
  }
}

function echecChargement(message) {
  travailleur?.terminate();
  travailleur = null;
  etat.modeleCharge = false;
  etat.enAnalyse = false;
  document.body.dataset.modele = 'erreur';
  chargement.hidden = true;
  boutonModele.disabled = false;
  boutonModele.hidden = false;
  $('#etat-modele').textContent = `Le modèle n'a pas pu être chargé : ${message}. La détection par les règles reste disponible.`;
  afficher();
}

// --- Affichage -------------------------------------------------------------------------

function afficher({ tableau = true } = {}) {
  const zones = fusionner(etat.regles, etat.modele ?? []);
  etat.liste = entites(etat.texte, zones);
  etat.gardees = new Set(etat.liste.filter((e) => !etat.ecartees.has(e.cle)).map((e) => e.cle));
  const signature = etat.liste.map((e) => e.cle).join('\n');
  if (signature !== etat.signature) relu.checked = false; // nouvelle liste : à relire
  etat.signature = signature;
  etat.sortie = remplacer(etat.texte, etat.liste, etat.gardees);
  document.body.dataset.analyse = etat.enAnalyse ? 'en-cours' : 'terminee';

  afficherApercu(zones);
  if (tableau) afficherRemplacements();
  $('#sortie').textContent = etat.sortie;
  $('#correspondance tbody').replaceChildren(
    ...etat.liste.filter((e) => etat.gardees.has(e.cle)).map((e) => el('tr', {}, [el('td', {}, [el('code', { textContent: e.pseudonyme })]), el('td', { textContent: e.formes.join(' · ') })])),
  );

  const n = zones.length;
  const source = etat.modele ? 'règles et modèle' : 'règles';
  $('#etat-detection').textContent = !etat.texte
    ? 'Aucun texte pour l\'instant.'
    : `${n} élément${n > 1 ? 's' : ''} repéré${n > 1 ? 's' : ''} (${source})${etat.enAnalyse ? ' — analyse par le modèle en cours…' : '.'}`;
  majCopier();
}

function afficherApercu(zones) {
  const apercu = $('#apercu');
  apercu.hidden = !etat.texte;
  const parZone = new Map();
  for (const e of etat.liste) for (const o of e.occurrences) parZone.set(o.start, e);
  const morceaux = [];
  let i = 0;
  for (const z of zones) {
    morceaux.push(etat.texte.slice(i, z.start));
    const e = parZone.get(z.start);
    const classe = `c-${z.type}${etat.gardees.has(e.cle) ? '' : ' ecarte'}`;
    morceaux.push(el('mark', { className: classe, title: `${CATEGORIES[z.type] ?? z.type} → ${e.pseudonyme}`, textContent: etat.texte.slice(z.start, z.end) }));
    i = z.end;
  }
  morceaux.push(etat.texte.slice(i));
  apercu.replaceChildren(...morceaux);

  const presentes = [...new Set(zones.map((z) => z.type))];
  $('#legende').replaceChildren(...presentes.map((t) => el('span', { className: `pastille c-${t}`, textContent: CATEGORIES[t] ?? t })));
}

function afficherRemplacements() {
  const table = $('#remplacements');
  table.hidden = etat.liste.length === 0;
  $('#etat-remplacements').textContent = etat.liste.length
    ? `${etat.liste.length} entité${etat.liste.length > 1 ? 's' : ''} ; décochez « garder » pour laisser une entité telle quelle.`
    : 'Aucun remplacement pour l\'instant.';
  $('#remplacements tbody').replaceChildren(
    ...etat.liste.map((e) => {
      const caseGarder = el('input', { type: 'checkbox', checked: etat.gardees.has(e.cle) });
      caseGarder.setAttribute('aria-label', `Garder le remplacement de ${e.formes[0]}`);
      caseGarder.addEventListener('change', () => {
        if (caseGarder.checked) etat.ecartees.delete(e.cle);
        else etat.ecartees.add(e.cle);
        afficher({ tableau: false });
      });
      const fois = e.occurrences.length > 1 ? ` (${e.occurrences.length} fois)` : '';
      const ligne = el('tr', {}, [
        el('td', { textContent: e.formes.join(' · ') + fois }),
        el('td', {}, [el('span', { className: `pastille c-${e.type}`, textContent: CATEGORIES[e.type] ?? e.type })]),
        el('td', {}, [el('code', { textContent: e.pseudonyme })]),
        el('td', { className: 'trouve-par' }, [el('span', { className: 'mobile-seul', textContent: 'Trouvé par : ' }), e.trouvePar]),
        el('td', { className: 'centre' }, [el('label', {}, [caseGarder, el('span', { className: 'mobile-seul', textContent: ' garder' })])]),
      ]);
      ligne.dataset.formes = JSON.stringify(e.formes); // relu par l'essai automatisé (app/essai-chrome.mjs)
      return ligne;
    }),
  );
}

// --- Copie -----------------------------------------------------------------------------

function majCopier() {
  copier.disabled = !(relu.checked && etat.texte && !etat.enAnalyse);
  $('#etat-copie').textContent = !etat.texte ? '' : !relu.checked ? 'Cochez « J\'ai relu chaque remplacement » pour activer la copie.' : etat.enAnalyse ? 'Attendez la fin de l\'analyse par le modèle.' : '';
}

relu.addEventListener('change', majCopier);

copier.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(etat.sortie);
    $('#etat-copie').textContent = 'Texte pseudonymisé copié.';
  } catch {
    getSelection().selectAllChildren($('#sortie'));
    $('#etat-copie').textContent = 'Copie refusée par le navigateur : le texte est sélectionné, copiez-le avec Ctrl+C (ou Cmd+C).';
  }
});

document.body.dataset.modele = 'absent';
if (estMobile(navigator)) boutonModele.hidden = false;
else chargerModele();
afficher();

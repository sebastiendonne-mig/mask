// Génère le golden set : golden/dev (mise au point des règles) et golden/test
// (mesure finale uniquement). Données 100 % fictives.
// Graine fixe : relancer le script reproduit les fichiers à l'octet près.
// Le script vérifie chaque étiquette et chaque clé de contrôle ; il n'écrit
// rien et sort en erreur si une seule vérification échoue.
// Usage : npm run golden

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Alea, graine, verifierIdentifiant, NOMS } from './golden/lib.mjs';
import { MODELES_DEV } from './golden/modeles-dev.mjs';
import { MODELES_TEST } from './golden/modeles-test.mjs';

const GRAINE = 'mask-golden-v1';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'golden');

const TYPES_SPANS = ['PERSONNE', 'ADRESSE', 'ORGANISATION', 'IBAN', 'SIREN', 'SIRET', 'TVA_INTRA', 'NIR', 'CARTE', 'EMAIL', 'TELEPHONE', 'NUMERO_DOSSIER'];
// Masqués = erreur (faux positif).
const TYPES_NON_MASQUES = ['DATE', 'MONTANT'];
// Neutres : ignorés dans le comptage, rapportés à part (seuils.md, amendement (2)).
const TYPES_NEUTRES = ['INSTITUTION', 'LIEU_ISOLE'];
const TYPES_PAR_LISTE = { spans: TYPES_SPANS, non_masques: TYPES_NON_MASQUES, neutres: TYPES_NEUTRES };
const COURT = { avocat: 'avocat', 'expert-comptable': 'ec', rh: 'rh', aucune: 'neutre' };

// Nombre de documents par modèle.
// Test : 10 par persona (2 modèles × 5) + 5 sans donnée personnelle (5 modèles × 1).
// Dev : 5 par persona (2 + 3 ou 3 + 2) + 2 sans donnée personnelle (2 modèles × 1).
const PLAN = {
  dev: {
    modeles: MODELES_DEV,
    nombre: {
      'avocat-mise-en-demeure': 2, 'avocat-convention-honoraires': 3,
      'ec-attestation-chiffre-affaires': 3, 'ec-relance-pieces': 2,
      'rh-promesse-embauche': 2, 'rh-bulletin-paie': 3,
      'neutre-note-frais': 1, 'neutre-fiche-conges': 1,
    },
  },
  test: {
    modeles: MODELES_TEST,
    nombre: {
      'avocat-courrier-client': 5, 'avocat-assignation': 5,
      'ec-lettre-mission': 5, 'ec-releve-compte-client': 5,
      'rh-contrat-travail': 5, 'rh-attestation-emploi': 5,
      'neutre-circulaire-facturation': 1, 'neutre-compte-rendu-reunion': 1, 'neutre-fiche-prudhommes': 1,
      'neutre-annonce-seminaire': 1, 'neutre-guide-teletravail': 1,
    },
  },
};

// --- Génération ----------------------------------------------------------------

function generer() {
  const documents = [];
  for (const [split, { modeles, nombre }] of Object.entries(PLAN)) {
    const compteurs = {};
    for (const modele of modeles) {
      for (let rang = 0; rang < nombre[modele.id]; rang++) {
        const court = COURT[modele.persona];
        compteurs[court] = (compteurs[court] ?? 0) + 1;
        const doc_id = `${split}-${court}-${String(compteurs[court]).padStart(2, '0')}`;
        const fragment = modele.fabriquer(new Alea(graine(`${GRAINE}/${doc_id}`)), rang);
        const parPosition = (a, b) => a.start - b.start;
        documents.push({
          doc_id,
          persona: modele.persona,
          split,
          template_id: modele.id,
          text: fragment.text,
          spans: [...fragment.spans].sort(parPosition),
          non_masques: [...fragment.non_masques].sort(parPosition),
          neutres: [...fragment.neutres].sort(parPosition),
        });
      }
    }
  }
  return documents;
}

// --- Vérifications -------------------------------------------------------------

const lettreOuChiffre = (c) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

function verifierDocument(doc, erreurs) {
  const err = (m) => erreurs.push(`${doc.doc_id} : ${m}`);
  const { text } = doc;
  if (text !== text.normalize('NFC')) err('texte non normalisé NFC');
  if (/[\u{10000}-\u{10FFFF}]/u.test(text)) err('caractère hors plan multilingue de base (positions ambiguës)');
  if (text.includes('\r')) err('retour chariot');

  const toutes = [
    ...doc.spans.map((e) => ({ ...e, liste: 'spans' })),
    ...doc.non_masques.map((e) => ({ ...e, liste: 'non_masques' })),
    ...doc.neutres.map((e) => ({ ...e, liste: 'neutres' })),
  ].sort((a, b) => a.start - b.start);

  let fin = 0;
  for (const e of toutes) {
    const types = TYPES_PAR_LISTE[e.liste];
    if (!types.includes(e.type)) err(`type ${e.type} interdit dans ${e.liste}`);
    if (text.slice(e.start, e.end) !== e.text) err(`position fausse pour « ${e.text} »`);
    if (!e.text || e.text.trim() !== e.text) err(`étiquette vide ou bordée d'espaces : « ${e.text} »`);
    if (e.start < fin) err(`chevauchement (spans, non_masques, neutres) sur « ${e.text} »`);
    fin = Math.max(fin, e.end);
    if (e.liste === 'spans') {
      const raison = verifierIdentifiant(e.type, e.text);
      if (raison) err(`${e.type} « ${e.text} » : ${raison}`);
    }
  }

  // Chaque occurrence d'une valeur étiquetée doit être couverte par une étiquette :
  // repère une donnée écrite en dur dans un modèle et oubliée par l'étiquetage.
  for (const e of toutes) {
    for (let i = text.indexOf(e.text); i !== -1; i = text.indexOf(e.text, i + 1)) {
      const j = i + e.text.length;
      if (lettreOuChiffre(text[i - 1]) || lettreOuChiffre(text[j])) continue;
      if (!toutes.some((x) => x.start <= i && j <= x.end)) err(`occurrence non étiquetée de « ${e.text} » en ${i}`);
    }
  }

  if (doc.persona === 'aucune' && doc.spans.length > 0) err('document sans donnée personnelle avec des étiquettes à masquer');
  if (doc.persona !== 'aucune' && doc.spans.length === 0) err('document de persona sans étiquette à masquer');
}

function verifierSeparation(erreurs) {
  const idsDev = new Set(MODELES_DEV.map((m) => m.id));
  const fonctionsDev = new Set(MODELES_DEV.map((m) => m.fabriquer));
  for (const m of MODELES_TEST) {
    if (idsDev.has(m.id) || fonctionsDev.has(m.fabriquer)) erreurs.push(`modèle partagé entre dev et test : ${m.id}`);
  }
  for (const [split, { modeles, nombre }] of Object.entries(PLAN)) {
    for (const m of modeles) if (!nombre[m.id]) erreurs.push(`${split} : modèle ${m.id} sans nombre de documents`);
  }
}

function verifierEffectifs(documents, erreurs) {
  const attendu = { dev: { avocat: 5, 'expert-comptable': 5, rh: 5, aucune: 2 }, test: { avocat: 10, 'expert-comptable': 10, rh: 10, aucune: 5 } };
  for (const [split, parPersona] of Object.entries(attendu)) {
    for (const [persona, n] of Object.entries(parPersona)) {
      const obtenu = documents.filter((d) => d.split === split && d.persona === persona).length;
      if (obtenu !== n) erreurs.push(`${split}/${persona} : ${obtenu} documents au lieu de ${n}`);
    }
  }
}

// --- Statistiques --------------------------------------------------------------

const MOTS_NOMS_VILLES = ['Florence', 'Paris', 'Valence'];
const contientMot = (texte, mot) => new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, 'iu').test(texte);

function statistiques(documents) {
  const parType = {};
  const pieges = {};
  for (const split of Object.keys(PLAN)) {
    const docs = documents.filter((d) => d.split === split);
    const spans = docs.flatMap((d) => d.spans);
    const nm = docs.flatMap((d) => d.non_masques);
    const neutres = docs.flatMap((d) => d.neutres);
    for (const e of [...spans, ...nm, ...neutres]) {
      parType[e.type] ??= {};
      parType[e.type][split] = (parType[e.type][split] ?? 0) + 1;
    }
    const personnes = spans.filter((e) => e.type === 'PERSONNE');
    const motsHorsNoms = docs.reduce((n, d) => {
      const re = /(^|[^\p{L}])(pierres?|roses?|rosiers?)(?=[^\p{L}]|$)/giu;
      let m;
      while ((m = re.exec(d.text))) {
        const i = m.index + m[1].length;
        if (!d.spans.some((e) => e.type === 'PERSONNE' && e.start <= i && i < e.end)) n++;
      }
      return n;
    }, 0);
    pieges[split] = {
      'Prénom-mot courant (Rose, Pierre) dans un nom': personnes.filter((e) => contientMot(e.text, 'Rose') || contientMot(e.text, 'Pierre')).length,
      'Nom de famille = ville (Florence, Paris, Valence)': personnes.filter((e) => MOTS_NOMS_VILLES.some((v) => contientMot(e.text, v))).length,
      'Nom en MAJUSCULES': personnes.filter((e) => /(^|[^\p{L}])\p{Lu}{2,}([^\p{L}]|$)/u.test(e.text)).length,
      'Adresse sur plusieurs lignes': spans.filter((e) => e.type === 'ADRESSE' && e.text.includes('\n')).length,
      'Ville homonyme d\'un nom (Florence, Paris, Valence) comme lieu ou dans une adresse': [...spans, ...neutres].filter((e) => ['ADRESSE', 'LIEU_ISOLE'].includes(e.type) && MOTS_NOMS_VILLES.some((v) => contientMot(e.text, v))).length,
      'Entreprise portant un nom de famille': spans.filter((e) => e.type === 'ORGANISATION' && NOMS.some((n) => contientMot(e.text, n))).length,
      'Mot « pierre/rose » hors nom de personne': motsHorsNoms,
      'Dates (toutes)': nm.filter((e) => e.type === 'DATE').length,
      'Dates de naissance': docs.reduce((n, d) => n + d.non_masques.filter((e) => e.type === 'DATE' && /n[ée]e? le $/i.test(d.text.slice(Math.max(0, e.start - 8), e.start))).length, 0),
      'Villes isolées hors adresse': neutres.filter((e) => e.type === 'LIEU_ISOLE').length,
      'Montants': nm.filter((e) => e.type === 'MONTANT').length,
      'Montants avec espaces insécables': nm.filter((e) => e.type === 'MONTANT' && e.text.includes(' ')).length,
    };
  }
  return { parType, pieges };
}

// --- Écriture ------------------------------------------------------------------

function ecrire(documents) {
  for (const split of Object.keys(PLAN)) {
    const dossier = path.join(RACINE, split);
    fs.rmSync(dossier, { recursive: true, force: true });
    fs.mkdirSync(dossier, { recursive: true });
  }
  for (const d of documents) {
    const dossier = path.join(RACINE, d.split);
    const etiquettes = {
      doc_id: d.doc_id,
      persona: d.persona,
      split: d.split,
      template_id: d.template_id,
      spans: d.spans.map(({ start, end, type, text }) => ({ start, end, type, text })),
      non_masques: d.non_masques.map(({ start, end, type, text }) => ({ start, end, type, text })),
      neutres: d.neutres.map(({ start, end, type, text }) => ({ start, end, type, text })),
    };
    fs.writeFileSync(path.join(dossier, `${d.doc_id}.txt`), d.text);
    fs.writeFileSync(path.join(dossier, `${d.doc_id}.json`), JSON.stringify(etiquettes, null, 2) + '\n');
  }
  // Manifeste du jeu de test, au format de « shasum -a 256 -c ».
  const dossierTest = path.join(RACINE, 'test');
  const lignes = fs.readdirSync(dossierTest).sort().map((nom) => {
    const empreinte = crypto.createHash('sha256').update(fs.readFileSync(path.join(dossierTest, nom))).digest('hex');
    return `${empreinte}  ${nom}\n`;
  });
  fs.writeFileSync(path.join(dossierTest, 'MANIFEST.sha256'), lignes.join(''));
  return lignes.length;
}

// --- Programme principal -------------------------------------------------------

const documents = generer();
const erreurs = [];
verifierSeparation(erreurs);
verifierEffectifs(documents, erreurs);
for (const d of documents) verifierDocument(d, erreurs);

if (erreurs.length > 0) {
  console.error(`ÉCHEC : ${erreurs.length} vérification(s) en échec, aucun fichier écrit.`);
  for (const e of erreurs) console.error(`- ${e}`);
  process.exit(1);
}

const nbManifeste = ecrire(documents);
const { parType, pieges } = statistiques(documents);
const nbEtiquettes = documents.reduce((n, d) => n + d.spans.length + d.non_masques.length + d.neutres.length, 0);

console.log(`Documents : ${documents.filter((d) => d.split === 'dev').length} dev, ${documents.filter((d) => d.split === 'test').length} test.`);
console.log(`Vérifications réussies : ${nbEtiquettes} étiquettes (positions, chevauchements, couverture), clés de contrôle de chaque identifiant, séparation des modèles.`);
console.log(`Manifeste : golden/test/MANIFEST.sha256 (${nbManifeste} fichiers).\n`);
console.log('Étiquettes par type et par jeu');
console.log('| Type | Liste | dev | test |\n|---|---|---|---|');
for (const t of [...TYPES_SPANS, ...TYPES_NON_MASQUES, ...TYPES_NEUTRES]) {
  const liste = Object.keys(TYPES_PAR_LISTE).find((l) => TYPES_PAR_LISTE[l].includes(t));
  console.log(`| ${t} | ${liste} | ${parType[t]?.dev ?? 0} | ${parType[t]?.test ?? 0} |`);
}
console.log('\nPièges par jeu');
console.log('| Piège | dev | test |\n|---|---|---|');
for (const p of Object.keys(pieges.dev)) console.log(`| ${p} | ${pieges.dev[p]} | ${pieges.test[p]} |`);

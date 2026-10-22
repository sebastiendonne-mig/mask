// Évaluateur d'un détecteur sur le golden set, selon le protocole de comptage de
// seuils.md (§ 8, amendements du 21/10/2026 (2) et (3)).
//
// Réutilisable pour tout détecteur (règles maintenant, modèles ensuite) : un module
// ESM qui exporte nom, version et detecter(texte) → [{ start, end, type }].
// Aucune dépendance : bibliothèque standard de Node uniquement.
//
//   node scripts/evaluer.mjs [--detecteur src/regles.mjs] [--split dev|test|robustesse] [--sortie dossier]
//
// Jeux : « dev » (par défaut, mise au point) ; « robustesse » (rédigé à la main, cas difficiles,
// indicatif, jamais pour la mise au point : seuils.md, amendement (4)).
// Le jeu de test ne s'évalue qu'avec --split test --mesure-finale (mesure finale,
// une seule fois, sur demande explicite de Sébastien).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- Seuils (seuils.md, § 4) -----------------------------------------------------

// S2 : formats fixes cités par seuils.md. TVA_INTRA et NUMERO_DOSSIER n'y figurent
// pas : leur rappel est rapporté par type, sans seuil.
export const FORMATS_FIXES = ['IBAN', 'SIREN', 'SIRET', 'NIR', 'EMAIL', 'TELEPHONE', 'CARTE'];

export const SEUILS = [
  { id: 'S2', critere: 'Rappel des formats fixes', types: FORMATS_FIXES, seuil: 1, bloquant: true },
  { id: 'S3', critere: 'Rappel PERSONNE', types: ['PERSONNE'], seuil: 0.95, bloquant: true },
  { id: 'S4', critere: 'Rappel ADRESSE', types: ['ADRESSE'], seuil: 0.9, bloquant: true },
  { id: 'S5', critere: 'Rappel ORGANISATION', types: ['ORGANISATION'], seuil: 0.85, bloquant: false },
  { id: 'S6', critere: 'Précision globale', precision: true, seuil: 0.8, bloquant: false },
];

export const MENTION_DEV = 'jeu de développement : indicatif, pas la mesure finale';
export const MENTION_ROBUSTESSE = 'jeu de robustesse : rédigé à la main, cas difficiles assumés, petit échantillon ; indicatif, ne modifie pas les seuils';

// Mention du rapport et listes détaillées par jeu ; le jeu de test n'a ni l'une ni l'autre.
const MENTIONS = { dev: MENTION_DEV, robustesse: MENTION_ROBUSTESSE, test: null };
const AVEC_LISTES = ['dev', 'robustesse'];

// Amendement (3) : « entièrement couvert » s'apprécie sur les lettres et les chiffres.
const SIGNIFIANT = /[\p{L}\p{N}]/u;

const chevauche = (a, b) => a.start < b.end && b.start < a.end;

// --- Masques ---------------------------------------------------------------------

// Refuse une sortie de détecteur mal formée plutôt que de la compter de travers.
export function validerMasques(masques, longueur) {
  if (!Array.isArray(masques)) throw new Error('le détecteur doit renvoyer un tableau');
  for (const m of masques) {
    const ok = m && Number.isInteger(m.start) && Number.isInteger(m.end) && m.start >= 0 && m.start < m.end && m.end <= longueur;
    if (!ok) throw new Error(`masque invalide : ${JSON.stringify(m)} (longueur du texte : ${longueur})`);
  }
}

// Les masques qui se chevauchent (au moins un caractère commun) n'en font qu'un :
// l'app n'afficherait qu'un remplacement. Des masques seulement adjacents restent distincts.
export function fusionner(masques) {
  const tries = [...masques].sort((a, b) => a.start - b.start || a.end - b.end);
  const sortie = [];
  for (const m of tries) {
    const dernier = sortie.at(-1);
    if (dernier && m.start < dernier.end) dernier.end = Math.max(dernier.end, m.end);
    else sortie.push({ start: m.start, end: m.end });
  }
  return sortie;
}

// --- Évaluation d'un document ----------------------------------------------------

// etiquettes : { spans, non_masques, neutres } au format de golden/README.md.
export function evaluerDocument(texte, etiquettes, masquesBruts) {
  validerMasques(masquesBruts, texte.length);
  const spans = etiquettes.spans ?? [];
  const nonMasques = etiquettes.non_masques ?? [];
  const neutres = etiquettes.neutres ?? [];
  const masques = fusionner(masquesBruts);

  const couvert = new Uint8Array(texte.length);
  for (const m of masques) couvert.fill(1, m.start, m.end);

  // Rappel : un élément est retrouvé si chacune de ses lettres et chacun de ses
  // chiffres est masqué ; sinon c'est un oubli, partiel si au moins un l'est.
  const elements = spans.map((e) => {
    let total = 0;
    let masques_ = 0;
    for (let k = e.start; k < e.end; k++) {
      if (!SIGNIFIANT.test(texte[k])) continue;
      total++;
      masques_ += couvert[k];
    }
    if (total === 0) {
      // Élément sans lettre ni chiffre (n'existe pas dans le golden set) : couverture littérale.
      total = e.end - e.start;
      masques_ = couvert.subarray(e.start, e.end).reduce((s, c) => s + c, 0);
    }
    const statut = masques_ === total ? 'retrouve' : masques_ > 0 ? 'partiel' : 'oubli';
    // Le type proposé n'entre pas dans le rappel ; il est seulement comparé, à part.
    const typesProposes = [...new Set(masquesBruts.filter((m) => chevauche(m, e)).map((m) => m.type))];
    return { ...e, statut, typeDifferent: statut === 'retrouve' && !typesProposes.includes(e.type), typesProposes };
  });

  // Précision. Un masque est correct s'il recouvre au moins un span. Erreurs :
  //  1) un masque qui ne recouvre aucun span ni aucun neutre : 1 erreur ;
  //  2) chaque DATE ou MONTANT touché par un masque qui recouvre un span ou un neutre :
  //     1 erreur par élément, sauf s'il est déjà touché par un masque compté en 1).
  // Un masque qui ne touche qu'un neutre n'est ni une réussite ni une erreur.
  const erreurs = [];
  const nmComptes = new Set();
  const statuts = masques.map((m) => {
    const s = spans.some((e) => chevauche(m, e));
    const n = neutres.some((e) => chevauche(m, e));
    const nm = nonMasques.filter((e) => chevauche(m, e));
    if (s) return 'correct';
    if (!n) {
      erreurs.push({ categorie: nm[0]?.type ?? 'NON_ETIQUETE', start: m.start, end: m.end });
      for (const e of nm) nmComptes.add(e);
      return 'erreur';
    }
    // Neutre et date/montant sans span : non couvert par la formule de Sébastien,
    // traité comme le cas 2 puisque l'amendement (2) dit « sans exception ».
    return nm.length ? 'neutre_date' : 'neutre_seul';
  });
  masques.forEach((m, k) => {
    if (statuts[k] === 'erreur') return;
    for (const e of nonMasques) {
      if (!chevauche(m, e) || nmComptes.has(e)) continue;
      nmComptes.add(e);
      erreurs.push({ categorie: e.type, start: e.start, end: e.end });
    }
  });

  // Neutres touchés par au moins un masque.
  const neutresMasques = neutres.filter((e) => masques.some((m) => chevauche(m, e)));

  // Débordement (informatif) : lettres et chiffres masqués hors des spans et des neutres.
  const etiquete = new Uint8Array(texte.length);
  for (const e of [...spans, ...neutres]) etiquete.fill(1, e.start, e.end);
  let totalMasque = 0;
  let horsEtiquettes = 0;
  for (let k = 0; k < texte.length; k++) {
    if (!couvert[k] || !SIGNIFIANT.test(texte[k])) continue;
    totalMasque++;
    if (!etiquete[k]) horsEtiquettes++;
  }

  return {
    elements,
    masques: masques.map((m, k) => ({ ...m, statut: statuts[k] })),
    erreurs,
    neutres: neutres.map((e) => ({ ...e, masque: neutresMasques.includes(e) })),
    debordement: { horsEtiquettes, totalMasque },
  };
}

// --- Agrégation ------------------------------------------------------------------

const taux = (n, d) => (d === 0 ? null : n / d);

function statutSeuil(valeur, seuil) {
  if (valeur === null) return 'non mesurable';
  return valeur >= seuil ? 'atteint' : 'non atteint';
}

// Extrait court pour les listes : 40 caractères au plus, sauts de ligne visibles.
export function extrait(texte, start, end) {
  const t = texte.slice(start, end).replace(/\n/g, '⏎');
  return t.length > 40 ? t.slice(0, 39) + '…' : t;
}

// docs : [{ doc_id, texte, resultat }] où resultat vient de evaluerDocument.
export function agreger(docs) {
  const parType = {};
  let partiels = 0;
  let totalElements = 0;
  const oublis = [];
  const typesDifferents = [];
  const listeErreurs = [];
  const erreursParCategorie = {};
  const neutresMasques = {};
  const neutresTotal = {};
  let corrects = 0;
  let neutresSeuls = 0;
  let neutresDates = 0;
  let horsEtiquettes = 0;
  let totalMasque = 0;
  let nbMasques = 0;

  for (const { doc_id, texte, resultat } of docs) {
    for (const e of resultat.elements) {
      const t = (parType[e.type] ??= { total: 0, trouves: 0, partiels: 0 });
      t.total++;
      totalElements++;
      if (e.statut === 'retrouve') t.trouves++;
      else {
        if (e.statut === 'partiel') {
          t.partiels++;
          partiels++;
        }
        oublis.push({ doc_id, type: e.type, statut: e.statut, extrait: extrait(texte, e.start, e.end) });
      }
      if (e.typeDifferent) typesDifferents.push({ doc_id, type: e.type, propose: e.typesProposes.join(', '), extrait: extrait(texte, e.start, e.end) });
    }
    for (const m of resultat.masques) {
      nbMasques++;
      if (m.statut === 'correct') corrects++;
      if (m.statut === 'neutre_seul') neutresSeuls++;
      if (m.statut === 'neutre_date') neutresDates++;
    }
    for (const e of resultat.erreurs) {
      erreursParCategorie[e.categorie] = (erreursParCategorie[e.categorie] ?? 0) + 1;
      listeErreurs.push({ doc_id, categorie: e.categorie, extrait: extrait(texte, e.start, e.end) });
    }
    for (const e of resultat.neutres) {
      neutresTotal[e.type] = (neutresTotal[e.type] ?? 0) + 1;
      if (e.masque) neutresMasques[e.type] = (neutresMasques[e.type] ?? 0) + 1;
    }
    horsEtiquettes += resultat.debordement.horsEtiquettes;
    totalMasque += resultat.debordement.totalMasque;
  }

  const rappelTypes = (types) => {
    const total = types.reduce((s, t) => s + (parType[t]?.total ?? 0), 0);
    const trouves = types.reduce((s, t) => s + (parType[t]?.trouves ?? 0), 0);
    return { trouves, total, valeur: taux(trouves, total) };
  };
  const nbErreurs = listeErreurs.length;
  const precision = { corrects, erreurs: nbErreurs, valeur: taux(corrects, corrects + nbErreurs) };

  const seuils = SEUILS.map((s) => {
    const mesure = s.precision ? precision : rappelTypes(s.types);
    return { id: s.id, critere: s.critere, seuil: s.seuil, bloquant: s.bloquant, ...mesure, statut: statutSeuil(mesure.valeur, s.seuil) };
  });

  for (const t of Object.values(parType)) t.rappel = taux(t.trouves, t.total);

  return {
    seuils,
    rappelParType: Object.fromEntries(Object.entries(parType).sort(([a], [b]) => a.localeCompare(b))),
    couverturePartielle: { partiels, total: totalElements, taux: taux(partiels, totalElements) },
    precision: {
      ...precision,
      erreursParCategorie,
      masques: nbMasques,
      masquesNeutresSeuls: neutresSeuls,
      masquesNeutreEtDateSansSpan: neutresDates,
    },
    neutres: { masques: neutresMasques, total: neutresTotal },
    debordement: { lettresChiffresHorsEtiquettes: horsEtiquettes, lettresChiffresMasques: totalMasque, part: taux(horsEtiquettes, totalMasque) },
    typesDifferents: typesDifferents.length,
    listes: { oublis, erreurs: listeErreurs, typesDifferents },
  };
}

// --- Rapport Markdown -------------------------------------------------------------

const pct = (v) => (v === null ? '—' : `${(v * 100).toFixed(1).replace('.', ',')} %`);
const cellule = (s) => String(s).replace(/\|/g, '\\|');

export function rapportMarkdown(r) {
  const l = [];
  l.push(`# Évaluation — ${r.detecteur.nom} ${r.detecteur.version} — jeu ${r.split}`, '');
  if (r.mention) l.push(`> **${r.mention}**`, '');
  l.push(`- Date (UTC) : ${r.date}`);
  l.push(`- Commit : \`${r.git.hash}\`${r.git.propre ? '' : ' + modifications non commitées'} (arbre propre : ${r.git.propre ? 'oui' : 'non'})`);
  l.push(`- Détecteur : ${r.detecteur.nom} ${r.detecteur.version} (\`${r.detecteur.module}\`)`);
  l.push(`- Documents : ${r.documents}`);
  l.push(`- Protocole : ${r.protocole}`, '');

  l.push('## Seuils', '', '| # | Critère | Valeur | Seuil | Bloquant | Statut |', '|---|---|---|---|---|---|');
  for (const s of r.seuils) {
    const detail = s.total !== undefined ? ` (${s.trouves}/${s.total})` : ` (${s.corrects} corrects, ${s.erreurs} erreurs)`;
    l.push(`| ${s.id} | ${s.critere} | ${pct(s.valeur)}${detail} | ${pct(s.seuil)} | ${s.bloquant ? 'oui' : 'non'} | ${s.statut} |`);
  }
  l.push('');

  l.push('## Rappel par type', '', '| Type | Trouvés / total | Rappel | Couverture partielle |', '|---|---|---|---|');
  for (const [type, t] of Object.entries(r.rappelParType)) {
    l.push(`| ${type}${FORMATS_FIXES.includes(type) ? ' (S2)' : ''} | ${t.trouves} / ${t.total} | ${pct(t.rappel)} | ${t.partiels} |`);
  }
  const cp = r.couverturePartielle;
  l.push('', `Couverture partielle (oubli dont au moins une lettre ou un chiffre est masqué) : ${cp.partiels} / ${cp.total} éléments (${pct(cp.taux)}).`, '');

  const p = r.precision;
  l.push('## Précision', '');
  l.push(`- Masques (après fusion des chevauchements) : ${p.masques}`);
  l.push(`- Corrects : ${p.corrects} ; erreurs : ${p.erreurs} ; précision : ${pct(p.valeur)}`);
  const cats = Object.entries(p.erreursParCategorie);
  l.push(`- Erreurs par catégorie : ${cats.length ? cats.map(([c, n]) => `${c} ${n}`).join(', ') : 'aucune'}`);
  l.push(`- Masques sur un neutre seul (ni réussite ni erreur) : ${p.masquesNeutresSeuls}`);
  l.push(`- Masques sur un neutre et une date/un montant, sans span (dates/montants comptés en erreur) : ${p.masquesNeutreEtDateSansSpan}`, '');

  l.push('## Neutres masqués', '');
  for (const type of Object.keys(r.neutres.total).sort()) l.push(`- ${type} : ${r.neutres.masques[type] ?? 0} / ${r.neutres.total[type]}`);
  if (!Object.keys(r.neutres.total).length) l.push('- aucun neutre étiqueté');
  l.push('');

  const d = r.debordement;
  l.push('## Débordement (informatif, sans seuil)', '');
  l.push(`Lettres et chiffres masqués hors des spans et des neutres : ${d.lettresChiffresHorsEtiquettes} sur ${d.lettresChiffresMasques} masqués (${pct(d.part)}).`, '');
  l.push(`Spans retrouvés avec un type proposé différent : ${r.typesDifferents}.`, '');

  if (r.listes) {
    l.push('## Oublis', '');
    if (!r.listes.oublis.length) l.push('Aucun.');
    else {
      l.push('| Document | Type | Statut | Extrait |', '|---|---|---|---|');
      for (const o of r.listes.oublis) l.push(`| ${o.doc_id} | ${o.type} | ${o.statut} | ${cellule(o.extrait)} |`);
    }
    l.push('', '## Erreurs', '');
    if (!r.listes.erreurs.length) l.push('Aucune.');
    else {
      l.push('| Document | Catégorie | Extrait |', '|---|---|---|');
      for (const e of r.listes.erreurs) l.push(`| ${e.doc_id} | ${e.categorie} | ${cellule(e.extrait)} |`);
    }
    l.push('', '## Types différents', '');
    if (!r.listes.typesDifferents.length) l.push('Aucun.');
    else {
      l.push('| Document | Type attendu | Type proposé | Extrait |', '|---|---|---|---|');
      for (const t of r.listes.typesDifferents) l.push(`| ${t.doc_id} | ${t.type} | ${t.propose} | ${cellule(t.extrait)} |`);
    }
    l.push('');
  }
  return l.join('\n');
}

// --- Ligne de commande -------------------------------------------------------------

// Fonction pure : le garde-fou du jeu de test se teste sans toucher au jeu de test.
export function verifierArguments(args) {
  const { values } = parseArgs({
    args,
    strict: true,
    options: {
      split: { type: 'string', default: 'dev' },
      'mesure-finale': { type: 'boolean', default: false },
      detecteur: { type: 'string', default: 'src/regles.mjs' },
      sortie: { type: 'string' },
    },
  });
  if (!Object.hasOwn(MENTIONS, values.split)) throw new Error(`--split : « dev », « test » ou « robustesse », pas « ${values.split} »`);
  if (values.split === 'test' && !values['mesure-finale']) {
    throw new Error('refus : le jeu de test est scellé. Il ne sert qu’une fois, pour la mesure finale, sur demande explicite : --split test --mesure-finale.');
  }
  return { split: values.split, mesureFinale: values['mesure-finale'], detecteur: values.detecteur, sortie: values.sortie ?? null };
}

function etatGit() {
  const git = (...a) => execFileSync('git', a, { cwd: RACINE, encoding: 'utf8' });
  return { hash: git('rev-parse', 'HEAD').trim(), propre: git('status', '--porcelain', '--untracked-files=all').trim() === '' };
}

async function principal() {
  let options;
  try {
    options = verifierArguments(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  // L'état git est relevé avant d'écrire le moindre fichier de résultat.
  const git = etatGit();
  const date = new Date().toISOString();

  const cheminDetecteur = path.resolve(process.cwd(), options.detecteur);
  const detecteur = await import(pathToFileURL(cheminDetecteur).href);
  if (typeof detecteur.detecter !== 'function' || !detecteur.nom || !detecteur.version) {
    throw new Error(`${options.detecteur} doit exporter nom, version et detecter(texte)`);
  }

  const dossier = path.join(RACINE, 'golden', options.split);
  const docs = [];
  for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith('.json')).sort()) {
    const etiquettes = JSON.parse(fs.readFileSync(path.join(dossier, fichier), 'utf8'));
    const texte = fs.readFileSync(path.join(dossier, fichier.replace(/\.json$/, '.txt')), 'utf8');
    const resultat = evaluerDocument(texte, etiquettes, await detecteur.detecter(texte));
    docs.push({ doc_id: etiquettes.doc_id, texte, resultat });
  }

  const { listes, ...agregat } = agreger(docs);
  const rapport = {
    date,
    git,
    detecteur: { nom: detecteur.nom, version: detecteur.version, module: path.relative(RACINE, cheminDetecteur) },
    split: options.split,
    mention: MENTIONS[options.split],
    documents: docs.length,
    protocole: 'seuils.md § 8, amendements du 21/10/2026 (2) et (3) ; masque sur un neutre et une date sans span : dates comptées en erreur',
    ...agregat,
    // Listes détaillées pour le jeu de développement et le jeu de robustesse, jamais pour le jeu de test.
    listes: AVEC_LISTES.includes(options.split) ? listes : undefined,
  };

  const sortie = options.sortie ? path.resolve(process.cwd(), options.sortie) : path.join(RACINE, 'resultats', options.split);
  fs.mkdirSync(sortie, { recursive: true });
  const base = path.join(sortie, detecteur.nom);
  fs.writeFileSync(base + '.json', JSON.stringify(rapport, null, 2) + '\n');
  fs.writeFileSync(base + '.md', rapportMarkdown(rapport));

  for (const s of rapport.seuils) console.log(`${s.id} ${s.critere} : ${pct(s.valeur)} (seuil ${pct(s.seuil)}) — ${s.statut}`);
  console.log(`Rapport : ${path.relative(process.cwd(), base)}.{json,md} — commit ${git.hash.slice(0, 7)}${git.propre ? '' : ' + modifications non commitées'}`);
}

if (import.meta.main) await principal();

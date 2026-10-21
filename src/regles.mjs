// Détecteur de référence par règles : expressions régulières et clés de contrôle.
//
// Formats fixes (IBAN, SIREN, SIRET, TVA intracommunautaire FR, NIR, carte, e-mail,
// téléphone français), adresses françaises, noms précédés d'une civilité, numéros
// de dossier après un indice explicite.
//
// Rien de propre au générateur du golden set : ni préfixes de numéros réservés à la
// fiction, ni domaines de messagerie, ni listes de noms (golden/README.md).
// Interface commune aux détecteurs : detecter(texte) → [{ start, end, type }].
// Aucune dépendance : bibliothèque standard uniquement, utilisable dans le navigateur.

export const nom = 'regles';
export const version = '0.4.0';

// --- Clés de contrôle ------------------------------------------------------------

function mod97(chiffres) {
  let r = 0;
  for (const c of chiffres) r = (r * 10 + Number(c)) % 97;
  return r;
}

export function luhn(chiffres) {
  if (!/^\d+$/.test(chiffres)) return false;
  let somme = 0;
  for (let k = 0; k < chiffres.length; k++) {
    let c = Number(chiffres[chiffres.length - 1 - k]);
    if (k % 2 === 1) {
      c *= 2;
      if (c > 9) c -= 9;
    }
    somme += c;
  }
  return somme % 10 === 0;
}

export const sirenValide = (s) => /^\d{9}$/.test(s) && luhn(s);

// SIRET : Luhn sur les 14 chiffres et sur le SIREN. Établissements de La Poste
// (SIREN 356 000 000) : la somme des chiffres est un multiple de 5.
export function siretValide(s) {
  if (!/^\d{14}$/.test(s)) return false;
  if (s.startsWith('356000000')) return [...s].reduce((t, c) => t + Number(c), 0) % 5 === 0;
  return luhn(s) && luhn(s.slice(0, 9));
}

// TVA intracommunautaire FR, clé numérique : (12 + 3 × (SIREN mod 97)) mod 97.
export const tvaFrValide = (cle, siren) => /^\d{2}$/.test(cle) && /^\d{9}$/.test(siren) && Number(cle) === (12 + 3 * (Number(siren) % 97)) % 97;

// NIR : clé = 97 − (13 premiers chiffres mod 97) ; Corse : 2A → 19, 2B → 18.
export function nirValide(n) {
  if (!/^[1-478]\d{4}(?:\d{2}|2[AB])\d{8}$/.test(n)) return false;
  const dep = n.slice(5, 7).replace('2A', '19').replace('2B', '18');
  const corps = n.slice(0, 5) + dep + n.slice(7, 13);
  return 97 - mod97(corps) === Number(n.slice(13));
}

// IBAN : 4 premiers caractères déplacés en fin, lettres converties (A = 10 … Z = 35), mod 97 = 1.
export function ibanValide(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  const r = iban.slice(4) + iban.slice(0, 4);
  return mod97([...r].map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join('')) === 1;
}

// Longueur de l'IBAN par pays (registre SWIFT), pour les pays européens courants.
const LONGUEURS_IBAN = {
  AD: 24, AT: 20, BE: 16, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20, ES: 24, FI: 18, FR: 27, GB: 22,
  GR: 27, HR: 21, HU: 28, IE: 22, IS: 26, IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18,
  NO: 15, PL: 28, PT: 25, RO: 24, SE: 24, SI: 19, SK: 24, SM: 27,
};

// --- Briques d'expressions ---------------------------------------------------------

const ESP = '[ \\u00A0\\u202F]'; // espace, espace insécable, espace fine insécable
const SEP = '[ \\u00A0\\u202F.\\-]'; // séparateur entre groupes de chiffres
const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const titre = (s) => s.replace(/(^|[ \-'’])(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase());
// Un mot en minuscules, avec majuscules initiales, ou tout en majuscules.
const variantes = (mots) => [...new Set(mots.flatMap((m) => [m, titre(m), m.toUpperCase()]))].sort((a, b) => b.length - a.length);
const alt = (mots) => variantes(mots).map(echapper).join('|');

// Priorités en cas de chevauchement (la plus petite l'emporte).
const P = { IBAN: 0, TVA: 1, NIR: 2, TEL_INTL: 3, EMAIL: 4, NUMERIQUE: 5, ADRESSE: 6, DOSSIER: 7, ORGANISATION: 8, PERSONNE: 9, PRENOM_NOM: 10, PROPAGATION: 11 };

// --- Identifiants -----------------------------------------------------------------

const RE_IBAN = /(?<![\p{L}\p{N}])[A-Z]{2}\d{2}(?:[  ]?[A-Z0-9]){8,32}/gu;

function ibans(texte, ajouter) {
  for (const m of texte.matchAll(RE_IBAN)) {
    // Caractères utiles (sans les espaces), avec leur position dans le texte.
    const car = [...m[0]].map((c, k) => ({ c, pos: m.index + k })).filter((x) => /[A-Z0-9]/.test(x.c));
    const pays = m[0].slice(0, 2);
    const longueurs = LONGUEURS_IBAN[pays] ? [LONGUEURS_IBAN[pays]] : Array.from({ length: 20 }, (_, k) => 34 - k);
    for (const n of longueurs) {
      if (car.length < n) continue;
      // Pas de coupure au milieu d'un bloc : le caractère suivant n'est pas collé.
      if (car.length > n && car[n].pos === car[n - 1].pos + 1) continue;
      if (!ibanValide(car.slice(0, n).map((x) => x.c).join(''))) continue;
      ajouter(m.index, car[n - 1].pos + 1, 'IBAN', P.IBAN);
      break;
    }
  }
}

const RE_TVA = new RegExp(`(?<![\\p{L}\\p{N}])FR${SEP}?(\\d{2})${SEP}?(\\d{3})${SEP}?(\\d{3})${SEP}?(\\d{3})(?!\\p{N})`, 'gu');

function tvas(texte, ajouter) {
  for (const m of texte.matchAll(RE_TVA)) {
    if (tvaFrValide(m[1], m[2] + m[3] + m[4])) ajouter(m.index, m.index + m[0].length, 'TVA_INTRA', P.TVA);
  }
}

const RE_NIR = new RegExp(`(?<![\\p{L}\\p{N}])([1-478])${SEP}?(\\d{2})${SEP}?(\\d{2})${SEP}?(\\d{2}|2[AB])${SEP}?(\\d{3})${SEP}?(\\d{3})${SEP}?(\\d{2})(?![\\p{L}\\p{N}])`, 'gu');

function nirs(texte, ajouter) {
  for (const m of texte.matchAll(RE_NIR)) {
    if (nirValide(m.slice(1).join(''))) ajouter(m.index, m.index + m[0].length, 'NIR', P.NIR);
  }
}

// Téléphone au format international : +33 ou 0033, « (0) » facultatif, puis 9 chiffres.
const RE_TEL_INTL = new RegExp(`(?<![\\p{L}\\p{N}+])(?:\\+|00)33${SEP}?(?:\\(0\\)${SEP}?)?[1-9](?:${SEP}?\\d{2}){4}(?!\\p{N})`, 'gu');

function telephonesInternationaux(texte, ajouter) {
  for (const m of texte.matchAll(RE_TEL_INTL)) ajouter(m.index, m.index + m[0].length, 'TELEPHONE', P.TEL_INTL);
}

// Suite de groupes de chiffres séparés par un seul séparateur.
const RE_SUITE = /(?<![\p{L}\p{N}])\d+(?:[   .\-]\d+)*(?![\p{L}\p{N}])/gu;
// Un nombre suivi de décimales ou d'une unité monétaire est un montant, pas un identifiant.
const estMontant = (texte, fin) => /^[   ]?(?:,\d|€|euros?(?!\p{L})|EUR(?!\p{L}))/u.test(texte.slice(fin, fin + 8));

// Groupements usuels de chaque identifiant (longueurs des groupes de chiffres) :
// un identifiant n'est reconnu que collé ou écrit selon l'un d'eux.
const GROUPEMENTS = {
  SIREN: ['9', '3-3-3'],
  SIRET: ['14', '3-3-3-5', '9-5'],
  TELEPHONE: ['10', '2-2-2-2-2'],
  CARTE: ['15', '4-6-5', '16', '4-4-4-4', '19', '4-4-4-4-3'],
};

function typeNumerique(chiffres, groupes) {
  let type = null;
  if (chiffres.length === 9 && sirenValide(chiffres)) type = 'SIREN';
  else if (chiffres.length === 10 && /^0[1-9]/.test(chiffres)) type = 'TELEPHONE';
  else if (chiffres.length === 14 && siretValide(chiffres)) type = 'SIRET';
  else if (chiffres.length === 15 && /^3[47]/.test(chiffres) && luhn(chiffres)) type = 'CARTE';
  else if ((chiffres.length === 16 || chiffres.length === 19) && /^[2-6]/.test(chiffres) && luhn(chiffres)) type = 'CARTE';
  if (!type) return null;
  return GROUPEMENTS[type].includes(groupes.map((g) => g.chiffres.length).join('-')) ? type : null;
}

// SIREN, SIRET, carte, téléphone national : dans chaque suite de chiffres, on cherche
// de gauche à droite la plus longue fenêtre de groupes entiers qui forme un identifiant valide.
function identifiantsNumeriques(texte, ajouter) {
  for (const m of texte.matchAll(RE_SUITE)) {
    const groupes = [...m[0].matchAll(/\d+/g)].map((g) => ({ start: m.index + g.index, end: m.index + g.index + g[0].length, chiffres: g[0] }));
    let i = 0;
    while (i < groupes.length) {
      let suivant = i + 1;
      for (let j = groupes.length - 1; j >= i; j--) {
        const fenetre = groupes.slice(i, j + 1);
        const chiffres = fenetre.map((g) => g.chiffres).join('');
        if (chiffres.length > 19) continue;
        const type = typeNumerique(chiffres, fenetre);
        const fin = fenetre.at(-1).end;
        if (!type || estMontant(texte, fin)) continue;
        ajouter(fenetre[0].start, fin, type, P.NUMERIQUE);
        suivant = j + 1;
        break;
      }
      i = suivant;
    }
  }
}

const RE_EMAIL = /(?<![\p{L}\p{N}._%+\-])[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}](?:[\p{L}\p{N}\-]*[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}\-]*[\p{L}\p{N}])?)*\.\p{L}{2,}(?![\p{L}\p{N}])/gu;

function emails(texte, ajouter) {
  for (const m of texte.matchAll(RE_EMAIL)) ajouter(m.index, m.index + m[0].length, 'EMAIL', P.EMAIL);
}

// --- Adresses françaises ------------------------------------------------------------

// Types de voie usuels (liste générale, pas celle du générateur).
const VOIES = [
  'rue', 'avenue', 'av.', 'boulevard', 'bd', 'place', 'allée', 'chemin', 'impasse', 'route', 'cours', 'quai',
  'square', 'passage', 'faubourg', 'sentier', 'esplanade', 'promenade', 'montée', 'voie', 'ruelle', 'venelle',
  'traverse', 'rond-point', 'parvis', 'cité', 'hameau', 'lieu-dit', 'chaussée', 'mail', 'sente',
];
// Compléments de localisation placés avant la voie (norme postale : bâtiment, résidence…).
const COMPLEMENTS = ['résidence', 'bâtiment', 'bât.', 'immeuble', 'appartement', 'appt', 'escalier', 'esc.', 'entrée', 'lotissement', 'le clos', 'clos', 'villa'];
const CONNECTEURS = ['sur', 'sous', 'en', 'de', 'des', 'du', 'la', 'le', 'les', 'lès', 'aux', 'et'];

const SEG = `(?:${ESP}*,${ESP}*|${ESP}*\\n${ESP}*)`; // fin de segment : virgule ou saut de ligne
const ETAGE = `\\d{1,2}(?:e|er|ème|è)${ESP}+(?:étage|ÉTAGE)`;
const COMPLEMENT = `(?:(?:${alt(COMPLEMENTS)})(?!\\p{L})[^\\n,;]{0,50}|${ETAGE})`;
const NUMERO = `\\d{1,4}(?:${ESP}?(?:${alt(['bis', 'ter', 'quater'])}|[A-D])(?!\\p{L}))?`;
const VOIE = `(?:${alt(VOIES)})\\.?`;
const NOM_VOIE = '[^\\n,;()]{1,60}?';
const CODE_POSTAL = `\\d{2}${ESP}?\\d{3}`;
const MOT_VILLE = "(?!CEDEX|Cedex)\\p{Lu}\\p{L}*(?:['’]\\p{L}+)?";
const VILLE = `${MOT_VILLE}(?:(?:[ \\-]|[ \\-](?:${CONNECTEURS.join('|')})[ \\-]|[ \\-][dl]['’])${MOT_VILLE}){0,4}`;
const CEDEX = `(?:${ESP}+(?:CEDEX|Cedex)(?:${ESP}+\\d{1,2})?)?`;

// Complément éventuel, numéro, type de voie, nom, code postal, ville ; sur une, deux ou trois lignes.
const RE_ADRESSE = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${COMPLEMENT}${SEG}){0,2}${NUMERO}${ESP}*,?${ESP}+${VOIE}${ESP}+${NOM_VOIE}(?:${SEG}|${ESP}+)${CODE_POSTAL}${ESP}+${VILLE}${CEDEX}`,
  'gu',
);

function adresses(texte, ajouter) {
  for (const m of texte.matchAll(RE_ADRESSE)) ajouter(m.index, m.index + m[0].length, 'ADRESSE', P.ADRESSE);
}

// --- Noms précédés d'une civilité ------------------------------------------------------

const CIVILITES = ['M.', 'MM.', 'Mme', 'Mmes', 'Mlle', 'Madame', 'Monsieur', 'Mademoiselle', 'Maître', 'Me', 'Docteur', 'Dr', 'Dr.', 'Professeur', 'Pr.'];
const PARTICULES = ['de', 'du', 'des', 'da', 'di', 'van', 'von', 'der', 'le', 'la'];
// Mot du nom : initiale suivie d'un point, ou mot commençant par une majuscule.
const MOT_NOM = "(?:\\p{Lu}\\.(?=[ \\u00A0])|\\p{Lu}(?:[\\p{L}'’\\-]*\\p{L})?)";
const NOM_PERSONNE = `${MOT_NOM}(?:(?:${ESP}+(?:(?:${PARTICULES.join('|')})${ESP}+)?|${ESP}+[dD]['’])${MOT_NOM}){0,3}`;
// La civilité reste hors du masque (convention d'étiquetage) : seul le groupe 1 est masqué.
const RE_PERSONNE = new RegExp(`(?<!\\p{L})(?:${CIVILITES.map(echapper).sort((a, b) => b.length - a.length).join('|')})${ESP}+(${NOM_PERSONNE})`, 'gdu');

// Nom affiché devant une adresse électronique entre chevrons (en-tête de courriel) :
// « Jeanne Dupont <j.dupont@exemple.test> ».
const RE_NOM_AFFICHE = new RegExp(`(?<![\\p{L}\\p{N}])(${NOM_PERSONNE})${ESP}*<[^<>\\s@]+@[^<>\\s]+>`, 'gdu');

// Convention « Prénom NOM » des courriers français : un mot à initiale majuscule suivi
// d'un nom en capitales (« Jeanne DUPONT », « Jean-Luc LE BRAS »). Écartés : mots-outils
// et civilités en premier mot, sigles usuels et formes juridiques en second.
const MOTS_OUTILS = ['Le', 'La', 'Les', 'Un', 'Une', 'De', 'Du', 'Des', 'Et', 'En', 'Au', 'Aux', 'À', 'Par', 'Pour', 'Sur', 'Dans', 'Avec', 'Total', 'Net', 'Taux', 'Montant', 'Code', 'Numéro', 'Objet', ...CIVILITES.filter((c) => !c.includes('.'))];
const SIGLES = [
  'SA', 'SAS', 'SASU', 'SARL', 'EURL', 'SELARL', 'SELAS', 'SCP', 'SCI', 'SNC', 'GIE', 'TVA', 'HT', 'TTC', 'RIB',
  'IBAN', 'BIC', 'SIREN', 'SIRET', 'RCS', 'NIR', 'CDI', 'CDD', 'URSSAF', 'CAF', 'RG', 'CEDEX', 'BP', 'PDF', 'SMS', 'TGI', 'PV',
];
const RE_PRENOM_NOM = new RegExp(
  `(?<![\\p{L}\\p{N}\\-'’.@])(?!(?:${MOTS_OUTILS.join('|')})(?!\\p{L}))\\p{Lu}\\p{Ll}+(?:-\\p{Lu}\\p{Ll}+)?${ESP}+` +
    `(?!(?:${SIGLES.join('|')})(?!\\p{L}))\\p{Lu}{2,}(?:(?:[-'’]|${ESP})\\p{Lu}{2,})*(?![\\p{L}\\p{N}])`,
  'gu',
);

function personnes(texte, ajouter) {
  for (const m of texte.matchAll(RE_PRENOM_NOM)) ajouter(m.index, m.index + m[0].length, 'PERSONNE', P.PRENOM_NOM);
  for (const re of [RE_PERSONNE, RE_NOM_AFFICHE]) {
    for (const m of texte.matchAll(re)) {
      const [start, end] = m.indices[1];
      ajouter(start, end, 'PERSONNE', P.PERSONNE);
    }
  }
}

// Un nom d'au moins deux mots, déjà repéré, est cherché ailleurs dans le même document,
// sans tenir compte des majuscules (« Mme Jeanne Dupont » puis « Jeanne DUPONT »).
function propagerNoms(texte, candidats, ajouter) {
  const noms = new Set();
  for (const c of candidats) {
    if (c.type !== 'PERSONNE') continue;
    const n = texte.slice(c.start, c.end);
    if (n.split(/[ \u00A0\u202F]+/).length >= 2) noms.add(n.toLowerCase());
  }
  for (const n of noms) {
    const motif = n.split(/[ \u00A0\u202F]+/).map(echapper).join(`${ESP}+`);
    for (const m of texte.matchAll(new RegExp(`(?<![\\p{L}\\p{N}\\-])${motif}(?![\\p{L}\\p{N}\\-])`, 'giu'))) {
      ajouter(m.index, m.index + m[0].length, 'PERSONNE', P.PROPAGATION);
    }
  }
}

// --- Numéros de dossier, seulement après un indice explicite -----------------------------

const INDICES_DOSSIER = `(?:${alt(['référence', 'réf.', 'réf', 'ref.', 'n/réf.', 'v/réf.', 'dossier', 'affaire', 'numéro de rôle'])}|N/Réf\\.|V/Réf\\.|R\\.G\\.|RG)`;
const RE_DOSSIER = new RegExp(
  `(?<!\\p{L})${INDICES_DOSSIER}(?!\\p{L})(?:${ESP}*(?:n°|N°|no|No|numéro|:))*${ESP}*([A-Z0-9](?:[A-Z0-9/_\\-]|\\.(?=[A-Z0-9]))*)(?![\\p{L}\\p{N}])`,
  'gdu',
);
const FORME_DATE = /^\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}$/;

function dossiers(texte, ajouter) {
  for (const m of texte.matchAll(RE_DOSSIER)) {
    const ref = m[1];
    if (ref.length < 3 || !/\d/.test(ref) || FORME_DATE.test(ref)) continue;
    const [start, end] = m.indices[1];
    ajouter(start, end, 'NUMERO_DOSSIER', P.DOSSIER);
  }
}

// --- Raisons sociales accolées à une forme juridique ------------------------------------

const FORMES = ['SASU', 'SAS', 'SARL', 'SA', 'EURL', 'SELARL', 'SELAS', 'SELAFA', 'SELURL', 'SCP', 'SCI', 'SNC', 'SCOP', 'SCA', 'SCS', 'GIE', 'SEM'];
// Mot de la raison sociale : initiale majuscule (« Atelier », « L'ÉTANG ») ou esperluette.
const MOT_ORG = "(?:\\p{Lu}[\\p{L}'’\\-]*|&)";
const FORME = `(?:${FORMES.join('|')})`;
// Un article seul devant la forme (« les SARL ») n'est pas un nom.
const NOM_ORG = `(?!(?:Le|La|Les|Un|Une|Des)${ESP}+${FORME}(?!\\p{L}))(?!(?:Pour|Par|Chez|Entre|Avec|Selon|Contre|Et|De|Du|Des|À|Au|Aux|En)(?!\\p{L}))${MOT_ORG}(?:${ESP}+(?:(?:de|des|du|la|le|les|et)${ESP}+)?${MOT_ORG}){0,5}`;
// Forme juridique avant (« SARL Atelier Dupont ») ou après (« Atelier Dupont SARL ») le nom ; « la société » reste hors masque.
const RE_ORGANISATION = new RegExp(`(?<![\\p{L}\\p{N}])(?:${FORME}${ESP}+${NOM_ORG}|${NOM_ORG}${ESP}+${FORME})(?![\\p{L}\\p{N}])`, 'gu');

function organisations(texte, ajouter) {
  for (const m of texte.matchAll(RE_ORGANISATION)) ajouter(m.index, m.index + m[0].length, 'ORGANISATION', P.ORGANISATION);
}

// --- Détecteur ----------------------------------------------------------------------

export function detecter(texte) {
  const candidats = [];
  const ajouter = (start, end, type, priorite) => candidats.push({ start, end, type, priorite });
  for (const regle of [ibans, tvas, nirs, telephonesInternationaux, emails, identifiantsNumeriques, adresses, dossiers, organisations, personnes]) {
    regle(texte, ajouter);
  }
  propagerNoms(texte, candidats, ajouter);
  // Chevauchement : la règle prioritaire l'emporte, puis la correspondance la plus longue.
  candidats.sort((a, b) => a.priorite - b.priorite || b.end - b.start - (a.end - a.start) || a.start - b.start);
  const retenus = [];
  for (const c of candidats) {
    if (!retenus.some((r) => c.start < r.end && r.start < c.end)) retenus.push(c);
  }
  return retenus.sort((a, b) => a.start - b.start).map(({ start, end, type }) => ({ start, end, type }));
}

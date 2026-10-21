// Briques communes du générateur du golden set : aléa à graine fixe, données
// 100 % fictives, identifiants aux clés de contrôle valides, texte étiqueté
// et vérifications. Aucune dépendance : bibliothèque standard de Node uniquement.

// --- Aléa à graine fixe --------------------------------------------------------

// Empreinte FNV-1a 32 bits d'un texte : sert à dériver une graine par document,
// pour qu'ajouter un document ne change pas les autres.
export function graine(texte) {
  let h = 0x811c9dc5;
  for (const octet of new TextEncoder().encode(texte)) {
    h ^= octet;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Générateur mulberry32 : même graine, même suite de nombres, sur toute machine.
export class Alea {
  constructor(graineNum) {
    this.etat = graineNum >>> 0;
  }
  suivant() {
    this.etat = (this.etat + 0x6d2b79f5) >>> 0;
    let t = this.etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  entier(min, max) {
    return min + Math.floor(this.suivant() * (max - min + 1));
  }
  choix(liste) {
    return liste[this.entier(0, liste.length - 1)];
  }
  chance(p) {
    return this.suivant() < p;
  }
  chiffres(n) {
    let s = '';
    for (let k = 0; k < n; k++) s += this.entier(0, 9);
    return s;
  }
}

// --- Texte étiqueté ------------------------------------------------------------

// Un modèle de document s'écrit comme un gabarit : f`Madame ${S('PERSONNE', nom)}`.
// Chaque valeur étiquetée enregistre sa position exacte au moment où elle est
// insérée : les étiquettes sont connues dès la génération, sans annotation.
const ETIQUETTE = Symbol('etiquette');

export class Fragment {
  constructor() {
    this.text = '';
    this.spans = [];
    this.non_masques = [];
    this.neutres = [];
  }
}

// Donnée à masquer.
export const S = (type, text) => ({ [ETIQUETTE]: 'spans', type, text });
// Donnée à NE PAS masquer (sert à mesurer les faux positifs) : un masque dessus est une erreur.
export const N = (type, text) => ({ [ETIQUETTE]: 'non_masques', type, text });
// Élément neutre : un masque dessus n'est ni une réussite ni une erreur (voir seuils.md).
export const neutre = (type, text) => ({ [ETIQUETTE]: 'neutres', type, text });
// Institution publique : juridiction, organisme, administration, collectivité, ordre professionnel.
// L'étiquette couvre la désignation seule, sans la ville (« tribunal judiciaire », pas « … de Rennes »).
export const I = (text) => neutre('INSTITUTION', text);

function ajouter(sortie, valeur) {
  if (valeur === null || valeur === undefined || valeur === false) return;
  if (Array.isArray(valeur)) {
    for (const v of valeur) ajouter(sortie, v);
    return;
  }
  if (valeur instanceof Fragment) {
    const decalage = sortie.text.length;
    sortie.text += valeur.text;
    for (const cle of ['spans', 'non_masques', 'neutres']) {
      for (const e of valeur[cle]) {
        sortie[cle].push({ ...e, start: e.start + decalage, end: e.end + decalage });
      }
    }
    return;
  }
  if (valeur[ETIQUETTE]) {
    const start = sortie.text.length;
    sortie.text += valeur.text;
    sortie[valeur[ETIQUETTE]].push({ start, end: sortie.text.length, type: valeur.type, text: valeur.text });
    return;
  }
  sortie.text += String(valeur);
}

export function f(morceaux, ...valeurs) {
  const sortie = new Fragment();
  morceaux.forEach((morceau, k) => {
    sortie.text += morceau;
    if (k < valeurs.length) ajouter(sortie, valeurs[k]);
  });
  return sortie;
}

// --- Données fictives de base --------------------------------------------------

// Prénoms : Rose et Pierre sont aussi des mots courants (piège).
export const PRENOMS_F = [
  'Rose', 'Claire', 'Élodie', 'Nathalie', 'Camille', 'Sophie', 'Aurélie', 'Inès', 'Juliette',
  'Margaux', 'Hélène', 'Céline', 'Laure', 'Agathe', 'Manon', 'Lucie', 'Yasmine', 'Chloé',
];
export const PRENOMS_M = [
  'Pierre', 'Julien', 'Thomas', 'Mathieu', 'Nicolas', 'Karim', 'Antoine', 'Olivier', 'Bastien',
  'Hugo', 'Lucas', 'Rémi', 'Damien', 'Yann', 'Fabrice', 'Mehdi', 'Guillaume',
];
// Noms de famille : Florence, Paris et Valence sont aussi des noms de ville (piège).
export const NOMS = [
  'Florence', 'Paris', 'Valence', 'Morel', 'Lefebvre', 'Rousseau', 'Bertin', 'Chevalier',
  'Marchand', 'Perrot', 'Lemaire', 'Guérin', 'Collin', 'Benali', 'Nguyen', 'Da Silva', 'Le Goff',
  'Ferrand', 'Masson', 'Gauthier', 'Roche', 'Delmas', 'Carpentier', 'Haddad', 'Meunier',
  'Lacroix', 'Tessier', 'Vidal', 'Royer', 'Barbier',
];
// Combinaisons écartées parce qu'elles évoquent une personne connue.
const COMBINAISONS_EXCLUES = new Set(['Pierre Richard', 'Pierre Fabre', 'Pierre Garnier', 'Thomas Jolly']);

// Villes réelles (code postal du centre-ville) : seules les adresses sont inventées.
export const VILLES = [
  ['Lyon', '69003', '69'], ['Rennes', '35000', '35'], ['Nantes', '44000', '44'],
  ['Bordeaux', '33000', '33'], ['Lille', '59000', '59'], ['Toulouse', '31000', '31'],
  ['Montpellier', '34000', '34'], ['Strasbourg', '67000', '67'], ['Grenoble', '38000', '38'],
  ['Dijon', '21000', '21'], ['Angers', '49000', '49'], ['Le Mans', '72000', '72'],
  ['Tours', '37000', '37'], ['Limoges', '87000', '87'], ['Rouen', '76000', '76'],
  ['Reims', '51100', '51'], ['Metz', '57000', '57'], ['Valence', '26000', '26'],
  ['Aix-en-Provence', '13100', '13'], ['Avignon', '84000', '84'], ['Brest', '29200', '29'],
  ['Caen', '14000', '14'], ['Orléans', '45000', '45'], ['Pau', '64000', '64'],
  ['Annecy', '74000', '74'], ['Saint-Étienne', '42000', '42'], ['Clermont-Ferrand', '63000', '63'],
  ['Poitiers', '86000', '86'], ['Besançon', '25000', '25'], ['Perpignan', '66000', '66'],
  ['Nîmes', '30000', '30'], ['La Rochelle', '17000', '17'], ['Chambéry', '73000', '73'],
  ['Paris', '75011', '75'], ['Toulon', '83000', '83'], ['Laval', '53000', '53'],
  ['Niort', '79000', '79'], ['Quimper', '29000', '29'], ['Vannes', '56000', '56'],
  ['Nancy', '54000', '54'],
].map(([nom, cp, dep]) => ({ nom, cp, dep }));

// Naissance à l'étranger : département 99 + code pays INSEE dans le NIR.
export const VILLES_ETRANGER = [
  { nom: 'Florence', pays: 'Italie', codePays: '127' },
  { nom: 'Porto', pays: 'Portugal', codePays: '139' },
  { nom: 'Casablanca', pays: 'Maroc', codePays: '350' },
];

// Voies inventées, sans nom de personne. Certaines contiennent un piège (Pierre, Roses).
const VOIES = [
  'rue des Tilleuls', 'allée des Glycines', 'chemin du Moulin', 'boulevard de la Liberté',
  'impasse des Lilas', 'rue de la Gare', 'place du Marché', 'rue de la Pierre Levée',
  'chemin des Vignes', 'rue de la Fontaine', 'rue des Écoles', 'route de la Forêt', 'rue Basse',
  'rue du Château', 'avenue des Peupliers', 'allée des Roses', 'cours des Arts', 'rue du Four',
  'chemin des Crêtes', 'rue des Remparts',
];
const COMPLEMENTS = ['Résidence Les Iris, bâtiment B', 'Bâtiment C, 2e étage', 'Le Clos des Cèdres', 'Immeuble Le Belvédère'];

// Domaines de messagerie inventés, extensions variées ; non vérifiés dans le DNS.
const DOMAINES_PERSO = [
  'messagerie-libre.fr', 'boitepostale.net', 'courrier-perso.eu', 'mail-maison.org',
  'postebox.io', 'monmel.fr', 'lettre-ouverte.info', 'courriel.bzh',
];
const EXTENSIONS_ORG = ['fr', 'com', 'eu', 'net', 'org', 'pro', 'bzh', 'immo', 'io'];

export const maj = (s) => s.toUpperCase();
export const sansAccents = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
export const identifiant = (s) => sansAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// --- Dates et montants ---------------------------------------------------------

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function date(alea, anDebut, anFin) {
  const an = alea.entier(anDebut, anFin);
  const mois = alea.entier(1, 12);
  const jours = new Date(Date.UTC(an, mois, 0)).getUTCDate();
  return { an, mois, jour: alea.entier(1, jours) };
}

export function plusJours(d, n) {
  const x = new Date(Date.UTC(d.an, d.mois - 1, d.jour + n));
  return { an: x.getUTCFullYear(), mois: x.getUTCMonth() + 1, jour: x.getUTCDate() };
}

const deux = (n) => String(n).padStart(2, '0');

export function fmtDate(d, style = 'long') {
  if (style === 'num') return `${deux(d.jour)}/${deux(d.mois)}/${d.an}`;
  if (style === 'point') return `${deux(d.jour)}.${deux(d.mois)}.${d.an}`;
  return `${d.jour === 1 ? '1er' : d.jour} ${MOIS[d.mois - 1]} ${d.an}`;
}

// Montant à la française : « 12 450,00 € ». Avec insecable, les espaces sont des
// espaces insécables (U+00A0), comme dans un document saisi sous traitement de texte.
export function montant(valeur, { centimes = true, unite = '€', insecable = false } = {}) {
  const esp = insecable ? ' ' : ' ';
  const [ent, dec] = valeur.toFixed(2).split('.');
  const groupes = ent.replace(/\B(?=(\d{3})+(?!\d))/g, esp);
  return `${groupes}${centimes ? ',' + dec : ''}${esp}${unite}`;
}

// --- Clés de contrôle ----------------------------------------------------------

export function cleLuhn(chiffresSansCle) {
  let somme = 0;
  const n = chiffresSansCle.length;
  for (let k = 0; k < n; k++) {
    let c = Number(chiffresSansCle[n - 1 - k]);
    if (k % 2 === 0) {
      c *= 2;
      if (c > 9) c -= 9;
    }
    somme += c;
  }
  return String((10 - (somme % 10)) % 10);
}

export function luhnValide(chiffres) {
  return /^\d+$/.test(chiffres) && cleLuhn(chiffres.slice(0, -1)) === chiffres.slice(-1);
}

const mod97 = (chiffres) => Number(BigInt(chiffres) % 97n);

// IBAN : lettres converties (A=10 … Z=35), 4 premiers caractères déplacés en fin.
function ibanEnChiffres(iban) {
  const r = iban.slice(4) + iban.slice(0, 4);
  return [...r].map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join('');
}

export const cleTva = (siren) => deux((12 + 3 * (Number(siren) % 97)) % 97);
export const cleNir = (treizeChiffres) => deux(97 - mod97(treizeChiffres));
const cleRib = (banque, guichet, compte) => deux(97 - Number((89n * BigInt(banque) + 15n * BigInt(guichet) + 3n * BigInt(compte)) % 97n));

// --- Identifiants fictifs ------------------------------------------------------

export function siren(alea) {
  for (;;) {
    const base = String(alea.entier(1, 9)) + alea.chiffres(7);
    const s = base + cleLuhn(base);
    if (s !== '356000000') return s; // La Poste : règle de contrôle particulière
  }
}

export function siret(alea, sirenNum) {
  const base = sirenNum + '000' + String(alea.entier(1, 9));
  return base + cleLuhn(base);
}

export function iban(alea) {
  const banque = String(alea.entier(10, 99)) + alea.chiffres(3);
  const guichet = alea.chiffres(5);
  const compte = alea.chiffres(11);
  const bban = banque + guichet + compte + cleRib(banque, guichet, compte);
  const cle = deux(98 - mod97(ibanEnChiffres('FR00' + bban)));
  return 'FR' + cle + bban;
}

export const fmtIban = (i, groupe = true) => (groupe ? i.match(/.{1,4}/g).join(' ') : i);

export function carte(alea) {
  const base = alea.chance(0.5) ? '4' + alea.chiffres(14) : '5' + alea.entier(1, 5) + alea.chiffres(13);
  return base + cleLuhn(base);
}

export function fmtCarte(c, style) {
  if (style === 'colle') return c;
  return c.match(/.{4}/g).join(style === 'tiret' ? '-' : ' ');
}

export function nir(alea, p) {
  // Code commune tiré au hasard (non vérifié contre le code officiel géographique).
  const lieu = p.naissance.etranger ? '99' + p.naissance.codePays : p.naissance.dep + String(alea.entier(1, 990)).padStart(3, '0');
  const treize = (p.sexe === 'F' ? '2' : '1') + deux(p.dateNaissance.an % 100) + deux(p.dateNaissance.mois) + lieu + String(alea.entier(1, 999)).padStart(3, '0');
  return treize + cleNir(treize);
}

export function fmtNir(n, style) {
  if (style === 'colle') return n;
  return [n[0], n.slice(1, 3), n.slice(3, 5), n.slice(5, 7), n.slice(7, 10), n.slice(10, 13), n.slice(13)].join(' ');
}

export function fmtSiren(s, groupe) {
  return groupe ? s.match(/.{3}/g).join(' ') : s;
}

export function fmtSiret(s, groupe) {
  return groupe ? fmtSiren(s.slice(0, 9), true) + ' ' + s.slice(9) : s;
}

export function fmtTva(siren, groupe) {
  const t = 'FR' + cleTva(siren) + siren;
  return groupe ? `FR ${t.slice(2, 4)} ${fmtSiren(siren, true)}` : t;
}

// Téléphones : plages réservées aux œuvres de fiction par l'Arcep (plan national
// de numérotation, version du 1er août 2019, § 2.5.12). Voir golden/README.md.
export const PLAGES_FICTION = ['019900', '026191', '035301', '046571', '053649', '063998'];

const ZONES = {
  '01': ['75', '77', '78', '91', '92', '93', '94', '95'],
  '02': ['14', '18', '22', '27', '28', '29', '35', '36', '37', '41', '44', '45', '49', '50', '53', '56', '61', '72', '76', '85'],
  '03': ['02', '08', '10', '21', '25', '39', '51', '52', '54', '55', '57', '58', '59', '60', '62', '67', '68', '70', '71', '80', '88', '89', '90'],
  '04': ['01', '03', '04', '05', '06', '07', '13', '15', '26', '30', '34', '38', '42', '43', '48', '63', '66', '69', '73', '74', '83', '84'],
  '05': ['09', '11', '12', '16', '17', '19', '23', '24', '31', '32', '33', '40', '46', '47', '64', '65', '79', '81', '82', '86', '87'],
};

export function telephone(alea, { mobile = false, dep = null } = {}) {
  let zone = '06';
  if (!mobile) zone = Object.keys(ZONES).find((z) => ZONES[z].includes(dep)) ?? alea.choix(['01', '02', '03', '04', '05']);
  return PLAGES_FICTION.find((p) => p.startsWith(zone)) + alea.chiffres(4);
}

const paires = (s) => s.match(/.{2}/g);

export function fmtTel(alea, t) {
  const style = alea.entier(0, 5);
  if (style === 0) return paires(t).join(' ');
  if (style === 1) return paires(t).join('.');
  if (style === 2) return t;
  if (style === 3) return `+33 ${t[1]} ${paires(t.slice(2)).join(' ')}`;
  if (style === 4) return `+33 (0)${t[1]} ${paires(t.slice(2)).join(' ')}`;
  return paires(t).join('-');
}

// --- Personnes, adresses, organisations ----------------------------------------

export function adresse(alea, ville = alea.choix(VILLES)) {
  const num = String(alea.entier(1, 148)) + (alea.chance(0.12) ? alea.choix([' bis', ' ter']) : '');
  const complement = alea.chance(0.2) ? alea.choix(COMPLEMENTS) : null;
  return { num, voie: alea.choix(VOIES), complement, cp: ville.cp, ville: ville.nom, dep: ville.dep };
}

// 'ligne' : « 12 rue des Tilleuls, 69003 Lyon » ; 'lignes' : sur deux lignes (ou trois avec complément).
export function fmtAdresse(a, style, villeMaj = false) {
  const ville = villeMaj ? maj(a.ville) : a.ville;
  if (style === 'lignes') return `${a.complement ? a.complement + '\n' : ''}${a.num} ${a.voie}\n${a.cp} ${ville}`;
  return `${a.complement ? a.complement + ', ' : ''}${a.num} ${a.voie}, ${a.cp} ${ville}`;
}

// Pièges imposés à la personne principale, à tour de rôle selon le rang du document.
export const piege = (rang) => [{ prenom: 'Rose' }, { prenom: 'Pierre' }, { nom: 'Florence' }, {}][rang % 4];

export function personne(alea, { prenom, nom, sexe, anNaissance = [1962, 2003] } = {}) {
  for (;;) {
    const s = sexe ?? (prenom ? (PRENOMS_F.includes(prenom) ? 'F' : 'M') : alea.choix(['F', 'M']));
    const p = {
      sexe: s,
      prenom: prenom ?? alea.choix(s === 'F' ? PRENOMS_F : PRENOMS_M),
      nom: nom ?? alea.choix(NOMS),
    };
    if (COMBINAISONS_EXCLUES.has(`${p.prenom} ${p.nom}`)) continue;
    p.dateNaissance = date(alea, anNaissance[0], anNaissance[1]);
    p.naissance = alea.chance(0.15) ? { ...alea.choix(VILLES_ETRANGER), etranger: true } : { ...alea.choix(VILLES), etranger: false };
    p.adresse = adresse(alea);
    p.tel = telephone(alea, { mobile: true });
    p.nir = nir(alea, p);
    const pn = identifiant(p.prenom).replace(/-/g, '');
    const nn = identifiant(p.nom).replace(/-/g, '');
    p.email = alea.choix([`${pn}.${nn}`, `${pn[0]}${nn}`, `${pn}.${nn}${alea.entier(10, 99)}`, `${nn}.${pn}`]) + '@' + alea.choix(DOMAINES_PERSO);
    return p;
  }
}

// Styles d'écriture d'un nom ; la civilité reste hors de l'étiquette.
export function nom(p, style = 'pn') {
  switch (style) {
    case 'pN': return `${p.prenom} ${maj(p.nom)}`;
    case 'Np': return `${maj(p.nom)} ${p.prenom}`;
    case 'PN': return maj(`${p.prenom} ${p.nom}`);
    case 'N': return maj(p.nom);
    case 'n': return p.nom;
    case 'iN': return `${p.prenom[0]}. ${maj(p.nom)}`;
    default: return `${p.prenom} ${p.nom}`;
  }
}

export const civ = (p) => (p.sexe === 'F' ? 'Mme' : 'M.');
export const civLong = (p) => (p.sexe === 'F' ? 'Madame' : 'Monsieur');
export const accord = (p, fem, masc) => (p.sexe === 'F' ? fem : masc);

// Titre du dirigeant selon la forme de la société : président d'une SAS ou d'une SA, gérant d'une SARL.
export const fonctionDirigeant = (o, p) => (['SAS', 'SA', 'SELAS'].includes(o.forme) ? accord(p, 'présidente', 'président') : accord(p, 'gérante', 'gérant'));

// E-mail professionnel d'une personne au domaine de son organisation.
export function emailPro(alea, p, o) {
  const pn = identifiant(p.prenom).replace(/-/g, '');
  const nn = identifiant(p.nom).replace(/-/g, '');
  return alea.choix([`${pn}.${nn}`, `${pn[0]}.${nn}`, `${pn[0]}${nn}`]) + '@' + o.domaine;
}

const NOMS_ORG_FAMILLE = [
  (n) => `${n} Bâtiment`, (n) => `Transports ${n}`, (n) => `${n} & Fils`, (n) => `Établissements ${n}`,
  (n) => `Boulangerie ${n}`, (n) => `${n} Conseil`, (n) => `Garage ${n}`, (n) => `Menuiserie ${n}`,
];
const NOMS_ORG_GENERIQUES = [
  'Atelier des Trois Chênes', 'Les Jardins du Plateau', 'Imprimerie du Val', 'Optique Horizon',
  'Domaine des Pierres Blanches', 'La Rose des Prés', "Bureau d'études Calade", 'Logistique Quatre Saisons',
  'Studio Ardoise', "Biscuiterie de l'Étang",
];

// Organisation fictive. nomFamille : l'entreprise porte un nom de famille (piège).
// modele : fonction (nom de famille) => nom commercial, pour les cabinets.
export function organisation(alea, { nomFamille = null, modele = null, formes = ['SAS', 'SARL', 'EURL', 'SA'] } = {}) {
  let nomCommercial;
  if (modele) nomCommercial = modele(nomFamille ?? alea.choix(NOMS));
  else if (nomFamille) nomCommercial = alea.choix(NOMS_ORG_FAMILLE)(nomFamille);
  else nomCommercial = alea.choix(NOMS_ORG_GENERIQUES);
  const forme = alea.choix(formes);
  const sirenNum = siren(alea);
  const o = {
    nom: nomCommercial,
    forme,
    raison: alea.chance(0.5) ? `${nomCommercial} ${forme}` : `${forme} ${nomCommercial}`,
    siren: sirenNum,
    siret: siret(alea, sirenNum),
    adresse: adresse(alea),
    capital: alea.choix([1000, 5000, 8000, 10000, 15000, 37000, 50000, 100000]),
  };
  o.raisonMaj = maj(o.raison);
  o.domaine = identifiant(nomCommercial) + '.' + alea.choix(EXTENSIONS_ORG);
  o.tel = telephone(alea, { dep: o.adresse.dep });
  o.email = alea.choix(['contact', 'accueil', 'secretariat', 'compta']) + '@' + o.domaine;
  return o;
}

export const modelesCabinetAvocats = [(n) => `${n} Avocats`, (n) => `Cabinet ${n} & Associés`, (n) => `${n} Avocats Associés`];
export const modelesCabinetComptable = [(n) => `${n} Expertise`, (n) => `Cabinet ${n} Audit & Conseil`, (n) => `${n} Expertise Comptable`];

export function numeroDossier(alea, sorte, p = null) {
  const an = alea.choix(['2025', '2026']);
  if (sorte === 'rg') return `${an.slice(2)}/${String(alea.entier(1, 9999)).padStart(5, '0')}`;
  if (sorte === 'cabinet') {
    const ini = p ? sansAccents(p.prenom[0] + p.nom[0]).toUpperCase() : 'XX';
    return alea.choix([`${ini}/${an}/${alea.chiffres(4)}`, `${an}-${alea.chiffres(4)}-${ini}`]);
  }
  return alea.choix([`EC-${an}-${alea.chiffres(4)}`, `DOS-${alea.chiffres(5)}`, `${ini3(alea)}${alea.chiffres(4)}`]);
}
const ini3 = (alea) => String.fromCharCode(65 + alea.entier(0, 25), 65 + alea.entier(0, 25), 65 + alea.entier(0, 25));

// --- Raccourcis pour les modèles -----------------------------------------------

export const per = (p, style) => S('PERSONNE', nom(p, style));
export const org = (o, champ = 'raison') => S('ORGANISATION', o[champ]);
export const adr = (a, style = 'ligne', villeMaj = false) => S('ADRESSE', fmtAdresse(a, style, villeMaj));
export const dt = (d, style = 'long') => N('DATE', fmtDate(d, style));
export const mt = (v, opts) => N('MONTANT', montant(v, opts));
export const lieu = (v) => neutre('LIEU_ISOLE', v);
export const tel = (alea, t) => S('TELEPHONE', fmtTel(alea, t));
export const mail = (e) => S('EMAIL', e);
export const dossier = (n) => S('NUMERO_DOSSIER', n);

// Lieu de naissance : « Rennes » ou « Florence (Italie) » ; seule la ville est étiquetée.
export function lieuNaissance(p) {
  return p.naissance.etranger ? f`${lieu(p.naissance.nom)} (${p.naissance.pays})` : f`${lieu(p.naissance.nom)}`;
}

// Montant arrondi au centime, sans erreur d'arrondi flottant.
export const arrondi = (v) => Math.round(v * 100) / 100;

// --- Vérifications -------------------------------------------------------------

const chiffresSeuls = (s) => s.replace(/[\s.\-]/g, '');

// Renvoie null si l'étiquette est valide, sinon la raison de l'échec.
export function verifierIdentifiant(type, texte) {
  const c = chiffresSeuls(texte);
  switch (type) {
    case 'IBAN': {
      if (!/^FR\d{25}$/.test(c)) return 'format IBAN FR';
      if (mod97(ibanEnChiffres(c)) !== 1) return 'clé IBAN (mod 97)';
      const [banque, guichet, compte, rib] = [c.slice(4, 9), c.slice(9, 14), c.slice(14, 25), c.slice(25)];
      if (cleRib(banque, guichet, compte) !== rib) return 'clé RIB';
      return null;
    }
    case 'SIREN': return /^\d{9}$/.test(c) && luhnValide(c) ? null : 'clé SIREN (Luhn)';
    case 'SIRET': return /^\d{14}$/.test(c) && luhnValide(c) && luhnValide(c.slice(0, 9)) ? null : 'clé SIRET (Luhn)';
    case 'TVA_INTRA': {
      const m = /^FR(\d{2})(\d{9})$/.exec(c);
      if (!m) return 'format TVA';
      if (!luhnValide(m[2])) return 'SIREN de la TVA';
      return cleTva(m[2]) === m[1] ? null : 'clé TVA';
    }
    case 'NIR': {
      if (!/^[12]\d{14}$/.test(c)) return 'format NIR (Corse 2A/2B exclue)';
      return cleNir(c.slice(0, 13)) === c.slice(13) ? null : 'clé NIR (97)';
    }
    case 'CARTE': return /^(4\d{15}|5[1-5]\d{14})$/.test(c) && luhnValide(c) ? null : 'clé carte (Luhn)';
    case 'TELEPHONE': {
      const t = c.replace(/^\+33\(0\)/, '0').replace(/^\+33/, '0');
      if (!/^0[1-9]\d{8}$/.test(t)) return 'format téléphone';
      return PLAGES_FICTION.includes(t.slice(0, 6)) ? null : 'hors plage fiction';
    }
    case 'EMAIL': return /^[a-z0-9._-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(texte) ? null : 'format e-mail';
    default: return null;
  }
}

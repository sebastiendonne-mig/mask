// Logique de la page de la préversion (étape 4b), sans DOM : testée par tests/app.test.mjs.
//
// - fusionner : masques des règles et du modèle → un seul remplacement par zone. Même règle que
//   l'évaluateur (scripts/evaluer.mjs, fusionner) : des masques qui se chevauchent (au moins un
//   caractère commun) n'en font qu'un ; des masques seulement adjacents restent distincts.
//   Catégorie de la zone fusionnée : celle d'un masque des règles s'il y en a un (le plus long),
//   sinon celle du masque du modèle le plus long.
// - entites : regroupe les zones d'une même entité (même catégorie, même texte normalisé) ; une
//   même entité garde le même pseudonyme, numéroté par catégorie dans l'ordre d'apparition.
// - remplacer : texte pseudonymisé, avec les seules entités gardées.
// - avertissements : navigateur non vérifié, page non isolée, mobile.

export const CATEGORIES = {
  PERSONNE: 'Personne',
  ORGANISATION: 'Organisation',
  LIEU: 'Lieu',
  ADRESSE: 'Adresse',
  IBAN: 'IBAN',
  NIR: 'N° de sécurité sociale',
  SIREN: 'SIREN',
  SIRET: 'SIRET',
  TVA_INTRA: 'TVA intracommunautaire',
  CARTE: 'Carte bancaire',
  EMAIL: 'Adresse e-mail',
  TELEPHONE: 'Téléphone',
  NUMERO_DOSSIER: 'N° de dossier',
  DIVERS: 'Divers',
};

// Formats fixes : comparés sans espaces, points ni tirets (« FR76 1234… » = « FR761234… »).
const FORMATS_FIXES = new Set(['IBAN', 'NIR', 'SIREN', 'SIRET', 'TVA_INTRA', 'CARTE', 'TELEPHONE']);

// Détecteurs à l'origine d'une zone (colonne « Trouvé par »).
export const TROUVE_PAR = { regles: 'règles', modele: 'modèle', deux: 'les deux' };
const trouvePar = (membres) => (membres.every((m) => m.regle) ? TROUVE_PAR.regles : membres.some((m) => m.regle) ? TROUVE_PAR.deux : TROUVE_PAR.modele);

// regles, modele : [{ start, end, type }]. Renvoie [{ start, end, type, trouvePar }] triés, sans chevauchement.
export function fusionner(regles = [], modele = []) {
  const tous = [...regles.map((m) => ({ ...m, regle: true })), ...modele.map((m) => ({ ...m, regle: false }))].sort((a, b) => a.start - b.start || a.end - b.end);
  const groupes = [];
  for (const m of tous) {
    const dernier = groupes.at(-1);
    if (dernier && m.start < dernier.end) {
      dernier.end = Math.max(dernier.end, m.end);
      dernier.membres.push(m);
    } else groupes.push({ start: m.start, end: m.end, membres: [m] });
  }
  return groupes.map(({ start, end, membres }) => {
    const candidats = membres.some((m) => m.regle) ? membres.filter((m) => m.regle) : membres;
    const choisi = candidats.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
    return { start, end, type: choisi.type, trouvePar: trouvePar(membres) };
  });
}

export function normaliser(type, texte) {
  if (FORMATS_FIXES.has(type)) return texte.replace(/[\s.\-]/g, '').toUpperCase();
  return texte.normalize('NFC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr');
}

// zones : sortie de fusionner. Renvoie [{ cle, type, pseudonyme, formes, occurrences, trouvePar }]
// dans l'ordre de première apparition ; formes : textes d'origine distincts ; occurrences :
// [{ start, end }] ; trouvePar : « règles », « modèle » ou « les deux » sur l'ensemble des occurrences.
export function entites(texte, zones) {
  const parCle = new Map();
  const compteurs = {};
  for (const z of zones) {
    const original = texte.slice(z.start, z.end);
    const cle = `${z.type}\u0000${normaliser(z.type, original)}`;
    let e = parCle.get(cle);
    if (!e) {
      compteurs[z.type] = (compteurs[z.type] ?? 0) + 1;
      e = { cle, type: z.type, pseudonyme: `[${z.type}_${compteurs[z.type]}]`, formes: [], occurrences: [], trouvePar: z.trouvePar };
      parCle.set(cle, e);
    }
    if (!e.formes.includes(original)) e.formes.push(original);
    e.occurrences.push({ start: z.start, end: z.end });
    if (z.trouvePar !== e.trouvePar) e.trouvePar = TROUVE_PAR.deux;
  }
  return [...parCle.values()];
}

// gardees : Set des clés des entités à remplacer. Les sauts de ligne d'une zone remplacée sont
// conservés après son pseudonyme (mise en page) ; la détection n'est pas modifiée.
export function remplacer(texte, liste, gardees) {
  const occ = liste.filter((e) => gardees.has(e.cle)).flatMap((e) => e.occurrences.map((o) => ({ ...o, pseudonyme: e.pseudonyme }))).sort((a, b) => a.start - b.start);
  let sortie = '';
  let i = 0;
  for (const o of occ) {
    sortie += texte.slice(i, o.start) + o.pseudonyme + (texte.slice(o.start, o.end).match(/\r?\n/g) ?? []).join('');
    i = o.end;
  }
  return sortie + texte.slice(i);
}

// Téléphone ou tablette : le modèle n'y est pas chargé automatiquement. Tablettes Android
// (userAgentData.mobile faux, plateforme Android) et iPad (Safari s'annonce comme un Mac, mais tactile).
export function estMobile({ userAgent = '', userAgentData = null, maxTouchPoints = 0 } = {}) {
  if (userAgentData) return Boolean(userAgentData.mobile) || userAgentData.platform === 'Android';
  return /Mobi|Android|iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

// nav : { userAgent, userAgentData, maxTouchPoints } (navigator) ; isole : crossOriginIsolated.
// Renvoie les avertissements à afficher (aucun ne bloque la page).
export function avertissements(nav = {}, isole = false) {
  const { userAgent = '', userAgentData = null } = nav;
  const marques = userAgentData?.brands?.map((b) => b.brand) ?? null;
  const mobile = estMobile(nav);
  const chromeOuEdge = marques
    ? marques.includes('Google Chrome') || marques.includes('Microsoft Edge')
    : /\bEdg\//.test(userAgent) || (/\bChrome\/\d/.test(userAgent) && !/\b(OPR|SamsungBrowser|YaBrowser|Vivaldi|Brave)\b/.test(userAgent));
  const sortie = [];
  if (!chromeOuEdge || mobile) sortie.push('Ce navigateur n\'a pas encore été vérifié : mask a été testé sur Chrome, sur ordinateur. La page reste utilisable, mais le modèle peut être plus lent ou ne pas se charger.');
  if (!isole) sortie.push('Cette page n\'est pas isolée (crossOriginIsolated est faux) : le modèle ne pourra utiliser qu\'un seul fil de calcul et sera plus lent.');
  if (mobile) sortie.push('Sur téléphone ou tablette : le modèle pèse 220 Mo, téléchargés une seule fois. Préférez une connexion Wi-Fi.');
  return sortie;
}

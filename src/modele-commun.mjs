// Détecteur par modèle, partie commune à Node (src/modele.mjs) et au navigateur
// (src/modele-navigateur.mjs) : camembert-ner (Xenova, ONNX quantifié q8) avec Transformers.js.
// Aucun import : la bibliothèque et les fichiers du modèle sont fournis par le chargeur de
// chaque environnement, qui vérifie les empreintes avant tout usage.
//
// Interface commune aux détecteurs : detecter(texte) → [{ start, end, type }].
// Types : PER → PERSONNE, ORG → ORGANISATION, LOC → LIEU, MISC → DIVERS.
//
// Positions sans recalcul : le texte est découpé en mots (suites maximales de non-blancs),
// chaque mot est tokenisé seul, et les identifiants sont concaténés entre <s> et </s>.
// scripts/controle-tokenisation.mjs vérifie que cette suite égale la tokenisation du
// texte entier. Une copie de même longueur, où les caractères que le normaliseur
// supprime sont remplacés par une espace, sert à découper et tokeniser ; les positions
// restent celles du texte d'origine.
//
// Écart connu : le normaliseur « Precompiled » de la bibliothèque JS ignore la table
// precompiled_charsmap du tokenizer (suppression de caractères de contrôle, blancs → espace,
// NFKC), d'où un écart possible avec la tokenisation de l'entraînement.

export const DEPOT = 'Xenova/camembert-ner';
export const REVISION = '8e1988247e872ba0137062653b1e5033a31e14fc';

// Seuls fichiers nécessaires : configuration, tokenizer, modèle quantifié (dtype q8).
export const FICHIERS = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'];

export const nom = 'modele';
export const version = `0.2.0+${DEPOT}@${REVISION}+q8`;

export const TYPES = { PER: 'PERSONNE', ORG: 'ORGANISATION', LOC: 'LIEU', MISC: 'DIVERS' };

// 500 sous-mots par fenêtre, plus <s> et </s> : sous la limite de 512 positions du modèle.
export const MAX_SOUS_MOTS = 500;
export const CHEVAUCHEMENT = 128;

// --- Mots ------------------------------------------------------------------------

// Caractères que le normaliseur supprime (tokenizers.mjs, Precompiled.normalize) :
// remplacés par une espace pour que les mots et la tokenisation restent alignés.
const SUPPRIMES = /[\u0001-\u0008\u000B\u000E-\u001F\u007F\u008F\u009F]/g;
export const copieTokenisable = (texte) => texte.replace(SUPPRIMES, ' ');

export function decouperMots(texte) {
  return [...copieTokenisable(texte).matchAll(/\S+/gu)].map((m) => ({ start: m.index, end: m.index + m[0].length }));
}

// --- Fenêtres --------------------------------------------------------------------

// longueurs : nombre de sous-mots de chaque mot. Fenêtres [debut, fin) de mots entiers,
// d'au plus max sous-mots ; chacune reprend jusqu'à chevauchement sous-mots de la précédente.
export function decouperFenetres(longueurs, max = MAX_SOUS_MOTS, chevauchement = CHEVAUCHEMENT) {
  const fenetres = [];
  let debut = 0;
  while (debut < longueurs.length) {
    let fin = debut;
    let total = 0;
    while (fin < longueurs.length && total + longueurs[fin] <= max) total += longueurs[fin++];
    if (fin === debut) throw new Error(`modèle : un mot de ${longueurs[debut]} sous-mots dépasse la fenêtre (${max})`);
    fenetres.push({ debut, fin });
    if (fin === longueurs.length) break;
    let suivant = fin;
    let recul = 0;
    while (suivant - 1 > debut && recul + longueurs[suivant - 1] <= chevauchement) recul += longueurs[--suivant];
    debut = suivant;
  }
  return fenetres;
}

// Fenêtre retenue pour chaque mot : celle où il est le plus loin du bord (en sous-mots) ;
// à égalité, la première.
export function attribuerFenetres(longueurs, fenetres) {
  const choix = new Array(longueurs.length).fill(-1);
  const marge = new Array(longueurs.length).fill(-1);
  fenetres.forEach(({ debut, fin }, k) => {
    let total = 0;
    for (let i = debut; i < fin; i++) total += longueurs[i];
    let avant = 0;
    for (let i = debut; i < fin; i++) {
      const distance = Math.min(avant, total - avant - longueurs[i]);
      if (distance > marge[i]) {
        marge[i] = distance;
        choix[i] = k;
      }
      avant += longueurs[i];
    }
  });
  return choix;
}

// --- Étiquette d'un mot et masques ----------------------------------------------------

const SIGNIFIANT = /[\p{L}\p{N}]/u;
const ELISION = /^(?:c|d|j|l|m|n|s|t|qu|jusqu|lorsqu|puisqu)['’](?=\p{L})/iu;
const APOSTROPHE = /['’]/;

// Sous-mot dont le mot prend l'étiquette : le premier qui contient une lettre ou un chiffre,
// après le préfixe d'élision (« l’Hôtel » → ▁l ’ Hôtel → Hôtel). -1 si le mot n'a aucun sous-mot.
export function sousMotRepresentatif(pieces, mot) {
  if (!pieces.length) return -1;
  const debut = mot.search(SIGNIFIANT);
  if (debut >= 0 && ELISION.test(mot.slice(debut))) {
    const a = pieces.findIndex((p) => APOSTROPHE.test(p));
    if (a >= 0) {
      for (let i = a; i < pieces.length; i++) {
        const reste = i === a ? pieces[i].slice(pieces[i].search(APOSTROPHE) + 1) : pieces[i];
        if (SIGNIFIANT.test(reste)) return i;
      }
    }
  }
  const i = pieces.findIndex((p) => SIGNIFIANT.test(p));
  return i >= 0 ? i : 0;
}

// Partie masquable d'un mot : de la première lettre ou du premier chiffre (après le préfixe
// d'élision) à la dernière lettre ou au dernier chiffre ; le point d'une initiale (« J. ») est
// inclus. null si le mot n'a ni lettre ni chiffre.
export function coeurDuMot(texte, start, end) {
  const mot = texte.slice(start, end);
  const signifiants = [...mot.matchAll(/[\p{L}\p{N}]/gu)];
  if (!signifiants.length) return null;
  let i = signifiants[0].index;
  const elision = ELISION.exec(mot.slice(i));
  if (elision) i += elision[0].length;
  const dernier = signifiants.at(-1);
  let j = dernier.index + dernier[0].length;
  if (i === dernier.index && /\p{L}/u.test(dernier[0]) && mot[j] === '.') j++;
  return { start: start + i, end: start + j };
}

// Liste usuelle des civilités françaises. Abréviations comparées en respectant la casse
// (« me », « mes » ne sont pas des civilités), formes longues sans tenir compte de la casse.
const CIVILITES_ABREGEES = new Set(['M', 'MM', 'Mme', 'Mmes', 'Mlle', 'Mlles', 'Me', 'Mes', 'Dr', 'Pr']);
const CIVILITES = new Set(['monsieur', 'madame', 'mademoiselle', 'messieurs', 'mesdames', 'maître', 'docteur', 'professeur']);

// Mot qui, ponctuation retirée, est une civilité (« Madame, » ; « M. »).
export function estCivilite(mot) {
  const nu = mot.replace(/\p{P}/gu, '');
  return CIVILITES_ABREGEES.has(nu) || CIVILITES.has(nu.toLowerCase());
}

// etiquettes : type du modèle par mot ('PER', 'ORG', 'LOC', 'MISC' ou 'O'). Une entité est une
// suite de mots consécutifs de même type ; un mot O sépare toujours. Une entité PER dont tous
// les mots sont des civilités (« Madame, Monsieur ») n'est pas masquée.
export function regrouper(texte, mots, etiquettes, types = Object.keys(TYPES)) {
  const entites = [];
  let courante = null;
  etiquettes.forEach((t, i) => {
    if (t !== 'O' && courante?.type === t) {
      courante.fin = i;
      return;
    }
    if (courante) entites.push(courante);
    courante = t === 'O' ? null : { type: t, debut: i, fin: i };
  });
  if (courante) entites.push(courante);

  const masques = [];
  for (const e of entites) {
    if (!types.includes(e.type)) continue;
    if (e.type === 'PER' && mots.slice(e.debut, e.fin + 1).every((m) => estCivilite(texte.slice(m.start, m.end)))) continue;
    const coeurs = [];
    for (let i = e.debut; i <= e.fin; i++) {
      const c = coeurDuMot(texte, mots[i].start, mots[i].end);
      if (c) coeurs.push(c);
    }
    if (coeurs.length) masques.push({ start: coeurs[0].start, end: coeurs.at(-1).end, type: TYPES[e.type] });
  }
  return masques;
}

// --- Préparation, à partir des fichiers déjà vérifiés -------------------------------

// Le tokenizer est construit directement à partir des fichiers : AutoTokenizer.from_pretrained
// cherche tokenizer_config.json sur la branche main et, s'il est absent, continue sans tokenizer
// (get_tokenizer_files.js).
export function preparer(lib, { tokenizerJson, tokenizerConfig, config }) {
  const tokenizer = new lib.PreTrainedTokenizer(tokenizerJson, tokenizerConfig);
  const pieces = tokenizerJson.model.vocab.map(([p]) => p);
  const [bos, eos, ...reste] = tokenizer.encode('');
  if (bos === undefined || eos === undefined || reste.length) throw new Error('modèle : jetons spéciaux inattendus');
  return { lib, tokenizer, pieces, bos, eos, id2label: config.id2label };
}

// Identifiants de chaque mot (sans jetons spéciaux), calculés sur la copie tokenisable.
export function tokeniserMots(tokenizer, texte, mots) {
  const copie = copieTokenisable(texte);
  return mots.map((m) => tokenizer.encode(copie.slice(m.start, m.end), { add_special_tokens: false }));
}

// Logits d'une fenêtre : [n, classes] à plat, jetons spéciaux compris.
export async function logitsFenetre({ lib, modele, bos, eos }, ids) {
  const entree = [bos, ...ids, eos];
  const n = entree.length;
  const input_ids = new lib.Tensor('int64', BigInt64Array.from(entree, BigInt), [1, n]);
  const attention_mask = new lib.Tensor('int64', new BigInt64Array(n).fill(1n), [1, n]);
  const { logits } = await modele({ input_ids, attention_mask });
  const [, longueur, classes] = logits.dims;
  if (longueur !== n) throw new Error(`modèle : ${longueur} sorties pour ${n} entrées`);
  return { n, classes, data: logits.data };
}

// Type prédit (sans préfixe I-/B-) pour chaque sous-mot d'une fenêtre.
async function predire(c, ids) {
  const { n, classes, data } = await logitsFenetre(c, ids);
  const sortie = [];
  for (let p = 1; p < n - 1; p++) {
    let meilleure = 0;
    for (let k = 1; k < classes; k++) if (data[p * classes + k] > data[p * classes + meilleure]) meilleure = k;
    sortie.push(c.id2label[meilleure].replace(/^[BI]-/, ''));
  }
  return sortie;
}

// --- Détecteur ------------------------------------------------------------------------

// charger : fonction asynchrone propre à l'environnement, qui renvoie le résultat de
// preparer() complété du modèle ({ ..., modele }).
export function fabriqueDetecteur(charger) {
  return function creerDetecteur({ types = Object.keys(TYPES) } = {}) {
    for (const t of types) if (!Object.hasOwn(TYPES, t)) throw new Error(`modèle : type inconnu « ${t} » (PER, ORG, LOC, MISC)`);
    return async function detecter(texte) {
      const c = await charger();
      const mots = decouperMots(texte);
      const ids = tokeniserMots(c.tokenizer, texte, mots);
      const longueurs = ids.map((x) => x.length);
      const fenetres = decouperFenetres(longueurs);
      const choix = attribuerFenetres(longueurs, fenetres);
      const etiquettes = new Array(mots.length).fill('O');
      for (const [k, { debut, fin }] of fenetres.entries()) {
        const predictions = await predire(c, ids.slice(debut, fin).flat());
        let decalage = 0;
        for (let i = debut; i < fin; i++) {
          if (choix[i] === k) {
            const r = sousMotRepresentatif(ids[i].map((id) => c.pieces[id]), texte.slice(mots[i].start, mots[i].end));
            if (r >= 0) etiquettes[i] = predictions[decalage + r];
          }
          decalage += longueurs[i];
        }
      }
      return regrouper(texte, mots, etiquettes, types);
    };
  };
}
